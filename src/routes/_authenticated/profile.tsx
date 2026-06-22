import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, BadgeCheck, Star, Heart, Camera, LogOut, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type PhotoRow = {
  id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

type PhotoView = PhotoRow & { url: string };

const SIGN_TTL = 60 * 60; // 1 hour

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

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoView[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      toast.error("Nuk mund të ngarkohej feed-i");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as PhotoRow[];
    const urls = await signPaths(rows.map((r) => r.storage_path));
    setPhotos(rows.map((r) => ({ ...r, url: urls[r.storage_path] ?? "" })));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    const channel = supabase
      .channel("photos-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos" },
        async (payload) => {
          const row = payload.new as PhotoRow;
          const urls = await signPaths([row.storage_path]);
          setPhotos((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [{ ...row, url: urls[row.storage_path] ?? "" }, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "photos" },
        (payload) => {
          const oldRow = payload.old as PhotoRow;
          setPhotos((prev) => prev.filter((p) => p.id !== oldRow.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} nuk është foto`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} është më e madhe se 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          toast.error(upErr.message);
          continue;
        }
        const { error: insErr } = await supabase.from("photos").insert({
          user_id: user.id,
          storage_path: path,
          public_url: path,
        });
        if (insErr) {
          toast.error(insErr.message);
          await supabase.storage.from("photos").remove([path]);
        }
      }
      toast.success("Fotot u ngarkuan");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photo: PhotoView) => {
    if (photo.user_id !== user.id) return;
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      toast.error("Nuk mund të fshihej");
      return;
    }
    await supabase.storage.from("photos").remove([photo.storage_path]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Përdorues";

  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-2xl">Profili</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSignOut}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Dil"
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
              <span className="text-muted-foreground">· 87 vlerësime</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Foto feed</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {uploading ? "Duke ngarkuar..." : "Ngarko foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Fotot e ngarkuara nga të gjithë përdoruesit shfaqen këtu në kohë reale.
        </p>

        {loading ? (
          <div className="mt-6 grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Ende nuk ka foto. Bëhu i pari të ndash diçka ✨
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary"
              >
                {photo.url && (
                  <img
                    src={photo.url}
                    alt={photo.caption ?? "Foto"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                {photo.user_id === user.id && (
                  <button
                    onClick={() => handleDelete(photo)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"
                    aria-label="Fshij"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
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
            <Heart className="h-4 w-4" /> Të gjitha të ruajturat
          </span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>
    </MobileShell>
  );
}
