import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, ChevronLeft, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CITIES, CONDITIONS, GENDERS } from "@/lib/listings";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

const MIN = 3;
const MAX = 10;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 10 * 1024 * 1024;

type PendingImage = { file: File; previewUrl: string; mime: string };

function SellPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [images, setImages] = useState<PendingImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [color, setColor] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const pickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX - images.length;
    const list = Array.from(files).slice(0, remaining);
    const added: PendingImage[] = [];
    for (const file of list) {
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
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    setImages((p) => {
      const next = [...p];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return p;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const priceNum = Number(price.replace(",", "."));
  const step1Valid = images.length >= MIN && images.length <= MAX;
  const step2Valid =
    title.trim().length > 0 &&
    brand.trim().length > 0 &&
    category &&
    size.trim().length > 0 &&
    condition &&
    city &&
    gender &&
    price.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    description.trim().length > 0;

  const publish = async () => {
    if (!userId || submitting || !step1Valid || !step2Valid) return;
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
          size: size.trim(),
          condition,
          color: color.trim(),
          city,
          gender,
          price: priceNum,
          description: description.trim(),
          image_paths: uploaded,
        })
        .select("id")
        .single();
      if (error) {
        await supabase.storage.from("photos").remove(uploaded);
        throw new Error(error.message);
      }
      toast.success("Artikulli u publikua!");
      navigate({ to: "/product/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publikimi dështoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <h1 className="flex-1 text-center font-display text-lg">
          Shit artikull · Hap {step}/3
        </h1>
        <div className="h-9 w-9" />
      </header>

      <div className="flex h-1 gap-1 px-5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 rounded-full ${s <= step ? "bg-foreground" : "bg-secondary"}`}
          />
        ))}
      </div>

      <div className="space-y-5 px-5 py-5">
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>
                Foto ({images.length}/{MAX}) — minimum {MIN}
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={img.previewUrl}
                    className="relative aspect-square overflow-hidden rounded-lg bg-secondary"
                  >
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 text-[10px] font-semibold">
                        Kopertinë
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute inset-x-1 bottom-1 flex justify-between">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="grid h-5 w-5 place-items-center rounded-full bg-background/90 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="grid h-5 w-5 place-items-center rounded-full bg-background/90 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {images.length < MAX && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-secondary"
                  >
                    {images.length === 0 ? (
                      <Camera className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={pickFiles}
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="inline-flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-50"
            >
              Vazhdo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Titulli">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="P.sh. Xhaketë Levi's" />
            </Field>
            <Field label="Përshkrimi">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Tregoji blerësit gjendjen, materialin..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategoria">
                <SelectInput value={category} onChange={setCategory} options={CATEGORIES.map((c) => c.value)} />
              </Field>
              <Field label="Marka">
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} placeholder="Zara" />
              </Field>
              <Field label="Madhësia">
                <Input value={size} onChange={(e) => setSize(e.target.value)} maxLength={20} placeholder="M, 38" />
              </Field>
              <Field label="Gjendja">
                <SelectInput value={condition} onChange={setCondition} options={[...CONDITIONS]} />
              </Field>
              <Field label="Ngjyra">
                <Input value={color} onChange={(e) => setColor(e.target.value)} maxLength={40} placeholder="E zezë" />
              </Field>
              <Field label="Qyteti">
                <SelectInput value={city} onChange={setCity} options={[...CITIES]} />
              </Field>
              <Field label="Gjinia">
                <SelectInput value={gender} onChange={setGender} options={[...GENDERS]} />
              </Field>
              <Field label="Çmimi (€)">
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="inline-flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-50"
            >
              Vazhdo në pamje
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border">
              <img src={images[0]?.previewUrl} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl">{title}</h2>
                  <p className="font-display text-2xl">€{price}</p>
                </div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{brand}</p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 rounded-xl bg-secondary/50 p-3 text-sm">
                  {[
                    ["Kategoria", category],
                    ["Madhësia", size],
                    ["Gjendja", condition],
                    ["Ngjyra", color || "—"],
                    ["Qyteti", city],
                    ["Gjinia", gender],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] uppercase text-muted-foreground">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="whitespace-pre-wrap pt-2 text-sm">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={publish}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Po publikon..." : "Publiko"}
            </button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Zgjidh" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
