import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Loader2,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Settings as SettingsIcon,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { RatingsDialog, StarRow } from "@/components/marketplace/RatingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView, CITIES } from "@/lib/listings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Tab = "mine" | "saved" | "offers" | "settings";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
};

type OfferRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  created_at: string;
};

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mine");
  const [subTab, setSubTab] = useState<"active" | "sold">("active");
  const [offerSub, setOfferSub] = useState<"received" | "sent">("received");
  const [ratingsOpen, setRatingsOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myListings, setMyListings] = useState<ListingView[]>([]);
  const [savedListings, setSavedListings] = useState<ListingView[]>([]);
  const [offersReceived, setOffersReceived] = useState<OfferRow[]>([]);
  const [offersSent, setOffersSent] = useState<OfferRow[]>([]);
  const [listingTitles, setListingTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [prof, mine, savesRes, offRec, offSent] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("listing_saves").select("listing_id").eq("user_id", user.id),
      supabase.from("offers").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(prof.data as Profile | null);
    setMyListings(await hydrateListings((mine.data ?? []) as ListingRow[]));

    const saveIds = (savesRes.data ?? []).map((r) => r.listing_id);
    if (saveIds.length) {
      const { data } = await supabase.from("listings").select("*").in("id", saveIds);
      setSavedListings(await hydrateListings((data ?? []) as ListingRow[]));
    } else {
      setSavedListings([]);
    }

    const allOffers = [...(offRec.data ?? []), ...(offSent.data ?? [])] as OfferRow[];
    setOffersReceived((offRec.data ?? []) as OfferRow[]);
    setOffersSent((offSent.data ?? []) as OfferRow[]);

    const ids = Array.from(new Set(allOffers.map((o) => o.listing_id)));
    if (ids.length) {
      const { data: titles } = await supabase.from("listings").select("id,title").in("id", ids);
      const map: Record<string, string> = {};
      for (const t of titles ?? []) map[t.id] = t.title;
      setListingTitles(map);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const ch = supabase
      .channel("profile-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `seller_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `buyer_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "ratings", filter: `seller_id=eq.${user.id}` }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user.id, loadAll]);

  const markSold = async (l: ListingView) => {
    await supabase.from("listings").update({ sold: !l.sold }).eq("id", l.id);
  };
  const deleteListing = async (l: ListingView) => {
    await supabase.from("listings").delete().eq("id", l.id);
    if (l.image_paths?.length) await supabase.storage.from("photos").remove(l.image_paths);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  const respondOffer = async (o: OfferRow, status: "accepted" | "declined") => {
    const { error } = await supabase.from("offers").update({ status }).eq("id", o.id);
    if (error) toast.error(error.message);
    else toast.success(status === "accepted" ? "Oferta u pranua" : "Oferta u refuzua");
  };

  const displayName = profile?.name || user.email?.split("@")[0] || "Përdorues";
  const avatar =
    profile?.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const username = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;

  const visibleMine = useMemo(
    () => myListings.filter((l) => (subTab === "active" ? !l.sold : l.sold)),
    [myListings, subTab],
  );

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-xl">{username}</h1>
        <div className="flex items-center gap-1">
          <Link
            to="/sell"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Shit"
          >
            <Plus className="h-5 w-5" strokeWidth={1.7} />
          </Link>
          <button
            onClick={() => setTab("settings")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Cilësimet"
          >
            <SettingsIcon className="h-5 w-5" strokeWidth={1.7} />
          </button>
        </div>
      </header>

      <section className="px-5">
        <div className="flex items-start gap-4">
          <img src={avatar} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-border" />
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-1">
              <p className="font-display text-lg">{displayName}</p>
              <BadgeCheck className="h-4 w-4 text-accent" fill="currentColor" />
            </div>
            {profile?.city && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {profile.city}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1 text-xs">
              <StarRow value={profile?.rating_avg ?? 0} size={12} />
              <span className="ml-1 font-semibold">{(profile?.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-muted-foreground">· {profile?.rating_count ?? 0} vlerësime</span>
            </div>
          </div>
        </div>
        {profile?.bio && <p className="mt-3 text-sm text-foreground/85">{profile.bio}</p>}
        <button
          onClick={() => setRatingsOpen(true)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <Star className="h-4 w-4" /> Vlerësimet
        </button>
      </section>

      <div className="mt-6 border-b border-border px-5">
        <div className="no-scrollbar flex gap-6 overflow-x-auto">
          {[
            { id: "mine" as const, label: "Artikujt e mi" },
            { id: "saved" as const, label: "Të ruajtura" },
            { id: "offers" as const, label: "Ofertat" },
            { id: "settings" as const, label: "Cilësimet" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 pb-3 text-sm font-medium transition ${
                tab === t.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      <section className="px-5 pt-4">
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "mine" ? (
          <>
            <div className="mb-3 flex gap-2">
              {(["active", "sold"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubTab(s)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    subTab === s ? "bg-foreground text-background" : "bg-secondary"
                  }`}
                >
                  {s === "active" ? "Aktive" : "Të shitura"}
                </button>
              ))}
            </div>
            {visibleMine.length === 0 ? (
              <EmptyMsg text="Asnjë artikull këtu." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visibleMine.map((l) => (
                  <OwnerCard key={l.id} listing={l} onMarkSold={() => markSold(l)} onDelete={() => deleteListing(l)} />
                ))}
              </div>
            )}
          </>
        ) : tab === "saved" ? (
          savedListings.length === 0 ? (
            <EmptyMsg text="Asnjë artikull i ruajtur." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedListings.map((l) => (
                <Link key={l.id} to="/product/$id" params={{ id: l.id }} className="block">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                    {l.coverUrl && <img src={l.coverUrl} className="h-full w-full object-cover" alt={l.title} />}
                  </div>
                  <p className="mt-1 truncate text-sm">{l.title}</p>
                  <p className="text-xs font-semibold">€{l.price}</p>
                </Link>
              ))}
            </div>
          )
        ) : tab === "offers" ? (
          <>
            <div className="mb-3 flex gap-2">
              {(["received", "sent"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setOfferSub(s)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    offerSub === s ? "bg-foreground text-background" : "bg-secondary"
                  }`}
                >
                  {s === "received" ? "Të marra" : "Të dërguara"}
                </button>
              ))}
            </div>
            <OffersList
              offers={offerSub === "received" ? offersReceived : offersSent}
              titles={listingTitles}
              canRespond={offerSub === "received"}
              onRespond={respondOffer}
            />
          </>
        ) : (
          <SettingsTab
            profile={profile}
            email={user.email ?? ""}
            onSaved={loadAll}
            onSignOut={handleSignOut}
          />
        )}
      </section>

      <RatingsDialog
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
      />
    </MobileShell>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function OwnerCard({
  listing,
  onMarkSold,
  onDelete,
}: {
  listing: ListingView;
  onMarkSold: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <Link to="/product/$id" params={{ id: listing.id }} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
          {listing.coverUrl && (
            <img
              src={listing.coverUrl}
              alt={listing.title}
              className={`h-full w-full object-cover ${listing.sold ? "opacity-70 grayscale" : ""}`}
            />
          )}
          {listing.sold && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="rotate-[-18deg] rounded-md bg-destructive px-4 py-1 text-xs font-black tracking-widest text-destructive-foreground shadow">
                SHITUR
              </span>
            </div>
          )}
        </div>
        <p className="mt-1 truncate text-sm">{listing.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{listing.size}</span>
          <span className="text-sm font-bold">€{listing.price}</span>
        </div>
      </Link>
      <div className="absolute right-1.5 top-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur"
              aria-label="Më shumë"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onMarkSold}>
              {listing.sold ? "Shëno si i disponueshëm" : "Shëno si i shitur"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              Fshij
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function OffersList({
  offers,
  titles,
  canRespond,
  onRespond,
}: {
  offers: OfferRow[];
  titles: Record<string, string>;
  canRespond: boolean;
  onRespond: (o: OfferRow, status: "accepted" | "declined") => void;
}) {
  if (offers.length === 0) return <EmptyMsg text="Asnjë ofertë." />;
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li key={o.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <Link to="/product/$id" params={{ id: o.listing_id }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{titles[o.listing_id] ?? "Artikull"}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
            </Link>
            <p className="shrink-0 font-display text-xl">€{o.amount}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                o.status === "accepted"
                  ? "bg-emerald-100 text-emerald-700"
                  : o.status === "declined"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary"
              }`}
            >
              {o.status === "pending" ? "Në pritje" : o.status === "accepted" ? "Pranuar" : "Refuzuar"}
            </span>
            {canRespond && o.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => onRespond(o, "declined")}
                  className="grid h-7 w-7 place-items-center rounded-full bg-secondary"
                  aria-label="Refuzo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onRespond(o, "accepted")}
                  className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background"
                  aria-label="Prano"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SettingsTab({
  profile,
  email,
  onSaved,
  onSignOut,
}: {
  profile: Profile | null;
  email: string;
  onSaved: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setCity(profile?.city ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${profile.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: signed } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) {
      setAvatarUrl(signed.signedUrl);
    }
    setUploading(false);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, bio, city, avatar_url: avatarUrl || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profili u ruajt");
      onSaved();
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "U")}`}
          alt=""
          className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
        />
        <label className="cursor-pointer rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-secondary">
          {uploading ? "Po ngarkohet..." : "Ndrysho foton"}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </label>
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div>
        <Label>Emri</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} />
      </div>
      <div>
        <Label>Qyteti</Label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Zgjidh</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Ruaj
      </button>
      <button
        onClick={onSignOut}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4" /> Dil
      </button>
    </div>
  );
}
