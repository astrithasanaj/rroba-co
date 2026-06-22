import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Settings,
  BadgeCheck,
  Star,
  Heart,
  Camera,
  LogOut,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  size: string;
  price: number;
  description: string;
  image_paths: string[];
  created_at: string;
};

type ListingView = ListingRow & { coverUrl: string };

const SIGN_TTL = 60 * 60;
const MIN_IMAGES = 3;
const MAX_IMAGES = 10;

const CATEGORIES = [
  { value: "topp", label: "Topp" },
  { value: "bukse", label: "Bukse" },
  { value: "kjole", label: "Kjole" },
  { value: "sko", label: "Sko" },
  { value: "jakke", label: "Jakke" },
  { value: "veske", label: "Veske" },
  { value: "tilbehor", label: "Tilbehør" },
  { value: "annet", label: "Annet" },
];

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_DIM = 100;
const MAX_DIM = 8000;

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from("photos")
    .createSignedUrls(paths, SIGN_TTL);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

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

type PendingImage = { file: File; previewUrl: string; mime: string };

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      toast.error("Kunne ikke laste feeden");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as ListingRow[];
    const covers = rows.map((r) => r.image_paths[0]).filter(Boolean);
    const urls = await signPaths(covers);
    setListings(
      rows.map((r) => ({ ...r, coverUrl: urls[r.image_paths[0]] ?? "" })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    const channel = supabase
      .channel("listings-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listings" },
        async (payload) => {
          const row = payload.new as ListingRow;
          const urls = await signPaths([row.image_paths[0]]);
          setListings((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [{ ...row, coverUrl: urls[row.image_paths[0]] ?? "" }, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "listings" },
        (payload) => {
          const oldRow = payload.old as ListingRow;
          setListings((prev) => prev.filter((p) => p.id !== oldRow.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (listing: ListingView) => {
    if (listing.user_id !== user.id) return;
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) {
      toast.error("Kunne ikke slette");
      return;
    }
    await supabase.storage.from("photos").remove(listing.image_paths);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Bruker";

  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-2xl">Profil</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSignOut}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Logg ut"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.7} />
          </button>
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
            <Settings className="h-5 w-5" strokeWidth={1.7} />
          </Link>
        </div>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-4">
          <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-display text-2xl">{displayName}</p>
              <BadgeCheck className="h-5 w-5 text-accent" fill="currentColor" />
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3" fill="currentColor" />
              <span className="font-semibold">4.9</span>
              <span className="text-muted-foreground">· 87 vurderinger</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Feed</h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            <Camera className="h-3.5 w-3.5" />
            Last opp foto
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Annonser fra alle brukere vises her i sanntid.
        </p>

        {loading ? (
          <div className="mt-6 grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Ingen annonser ennå. Bli den første til å publisere ✨
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-square bg-secondary">
                  {l.coverUrl && (
                    <img
                      src={l.coverUrl}
                      alt={l.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                  {l.user_id === user.id && (
                    <button
                      onClick={() => handleDelete(l)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"
                      aria-label="Slett"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.category} · str. {l.size}
                  </p>
                  <p className="mt-1 text-sm font-bold">{l.price} kr</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="px-5 pt-6">
        <Link
          to="/favorites"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4" /> Alle lagrede
          </span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>

      <NewListingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={user.id}
      />
    </MobileShell>
  );
}

function NewListingDialog({
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
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setTitle("");
    setCategory("");
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
    category.length > 0 &&
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
        const ext = ALLOWED_MIME[img.mime];
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, img.file, { contentType: img.mime, upsert: false });
        if (upErr) {
          throw new Error(upErr.message);
        }
        uploadedPaths.push(path);
      }
      const { error: insErr } = await supabase.from("listings").insert({
        user_id: userId,
        title: title.trim(),
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
            <Label>Bilder ({images.length}/{MAX_IMAGES})</Label>
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

          <div>
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori" />
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
              placeholder="Tilstand, merke, materiale …"
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
