import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  Bookmark,
  Check,
  Grid2x2,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Settings as SettingsIcon,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { RatingsDialog, StarRow } from "@/components/marketplace/RatingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView, CITIES } from "@/lib/listings";
import { useUserCollections } from "@/lib/user-collections";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Tab = "mine" | "liked" | "saved" | "wardrobe";

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
  const { likes, saves } = useUserCollections();
  const [tab, setTab] = useState<Tab>("mine");
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myListings, setMyListings] = useState<ListingView[]>([]);
  const [likedListings, setLikedListings] = useState<ListingView[]>([]);
  const [savedListings, setSavedListings] = useState<ListingView[]>([]);
  const [offersReceived, setOffersReceived] = useState<OfferRow[]>([]);
  const [offersSent, setOffersSent] = useState<OfferRow[]>([]);
  const [listingTitles, setListingTitles] = useState<Record<string, string>>({});
  const [offerSub, setOfferSub] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [prof, mine, offRec, offSent] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(prof.data as Profile | null);
    setMyListings(await hydrateListings((mine.data ?? []) as ListingRow[]));

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

  // Load liked/saved listings whenever the underlying sets change
  useEffect(() => {
    const ids = Array.from(likes);
    if (ids.length === 0) {
      setLikedListings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("listings").select("*").in("id", ids);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (!cancelled) setLikedListings(hydrated);
    })();
    return () => {
      cancelled = true;
    };
  }, [likes]);

  useEffect(() => {
    const ids = Array.from(saves);
    if (ids.length === 0) {
      setSavedListings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("listings").select("*").in("id", ids);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (!cancelled) setSavedListings(hydrated);
    })();
    return () => {
      cancelled = true;
    };
  }, [saves]);

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
    if (l.image_paths?.length) {
      const cleanup = l.image_paths.filter((p) => !/^https?:\/\//i.test(p));
      if (cleanup.length) await supabase.storage.from("photos").remove(cleanup);
    }
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

  const activeListings = useMemo(() => myListings.filter((l) => !l.sold), [myListings]);
  const wardrobeListings = useMemo(() => myListings.filter((l) => l.sold), [myListings]);

  const tabs: { id: Tab; label: string; icon: typeof Grid2x2 }[] = [
    { id: "mine", label: "Artikujt e mi", icon: Grid2x2 },
    { id: "liked", label: "Të pëlqyera", icon: Heart },
    { id: "saved", label: "Të ruajtura", icon: Bookmark },
    { id: "wardrobe", label: "Garderoba ime", icon: Archive },
  ];

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
            onClick={() => setSettingsOpen(true)}
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
            <button
              onClick={() => setRatingsOpen(true)}
              className="mt-1 flex items-center gap-1 text-xs hover:opacity-80"
            >
              <StarRow value={profile?.rating_avg ?? 0} size={12} />
              <span className="ml-1 font-semibold">{(profile?.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-muted-foreground">· {profile?.rating_count ?? 0} vlerësime</span>
            </button>
          </div>
        </div>
        {profile?.bio ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {profile.bio}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Shto një bio…
          </p>
        )}
      </section>

      {/* 4-tab icon nav with underline indicator */}
      <div className="mt-6 border-b border-border">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                aria-pressed={active}
                className="relative flex items-center justify-center py-3.5"
              >
                <Icon
                  className={`h-6 w-6 transition ${active ? "text-foreground" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2.2 : 1.7}
                  fill={active && t.id === "liked" ? "currentColor" : "none"}
                />
                {active && (
                  <span className="absolute inset-x-6 -bottom-px h-0.5 rounded-full bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section className="px-2 pt-2">
        {loading && tab === "mine" ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "mine" ? (
          activeListings.length === 0 ? (
            <EmptyMsg
              text="Ende nuk ke publikuar asnjë artikull."
              actionLabel="Publiko të parin"
              to="/sell"
            />
          ) : (
            <OwnerGrid listings={activeListings} onMarkSold={markSold} onDelete={deleteListing} />
          )
        ) : tab === "liked" ? (
          likedListings.length === 0 ? (
            <EmptyMsg text="Asnjë artikull i pëlqyer ende — fillo të eksplorosh!" actionLabel="Shfleto" to="/" />
          ) : (
            <PhotoGrid listings={likedListings} />
          )
        ) : tab === "saved" ? (
          savedListings.length === 0 ? (
            <EmptyMsg text="Asnjë artikull i ruajtur — ruaj artikujt që dëshiron t'i shikosh më vonë." actionLabel="Shfleto" to="/" />
          ) : (
            <PhotoGrid listings={savedListings} />
          )
        ) : wardrobeListings.length === 0 ? (
          <EmptyMsg text="Garderoba jote është bosh — artikujt e shitur shfaqen këtu." />
        ) : (
          <PhotoGrid listings={wardrobeListings} sold />
        )}
      </section>

      <RatingsDialog
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
      />

      <Sheet open={offersOpen} onOpenChange={setOffersOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ofertat</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex gap-2">
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
          <div className="mt-4">
            <OffersList
              offers={offerSub === "received" ? offersReceived : offersSent}
              titles={listingTitles}
              canRespond={offerSub === "received"}
              onRespond={respondOffer}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cilësimet</SheetTitle>
          </SheetHeader>
          <button
            onClick={() => {
              setSettingsOpen(false);
              setOffersOpen(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary"
          >
            <span className="inline-flex items-center gap-2">
              <Tag className="h-4 w-4" /> Ofertat
            </span>
            <span className="text-muted-foreground">›</span>
          </button>
          <div className="mt-4">
            <SettingsTab
              profile={profile}
              email={user.email ?? ""}
              onSaved={loadAll}
              onSignOut={handleSignOut}
            />
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}

function PhotoGrid({ listings, sold = false }: { listings: ListingView[]; sold?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {listings.map((l) => (
        <Link
          key={l.id}
          to="/product/$id"
          params={{ id: l.id }}
          className="relative aspect-square overflow-hidden bg-secondary"
        >
          {l.coverUrl && (
            <img
              src={l.coverUrl}
              alt={l.title}
              className={`h-full w-full object-cover ${sold || l.sold ? "opacity-80" : ""}`}
              loading="lazy"
            />
          )}
          {(sold || l.sold) && (
            <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-destructive px-1.5 py-0.5 text-[9px] font-black tracking-wider text-destructive-foreground">
              SHITUR
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function OwnerGrid({
  listings,
  onMarkSold,
  onDelete,
}: {
  listings: ListingView[];
  onMarkSold: (l: ListingView) => void;
  onDelete: (l: ListingView) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {listings.map((l) => (
        <div key={l.id} className="relative aspect-square overflow-hidden bg-secondary">
          <Link to="/product/$id" params={{ id: l.id }} className="block h-full w-full">
            {l.coverUrl && (
              <img src={l.coverUrl} alt={l.title} className="h-full w-full object-cover" loading="lazy" />
            )}
          </Link>
          <div className="absolute right-1 top-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid h-6 w-6 place-items-center rounded-full bg-background/90 backdrop-blur"
                  aria-label="Më shumë"
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMarkSold(l)}>Shëno si i shitur</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(l)} className="text-destructive focus:text-destructive">
                  Fshij
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold">
            €{l.price}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyMsg({ text, actionLabel, to }: { text: string; actionLabel?: string; to?: string }) {
  return (
    <div className="mx-3 mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionLabel && to && (
        <Link
          to={to}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
        >
          {actionLabel}
        </Link>
      )}
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
  if (offers.length === 0)
    return <p className="py-6 text-center text-sm text-muted-foreground">Asnjë ofertë.</p>;
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
    if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
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
