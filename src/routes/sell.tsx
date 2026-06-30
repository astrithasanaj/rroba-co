import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Images,
  Loader2,
  Pencil,
  Search,
  Shirt,
  Baby,
  Sofa,
  Mountain,
  Frame,
  Headphones,
  
  X,
  Video,
  Footprints,
  Glasses,
  ShoppingBag,
  Dumbbell,
  Sparkles,
  User,
  Users,
  UserCircle2,
  Circle,
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

const CATEGORIES: { id: string; label: string; Icon: typeof Shirt }[] = [
  { id: "fashion", label: "Modë & aksesorë", Icon: Shirt },
  { id: "kids", label: "Artikuj për fëmijë", Icon: Baby },
  { id: "home", label: "Dekor & mobilje", Icon: Sofa },
  { id: "outdoor", label: "Outdoor & sport", Icon: Mountain },
  { id: "art", label: "Art & dizajn", Icon: Frame },
  { id: "electronics", label: "Elektronikë & zë", Icon: Headphones },
  
];

const GENDERS: { id: string; label: string; subtitle: string; Icon: typeof User }[] = [
  { id: "Femra", label: "Femra", subtitle: "Listo artikullin si për femra", Icon: User },
  { id: "Meshkuj", label: "Meshkuj", subtitle: "Listo artikullin si për meshkuj", Icon: Users },
  { id: "Uniseks", label: "Uniseks", subtitle: "Listo artikullin si uniseks", Icon: UserCircle2 },
];

const SUBCATEGORIES: { id: string; label: string; Icon: typeof Shirt }[] = [
  { id: "Veshje", label: "Veshje", Icon: Shirt },
  { id: "Çanta dhe tuta", label: "Çanta dhe tuta", Icon: ShoppingBag },
  { id: "Këpucë", label: "Këpucë", Icon: Footprints },
  { id: "Aksesorë", label: "Aksesorë", Icon: Glasses },
  { id: "Fitness", label: "Fitness", Icon: Dumbbell },
  { id: "Kozmetikë", label: "Kozmetikë", Icon: Sparkles },
];

const CITIES = ["Prishtinë", "Prizren", "Pejë", "Tiranë", "Gjilan", "Ferizaj"];
const DELIVERY = ["Takim", "Dorëzim në shtëpi"];

type View = "media" | "details" | "final";
type Picker = "category" | "gender" | "subcategory";

function SellPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [view, setView] = useState<View>("media");
  const [pickerStack, setPickerStack] = useState<Picker[]>([]);

  const [images, setImages] = useState<PendingImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [catCategory, setCatCategory] = useState<string>(""); // id
  const [catGender, setCatGender] = useState<string>("");
  const [catSub, setCatSub] = useState<string>("");
  const [condition, setCondition] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [searchCat, setSearchCat] = useState("");

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
      if (view === "media") setView("details");
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

  const selectedCategoryLabel = CATEGORIES.find((c) => c.id === catCategory)?.label ?? "";
  const fullCategoryLabel =
    catSub && selectedCategoryLabel && catGender
      ? `${selectedCategoryLabel} / ${catGender} / ${catSub}`
      : "";

  const step2Valid = !!fullCategoryLabel && !!condition && title.trim().length > 0;

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
      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: userId,
          title: title.trim(),
          brand: brand.trim(),
          category: selectedCategoryLabel,
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
        })
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
  const goToPicker = (p: Picker) => {
    const idx = pickerStack.indexOf(p);
    if (idx >= 0) setPickerStack(pickerStack.slice(0, idx + 1));
  };
  const closePickers = () => setPickerStack([]);

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <div
        className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden"
        style={{ background: CREAM }}
      >
        {/* Base view layers */}
        <Layer visible={view === "media"}>
          <MediaStep
            onClose={() => navigate({ to: "/" })}
            onPickFiles={() => fileRef.current?.click()}
            onOpenCamera={() => cameraRef.current?.click()}
          />
        </Layer>

        <Layer visible={view === "details" || view === "final"}>
          {view === "details" ? (
            <DetailsStep
              images={images}
              onCancel={() => {
                setView("media");
              }}
              onAddMore={() => fileRef.current?.click()}
              onRemoveImage={removeImage}
              fullCategoryLabel={fullCategoryLabel}
              onOpenCategory={() => openPicker("category")}
              onClearCategory={() => {
                setCatCategory("");
                setCatGender("");
                setCatSub("");
              }}
              condition={condition}
              setCondition={setCondition}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              canNext={step2Valid}
              onNext={() => setView("final")}
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

        {/* Picker overlays — stack */}
        {(["category", "gender", "subcategory"] as Picker[]).map((p) => {
          const idx = pickerStack.indexOf(p);
          const visible = idx >= 0;
          return (
            <Layer key={p} visible={visible} z={20 + (idx >= 0 ? idx : 0)}>
              {p === "category" && (
                <CategoryPicker
                  search={searchCat}
                  setSearch={setSearchCat}
                  selectedCat={catCategory}
                  selectedSub={catSub}
                  onBack={popPicker}
                  onPick={(id) => {
                    setCatCategory(id);
                    openPicker("gender");
                  }}
                />
              )}
              {p === "gender" && (
                <GenderPicker
                  catLabel={selectedCategoryLabel}
                  selected={catGender}
                  onBack={popPicker}
                  onCrumb={() => goToPicker("category")}
                  onPick={(g) => {
                    setCatGender(g);
                    openPicker("subcategory");
                  }}
                />
              )}
              {p === "subcategory" && (
                <SubcategoryPicker
                  catLabel={selectedCategoryLabel}
                  genderLabel={catGender}
                  onBack={popPicker}
                  onCrumbAll={() => goToPicker("category")}
                  onCrumbGender={() => goToPicker("gender")}
                  onPick={(s) => {
                    setCatSub(s);
                    closePickers();
                  }}
                />
              )}
            </Layer>
          );
        })}

        {/* Hidden inputs */}
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
          onChange={setSize}
          gender={catGender}
          category={selectedCategoryLabel}
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

/* ============================== Shared bits ============================== */

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
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: CREAM }}>
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

/* ============================== Step 1: Media ============================== */

