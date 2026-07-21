import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { CONDITIONS } from "@/lib/listings";
import { CityPicker } from "@/components/marketplace/CityPicker";
import {
  SizePickerSheet,
  resolveSizeKind,
  isSizeRequired,
  sizeKindHidden,
} from "@/components/marketplace/SizePickerSheet";
import { ColorPickerSheet, COLOR_OPTIONS } from "@/components/marketplace/ColorPickerSheet";
import { compressImage, PRODUCT_IMAGE_OPTIONS } from "@/utils/compressImage";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

// Brand tokens — mapped once, used everywhere.
const PAGE = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-muted)";
const CORAL_GRADIENT = "linear-gradient(120deg, var(--brand-coral), var(--brand-rose))";
const DIVIDER = "var(--brand-border)";
const DANGER = "var(--brand-danger)";
const FOCUS_RING = "0 0 0 3px rgba(198,90,122,0.35)";
// Single source for keyboard focus-ring styling across sell.tsx.
// Kept co-located with FOCUS_RING so the rgba value lives in one place.
const FOCUS_CLASS = "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";
const SAFE_BOTTOM = "calc(1.5rem + env(safe-area-inset-bottom))";
const OVERLAY_GLYPH = "#ffffff"; // intentional white glyph on dark/gradient badges & CTAs
const OVERLAY_MUTED = "rgba(255,255,255,0.72)"; // muted glyph on gradient (condition subtitle)
const OVERLAY_SCRIM = "rgba(0,0,0,0.6)"; // scrim behind delete icon on images

const MAX_PHOTOS = 8;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  // HEIC/HEIF from iOS: normalized to JPEG by compressImage() via heic2any before upload.
  "image/heic": "heic",
  "image/heif": "heif",
};
const MAX_BYTES = 10 * 1024 * 1024;

type PendingImage = { file: File; previewUrl: string; mime: string };

const CONDITION_SUBTITLES: Record<string, string> = {
  "I ri": "Kurrë i përdorur",
  "Mirë përdorur": "Shenja të lehta përdorimi",
  Përdorur: "Shenja të dukshme përdorimi",
  "Shumë përdorur": "Shenja të forta përdorimi",
};

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
  { id: "Interier & mobilie", label: "Interier & mobilie", Icon: Sofa, genderMode: false },
];

const ADULT_GENDERS = ["Femra", "Meshkuj"] as const;
const ADULT_EXTRA = "Uniseks";
const KIDS_GENDERS = ["Vajza", "Djem"] as const;
const KIDS_EXTRA = "Të dyja";

function getSubcategories(category: string, gender: string): string[] {
  switch (category) {
    case "Veshje":
      if (gender === "Femra")
        return [
          "Bluza",
          "Fustane",
          "T-shirt",
          "Këmisha",
          "Pantallona",
          "Funde",
          "Xhaketa",
          "Pallto",
          "Triko",
          "Shorte",
          "Kostume banje",
          "Pizhame",
        ];
      if (gender === "Meshkuj")
        return [
          "Bluza",
          "T-shirt",
          "Këmisha",
          "Pantallona",
          "Xhaketa",
          "Pallto",
          "Triko",
          "Shorte",
          "Kostume banje",
          "Pizhame",
        ];
      return ["Bluza", "T-shirt", "Pantallona", "Xhaketa", "Triko", "Shorte", "Pizhame"];
    case "Këpucë":
      if (gender === "Femra")
        return ["Të përditshme", "Sportet", "Me taka", "Sandale", "Çizme", "Të tjera"];
      if (gender === "Meshkuj")
        return ["Të përditshme", "Sportet", "Elegante", "Sandale", "Çizme", "Të tjera"];
      return ["Të përditshme", "Sportet", "Sandale", "Çizme", "Të tjera"];
    case "Çanta":
      return ["Çanta dore", "Çanta shpine", "Portofol", "Çanta udhëtimi", "Të tjera"];
    case "Aksesorë":
      return ["Kapele", "Shall & doreza", "Rripa", "Syze", "Bizhuteri", "Ora", "Të tjera"];
    case "Fëmijë & bebe":
      return ["Veshje", "Këpucë", "Lodra", "Karrocë", "Aksesorë bebeje", "Të tjera"];
    case "Outdoor & sport":
      return [
        "Veshje sportive",
        "Këpucë sportive",
        "Bicikletë",
        "Kampim",
        "Ski & dëborë",
        "Fitness",
        "Të tjera",
      ];
    case "Art & dizajn":
      return ["Pikturë", "Print & poster", "Fotografi", "Skulpturë", "Dekor", "Të tjera"];
    case "Elektronikë & zë":
      return ["Telefona", "Kompjuterë", "Audio", "Kamera", "Aksesorë", "Të tjera"];
    case "Interier & mobilie":
      return ["Mobilje", "Dekor", "Ndriçim", "Kuzhinë", "Tekstil", "Të tjera"];
    default:
      return [];
  }
}

