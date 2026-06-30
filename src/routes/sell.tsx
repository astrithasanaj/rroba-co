import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Images,
  Loader2,
  Shirt,
  Baby,
  Sofa,
  Mountain,
  Frame,
  Headphones,
  X,
  Footprints,
  Gem,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  SizePickerSheet,
  resolveSizeKind,
  isSizeRequired,
  sizeKindHidden,
} from "@/components/marketplace/SizePickerSheet";
import { ColorPickerSheet, COLOR_OPTIONS } from "@/components/marketplace/ColorPickerSheet";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

// Palette
const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";
const DIVIDER = "#ddd8ce";

const MAX_PHOTOS = 8;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 10 * 1024 * 1024;

type PendingImage = { file: File; previewUrl: string; mime: string };

const CONDITIONS: { value: string; subtitle: string }[] = [
  { value: "I ri", subtitle: "Kurrë i përdorur" },
  { value: "Mirë përdorur", subtitle: "Pa shenja përdorimi" },
  { value: "Përdorur", subtitle: "Disa shenja përdorimi" },
  { value: "Shumë përdorur", subtitle: "Shenja të qarta përdorimi" },
];

type GenderMode = "adult" | "kids" | false;

type Category = {
  id: string;
  label: string;
  Icon: typeof Shirt;
  genderMode: GenderMode;
};

const CATEGORIES: Category[] = [
  { id: "Veshje", label: "Veshje", Icon: Shirt, genderMode: "adult" },
  { id: "Këpucë", label: "Këpucë", Icon: Footprints, genderMode: "adult" },
  { id: "Çanta", label: "Çanta", Icon: ShoppingBag, genderMode: "adult" },
  { id: "Aksesorë", label: "Aksesorë", Icon: Gem, genderMode: "adult" },
  { id: "Fëmijë & bebe", label: "Fëmijë & bebe", Icon: Baby, genderMode: "kids" },
  { id: "Outdoor & sport", label: "Outdoor & sport", Icon: Mountain, genderMode: false },
  { id: "Art & dizajn", label: "Art & dizajn", Icon: Frame, genderMode: false },
  { id: "Elektronikë & zë", label: "Elektronikë & zë", Icon: Headphones, genderMode: false },
  { id: "Interiør & mobilje", label: "Interiør & mobilje", Icon: Sofa, genderMode: false },
];

const ADULT_GENDERS = ["Femra", "Meshkuj"] as const;
const ADULT_EXTRA = "Uniseks";
const KIDS_GENDERS = ["Vajza", "Djem"] as const;
const KIDS_EXTRA = "Të dyja";

function getSubcategories(category: string, gender: string): string[] {
  switch (category) {
    case "Veshje":
      if (gender === "Femra")
        return ["Bluza","Fustane","T-shirt","Këmisha","Pantallona","Funde","Xhaketa","Pallto","Triko","Shorte","Kostume banje","Pizhame"];
      if (gender === "Meshkuj")
        return ["Bluza","T-shirt","Këmisha","Pantallona","Xhaketa","Pallto","Triko","Shorte","Kostume banje","Pizhame"];
      return ["Bluza","T-shirt","Pantallona","Xhaketa","Triko","Shorte","Pizhame"];
    case "Këpucë":
      if (gender === "Femra") return ["Të përditshme","Sportet","Me taka","Sandale","Çizme","Të tjera"];
      if (gender === "Meshkuj") return ["Të përditshme","Sportet","Elegante","Sandale","Çizme","Të tjera"];
      return ["Të përditshme","Sportet","Sandale","Çizme","Të tjera"];
    case "Çanta":
      return ["Çanta dore","Çanta shpine","Portofol","Çanta udhëtimi","Të tjera"];
    case "Aksesorë":
      return ["Kapele","Shall & doreza","Rripa","Syze","Bizhuteri","Ora","Të tjera"];
    case "Fëmijë & bebe":
      return ["Veshje","Këpucë","Lodra","Karrocë","Aksesorë bebeje","Të tjera"];
    case "Outdoor & sport":
      return ["Veshje sportive","Këpucë sportive","Bicikletë","Kampim","Ski & dëborë","Fitness","Të tjera"];
    case "Art & dizajn":
      return ["Pikturë","Print & poster","Fotografi","Skulpturë","Dekor","Të tjera"];
    case "Elektronikë & zë":
      return ["Telefona","Kompjuterë","Audio","Kamera","Aksesorë","Të tjera"];
    case "Interiør & mobilje":
      return ["Mobilje","Dekor","Ndriçim","Kuzhinë","Tekstil","Të tjera"];
    default:
      return [];
  }
}

