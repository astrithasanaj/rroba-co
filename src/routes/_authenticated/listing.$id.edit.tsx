import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Loader2, Pencil, X, Grid3x3, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  SizePickerSheet,
  resolveSizeKind,
  sizeKindHidden,
} from "@/components/marketplace/SizePickerSheet";
import { ColorPickerSheet, COLOR_OPTIONS } from "@/components/marketplace/ColorPickerSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export const Route = createFileRoute("/_authenticated/listing/$id/edit")({
  component: EditListingPage,
});

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

const CONDITIONS = [
  { value: "I ri", subtitle: "Kurrë i përdorur" },
  { value: "Mirë përdorur", subtitle: "Pa shenja përdorimi" },
  { value: "Përdorur", subtitle: "Disa shenja përdorimi" },
  { value: "Shumë përdorur", subtitle: "Shenja të qarta përdorimi" },
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
  { id: "Interiør & mobilje", label: "Interiør & mobilje", genderMode: false },
];

const ADULT_GENDERS = ["Femra", "Meshkuj", "Uniseks"];
const KIDS_GENDERS = ["Vajza", "Djem", "Të dyja"];

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
      const { data: signed } = await supabase.storage.from("photos").createSignedUrls(filtered, 3600);
      const map: Record<string, string> = {};
      for (const s of signed ?? []) if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
      setPhotos(
        paths.map<Photo>((p) => ({
          kind: "existing",
          path: p,
          url: /^https?:\/\//i.test(p) ? p : map[p] ?? "",
        })),
      );
      setCatCategory(row.category ?? "");
      setCatGender(row.gender && row.gender !== "Unisex" ? row.gender : row.gender ?? "");
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
      if (!ALLOWED[file.type]) {
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
    if (!ALLOWED[file.type]) {
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
          const ext = ALLOWED[ph.mime];
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("photos")
            .upload(path, ph.file, { contentType: ph.mime, upsert: false });
          if (error) throw new Error(error.message);
          finalPaths.push(path);
        }
      }

      const { error } = await supabase
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
          price: priceNum,
          description: description.trim(),
          image_paths: finalPaths,
          delivery,
          status: "pending_review",
          updated_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .eq("id", id);
      if (error) throw new Error(error.message);

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
      <div className="grid h-screen place-items-center" style={{ background: CREAM }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
      </div>
    );
  }

  const fullCategoryLabel = [catCategory, catGender, catSub].filter(Boolean).join(" / ");

  return (
    <div
      className="fixed inset-0 flex justify-center"
      style={{ background: CREAM, height: "100dvh", overflow: "hidden" }}
    >
      <div className="relative flex h-full w-full max-w-[480px] flex-col" style={{ background: CREAM }}>
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: CREAM }}
        >
          <div className="w-20" />
          <h1 className="text-[15px] font-bold" style={{ color: INK }}>
            Ndrysho
          </h1>
          <div className="flex w-20 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{ background: INK, color: "#fff" }}
            >
              Anulo
            </button>
          </div>
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
                  style={{ background: CARD }}
                >
                  {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
                    aria-label="Fshij"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      replaceIdxRef.current = i;
                      replaceRef.current?.click();
                    }}
                    className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
                    aria-label="Ndrysho"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => movePhoto(i, -1)}
                      className="text-[10px] text-white disabled:opacity-30"
                      disabled={i === 0}
                    >
                      ‹
                    </button>
                    <span className="text-[10px] text-white/80">⠿</span>
                    <button
                      type="button"
                      onClick={() => movePhoto(i, 1)}
                      className="text-[10px] text-white disabled:opacity-30"
                      disabled={i === photos.length - 1}
                    >
                      ›
                    </button>
                  </div>
                </div>
              );
            })}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid h-[100px] w-[100px] shrink-0 place-items-center rounded-xl"
                style={{ background: CARD, color: INK }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Plus className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">Shto</span>
                </div>
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
            Po lejon ripërdorimin e fotove tuaja momentalisht.{" "}
            <button
              type="button"
              className="underline"
              style={{ color: CORAL }}
              onClick={() => toast.info("Ndrysho parametrat në cilësimet e profilit")}
            >
              Lexo më shumë ose ndrysho
            </button>
          </p>

          {/* Section 2: Category */}
          <SectionLabel>Kategoria</SectionLabel>
          <button
            type="button"
            onClick={() => setCatSheet("category")}
            className="flex w-full items-center justify-between rounded-full px-4 py-3.5 text-left text-sm"
            style={{ background: CARD, color: INK }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Grid3x3 className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
              <span className="truncate" style={{ color: fullCategoryLabel ? INK : MUTED }}>
                {fullCategoryLabel || "Zgjidh kategorinë"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
          </button>
          {fullCategoryLabel && (
            <button
              type="button"
              onClick={() => {
                setCatCategory("");
                setCatGender("");
                setCatSub("");
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
              style={{ borderColor: CORAL, color: CORAL, background: "transparent" }}
            >
              <span className="truncate">{fullCategoryLabel}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Section 3: Condition */}
          <SectionLabel>Gjendja</SectionLabel>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {CONDITIONS.map((c) => {
              const active = condition === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className="flex w-[150px] shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-3 text-left"
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

          {/* Section 4: Title + description */}
          <SectionLabel>Titulli</SectionLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Titulli"
            className="w-full rounded-2xl border-none px-4 py-3.5 text-sm focus:outline-none"
            style={{ background: CARD, color: INK }}
          />
          <SectionLabel>Përshkrimi i artikullit</SectionLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Përshkrimi i artikullit"
            className="w-full resize-none rounded-2xl border-none px-4 py-3.5 text-sm focus:outline-none"
            style={{ background: CARD, color: INK }}
          />
          <p className="mt-1.5 text-[11px]" style={{ color: MUTED }}>
            Përshkruaj formën, defektet dhe mangësitë eventuale
          </p>

          {/* Section 5: Size */}
          {!sizeHidden && (
            <>
              <SectionLabel>Madhësia</SectionLabel>
              <button
                type="button"
                onClick={() => setSizeSheet(true)}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm"
                style={{ background: CARD, color: INK }}
              >
                <span style={{ color: size ? INK : MUTED }}>{size || "Zgjidh madhësinë"}</span>
                <ChevronRight className="h-4 w-4" style={{ color: MUTED }} />
              </button>
            </>
          )}

          {/* Section 6: Color */}
          <SectionLabel>Ngjyra</SectionLabel>
          <button
            type="button"
            onClick={() => setColorSheet(true)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm"
            style={{ background: CARD, color: INK }}
          >
            <span className="flex min-w-0 items-center gap-2">
              {color.length === 0 ? (
                <span style={{ color: MUTED }}>Zgjidh ngjyrën</span>
              ) : (
                <>
                  <span className="flex -space-x-1.5">
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
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
          </button>

          {/* Section 7: Brand */}
          <SectionLabel>Marka</SectionLabel>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={60}
            placeholder="p.sh. Zara"
            className="w-full rounded-2xl border-none px-4 py-3.5 text-sm focus:outline-none"
            style={{ background: CARD, color: INK }}
          />

          {/* Section 8: Price + city */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <SectionLabel className="mt-0">Çmimi (€)</SectionLabel>
              <div className="rounded-2xl px-4 py-3.5" style={{ background: CARD }}>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="45"
                  className="no-spinner w-full bg-transparent text-sm focus:outline-none"
                  style={{ color: INK }}
                />
              </div>
            </div>
            <div>
              <SectionLabel className="mt-0">Qyteti</SectionLabel>
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

          {/* Section 9: Delivery */}
          <SectionLabel>Dorëzimi</SectionLabel>
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

        {/* Sticky save button */}
        <div
          className="sticky bottom-0 px-5 pb-6 pt-3"
          style={{ background: `linear-gradient(to top, ${CREAM} 70%, transparent)` }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 py-4 text-sm font-bold transition disabled:opacity-70"
            style={{ background: CORAL, color: "#fff", borderRadius: 14, minHeight: 56 }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Duke ruajtur…" : "Ruaj ndryshimet"}
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onPickAdd}
        />
        <input
          ref={replaceRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickReplace}
        />

        {/* Category picker sheets */}
        <Sheet open={catSheet !== null} onOpenChange={(o) => !o && setCatSheet(null)}>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl border-0 p-0"
            style={{ background: CREAM, maxHeight: "80dvh" }}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full" style={{ background: DIVIDER }} />
            <SheetHeader className="px-5 pt-3 text-left">
              <SheetTitle style={{ color: INK }}>
                {catSheet === "category"
                  ? "Zgjidh kategorinë"
                  : catSheet === "gender"
                    ? "Për kend është?"
                    : "Nënkategoria"}
              </SheetTitle>
            </SheetHeader>
            <div className="max-h-[70dvh] overflow-y-auto px-5 pb-6 pt-4">
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
                      className="rounded-2xl px-3 py-4 text-[13px] font-bold"
                      style={{ background: CARD, color: INK }}
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
                        className="rounded-full px-2 py-3 text-[12px] font-semibold"
                        style={{ background: CARD, color: INK }}
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
                      className="rounded-full px-2 py-3 text-[12px] font-semibold"
                      style={{ background: CARD, color: INK }}
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
          <AlertDialogContent style={{ background: CREAM, borderColor: DIVIDER }}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: INK }}>A je i sigurt?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: MUTED }}>
                Ndryshimet nuk do të ruhen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-full border-0"
                style={{ background: CARD, color: INK }}
              >
                Kthehu
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => navigate({ to: "/listing/$id/manage", params: { id } })}
                className="rounded-full"
                style={{ background: INK, color: "#fff" }}
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

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.15em] ${className}`}
      style={{ color: MUTED }}
    >
      {children}
    </p>
  );
}