// City list moved to DB — see CityPicker/useCities
const DELIVERY = ["Takim", "Dorëzim në shtëpi"];

type View = "media" | "form";
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
  const [cityId, setCityId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) navigate({ to: "/auth" });
      else setUserId(user!.id);
    });
  }, [navigate]);

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - images.length;
    const added: PendingImage[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      // Some iOS/Safari versions report an empty MIME type for HEIC/HEIF —
      // fall back to the filename extension so those files aren't rejected
      // before compressImage() has a chance to normalize them.
      const isHeicByName = /\.(heic|heif)$/i.test(file.name);
      if (!ALLOWED[file.type] && !isHeicByName) {
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
  }, [sizeKind]);

  const step2Valid =
    !!fullCategoryLabel &&
    !!catSub &&
    !!condition &&
    title.trim().length > 0 &&
    (!sizeRequired || size.trim().length > 0);

  const priceNum = Number(price.replace(",", "."));
  const finalValid =
    step2Valid && price.trim().length > 0 && Number.isFinite(priceNum) && priceNum >= 0 && !!cityId;

  const publish = async () => {
    if (!userId || submitting || !finalValid) return;
    if (images.length < 1) {
      toast.error("Shto të paktën një foto para se të publikosh");
      return;
    }
    setSubmitting(true);
    const uploaded: string[] = [];
    try {
      for (const img of images) {
        const compressed = await compressImage(img.file, PRODUCT_IMAGE_OPTIONS);
        const ext = compressed.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("photos")
          .upload(path, compressed, { contentType: compressed.type, upsert: false });
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
        city_id: cityId,
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

  const handleRedirectToKids = () => {
    setCatCategory("Fëmijë & bebe");
    setCatGender("");
    setCatSub("");
    setPickerStack(["gender"]);
  };

  const handlePickSub = (s: string) => {
    setCatSub(s);
    closePickers();
    setView("form");
  };

  return (
    <div
      className="fixed inset-0 flex justify-center"
      style={{ background: PAGE, height: "100dvh", overflow: "hidden" }}
    >
      <div
        className="relative w-full max-w-[480px] overflow-hidden"
        style={{ background: PAGE, height: "100dvh" }}
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

        <Layer visible={view === "form"}>
          <FormStep
            images={images}
            onCancel={() => setView("media")}
            onAddMore={() => fileRef.current?.click()}
            onRemoveImage={removeImage}
            fullCategoryLabel={fullCategoryLabel}
            onEditCategory={() => {
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
            setSizeError={setSizeError}
            onOpenSize={() => setSizeSheetOpen(true)}
            brand={brand}
            setBrand={setBrand}
            color={color}
            price={price}
            setPrice={setPrice}
            cityId={cityId}
            onCityChange={(id, name) => {
              setCityId(id);
              setCity(name);
            }}
            delivery={delivery}
            setDelivery={setDelivery}
            onOpenColor={() => setColorSheetOpen(true)}
            canPublish={finalValid}
            submitting={submitting}
            onPublish={publish}
          />
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
                  onPickChild={handleRedirectToKids}
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
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={pickFiles}
          tabIndex={-1}
          aria-hidden="true"
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
  // `inert` removes descendants from the tab order, prevents pointer/keyboard
  // interaction and hides them from AT — a stronger guarantee than aria-hidden
  // alone, which still leaves focusable descendants reachable.
  const inertProps = visible ? {} : ({ inert: true } as { inert?: boolean });
  return (
    <div
      className="absolute inset-0 transition-transform duration-300 ease-out"
      style={{
        transform: visible ? "translateX(0)" : "translateX(100%)",
        zIndex: z,
        background: PAGE,
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={!visible}
      {...inertProps}
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
      style={{ background: PAGE }}
    >
      <div className="flex w-20 justify-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Kthehu"
            className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-90 ${FOCUS_CLASS}`}
            style={{
              background: CARD,
              border: `1px solid ${DIVIDER}`,
            }}
          >
            <ChevronLeft
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              style={{ color: "var(--brand-ink)" }}
            />
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
            className={`min-h-11 rounded-full px-4 text-xs font-semibold ${FOCUS_CLASS}`}
            style={{ background: INK, color: OVERLAY_GLYPH }}
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
    <div className="flex h-full flex-col overflow-y-auto" style={{ paddingBottom: SAFE_BOTTOM }}>
      <TopHeader title="Shto artikull të ri" onBack={onClose} />

      <div className="px-5 pt-1">
        {/* Compact upload buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPickFiles}
            className={`flex h-[80px] flex-col items-center justify-center gap-1 rounded-2xl p-4 transition active:scale-[0.98] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          >
            <Images className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[12px] font-semibold">Ngarko media</span>
          </button>
          <button
            type="button"
            onClick={onOpenCamera}
            className={`flex h-[80px] flex-col items-center justify-center gap-1 rounded-2xl p-4 transition active:scale-[0.98] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          >
            <Camera className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[12px] font-semibold">Hap kamerën</span>
          </button>
        </div>

        <p className="mt-2 text-[11px] italic" style={{ color: MUTED }}>
          Fotot në formatin portret (3:4) funksionojnë më mirë
        </p>

        {images.length > 0 && (
          <ul
            aria-label="Fotot e ngarkuara"
            className="no-scrollbar -mx-5 mt-3 flex list-none gap-2 overflow-x-auto px-5"
          >
            {images.map((img, i) => (
              <li
                key={img.previewUrl}
                className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl"
                style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
              >
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(i)}
                  className={`absolute left-0 top-0 grid h-11 w-11 place-items-start justify-start rounded-tl-xl bg-transparent ${FOCUS_CLASS}`}
                  aria-label={`Fshij foton ${i + 1}`}
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-br-xl rounded-tl-xl"
                    style={{ background: OVERLAY_SCRIM, color: OVERLAY_GLYPH }}
                    aria-hidden="true"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
              className={`flex h-[100px] flex-col items-center justify-center gap-2 rounded-2xl p-4 transition active:scale-[0.98] ${FOCUS_CLASS}`}
              style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
            >
              <cat.Icon className="h-7 w-7" strokeWidth={1.4} aria-hidden="true" />
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
  onPickChild,
}: {
  category: Category;
  onBack: () => void;
  onPick: (g: string) => void;
  onPickChild?: () => void;
}) {
  const isKids = category.genderMode === "kids";
  const primary = isKids ? KIDS_GENDERS : ADULT_GENDERS;
  const extra = isKids ? KIDS_EXTRA : ADULT_EXTRA;

  const tiles: { key: string; label: string; icon: React.ReactNode; onClick: () => void }[] = [
    ...primary.map((g) => ({
      key: g,
      label: g,
      icon: (
        <span className="text-[28px]" aria-hidden="true">
          {g === "Femra" || g === "Vajza" ? "♀" : "♂"}
        </span>
      ),
      onClick: () => onPick(g),
    })),
    ...(!isKids && onPickChild
      ? [
          {
            key: "Fëmijë",
            label: "Fëmijë",
            icon: <Baby className="h-7 w-7" strokeWidth={1.4} aria-hidden="true" />,
            onClick: onPickChild,
          },
        ]
      : []),
    {
      key: extra,
      label: extra,
      icon: <Sparkles className="h-7 w-7" strokeWidth={1.4} aria-hidden="true" />,
      onClick: () => onPick(extra),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ paddingBottom: SAFE_BOTTOM }}>
      <TopHeader title={category.label} onBack={onBack} />
      <div className="px-5">
        <h2 className="mt-2 text-[24px] font-bold" style={{ color: INK }}>
          Për kend është?
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={t.onClick}
              className={`flex h-[120px] flex-col items-center justify-center gap-2 rounded-2xl transition active:scale-[0.98] ${FOCUS_CLASS}`}
              style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
            >
              {t.icon}
              <span className="text-[14px] font-bold">{t.label}</span>
            </button>
          ))}
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
    <div className="flex h-full flex-col overflow-y-auto" style={{ paddingBottom: SAFE_BOTTOM }}>
      <TopHeader title={crumb} onBack={onBack} />
      <div className="px-5">
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
              className={`min-h-11 rounded-full px-2 text-center text-[12px] font-semibold transition active:scale-[0.97] ${FOCUS_CLASS}`}
              style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== Unified form step ============================== */

function FormStep({
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
  setSizeError,
  onOpenSize,
  brand,
  setBrand,
  color,
  price,
  setPrice,
  cityId,
  onCityChange,
  delivery,
  setDelivery,
  onOpenColor,
  canPublish,
  submitting,
  onPublish,
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
  setSizeError: (v: boolean) => void;
  onOpenSize: () => void;
  brand: string;
  setBrand: (v: string) => void;
  color: string[];
  price: string;
  setPrice: (v: string) => void;
  cityId: string | null;
  onCityChange: (id: string, name: string) => void;
  delivery: string[];
  setDelivery: (v: string[]) => void;
  onOpenColor: () => void;
  canPublish: boolean;
  submitting: boolean;
  onPublish: () => void;
}) {
  const slots = Math.max(images.length + 1, 4);
  const toggleDelivery = (opt: string) =>
    setDelivery(delivery.includes(opt) ? delivery.filter((x) => x !== opt) : [...delivery, opt]);

  const conditionRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  const scrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Move focus for a11y where possible.
    if (typeof (el as HTMLInputElement).focus === "function") {
      (el as HTMLInputElement).focus({ preventScroll: true });
    }
  };

  const handlePublish = () => {
    if (submitting) return;
    if (!condition) {
      toast.error("Zgjidh gjendjen e artikullit");
      scrollTo(conditionRef.current);
      return;
    }
    if (sizeRequired && !size.trim()) {
      setSizeError(true);
      toast.error("Zgjidh madhësinë");
      scrollTo(sizeRef.current);
      return;
    }
    if (!title.trim()) {
      toast.error("Shto një titull");
      scrollTo(titleRef.current);
      return;
    }
    if (!price.trim() || !Number.isFinite(Number(price.replace(",", ".")))) {
      toast.error("Shto çmimin");
      scrollTo(priceRef.current);
      return;
    }
    if (!cityId) {
      toast.error("Zgjidh qytetin");
      scrollTo(cityRef.current);
      return;
    }
    onPublish();
  };

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Shto artikull të ri" onBack={onCancel} />

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Category breadcrumb pill */}
        {fullCategoryLabel && (
          <button
            type="button"
            onClick={onEditCategory}
            aria-label={`Ndrysho kategorinë: ${fullCategoryLabel}`}
            className={`mt-1 inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          >
            <span className="truncate">{fullCategoryLabel}</span>
            <span
              aria-hidden="true"
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
              style={{ background: CORAL_GRADIENT, color: OVERLAY_GLYPH }}
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        )}

        {/* Thumbnails row */}
        <ul
          aria-label="Fotot"
          className="no-scrollbar -mx-5 mt-4 flex list-none gap-2 overflow-x-auto px-5 pb-1"
        >
          {Array.from({ length: slots }).map((_, i) => {
            const img = images[i];
            if (img) {
              return (
                <li
                  key={img.previewUrl}
                  className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-2xl"
                  style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(i)}
                    className={`absolute left-0 top-0 grid h-11 w-11 place-items-start justify-start rounded-tl-2xl bg-transparent ${FOCUS_CLASS}`}
                    aria-label={`Fshij foton ${i + 1}`}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-br-xl rounded-tl-2xl"
                      style={{ background: OVERLAY_SCRIM, color: OVERLAY_GLYPH }}
                      aria-hidden="true"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={onAddMore}
                  aria-label="Shto foto"
                  className={`grid h-[100px] w-[100px] place-items-center rounded-2xl transition active:scale-[0.98] ${FOCUS_CLASS}`}
                  style={{ background: CARD, color: MUTED, border: `1px solid ${DIVIDER}` }}
                >
                  <Images className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Detajet: condition + size */}
        <div
          className="mt-7 rounded-2xl p-4"
          style={{ border: `1px solid ${DIVIDER}`, background: CARD }}
        >
          <h2 className="text-[22px] font-bold" style={{ color: INK }}>
            Detajet
          </h2>

          <h3 ref={conditionRef} className="mt-5 text-[17px] font-bold" style={{ color: INK }}>
            Çfarë është gjendja e artikullit?
          </h3>
          <div
            role="radiogroup"
            aria-label="Gjendja e artikullit"
            className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            {CONDITIONS.map((value) => {
              const active = condition === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCondition(value)}
                  className={`flex w-[140px] shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left transition active:scale-[0.98] ${FOCUS_CLASS}`}
                  style={{
                    background: active ? CORAL_GRADIENT : CARD,
                    color: active ? OVERLAY_GLYPH : INK,
                    border: active ? "1px solid transparent" : `1px solid ${DIVIDER}`,
                  }}
                >
                  <span className="text-[13px] font-semibold leading-tight">{value}</span>
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: active ? OVERLAY_MUTED : MUTED }}
                  >
                    {CONDITION_SUBTITLES[value]}
                  </span>
                </button>
              );
            })}
          </div>

          {!sizeHidden && (
            <div ref={sizeRef} className="mt-7">
              <label
                htmlFor="sell-size-trigger"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: MUTED }}
              >
                Madhësia
              </label>
              <button
                id="sell-size-trigger"
                type="button"
                onClick={onOpenSize}
                aria-invalid={sizeError || undefined}
                aria-describedby={sizeError && sizeRequired ? "sell-size-error" : undefined}
                className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition active:scale-[0.99] ${FOCUS_CLASS}`}
                style={{
                  background: CARD,
                  color: INK,
                  border: `1px solid ${sizeError ? DANGER : DIVIDER}`,
                }}
              >
                <span style={{ color: size ? INK : MUTED }}>{size || "Zgjidh madhësinë"}</span>
                <ChevronRight className="h-4 w-4" style={{ color: MUTED }} aria-hidden="true" />
              </button>
              {sizeError && sizeRequired && (
                <p
                  id="sell-size-error"
                  role="alert"
                  className="mt-1.5 text-[12px] font-medium"
                  style={{ color: DANGER }}
                >
                  Ju lutemi zgjidhni madhësinë
                </p>
              )}
            </div>
          )}
        </div>

        {/* Përshkruaj artikullin: title + description */}
        <div
          className="mt-7 rounded-2xl p-4"
          style={{ border: `1px solid ${DIVIDER}`, background: CARD }}
        >
          <h3 className="text-[17px] font-bold" style={{ color: INK }}>
            Përshkruaj artikullin
          </h3>
          <label htmlFor="sell-title" className="sr-only">
            Titulli
          </label>
          <input
            id="sell-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulli"
            maxLength={120}
            autoComplete="off"
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                descriptionRef.current?.focus();
              }
            }}
            className={`mt-3 h-[52px] w-full rounded-2xl px-4 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          />
          <label htmlFor="sell-description" className="sr-only">
            Përshkrimi
          </label>
          <textarea
            id="sell-description"
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Përshkrimi i artikullit"
            maxLength={2000}
            rows={5}
            className={`mt-3 w-full resize-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}`, minHeight: 120 }}
          />
        </div>

        {/* Detaje shtesë: brand + color */}
        <div className="mt-7">
          <Label htmlFor="sell-brand">Marka</Label>
          <input
            id="sell-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="p.sh. Zara"
            maxLength={60}
            autoComplete="off"
            enterKeyHint="next"
            className={`h-[52px] w-full rounded-2xl px-4 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          />

          <div className="mt-4">
            <Label htmlFor="sell-color">Ngjyra</Label>
            <button
              id="sell-color"
              type="button"
              onClick={onOpenColor}
              className={`flex h-[52px] w-full items-center justify-between rounded-2xl px-4 text-left text-sm transition active:scale-[0.99] ${FOCUS_CLASS}`}
              style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {color.length === 0 ? (
                  <span style={{ color: MUTED }}>Zgjidh</span>
                ) : (
                  <>
                    <span className="flex -space-x-1.5" aria-hidden="true">
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
              <ChevronRight
                className="ml-2 h-4 w-4 shrink-0"
                style={{ color: MUTED }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Price + city */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sell-price">Çmimi (€)</Label>
            <div
              className="flex h-[52px] w-full items-center rounded-2xl px-4"
              style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
            >
              <span
                aria-hidden="true"
                className="mr-2 text-sm font-semibold"
                style={{ color: MUTED }}
              >
                €
              </span>
              <input
                id="sell-price"
                ref={priceRef}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                className="no-spinner w-full bg-transparent text-sm focus:outline-none"
                style={{ color: INK }}
              />
            </div>
          </div>
          <div ref={cityRef}>
            <Label htmlFor="sell-city">Qyteti</Label>
            <CityPicker value={cityId} onChange={(id, c) => onCityChange(id, c.name)} />
          </div>
        </div>

        {/* Delivery */}
        <Label className="mt-4">Dorëzimi</Label>
        <div role="group" aria-label="Opsionet e dorëzimit" className="flex flex-wrap gap-2">
          {DELIVERY.map((d) => {
            const active = delivery.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDelivery(d)}
                className={`min-h-11 rounded-full px-4 text-sm transition active:scale-[0.97] ${FOCUS_CLASS}`}
                style={{
                  background: active ? CORAL_GRADIENT : CARD,
                  color: active ? OVERLAY_GLYPH : INK,
                  border: active ? "1px solid transparent" : `1px solid ${DIVIDER}`,
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="sticky bottom-0 px-5 pt-3"
        style={{
          background: `linear-gradient(to top, var(--brand-surface) 70%, transparent)`,
          paddingBottom: SAFE_BOTTOM,
        }}
      >
        <button
          type="button"
          onClick={handlePublish}
          disabled={submitting}
          aria-busy={submitting || undefined}
          aria-disabled={!canPublish || undefined}
          className={`relative inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition enabled:active:scale-[0.98] disabled:active:scale-100 ${FOCUS_CLASS}`}
          style={{
            background: canPublish ? CORAL_GRADIENT : DIVIDER,
            color: canPublish ? OVERLAY_GLYPH : MUTED,
          }}
        >
          <span
            className="inline-flex items-center gap-2"
            style={{ visibility: submitting ? "hidden" : "visible" }}
          >
            Publiko
          </span>
          {submitting && (
            <span
              className="absolute inset-0 inline-flex items-center justify-center gap-2"
              aria-hidden="true"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Po publikon…</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function Label({
  children,
  className = "",
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] ${className}`}
      style={{ color: MUTED }}
    >
      {children}
    </label>
  );
}
