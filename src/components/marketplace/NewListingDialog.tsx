import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { compressImage, PRODUCT_IMAGE_OPTIONS } from "@/utils/compressImage";
import { CATEGORY_TAXONOMY } from "@/lib/category-taxonomy";

const MIN_IMAGES = 3;
const MAX_IMAGES = 10;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_DIM = 100;
const MAX_DIM = 8000;


type PendingImage = { file: File; previewUrl: string; mime: string };

const sniffMime = async (file: File): Promise<string | null> => {
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646") && buf.length >= 12) {
    const tag = String.fromCharCode(...buf.slice(8, 12));
    if (tag === "WEBP") return "image/webp";
  }
  return null;
};

const readDimensions = (file: File): Promise<{ w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode_failed"));
    };
    img.src = url;
  });

export function NewListingDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [nodeKey, setNodeKey] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedNode = CATEGORY_TAXONOMY.find((n) => n.key === nodeKey);
  const category = selectedNode?.categories[0] ?? "";

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setTitle("");
    setBrand("");
    setNodeKey("");
    setSubcategory("");
    setSize("");
    setPrice("");
    setDescription("");
  };

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    const list = Array.from(files).slice(0, remaining);
    const added: PendingImage[] = [];
    for (const file of list) {
      if (!ALLOWED_MIME[file.type]) {
        toast.error(`${file.name}: format ikke tillatt`);
        continue;
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        toast.error(`${file.name}: ugyldig størrelse (maks 10MB)`);
        continue;
      }
      const sniffed = await sniffMime(file);
      if (!sniffed || sniffed !== file.type) {
        toast.error(`${file.name}: innhold matcher ikke filtype`);
        continue;
      }
      try {
        const dims = await readDimensions(file);
        if (dims.w < MIN_DIM || dims.h < MIN_DIM || dims.w > MAX_DIM || dims.h > MAX_DIM) {
          toast.error(`${file.name}: ugyldige bildedimensjoner`);
          continue;
        }
      } catch {
        toast.error(`${file.name}: kunne ikke leses som bilde`);
        continue;
      }
      added.push({ file, previewUrl: URL.createObjectURL(file), mime: sniffed });
    }
    setImages((prev) => [...prev, ...added]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const priceNum = Number(price.replace(",", "."));
  const isValid =
    images.length >= MIN_IMAGES &&
    images.length <= MAX_IMAGES &&
    title.trim().length > 0 &&
    title.trim().length <= 120 &&
    brand.trim().length > 0 &&
    brand.trim().length <= 60 &&
    category.length > 0 &&
    subcategory.length > 0 &&
    size.trim().length > 0 &&
    size.trim().length <= 20 &&
    price.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    description.trim().length > 0 &&
    description.trim().length <= 2000;

  const handlePublish = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      for (const img of images) {
        const compressed = await compressImage(img.file, PRODUCT_IMAGE_OPTIONS);
        const ext = compressed.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, compressed, { contentType: compressed.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        uploadedPaths.push(path);
      }
      const { error: insErr } = await supabase.from("listings").insert({
        user_id: userId,
        title: title.trim(),
        brand: brand.trim(),
        category,
        size: size.trim(),
        price: priceNum,
        description: description.trim(),
        image_paths: uploadedPaths,
      });
      if (insErr) {
        await supabase.storage.from("photos").remove(uploadedPaths);
        throw new Error(insErr.message);
      }
      toast.success("Annonsen er publisert");
      onOpenChange(false);
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("photos").remove(uploadedPaths);
      }
      toast.error(err instanceof Error ? err.message : "Publisering feilet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ny annonse</DialogTitle>
          <DialogDescription>
            Last opp {MIN_IMAGES}–{MAX_IMAGES} bilder og fyll inn alle felter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Bilder ({images.length}/{MAX_IMAGES})
            </Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.previewUrl}
                  className="relative aspect-square overflow-hidden rounded-lg bg-secondary"
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                    aria-label="Fjern"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-secondary"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handlePickFiles}
            />
            {images.length < MIN_IMAGES && (
              <p className="mt-1 text-xs text-muted-foreground">
                Minst {MIN_IMAGES} bilder kreves.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="F.eks. Vintage Levi's 501"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="brand">Merke</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                maxLength={60}
                placeholder="Zara, Nike …"
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="size">Størrelse</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                maxLength={20}
                placeholder="M, 38, 42 …"
              />
            </div>
            <div>
              <Label htmlFor="price">Pris (kr)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Tilstand, materiale …"
            />
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!isValid || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-sm font-semibold text-background disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Publiserer…" : "Publiser"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