function MediaStep({
  onClose,
  onPickFiles,
  onOpenCamera,
}: {
  onClose: () => void;
  onPickFiles: () => void;
  onOpenCamera: () => void;
}) {
  const examples = [
    { label: "Ballore" },
    { label: "Detaje" },
    { label: "Marka dhe madhësia" },
    { label: "Materiali" },
    { label: "Video" },
  ];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title="Shto artikull të ri" rightLabel="Mbyll" onRight={onClose} />

      <div className="px-5 pt-3">
        <h2 className="text-[26px] font-bold leading-tight" style={{ color: INK }}>
          Shto foto dhe video
        </h2>
        <p className="mt-2 text-sm" style={{ color: MUTED }}>
          Shto deri në 8 foto dhe një video
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPickFiles}
            className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: CARD, color: INK }}
          >
            <Images className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-sm font-semibold">Ngarko media</span>
          </button>
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: CARD, color: INK }}
          >
            <Camera className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-sm font-semibold">Hap kamerën</span>
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-[17px] font-bold" style={{ color: INK }}>
            Një udhëzues i vogël për të filluar
          </h3>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            Bëje njoftimin tënd tërheqës me foto si këto
          </p>

          <div className="no-scrollbar mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {examples.map((e) => (
              <div key={e.label} className="flex w-[80px] shrink-0 flex-col items-center gap-2">
                <div
                  className="grid h-[80px] w-[80px] place-items-center rounded-xl"
                  style={{ background: CARD, color: MUTED }}
                >
                  {e.label === "Video" ? (
                    <Video className="h-7 w-7" strokeWidth={1.5} />
                  ) : (
                    <Images className="h-7 w-7" strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-center text-[11px] leading-tight" style={{ color: INK }}>
                  {e.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 2: Details ============================== */

function DetailsStep({
  images,
  onCancel,
  onAddMore,
  onRemoveImage,
  fullCategoryLabel,
  onOpenCategory,
  onClearCategory,
  condition,
  setCondition,
  title,
  setTitle,
  description,
  setDescription,
  canNext,
  onNext,
}: {
  images: PendingImage[];
  onCancel: () => void;
  onAddMore: () => void;
  onRemoveImage: (i: number) => void;
  fullCategoryLabel: string;
  onOpenCategory: () => void;
  onClearCategory: () => void;
  condition: string;
  setCondition: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  canNext: boolean;
  onNext: () => void;
}) {
  const slots = Math.max(images.length + 1, 4);
  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Shto artikull të ri" rightLabel="Anulo" onRight={onCancel} />

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Thumbnails row */}
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
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
                  {i === 0 && (
                    <div
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.55)" }}
                    >
                      <Pencil className="h-3 w-3 text-white" />
                    </div>
                  )}
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
            const isVideoSlot = i === slots - 1 && images.length < slots - 1;
            return (
              <button
                key={i}
                type="button"
                onClick={onAddMore}
                className="grid h-[100px] w-[100px] shrink-0 place-items-center rounded-2xl"
                style={{ background: CARD, color: MUTED }}
              >
                {isVideoSlot ? (
                  <Video className="h-7 w-7" strokeWidth={1.5} />
                ) : (
                  <Images className="h-7 w-7" strokeWidth={1.5} />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[12px] leading-snug" style={{ color: MUTED }}>
          Po lejon ripërdorimin e fotove tuaja momentalisht.{" "}
          <button type="button" className="underline" style={{ color: CORAL }}>
            Lexo më shumë ose ndrysho
          </button>
        </p>

        {/* Detajet */}
        <h2 className="mt-7 text-[22px] font-bold" style={{ color: INK }}>
          Detajet
        </h2>

        <button
          type="button"
          onClick={onOpenCategory}
          className="mt-3 flex w-full items-center gap-3 rounded-full px-4 py-3.5"
          style={{ background: CARD, color: INK }}
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-md"
            style={{ background: "transparent" }}
          >
            <GridIcon />
          </span>
          <span className="flex-1 text-left text-sm font-medium">Kategoria</span>
          <ChevronRight className="h-4 w-4" style={{ color: MUTED }} />
        </button>

        {fullCategoryLabel && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: CORAL, color: CORAL, background: "transparent" }}
            >
              {fullCategoryLabel}
              <button
                type="button"
                onClick={onClearCategory}
                aria-label="Hiq"
                className="grid h-4 w-4 place-items-center rounded-full"
                style={{ background: CORAL, color: "#fff" }}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          </div>
        )}

        <h3 className="mt-7 text-[17px] font-bold" style={{ color: INK }}>
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
                style={{
                  background: active ? INK : CARD,
                  color: active ? "#fff" : INK,
                }}
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
            {
              background: CARD,
              color: INK,
              ["--muted" as string]: MUTED,
            } as React.CSSProperties
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
            {
              background: CARD,
              color: INK,
              ["--muted" as string]: MUTED,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Sticky bottom */}
      <div
        className="sticky bottom-0 px-5 pb-6 pt-3"
        style={{ background: `linear-gradient(to top, ${CREAM} 70%, transparent)` }}
      >
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="w-full rounded-2xl py-4 text-sm font-bold transition"
          style={{
            background: canNext ? CORAL : DIVIDER,
            color: canNext ? "#fff" : MUTED,
          }}
        >
          Tjetër
        </button>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke={INK} strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke={INK} strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke={INK} strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke={INK} strokeWidth="1.5" />
    </svg>
  );
}

/* ============================== Step 3: Category ============================== */

