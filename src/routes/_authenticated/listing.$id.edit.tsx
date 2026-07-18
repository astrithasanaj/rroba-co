import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, X, Grid3x3, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CityPicker } from "@/components/marketplace/CityPicker";
import {
  SizePickerSheet,
  resolveSizeKind,
  sizeKindHidden,
} from "@/components/marketplace/SizePickerSheet";
import { ColorPickerSheet, COLOR_OPTIONS } from "@/components/marketplace/ColorPickerSheet";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { compressImage, PRODUCT_IMAGE_OPTIONS } from "@/utils/compressImage";

export const Route = createFileRoute("/_authenticated/listing/$id/edit")({
  component: () => (
    <SwipeBackWrapper>
      <EditListingPage />
    </SwipeBackWrapper>
  ),
});

// Brand tokens — mirror sell.tsx so create + edit share the same visual language.
const PAGE = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-muted)";
const CORAL_GRADIENT = "linear-gradient(120deg, var(--brand-coral), var(--brand-rose))";
const DIVIDER = "var(--brand-border)";
const ROSE = "var(--brand-rose)";
// Single source for keyboard focus-ring styling across edit.tsx (matches sell.tsx).
const FOCUS_CLASS = "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";
const SAFE_BOTTOM = "calc(1.5rem + env(safe-area-inset-bottom))";
const OVERLAY_GLYPH = "#ffffff"; // intentional white glyph on dark/gradient badges & CTAs
const OVERLAY_MUTED = "rgba(255,255,255,0.72)"; // muted glyph on gradient (condition subtitle)
const OVERLAY_SCRIM = "rgba(0,0,0,0.6)"; // scrim behind delete/edit icons on images

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

const CONDITIONS = [
  { value: "I ri", subtitle: "Kurrë i përdorur" },
  { value: "Mirë përdorur", subtitle: "Shenja të lehta përdorimi" },
  { value: "Përdorur", subtitle: "Shenja të dukshme përdorimi" },
  { value: "Shumë përdorur", subtitle: "Shenja të forta përdorimi" },
];

type GenderMode = "adult" | "kids" | false;
type Category = { id: string; label: string; genderMode: GenderMode };

const CATEGORIES: Category[] = [
  { id: "Veshje", label: "Veshje", genderMode: "adult" },
  { id: "Këpucë", label: "Këpucë", genderMode: "adult" },
  { id: "Çanta", label: "Çanta", genderMode: "adult" },
  { id: "Aksesorë", label: "Aksesorë", genderMode: "adult" },
  { id: "Fëmijë & bebe", label: "Fëmijë & bebe", genderMode: "kids" },
  { id: "Outdoor & sport", label: "Outdoor & sport", genderMode: false },
  { id: "Art & dizajn", label: "Art & dizajn", genderMode: false },
  { id: "Elektronikë & zë", label: "Elektronikë & zë", genderMode: false },
  { id: "Interier & mobilie", label: "Interier & mobilie", genderMode: false },
];

const ADULT_GENDERS = ["Femra", "Meshkuj", "Uniseks"];
const KIDS_GENDERS = ["Vajza", "Djem", "Të dyja"];

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

type ExistingPhoto = { kind: "existing"; path: string; url: string };
type NewPhoto = { kind: "new"; file: File; previewUrl: string; mime: string };
type Photo = ExistingPhoto | NewPhoto;

