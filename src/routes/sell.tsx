import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

const GENDERS = ["Femra", "Meshkuj", "Fëmijë"] as const;
const CATEGORIES = ["Veshje", "Këpucë", "Çanta", "Aksesorë", "Vintage", "Designer/Premium"];
const CONDITIONS = ["I ri me etiketë", "Shkëlqyeshëm", "Shumë mirë", "Mirë"];
const CITIES = ["Prishtinë", "Prizren", "Pejë", "Tiranë", "Gjilan", "Ferizaj"];
const DELIVERY = ["Posta", "Takim", "Dorëzim në shtëpi"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "One size"];
const COLORS = ["E zezë", "E bardhë", "Bezhë", "Kafe", "Gri", "Blu", "E gjelbër", "E kuqe", "E verdhë", "Portokalli", "Rozë", "Vjollcë"];

const MAX_PHOTOS = 10;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 10 * 1024 * 1024;

type PendingImage = { file: File; previewUrl: string; mime: string };

const CREAM = "#f6f1e7";
const RUST = "#b94a1f";

function SellPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

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
    setImages((p) => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((p) => {
      const next = [...p];
      const [r] = next.splice(idx, 1);
      if (r) URL.revokeObjectURL(r.previewUrl);
      return next;
    });
  };

  const toggleDelivery = (opt: string) =>
    setDelivery((p) => (p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]));

  const priceNum = Number(price.replace(",", "."));
  const canPublish =
    !!gender &&
    !!category &&
    images.length >= 1 &&
    title.trim().length > 0 &&
    !!condition &&
    price.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    !!city;

  const publish = async () => {
    if (!userId || submitting || !canPublish) return;
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
          category,
          size,
          condition,
          color,
          city,
          gender,
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

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <div
        className="relative mx-auto min-h-screen w-full max-w-[480px] pb-32"
        style={{ background: CREAM }}
      >
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-black/5 px-4 py-4 backdrop-blur" style={{ background: `${CREAM}f0` }}>
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Mbyll"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-sans text-2xl font-semibold">Shit një artikull</h1>
        </header>

        <div className="space-y-10 px-5 py-6">
          {/* 01 */}
          <Section num="01" title="Për kë është artikulli?">
            <div className="grid grid-cols-3 gap-2.5">
              {GENDERS.map((g) => {
                const active = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-lg px-3 py-4 text-xs font-semibold tracking-[0.15em] transition ${
                      active
                        ? "bg-black text-white"
                        : "bg-black/[0.04] text-foreground hover:bg-black/[0.07]"
                    }`}
                  >
                    {g.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 02 */}
          <Section num="02" title="Zgjedh kategorinë">
            <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
          </Section>

          {/* 03 */}
          <Section num="03" title="Foto">
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => {
                const img = images[i];
                if (img) {
                  return (
                    <div
                      key={img.previewUrl}
                      className="relative aspect-square overflow-hidden rounded-lg bg-black/[0.04]"
                    >
                      <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }
                const isFirstEmpty = i === images.length;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => isFirstEmpty && fileRef.current?.click()}
                    disabled={!isFirstEmpty}
                    className={`grid aspect-square place-items-center rounded-lg text-muted-foreground transition ${
                      isFirstEmpty
                        ? "border border-dashed border-black/30 bg-black/[0.04] hover:bg-black/[0.07]"
                        : "bg-black/[0.04]"
                    }`}
                  >
                    {isFirstEmpty && (
                      <span className="flex flex-col items-center gap-1.5">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px] font-semibold tracking-[0.15em]">SHTO</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Shto deri në {MAX_PHOTOS} foto {images.length > 0 ? `· ${images.length}/${MAX_PHOTOS}` : ""}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={pickFiles}
            />

          </Section>

          {/* 04 */}
          <Section num="04" title="Detajet">
            <FieldLabel>Titulli</FieldLabel>
            <TextInput value={title} onChange={setTitle} placeholder="p.sh. Zara Oversized Blazer" maxLength={120} />

            <FieldLabel className="mt-5">Marka</FieldLabel>
            <TextInput value={brand} onChange={setBrand} placeholder="Zara" maxLength={60} />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Madhësia</FieldLabel>
                <SelectInput value={size} onChange={setSize} options={SIZES} />
              </div>
              <div>
                <FieldLabel>Ngjyra</FieldLabel>
                <SelectInput value={color} onChange={setColor} options={COLORS} />
              </div>
            </div>

            <FieldLabel className="mt-5">Gjendja</FieldLabel>
            <ChipRow options={CONDITIONS} value={condition} onChange={setCondition} />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Çmimi (€)</FieldLabel>
                <TextInput
                  value={price}
                  onChange={setPrice}
                  placeholder="45"
                  inputMode="decimal"
                  type="number"
                />
              </div>
              <div>
                <FieldLabel>Qyteti</FieldLabel>
                <SelectInput value={city} onChange={setCity} options={CITIES} />
              </div>
            </div>

            <FieldLabel className="mt-5">Dorëzimi</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {DELIVERY.map((d) => {
                const active = delivery.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDelivery(d)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-transparent text-foreground hover:bg-black/[0.04]"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <FieldLabel className="mt-5">Përshkrimi</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Trego diçka për artikullin..."
              className="w-full resize-none rounded-lg border-none bg-black/[0.04] px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </Section>

          <button
            type="button"
            onClick={publish}
            disabled={!canPublish || submitting}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-sm font-semibold tracking-[0.2em] text-white transition disabled:bg-black/40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "PO PUBLIKON..." : "PUBLIKO"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-sans text-xs font-bold tracking-widest" style={{ color: RUST }}>
          {num}
        </span>
        <h2 className="font-sans text-2xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-black bg-black text-white"
                : "border-black/15 bg-transparent text-foreground hover:bg-black/[0.04]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground ${className}`}
    >
      {children}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      type={type}
      className="w-full rounded-lg border-none bg-black/[0.04] px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-black/20"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border-none bg-black/[0.04] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
    >
      <option value="" disabled>
        Zgjidh
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