const CITIES = ["Prishtinë", "Prizren", "Pejë", "Tiranë", "Gjilan", "Ferizaj"];
const DELIVERY = ["Takim", "Dorëzim në shtëpi"];

type View = "media" | "details" | "final";
type Picker = "gender" | "subcategory";

function SellPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [view, setView] = useState<View>("media");
  const [pickerStack, setPickerStack] = useState<Picker[]>([]);

  const [images, setImages] = useState<PendingImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Category state
  const [catCategory, setCatCategory] = useState<string>("");
  const [catGender, setCatGender] = useState<string>("");
  const [catSub, setCatSub] = useState<string>("");
  const [condition, setCondition] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Final step state
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - images.length;
    const added: PendingImage[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!ALLOWED[file.type]) {
        toast.error(`${file.name}: format i palejuar`);
        continue;
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        toast.error(`${file.name}: madhësi e palejuar (maks 10MB)`);
        continue;
      }
      added.push({ file, previewUrl: URL.createObjectURL(file), mime: file.type });
    }
    if (added.length > 0) {
      setImages((p) => [...p, ...added]);
    }
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((p) => {
      const next = [...p];
      const [r] = next.splice(idx, 1);
      if (r) URL.revokeObjectURL(r.previewUrl);
      return next;
    });
  };

  const selectedCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === catCategory),
    [catCategory],
  );

  const fullCategoryLabel = catCategory
    ? [catCategory, catGender, catSub].filter(Boolean).join(" / ")
    : "";

  // For size resolution, map kids to "Fëmijë" path the size resolver expects
  const sizeKind = resolveSizeKind(catCategory, catGender, catSub);
  const sizeHidden = sizeKindHidden(sizeKind);
  const sizeRequired = isSizeRequired(sizeKind);

  useEffect(() => {
    setSizeError(false);
    if (sizeKind === "accessory") setSize("Universal");
    else setSize("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeKind]);

  const step2Valid =
    !!fullCategoryLabel &&
    !!catSub &&
    !!condition &&
    title.trim().length > 0 &&
    (!sizeRequired || size.trim().length > 0);

  const priceNum = Number(price.replace(",", "."));
  const finalValid =
    step2Valid &&
    price.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    !!city;

  const publish = async () => {
    if (!userId || submitting || !finalValid) return;
    setSubmitting(true);
    const uploaded: string[] = [];
    try {
      for (const img of images) {
        const ext = ALLOWED[img.mime];
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("photos")
          .upload(path, img.file, { contentType: img.mime, upsert: false });
        if (error) throw new Error(error.message);
        uploaded.push(path);
      }
      const insertPayload: Record<string, unknown> = {
        user_id: userId,
        title: title.trim(),
        brand: brand.trim(),
        category: catCategory,
        subcategory: catSub,
        size,
        condition,
        color: color.length ? color.join(", ") : "",
        city,
        gender: catGender,
        price: priceNum,
        description: description.trim(),
        image_paths: uploaded,
        delivery,
        status: "active",
      };
      const { data, error } = await supabase
        .from("listings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertPayload as any)
        .select("id")
        .single();
      if (error) {
        await supabase.storage.from("photos").remove(uploaded);
        throw new Error(error.message);
      }
      toast.success("Artikulli u publikua me sukses! 🎉");
      navigate({ to: "/product/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publikimi dështoi");
    } finally {
      setSubmitting(false);
    }
  };

  const openPicker = (p: Picker) => setPickerStack((s) => [...s, p]);
  const popPicker = () => setPickerStack((s) => s.slice(0, -1));
  const closePickers = () => setPickerStack([]);

  const handlePickCategory = (cat: Category) => {
    setCatCategory(cat.id);
    setCatGender("");
    setCatSub("");
    if (cat.genderMode === false) {
      openPicker("subcategory");
    } else {
      openPicker("gender");
    }
  };

  const handlePickGender = (g: string) => {
    setCatGender(g);
    setPickerStack(["subcategory"]);
  };

  const handlePickSub = (s: string) => {
    setCatSub(s);
    closePickers();
    setView("details");
  };

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <div
        className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden"
        style={{ background: CREAM }}
      >
        <Layer visible={view === "media"}>
          <MediaCategoryStep
            images={images}
            onClose={() => navigate({ to: "/" })}
            onPickFiles={() => fileRef.current?.click()}
            onOpenCamera={() => cameraRef.current?.click()}
            onRemoveImage={removeImage}
            onPickCategory={handlePickCategory}
          />
        </Layer>

        <Layer visible={view === "details" || view === "final"}>
          {view === "details" ? (
            <DetailsStep
              images={images}
              onCancel={() => setView("media")}
              onAddMore={() => fileRef.current?.click()}
              onRemoveImage={removeImage}
              fullCategoryLabel={fullCategoryLabel}
              onEditCategory={() => {
                // Reset and go back to step 1 to re-pick
                setCatCategory("");
                setCatGender("");
                setCatSub("");
                setView("media");
              }}
              condition={condition}
              setCondition={setCondition}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              size={size}
              sizeHidden={sizeHidden}
              sizeRequired={sizeRequired}
              sizeError={sizeError}
              onOpenSize={() => setSizeSheetOpen(true)}
              canNext={step2Valid}
              onNext={() => {
                if (sizeRequired && !size.trim()) {
                  setSizeError(true);
                  return;
                }
                setView("final");
              }}
            />
          ) : (
            <FinalStep
              onBack={() => setView("details")}
              brand={brand}
              setBrand={setBrand}
              size={size}
              color={color}
              price={price}
              setPrice={setPrice}
              city={city}
              setCity={setCity}
              delivery={delivery}
              setDelivery={setDelivery}
              onOpenSize={() => setSizeSheetOpen(true)}
              onOpenColor={() => setColorSheetOpen(true)}
              canPublish={finalValid}
              submitting={submitting}
              onPublish={publish}
            />
          )}
        </Layer>

        {(["gender", "subcategory"] as Picker[]).map((p) => {
          const idx = pickerStack.indexOf(p);
          const visible = idx >= 0;
          return (
            <Layer key={p} visible={visible} z={20 + (idx >= 0 ? idx : 0)}>
              {p === "gender" && selectedCategory && (
                <GenderPicker
                  category={selectedCategory}
                  onBack={() => {
                    popPicker();
                  }}
                  onPick={handlePickGender}
                />
              )}
              {p === "subcategory" && selectedCategory && (
                <SubcategoryPicker
                  category={selectedCategory}
                  gender={catGender}
                  onBack={popPicker}
                  onPick={handlePickSub}
                />
              )}
            </Layer>
          );
        })}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={pickFiles}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={pickFiles}
        />

        <SizePickerSheet
          open={sizeSheetOpen}
          onOpenChange={setSizeSheetOpen}
          value={size}
          onChange={(v) => {
            setSize(v);
            setSizeError(false);
          }}
          kind={sizeKind}
        />
        <ColorPickerSheet
          open={colorSheetOpen}
          onOpenChange={setColorSheetOpen}
          value={color}
          onChange={setColor}
        />
      </div>
    </div>
  );
}

/* ============================== Layer wrapper ============================== */

function Layer({
  visible,
  z = 10,
  children,
}: {
  visible: boolean;
  z?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 transition-transform duration-300 ease-out"
      style={{
        transform: visible ? "translateX(0)" : "translateX(100%)",
        zIndex: z,
        background: CREAM,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

/* ============================== Shared header ============================== */

function TopHeader({
  title,
  rightLabel,
  onRight,
  onBack,
}: {
  title: string;
  rightLabel?: string;
  onRight?: () => void;
  onBack?: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
      style={{ background: CREAM }}
    >
      <div className="w-20">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Mbrapa"
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: CARD, color: INK }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <h1 className="text-[15px] font-semibold" style={{ color: INK }}>
        {title}
      </h1>
      <div className="flex w-20 justify-end">
        {rightLabel && (
          <button
            type="button"
            onClick={onRight}
            className="rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: INK, color: "#fff" }}
          >
            {rightLabel}
          </button>
        )}
      </div>
    </header>
  );
}

/* ============================== Step 1: Media + Category ============================== */

function MediaCategoryStep({
  images,
  onClose,
  onPickFiles,
  onOpenCamera,
  onRemoveImage,
  onPickCategory,
}: {
  images: PendingImage[];
  onClose: () => void;
  onPickFiles: () => void;
  onOpenCamera: () => void;
  onRemoveImage: (i: number) => void;
  onPickCategory: (c: Category) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto pb-10">
      <TopHeader title="Shto artikull të ri" rightLabel="Mbyll" onRight={onClose} />

      <div className="px-5 pt-1">
        {/* Compact upload buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPickFiles}
            className="flex h-[80px] flex-col items-center justify-center gap-1 rounded-2xl"
            style={{ background: CARD, color: INK }}
          >
            <Images className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold">Ngarko media</span>
          </button>
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex h-[80px] flex-col items-center justify-center gap-1 rounded-2xl"
            style={{ background: CARD, color: INK }}
          >
            <Camera className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold">Hap kamerën</span>
          </button>
        </div>

        {images.length > 0 && (
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            {images.map((img, i) => (
              <div
                key={img.previewUrl}
                className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl"
                style={{ background: CARD }}
              >
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(i)}
                  className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="Fshij"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Heading */}
        <h2
          className="mt-7 text-[26px] font-bold italic leading-tight"
          style={{ color: INK, fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
        >
          Çfarë po shet?
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
          Zgjidh kategorinë e duhur
        </p>

        {/* Category grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onPickCategory(cat)}
              className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-2xl transition active:scale-[0.98]"
              style={{ background: CARD, color: INK }}
            >
              <cat.Icon className="h-7 w-7" strokeWidth={1.4} />
              <span className="px-2 text-center text-[13px] font-bold leading-tight">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 2: Gender ============================== */

function GenderPicker({
  category,
  onBack,
  onPick,
}: {
  category: Category;
  onBack: () => void;
  onPick: (g: string) => void;
}) {
  const isKids = category.genderMode === "kids";
  const primary = isKids ? KIDS_GENDERS : ADULT_GENDERS;
  const extra = isKids ? KIDS_EXTRA : ADULT_EXTRA;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title={category.label} onBack={onBack} />
      <div className="px-5 pb-10">
        <h2 className="mt-2 text-[24px] font-bold" style={{ color: INK }}>
          Për kend është?
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {primary.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onPick(g)}
              className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-2xl transition active:scale-[0.98]"
              style={{ background: CARD, color: INK }}
            >
              <span className="text-[28px]">{g === "Femra" || g === "Vajza" ? "♀" : "♂"}</span>
              <span className="text-[14px] font-bold">{g}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => onPick(extra)}
            className="rounded-full px-5 py-2.5 text-[13px] font-semibold"
            style={{ background: CARD, color: INK }}
          >
            {extra}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 3: Subcategory chips ============================== */

function SubcategoryPicker({
  category,
  gender,
  onBack,
  onPick,
}: {
  category: Category;
  gender: string;
  onBack: () => void;
  onPick: (s: string) => void;
}) {
  const subs = getSubcategories(category.id, gender);
  const crumb = gender ? `${category.label} / ${gender}` : category.label;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title={crumb} onBack={onBack} />
      <div className="px-5 pb-10">
        <h2 className="mt-2 text-[24px] font-bold" style={{ color: INK }}>
          Çfarë saktësisht?
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
          Zgjidh një nënkategori
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {subs.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full px-2 py-3 text-center text-[12px] font-semibold transition active:scale-[0.97]"
              style={{ background: CARD, color: INK }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 4: Details ============================== */

function DetailsStep({
  images,
  onCancel,
  onAddMore,
  onRemoveImage,
  fullCategoryLabel,
  onEditCategory,
  condition,
  setCondition,
  title,
  setTitle,
  description,
  setDescription,
  size,
  sizeHidden,
  sizeRequired,
  sizeError,
  onOpenSize,
  canNext,
  onNext,
}: {
  images: PendingImage[];
  onCancel: () => void;
  onAddMore: () => void;
  onRemoveImage: (i: number) => void;
  fullCategoryLabel: string;
  onEditCategory: () => void;
  condition: string;
  setCondition: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  size: string;
  sizeHidden: boolean;
  sizeRequired: boolean;
  sizeError: boolean;
  onOpenSize: () => void;
  canNext: boolean;
  onNext: () => void;
}) {
  const slots = Math.max(images.length + 1, 4);
  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Shto artikull të ri" rightLabel="Anulo" onRight={onCancel} />

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Category breadcrumb pill */}
        {fullCategoryLabel && (
          <button
            type="button"
            onClick={onEditCategory}
            className="mt-1 inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold"
            style={{ background: CARD, color: INK }}
          >
            <span className="truncate">{fullCategoryLabel}</span>
            <span
              aria-label="Ndrysho"
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
              style={{ background: INK, color: "#fff" }}
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        )}

        {/* Thumbnails row */}
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {Array.from({ length: slots }).map((_, i) => {
            const img = images[i];
            if (img) {
              return (
                <div
                  key={img.previewUrl}
                  className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-2xl"
                  style={{ background: CARD }}
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(i)}
                    className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
                    aria-label="Fshij"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={onAddMore}
                className="grid h-[100px] w-[100px] shrink-0 place-items-center rounded-2xl"
                style={{ background: CARD, color: MUTED }}
              >
                <Images className="h-7 w-7" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>

        <h2 className="mt-7 text-[22px] font-bold" style={{ color: INK }}>
          Detajet
        </h2>

        <h3 className="mt-5 text-[17px] font-bold" style={{ color: INK }}>
          Çfarë është gjendja e artikullit?
        </h3>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {CONDITIONS.map((c) => {
            const active = condition === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className="flex w-[140px] shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left"
                style={{ background: active ? INK : CARD, color: active ? "#fff" : INK }}
              >
                <span className="text-[13px] font-semibold leading-tight">{c.value}</span>
                <span
                  className="text-[11px] leading-tight"
                  style={{ color: active ? "rgba(255,255,255,0.7)" : MUTED }}
                >
                  {c.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {!sizeHidden && (
          <div className="mt-7">
            <p
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: MUTED }}
            >
              Madhësia
            </p>
            <button
              type="button"
              onClick={onOpenSize}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm"
              style={{
                background: CARD,
                color: INK,
                boxShadow: sizeError ? "0 0 0 1.5px #e53935 inset" : undefined,
              }}
            >
              <span style={{ color: size ? INK : MUTED }}>{size || "Zgjidh madhësinë"}</span>
              <ChevronRight className="h-4 w-4" style={{ color: MUTED }} />
            </button>
            {sizeError && sizeRequired && (
              <p className="mt-1.5 text-[12px] font-medium" style={{ color: "#e53935" }}>
                Ju lutemi zgjidhni madhësinë
              </p>
            )}
          </div>
        )}

        <h3 className="mt-7 text-[17px] font-bold" style={{ color: INK }}>
          Përshkruaj artikullin
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titulli"
          maxLength={120}
          className="mt-3 w-full rounded-2xl border-none px-4 py-3.5 text-sm placeholder:text-[color:var(--muted)] focus:outline-none"
          style={
            { background: CARD, color: INK, ["--muted" as string]: MUTED } as React.CSSProperties
          }
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Përshkrimi i artikullit"
          maxLength={2000}
          rows={5}
          className="mt-3 w-full resize-none rounded-2xl border-none px-4 py-3.5 text-sm placeholder:text-[color:var(--muted)] focus:outline-none"
          style={
            { background: CARD, color: INK, ["--muted" as string]: MUTED } as React.CSSProperties
          }
        />
      </div>

      <div
        className="sticky bottom-0 px-5 pb-6 pt-3"
        style={{ background: `linear-gradient(to top, ${CREAM} 70%, transparent)` }}
      >
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="w-full rounded-2xl py-4 text-sm font-bold transition"
          style={{ background: canNext ? CORAL : DIVIDER, color: canNext ? "#fff" : MUTED }}
        >
          Tjetër
        </button>
      </div>
    </div>
  );
}

/* ============================== Final: existing details ============================== */

function FinalStep({
  onBack,
  brand,
  setBrand,
  size,
  color,
  price,
  setPrice,
  city,
  setCity,
  delivery,
  setDelivery,
  onOpenSize,
  onOpenColor,
  canPublish,
  submitting,
  onPublish,
}: {
  onBack: () => void;
  brand: string;
  setBrand: (v: string) => void;
  size: string;
  color: string[];
  price: string;
  setPrice: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  delivery: string[];
  setDelivery: (v: string[]) => void;
  onOpenSize: () => void;
  onOpenColor: () => void;
  canPublish: boolean;
  submitting: boolean;
  onPublish: () => void;
}) {
  const toggleDelivery = (opt: string) =>
    setDelivery(delivery.includes(opt) ? delivery.filter((x) => x !== opt) : [...delivery, opt]);

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Detaje shtesë" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <Label>Marka</Label>
        <Field>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="p.sh. Zara"
            maxLength={60}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: INK }}
          />
        </Field>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>Madhësia</Label>
            <button
              type="button"
              onClick={onOpenSize}
              className="flex w-full items-center justify-start rounded-2xl px-4 py-3.5 text-left text-sm"
              style={{ background: CARD, color: INK }}
            >
              <span style={{ color: size ? INK : MUTED }}>{size || "Zgjidh"}</span>
            </button>
          </div>
          <div>
            <Label>Ngjyra</Label>
            <button
              type="button"
              onClick={onOpenColor}
              className="flex w-full items-center justify-start rounded-2xl px-4 py-3.5 text-left text-sm"
              style={{ background: CARD, color: INK }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {color.length === 0 ? (
                  <span style={{ color: MUTED }}>Zgjidh</span>
                ) : (
                  <>
                    <span className="flex -space-x-1.5">
                      {color.map((c) => {
                        const opt = COLOR_OPTIONS.find((o) => o.name === c);
                        if (!opt) return null;
                        if (opt.inner === "rainbow") {
                          return (
                            <span
                              key={c}
                              className="h-4 w-4 shrink-0 rounded-full border"
                              style={{
                                borderColor: DIVIDER,
                                background:
                                  "conic-gradient(from 0deg, #ff3b3b, #ffb13b, #ffe93b, #4ade80, #22d3ee, #6366f1, #d946ef, #ff3b3b)",
                              }}
                            />
                          );
                        }
                        return (
                          <span
                            key={c}
                            className="h-4 w-4 shrink-0 rounded-full border"
                            style={{
                              borderColor: DIVIDER,
                              background: opt.inner,
                              boxShadow: opt.innerRing
                                ? `0 0 0 1px ${opt.innerRing} inset`
                                : undefined,
                            }}
                          />
                        );
                      })}
                    </span>
                    <span className="truncate" style={{ color: INK }}>
                      {color.join(", ")}
                    </span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>Çmimi (€)</Label>
            <Field>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45"
                type="number"
                inputMode="decimal"
                min={0}
                className="no-spinner w-full bg-transparent text-sm focus:outline-none"
                style={{ color: INK }}
              />
            </Field>
          </div>
          <div>
            <Label>Qyteti</Label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none"
              style={{ background: CARD, color: city ? INK : MUTED }}
            >
              <option value="" disabled>
                Zgjidh
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Label className="mt-4">Dorëzimi</Label>
        <div className="flex flex-wrap gap-2">
          {DELIVERY.map((d) => {
            const active = delivery.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDelivery(d)}
                className="rounded-full px-4 py-2 text-sm transition"
                style={{ background: active ? INK : CARD, color: active ? "#fff" : INK }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="sticky bottom-0 px-5 pb-6 pt-3"
        style={{ background: `linear-gradient(to top, ${CREAM} 70%, transparent)` }}
      >
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition"
          style={{ background: canPublish ? CORAL : DIVIDER, color: canPublish ? "#fff" : MUTED }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Po publikon..." : "Publiko"}
        </button>
      </div>
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] ${className}`}
      style={{ color: MUTED }}
    >
      {children}
    </p>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl px-4 py-3.5" style={{ background: CARD }}>
      {children}
    </div>
  );
}