function EditListingPage() {
  const { id } = useParams({ from: "/_authenticated/listing/$id/edit" });
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdxRef = useRef<number | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);

  const [catCategory, setCatCategory] = useState("");
  const [catGender, setCatGender] = useState("");
  const [catSub, setCatSub] = useState("");
  const [condition, setCondition] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [cityId, setCityId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<string[]>([]);

  const [sizeSheet, setSizeSheet] = useState(false);
  const [colorSheet, setColorSheet] = useState(false);
  const [catSheet, setCatSheet] = useState<null | "category" | "gender" | "subcategory">(null);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (!row || row.user_id !== user.id) {
        navigate({ to: "/profile" });
        return;
      }
      const paths: string[] = row.image_paths ?? [];
      const filtered = paths.filter((p) => p && !/^https?:\/\//i.test(p));
      const { data: signed } = await supabase.storage
        .from("photos")
        .createSignedUrls(filtered, 3600);
      const map: Record<string, string> = {};
      for (const s of signed ?? []) if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      setPhotos(
        paths.map<Photo>((p) => ({
          kind: "existing",
          path: p,
          url: /^https?:\/\//i.test(p) ? p : (map[p] ?? ""),
        })),
      );
      setCatCategory(row.category ?? "");
      setCatGender(row.gender && row.gender !== "Unisex" ? row.gender : (row.gender ?? ""));
      setCatSub(row.subcategory ?? "");
      setCondition(row.condition ?? "");
      setTitle(row.title ?? "");
      setDescription(row.description ?? "");
      setBrand(row.brand ?? "");
      setSize(row.size ?? "");
      setColor(
        (row.color ?? "")
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean),
      );
      setPrice(String(row.price ?? ""));
      setCity(row.city ?? "");
      setCityId((row as unknown as { city_id?: string | null }).city_id ?? null);
      // Drop "Posta" if previously saved
      setDelivery(((row.delivery ?? []) as string[]).filter((d) => d !== "Posta"));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === catCategory),
    [catCategory],
  );
  const sizeKind = resolveSizeKind(catCategory, catGender, catSub);
  const sizeHidden = sizeKindHidden(sizeKind);

  const addPhotos = (files: FileList) => {
    const remaining = MAX_PHOTOS - photos.length;
    const added: NewPhoto[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      // Same iOS/Safari fallback as sell.tsx: some devices report empty MIME
      // for HEIC/HEIF — accept by extension so compressImage() can normalize.
      const isHeicByName = /\.(heic|heif)$/i.test(file.name);
      if (!ALLOWED[file.type] && !isHeicByName) {
        toast.error(`${file.name}: format i palejuar`);
        continue;
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        toast.error(`${file.name}: madhësi e palejuar (maks 10MB)`);
        continue;
      }
      added.push({ kind: "new", file, previewUrl: URL.createObjectURL(file), mime: file.type });
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
  };

  const onPickAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addPhotos(e.target.files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = replaceIdxRef.current;
    const file = e.target.files?.[0];
    if (idx == null || !file) return;
    const isHeicByName = /\.(heic|heif)$/i.test(file.name);
    if (!ALLOWED[file.type] && !isHeicByName) {
      toast.error("Format i palejuar");
    } else if (file.size === 0 || file.size > MAX_BYTES) {
      toast.error("Madhësi e palejuar (maks 10MB)");
    } else {
      setPhotos((p) => {
        const next = [...p];
        const prev = next[idx];
        if (prev?.kind === "existing") setRemovedPaths((r) => [...r, prev.path]);
        if (prev?.kind === "new") URL.revokeObjectURL(prev.previewUrl);
        next[idx] = {
          kind: "new",
          file,
          previewUrl: URL.createObjectURL(file),
          mime: file.type,
        };
        return next;
      });
    }
    replaceIdxRef.current = null;
    if (replaceRef.current) replaceRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => {
      const next = [...p];
      const [r] = next.splice(idx, 1);
      if (r?.kind === "existing") setRemovedPaths((rp) => [...rp, r.path]);
      if (r?.kind === "new") URL.revokeObjectURL(r.previewUrl);
      return next;
    });
  };

  const movePhoto = (from: number, dir: -1 | 1) => {
    setPhotos((p) => {
      const to = from + dir;
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const toggleDelivery = (opt: string) =>
    setDelivery((d) => (d.includes(opt) ? d.filter((x) => x !== opt) : [...d, opt]));

  const handleCancel = () => setConfirmCancel(true);

  const handleSave = async () => {
    if (saving) return;
    const priceNum = Number(price.replace(",", "."));
    if (!title.trim()) return toast.error("Shto titullin");
    if (!catCategory) return toast.error("Zgjidh kategorinë");
    if (!Number.isFinite(priceNum) || priceNum < 0) return toast.error("Çmim i pavlefshëm");
    if (photos.length < 1) return toast.error("Duhet të paktën 1 foto");

    setSaving(true);
    try {
      // Upload any new photos
      const finalPaths: string[] = [];
      for (const ph of photos) {
        if (ph.kind === "existing") {
          finalPaths.push(ph.path);
        } else {
          const compressed = await compressImage(ph.file, PRODUCT_IMAGE_OPTIONS);
          const ext = compressed.type === "image/webp" ? "webp" : "jpg";
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("photos")
            .upload(path, compressed, { contentType: compressed.type, upsert: false });
          if (error) throw new Error(error.message);
          finalPaths.push(path);
        }
      }

      // Verify every path resolves in storage before saving — drop broken references
      // so no listing goes live with an unresolvable cover image.
      const toVerify = finalPaths.filter((p) => !/^https?:\/\//i.test(p));
      const verified = new Set<string>(finalPaths.filter((p) => /^https?:\/\//i.test(p)));
      if (toVerify.length) {
        const { data: signed } = await supabase.storage
          .from("photos")
          .createSignedUrls(toVerify, 60);
        for (const s of signed ?? []) {
          if (s.path && s.signedUrl && !s.error) verified.add(s.path);
        }
      }
      const cleanPaths = finalPaths.filter((p) => verified.has(p));
      if (cleanPaths.length < 1) {
        throw new Error("Duhet të paktën 1 foto e vlefshme");
      }

      const { data: updated, error } = await supabase
        .from("listings")
        .update({
          title: title.trim(),
          brand: brand.trim(),
          category: catCategory,
          subcategory: catSub || null,
          gender: catGender || "Unisex",
          size: size || "",
          condition: condition || "I mirë",
          color: color.join(", "),
          city,
          city_id: cityId,
          price: priceNum,
          description: description.trim(),
          image_paths: cleanPaths,
          delivery,
          updated_at: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Nuk u lejua të ruash këtë artikull.");

      // Clean up removed storage objects (best-effort)
      if (removedPaths.length) {
        await supabase.storage.from("photos").remove(removedPaths);
      }

      toast.success("Ndryshimet u ruajtën! Artikulli është duke u rishikuar.");
      setTimeout(() => {
        navigate({ to: "/listing/$id/manage", params: { id } });
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ruajtja dështoi");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 grid place-items-center"
        style={{ background: PAGE, height: "100dvh" }}
        aria-busy="true"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} aria-hidden="true" />
        <span className="sr-only">Duke ngarkuar…</span>
      </div>
    );
  }

  const fullCategoryLabel = [catCategory, catGender, catSub].filter(Boolean).join(" / ");
  const priceInvalid = price !== "" && !Number.isFinite(Number(price.replace(",", ".")));

  return (
    <div
      className="fixed inset-0 flex justify-center"
      style={{ background: PAGE, height: "100dvh", overflow: "hidden" }}
    >
      <div
        className="relative flex h-full w-full max-w-[480px] flex-col"
        style={{ background: PAGE }}
      >
        {/* Header — mirrors sell.tsx TopBar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: PAGE }}
        >
          <div className="flex w-20 justify-start">
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Kthehu"
              className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_CLASS}`}
              style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
            >
              <ChevronLeft
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                style={{ color: "var(--brand-ink)" }}
              />
            </button>
          </div>
          <h1 className="text-[15px] font-semibold" style={{ color: INK }}>
            Ndrysho
          </h1>
          <div className="w-20" />
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-36">
          {/* Section 1: Photos */}
          <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
            {photos.map((ph, i) => {
              const src = ph.kind === "existing" ? ph.url : ph.previewUrl;
              return (
                <div
                  key={i}
                  className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl"
                  style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
                >
                  {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className={`absolute right-0 top-0 grid h-11 w-11 place-items-start justify-end rounded-tr-xl bg-transparent ${FOCUS_CLASS}`}
                    aria-label={`Fshij foton ${i + 1}`}
                  >
                    <span
                      className="grid h-6 w-6 place-items-center rounded-bl-xl rounded-tr-xl"
                      style={{ background: OVERLAY_SCRIM, color: OVERLAY_GLYPH }}
                      aria-hidden="true"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      replaceIdxRef.current = i;
                      replaceRef.current?.click();
                    }}
                    className={`absolute left-0 top-0 grid h-11 w-11 place-items-start justify-start rounded-tl-xl bg-transparent ${FOCUS_CLASS}`}
                    aria-label={`Ndrysho foton ${i + 1}`}
                  >
                    <span
                      className="grid h-6 w-6 place-items-center rounded-br-xl rounded-tl-xl"
                      style={{ background: OVERLAY_SCRIM, color: OVERLAY_GLYPH }}
                      aria-hidden="true"
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </button>
                  <div
                    className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1 py-0.5"
                    style={{ background: OVERLAY_SCRIM }}
                  >
                    <button
                      type="button"
                      onClick={() => movePhoto(i, -1)}
                      className={`grid h-6 w-6 place-items-center text-[12px] disabled:opacity-30 ${FOCUS_CLASS}`}
                      style={{ color: OVERLAY_GLYPH }}
                      disabled={i === 0}
                      aria-label={`Zhvendos foton ${i + 1} majtas`}
                    >
                      <span aria-hidden="true">‹</span>
                    </button>
                    <span
                      className="text-[10px]"
                      style={{ color: OVERLAY_MUTED }}
                      aria-hidden="true"
                    >
                      ⠿
                    </span>
                    <button
                      type="button"
                      onClick={() => movePhoto(i, 1)}
                      className={`grid h-6 w-6 place-items-center text-[12px] disabled:opacity-30 ${FOCUS_CLASS}`}
                      style={{ color: OVERLAY_GLYPH }}
                      disabled={i === photos.length - 1}
                      aria-label={`Zhvendos foton ${i + 1} djathtas`}
                    >
                      <span aria-hidden="true">›</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`grid h-[100px] w-[100px] shrink-0 place-items-center rounded-xl transition active:scale-[0.98] ${FOCUS_CLASS}`}
                style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
                aria-label="Shto foto"
              >
                <div className="flex flex-col items-center gap-1">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] font-semibold">Shto</span>
                </div>
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
            Fotot në formatin portret (3:4) funksionojnë më mirë
          </p>

          {/* Section 2: Category */}
          <Label htmlFor="edit-category-trigger">Kategoria</Label>
          <button
            id="edit-category-trigger"
            type="button"
            onClick={() => setCatSheet("category")}
            className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition active:scale-[0.99] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Grid3x3 className="h-4 w-4 shrink-0" style={{ color: MUTED }} aria-hidden="true" />
              <span className="truncate" style={{ color: fullCategoryLabel ? INK : MUTED }}>
                {fullCategoryLabel || "Zgjidh kategorinë"}
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0"
              style={{ color: MUTED }}
              aria-hidden="true"
            />
          </button>
          {fullCategoryLabel && (
            <button
              type="button"
              onClick={() => {
                setCatCategory("");
                setCatGender("");
                setCatSub("");
              }}
              className={`mt-2 inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-[0.97] ${FOCUS_CLASS}`}
              style={{ borderColor: ROSE, color: ROSE, background: "transparent" }}
              aria-label={`Hiq kategorinë: ${fullCategoryLabel}`}
            >
              <span className="truncate">{fullCategoryLabel}</span>
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}

          {/* Section 3: Condition */}
          <Label>Gjendja</Label>
          <div
            role="radiogroup"
            aria-label="Gjendja e artikullit"
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
          >
            {CONDITIONS.map((c) => {
              const active = condition === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCondition(c.value)}
                  className={`flex w-[150px] shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left transition active:scale-[0.98] ${FOCUS_CLASS}`}
                  style={{
                    background: active ? CORAL_GRADIENT : CARD,
                    color: active ? OVERLAY_GLYPH : INK,
                    border: active ? "1px solid transparent" : `1px solid ${DIVIDER}`,
                  }}
                >
                  <span className="text-[13px] font-semibold leading-tight">{c.value}</span>
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: active ? OVERLAY_MUTED : MUTED }}
                  >
                    {c.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section 4: Title + description */}
          <Label htmlFor="edit-title">Titulli</Label>
          <input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Titulli"
            autoComplete="off"
            enterKeyHint="next"
            className={`h-[52px] w-full rounded-2xl px-4 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          />
          <Label htmlFor="edit-description">Përshkrimi i artikullit</Label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Përshkrimi i artikullit"
            className={`w-full resize-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{
              background: CARD,
              color: INK,
              border: `1px solid ${DIVIDER}`,
              minHeight: 120,
            }}
          />
          <p className="mt-1.5 text-[11px]" style={{ color: MUTED }}>
            Përshkruaj formën, defektet dhe mangësitë eventuale
          </p>

          {/* Section 5: Size */}
          {!sizeHidden && (
            <>
              <Label htmlFor="edit-size-trigger">Madhësia</Label>
              <button
                id="edit-size-trigger"
                type="button"
                onClick={() => setSizeSheet(true)}
                className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition active:scale-[0.99] ${FOCUS_CLASS}`}
                style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
              >
                <span style={{ color: size ? INK : MUTED }}>{size || "Zgjidh madhësinë"}</span>
                <ChevronRight className="h-4 w-4" style={{ color: MUTED }} aria-hidden="true" />
              </button>
            </>
          )}

          {/* Section 6: Color */}
          <Label htmlFor="edit-color-trigger">Ngjyra</Label>
          <button
            id="edit-color-trigger"
            type="button"
            onClick={() => setColorSheet(true)}
            className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm transition active:scale-[0.99] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          >
            <span className="flex min-w-0 items-center gap-2">
              {color.length === 0 ? (
                <span style={{ color: MUTED }}>Zgjidh ngjyrën</span>
              ) : (
                <>
                  <span className="flex -space-x-1.5" aria-hidden="true">
                    {color.map((c) => {
                      const opt = COLOR_OPTIONS.find((o) => o.name === c);
                      if (!opt) return null;
                      const bg =
                        opt.inner === "rainbow"
                          ? "conic-gradient(from 0deg, #ff3b3b, #ffb13b, #ffe93b, #4ade80, #22d3ee, #6366f1, #d946ef, #ff3b3b)"
                          : opt.inner;
                      return (
                        <span
                          key={c}
                          className="h-4 w-4 shrink-0 rounded-full border"
                          style={{ borderColor: DIVIDER, background: bg }}
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
              className="h-4 w-4 shrink-0"
              style={{ color: MUTED }}
              aria-hidden="true"
            />
          </button>

          {/* Section 7: Brand */}
          <Label htmlFor="edit-brand">Marka</Label>
          <input
            id="edit-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={60}
            placeholder="p.sh. Zara"
            autoComplete="off"
            enterKeyHint="next"
            className={`h-[52px] w-full rounded-2xl px-4 text-sm placeholder:text-[color:var(--brand-ink-muted)] ${FOCUS_CLASS}`}
            style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
          />

          {/* Section 8: Price + city */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-price">Çmimi (€)</Label>
              <div
                className={`flex h-[52px] w-full items-center rounded-2xl px-4 ${
                  priceInvalid ? "" : ""
                }`}
                style={{
                  background: CARD,
                  border: `1px solid ${priceInvalid ? "var(--brand-danger)" : DIVIDER}`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="mr-2 text-sm font-semibold"
                  style={{ color: MUTED }}
                >
                  €
                </span>
                <input
                  id="edit-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="done"
                  aria-invalid={priceInvalid || undefined}
                  className="no-spinner w-full bg-transparent text-sm focus:outline-none"
                  style={{ color: INK }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-city">Qyteti</Label>
              <CityPicker
                value={cityId}
                onChange={(id, c) => {
                  setCityId(id);
                  setCity(c.name);
                }}
              />
            </div>
          </div>

          {/* Section 9: Delivery */}
          <Label>Dorëzimi</Label>
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

        {/* Sticky save button — matches sell.tsx CTA */}
        <div
          className="sticky bottom-0 px-5 pt-3"
          style={{
            background: `linear-gradient(to top, var(--brand-surface) 70%, transparent)`,
            paddingBottom: SAFE_BOTTOM,
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving || undefined}
            className={`relative inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition enabled:active:scale-[0.98] disabled:active:scale-100 disabled:opacity-70 ${FOCUS_CLASS}`}
            style={{ background: CORAL_GRADIENT, color: OVERLAY_GLYPH }}
          >
            <span
              className="inline-flex items-center gap-2"
              style={{ visibility: saving ? "hidden" : "visible" }}
            >
              Ruaj ndryshimet
            </span>
            {saving && (
              <span
                className="absolute inset-0 inline-flex items-center justify-center gap-2"
                aria-hidden="true"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Duke ruajtur…</span>
              </span>
            )}
          </button>
        </div>

        {/* Hidden inputs — HEIC/HEIF accepted (normalized in compressImage) */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={onPickAdd}
        />
        <input
          ref={replaceRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={onPickReplace}
        />

        {/* Category picker sheets */}
        <Sheet open={catSheet !== null} onOpenChange={(o) => !o && setCatSheet(null)}>
          <SheetContent
            side="bottom"
            hideClose
            className="border-0 p-0"
            style={{ background: PAGE }}
          >
            <div className="flex items-center gap-3 px-5 pb-3 pt-4">
              <button
                type="button"
                onClick={() => setCatSheet(null)}
                aria-label="Kthehu"
                className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_CLASS}`}
                style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
              >
                <ChevronLeft
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  style={{ color: "var(--brand-ink)" }}
                />
              </button>
              <SheetTitle style={{ color: INK }}>
                {catSheet === "category"
                  ? "Zgjidh kategorinë"
                  : catSheet === "gender"
                    ? "Për kend është?"
                    : "Nënkategoria"}
              </SheetTitle>
            </div>
            <div
              className="overflow-y-auto px-5 pb-6 pt-2"
              style={{ height: "calc(100dvh - 76px)" }}
            >
              {catSheet === "category" && (
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCatCategory(c.id);
                        setCatGender("");
                        setCatSub("");
                        if (c.genderMode === false) setCatSheet("subcategory");
                        else setCatSheet("gender");
                      }}
                      className={`min-h-[52px] rounded-2xl px-3 py-4 text-[13px] font-bold transition active:scale-[0.98] ${FOCUS_CLASS}`}
                      style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              {catSheet === "gender" && selectedCategory && (
                <div className="grid grid-cols-3 gap-2.5">
                  {(selectedCategory.genderMode === "kids" ? KIDS_GENDERS : ADULT_GENDERS).map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setCatGender(g);
                          setCatSheet("subcategory");
                        }}
                        className={`min-h-11 rounded-full px-2 py-3 text-[12px] font-semibold transition active:scale-[0.97] ${FOCUS_CLASS}`}
                        style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
                      >
                        {g}
                      </button>
                    ),
                  )}
                </div>
              )}
              {catSheet === "subcategory" && selectedCategory && (
                <div className="grid grid-cols-3 gap-2.5">
                  {getSubcategories(selectedCategory.id, catGender).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setCatSub(s);
                        setCatSheet(null);
                      }}
                      className={`min-h-11 rounded-full px-2 py-3 text-[12px] font-semibold transition active:scale-[0.97] ${FOCUS_CLASS}`}
                      style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <SizePickerSheet
          open={sizeSheet}
          onOpenChange={setSizeSheet}
          value={size}
          onChange={setSize}
          kind={sizeKind}
        />
        <ColorPickerSheet
          open={colorSheet}
          onOpenChange={setColorSheet}
          value={color}
          onChange={setColor}
        />

        {/* Cancel confirm */}
        <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <AlertDialogContent style={{ background: PAGE, borderColor: DIVIDER }}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: INK }}>A je i sigurt?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: MUTED }}>
                Ndryshimet nuk do të ruhen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className={`rounded-full border-0 ${FOCUS_CLASS}`}
                style={{ background: CARD, color: INK, border: `1px solid ${DIVIDER}` }}
              >
                Kthehu
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => window.history.back()}
                className={`rounded-full ${FOCUS_CLASS}`}
                style={{ background: CORAL_GRADIENT, color: OVERLAY_GLYPH }}
              >
                Po, largohu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      className={`mb-2 mt-5 block text-[11px] font-semibold uppercase tracking-[0.15em] ${className}`}
      style={{ color: MUTED }}
    >
      {children}
    </label>
  );
}