function CategoryPicker({
  search,
  setSearch,
  selectedCat,
  selectedSub,
  onBack,
  onPick,
}: {
  search: string;
  setSearch: (s: string) => void;
  selectedCat: string;
  selectedSub: string;
  onBack: () => void;
  onPick: (id: string) => void;
}) {
  const filtered = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedItem = CATEGORIES.find((c) => c.id === selectedCat);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title="Zgjedh kategorinë" onBack={onBack} />

      <div className="px-5 pb-10">
        <div
          className="flex items-center gap-2 rounded-full px-4 py-3"
          style={{ background: CARD }}
        >
          <Search className="h-4 w-4" style={{ color: MUTED }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: INK }}
          />
        </div>

        {selectedItem && (
          <button
            type="button"
            onClick={() => onPick(selectedItem.id)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left"
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-full border-2"
              style={{ borderColor: CORAL }}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: CORAL }} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold" style={{ color: INK }}>
                {selectedItem.label}
              </span>
              {selectedSub && (
                <span className="block text-xs" style={{ color: MUTED }}>
                  {selectedSub}
                </span>
              )}
            </span>
          </button>
        )}

        <h3 className="mt-6 text-[15px] font-bold" style={{ color: INK }}>
          Të gjitha kategoritë
        </h3>

        <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">
          {filtered.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="flex flex-col items-center gap-2"
            >
              <span
                className="grid h-[72px] w-[72px] place-items-center rounded-full"
                style={{ background: CARD }}
              >
                <Icon className="h-7 w-7" strokeWidth={1.4} style={{ color: INK }} />
              </span>
              <span
                className="text-center text-[11px] font-semibold leading-tight"
                style={{ color: INK }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 4: Gender ============================== */

function GenderPicker({
  catLabel,
  selected,
  onBack,
  onCrumb,
  onPick,
}: {
  catLabel: string;
  selected: string;
  onBack: () => void;
  onCrumb: () => void;
  onPick: (g: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title="Zgjedh gjininë" onBack={onBack} />
      <div className="px-5 pb-10">
        <p className="text-xs" style={{ color: MUTED }}>
          <button type="button" onClick={onCrumb} className="underline">
            Të gjitha
          </button>{" "}
          <span style={{ color: INK }}>/ Gjinia</span>
          {catLabel && <span style={{ color: MUTED }}> · {catLabel}</span>}
        </p>

        <div className="mt-4 divide-y" style={{ borderColor: DIVIDER }}>
          {GENDERS.map(({ id, label, subtitle, Icon }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick(id)}
                className="flex w-full items-center gap-4 py-4 text-left"
                style={{ borderColor: DIVIDER }}
              >
                <span
                  className="grid h-[72px] w-[72px] place-items-center rounded-full"
                  style={{
                    background: CARD,
                    boxShadow: active ? `0 0 0 2px ${CORAL}` : undefined,
                  }}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.4} style={{ color: INK }} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold" style={{ color: INK }}>
                    {label}
                  </span>
                  <span className="block text-xs" style={{ color: MUTED }}>
                    {subtitle}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4" style={{ color: MUTED }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== Step 5: Subcategory ============================== */

function SubcategoryPicker({
  catLabel,
  genderLabel,
  onBack,
  onCrumbAll,
  onCrumbGender,
  onPick,
}: {
  catLabel: string;
  genderLabel: string;
  onBack: () => void;
  onCrumbAll: () => void;
  onCrumbGender: () => void;
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopHeader title="Zgjedh nënkategorinë" onBack={onBack} />
      <div className="px-5 pb-10">
        <p className="text-xs" style={{ color: MUTED }}>
          <button type="button" onClick={onCrumbAll} className="underline">
            Të gjitha
          </button>{" "}
          /{" "}
          <button type="button" onClick={onCrumbGender} className="underline">
            {genderLabel || "Gjinia"}
          </button>{" "}
          <span style={{ color: INK }}>/ {catLabel || "Kategori"}</span>
        </p>

        <div className="mt-3">
          {SUBCATEGORIES.map(({ id, label, Icon }, idx) => (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="flex w-full items-center gap-4 py-4 text-left"
              style={{
                borderTop: idx === 0 ? "none" : `1px solid ${DIVIDER}`,
              }}
            >
              <span
                className="grid h-[64px] w-[64px] place-items-center rounded-full"
                style={{ background: CARD }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.4} style={{ color: INK }} />
              </span>
              <span className="flex-1 text-[15px] font-semibold" style={{ color: INK }}>
                {label}
              </span>
              <ChevronRight className="h-4 w-4" style={{ color: MUTED }} />
            </button>
          ))}
        </div>
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
                style={{
                  background: active ? INK : CARD,
                  color: active ? "#fff" : INK,
                }}
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
          style={{
            background: canPublish ? CORAL : DIVIDER,
            color: canPublish ? "#fff" : MUTED,
          }}
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

// Keep unused circle import referenced to avoid lint complaints if tree-shaken
void Circle;
