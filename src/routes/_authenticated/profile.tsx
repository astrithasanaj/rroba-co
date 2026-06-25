import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Bell,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Gem,
  Grid2x2,
  Heart,
  HelpCircle,
  Loader2,
  LogOut,
  MessageSquare,
  Minus,
  Plus,
  Ruler,
  Settings as SettingsIcon,
  Share2,
  Shirt,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { RatingsDialog, StarRow } from "@/components/marketplace/RatingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView, CITIES } from "@/lib/listings";
import { useUserCollections } from "@/lib/user-collections";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Tab = "mine" | "liked" | "saved" | "wardrobe";
type SortMode = "new" | "low" | "high";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
  height_cm: number | null;
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

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const SOLD = "#e8826a";

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { likes, saves } = useUserCollections();
  const [tab, setTab] = useState<Tab>("mine");
  const [sort, setSort] = useState<SortMode>("new");
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
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
  const [followers] = useState(0);
  const [following] = useState(0);
  const [streak] = useState(2);

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

  useEffect(() => {
    const ids = Array.from(likes);
    if (ids.length === 0) { setLikedListings([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("listings").select("*").in("id", ids);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (!cancelled) setLikedListings(hydrated);
    })();
    return () => { cancelled = true; };
  }, [likes]);

  useEffect(() => {
    const ids = Array.from(saves);
    if (ids.length === 0) { setSavedListings([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("listings").select("*").in("id", ids);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (!cancelled) setSavedListings(hydrated);
    })();
    return () => { cancelled = true; };
  }, [saves]);

  useEffect(() => {
    const ch = supabase
      .channel("profile-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `seller_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `buyer_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "ratings", filter: `seller_id=eq.${user.id}` }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user.id, loadAll]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  const respondOffer = async (o: OfferRow, status: "accepted" | "declined") => {
    const { error } = await supabase.from("offers").update({ status }).eq("id", o.id);
    if (error) toast.error(error.message);
    else toast.success(status === "accepted" ? "Oferta u pranua" : "Oferta u refuzua");
  };

  const handleShare = async () => {
    const url = window.location.origin + `/user/${user.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: displayName });
      else { await navigator.clipboard.writeText(url); toast.success("Linku u kopjua"); }
    } catch {}
  };

  const displayName = profile?.name || user.email?.split("@")[0] || "Përdorues";
  const avatar = profile?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const username = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;

  const sortFn = (a: ListingView, b: ListingView) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  const activeListings = useMemo(() => myListings.filter((l) => !l.sold).sort(sortFn), [myListings, sort]);
  const wardrobeListings = useMemo(() => myListings.filter((l) => l.sold).sort(sortFn), [myListings, sort]);
  const sortedLiked = useMemo(() => [...likedListings].sort(sortFn), [likedListings, sort]);
  const sortedSaved = useMemo(() => [...savedListings].sort(sortFn), [savedListings, sort]);

  const salesCount = useMemo(() => myListings.filter((l) => l.sold).length, [myListings]);
  const tier = salesCount >= 20 ? "top" : salesCount >= 5 ? "trusted" : "starter";

  const tabs: { id: Tab; icon: typeof Grid2x2 }[] = [
    { id: "mine", icon: Grid2x2 },
    { id: "liked", icon: Heart },
    { id: "saved", icon: Bookmark },
    { id: "wardrobe", icon: Shirt },
  ];

  const currentGrid =
    tab === "mine" ? activeListings :
    tab === "liked" ? sortedLiked :
    tab === "saved" ? sortedSaved :
    wardrobeListings;

  return (
    <MobileShell>
      <div style={{ backgroundColor: CREAM, color: INK }} className="min-h-screen pb-24">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: INK }}>
            <button onClick={() => navigate({ to: "/notifications" })} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Njoftimet">
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
            <button onClick={() => setSortOpen(true)} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Filtro">
              <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
          <h1 className="text-[15px] font-medium">{username}</h1>
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: INK }}>
            <button onClick={handleShare} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Shpërndaj">
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
            <button onClick={() => setSettingsOpen(true)} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Cilësimet">
              <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Profile section */}
        <section className="px-5 pt-3">
          <div className="flex items-center gap-5">
            <img src={avatar} alt="" className="h-[90px] w-[90px] shrink-0 rounded-full object-cover" style={{ boxShadow: `0 0 0 3px ${CREAM}, 0 0 0 4px ${DIVIDER}` }} />
            <div className="flex flex-1 items-center justify-around">
              <Stat value={streak} label="streak" />
              <Stat value={followers} label="følgjarit" />
              <Stat value={following} label="ndjek" />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setBenefitsOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold"
              style={{ borderColor: INK, color: INK }}
            >
              <Gem className="h-4 w-4" strokeWidth={1.8} /> Përfitimet
            </button>
            <button
              onClick={() => setRatingsOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold"
              style={{ borderColor: INK, color: INK }}
            >
              {(profile?.rating_count ?? 0) > 0 ? (
                <>
                  <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  {(profile?.rating_avg ?? 0).toFixed(1)} ({profile?.rating_count})
                </>
              ) : (
                "Asnjë vlerësim"
              )}
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[20px] font-bold leading-tight" style={{ color: INK }}>{displayName}</p>
              {profile?.city && (
                <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{profile.city}</p>
              )}
            </div>
            {profile?.height_cm ? (
              <p className="inline-flex items-center gap-1 text-[13px]" style={{ color: MUTED }}>
                <Ruler className="h-3.5 w-3.5" /> {profile.height_cm} cm
              </p>
            ) : null}
          </div>

          {profile?.bio && (
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: INK }}>{profile.bio}</p>
          )}
        </section>

        {/* Tabs */}
        <div className="mt-5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <div className="grid grid-cols-4">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative flex items-center justify-center py-3"
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.7} style={{ color: active ? INK : MUTED }} />
                  {active && <span className="absolute inset-x-8 -bottom-px h-[2px]" style={{ backgroundColor: INK }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <section className="pt-0">
          {loading && tab === "mine" ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
            </div>
          ) : currentGrid.length === 0 ? (
            <EmptyMsg
              text={
                tab === "mine" ? "Ende nuk ke publikuar asnjë artikull." :
                tab === "liked" ? "Asnjë artikull i pëlqyer ende." :
                tab === "saved" ? "Asnjë artikull i ruajtur." :
                "Garderoba është bosh — artikujt e shitur shfaqen këtu."
              }
              actionLabel={tab === "mine" ? "Publiko të parin" : tab !== "wardrobe" ? "Shfleto" : undefined}
              to={tab === "mine" ? "/sell" : tab !== "wardrobe" ? "/" : undefined}
            />
          ) : (
            <ListingsGrid listings={currentGrid} />
          )}
        </section>

        {/* Floating sort button */}
        {currentGrid.length > 0 && (
          <button
            onClick={() => setSortOpen(true)}
            className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white shadow-lg"
            style={{ backgroundColor: INK }}
          >
            Rendit <ArrowDownUp className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sort sheet */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0" style={{ backgroundColor: CARD }}>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: DIVIDER }} />
          <div className="px-5 pb-8 pt-4">
            <h2 className="mb-3 text-[17px] font-bold" style={{ color: INK }}>Rendit sipas</h2>
            {([
              { id: "new", label: "Më të rejat" },
              { id: "low", label: "Çmimi: ulët-lartë" },
              { id: "high", label: "Çmimi: lartë-ulët" },
            ] as const).map((o) => (
              <button
                key={o.id}
                onClick={() => { setSort(o.id); setSortOpen(false); }}
                className="flex w-full items-center justify-between py-3 text-left text-[15px]"
                style={{ color: INK, borderBottom: `1px solid ${DIVIDER}` }}
              >
                {o.label}
                {sort === o.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Benefits sheet */}
      <Sheet open={benefitsOpen} onOpenChange={setBenefitsOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0" style={{ backgroundColor: CREAM }}>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: DIVIDER }} />
          <div className="px-5 pb-8 pt-4">
            <h2 className="mb-1 text-[18px] font-bold" style={{ color: INK }}>Përfitimet e shitësit</h2>
            <p className="mb-4 text-[13px]" style={{ color: MUTED }}>Sa më shumë shet, aq më shumë përfitime.</p>
            <div className="space-y-2.5">
              <TierCard
                emoji="🥉" title="Fillestar" range="0–4 shitje"
                body="Akses bazë në listim dhe shitje."
                active={tier === "starter"}
              />
              <TierCard
                emoji="🥈" title="I besueshëm" range="5–19 shitje"
                body="Prioritet në kërkim dhe shenjë e verifikuar."
                active={tier === "trusted"}
              />
              <TierCard
                emoji="🥇" title="Top shitës" range="20+ shitje"
                body="Promovim falas, shenjë e artë dhe shfaqje në kryefaqe."
                active={tier === "top"}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reviews dialog */}
      <RatingsDialog
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
      />

      {/* Offers sheet */}
      <Sheet open={offersOpen} onOpenChange={setOffersOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto" style={{ backgroundColor: CREAM }}>
          <SheetHeader><SheetTitle>Ofertat</SheetTitle></SheetHeader>
          <div className="mt-4 flex gap-2">
            {(["received", "sent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setOfferSub(s)}
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ backgroundColor: offerSub === s ? INK : CARD, color: offerSub === s ? "white" : INK }}
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

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        email={user.email ?? ""}
        onSaved={loadAll}
        onSignOut={handleSignOut}
        onOpenOffers={() => { setSettingsOpen(false); setOffersOpen(true); }}
      />
    </MobileShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[18px] font-bold leading-tight" style={{ color: INK }}>{value}</p>
      <p className="text-[12px]" style={{ color: MUTED }}>{label}</p>
    </div>
  );
}

function TierCard({ emoji, title, range, body, active }: { emoji: string; title: string; range: string; body: string; active: boolean }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: active ? INK : CARD, color: active ? "white" : INK }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">{emoji} {title}</p>
        <p className="text-[12px] opacity-80">{range}</p>
      </div>
      <p className="mt-1 text-[13px] opacity-90">{body}</p>
    </div>
  );
}

function ListingsGrid({ listings }: { listings: ListingView[] }) {
  return (
    <div className="grid grid-cols-2 gap-0">
      {listings.map((l) => (
        <Link
          key={l.id}
          to="/product/$id"
          params={{ id: l.id }}
          className="relative block aspect-[3/4] overflow-hidden"
          style={{ backgroundColor: CARD }}
        >
          {l.coverUrl && (
            <img src={l.coverUrl} alt={l.title} className="h-full w-full object-cover" loading="lazy" />
          )}
          {/* Brand watermark */}
          <span className="pointer-events-none absolute left-2 top-2 text-[11px] italic text-white/95" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
            Rroba
          </span>
          {/* Sold ribbon */}
          {l.sold && <SoldRibbon />}
          {/* Bottom overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 pt-8" style={{ backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))" }}>
            <p className="truncate text-[13px] font-bold text-white">{l.title}</p>
            <p className="truncate text-[11px] text-white/85">
              {[l.brand, l.size, `€${l.price}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SoldRibbon() {
  return (
    <div className="pointer-events-none absolute -right-10 top-4 w-36 rotate-45 py-1 text-center text-[11px] font-bold tracking-wider text-white" style={{ backgroundColor: SOLD }}>
      Shitur
    </div>
  );
}

function EmptyMsg({ text, actionLabel, to }: { text: string; actionLabel?: string; to?: string }) {
  return (
    <div className="mx-5 mt-8 rounded-2xl p-8 text-center" style={{ backgroundColor: CARD }}>
      <p className="text-sm" style={{ color: MUTED }}>{text}</p>
      {actionLabel && to && (
        <Link
          to={to}
          className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: INK }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function OffersList({
  offers, titles, canRespond, onRespond,
}: {
  offers: OfferRow[];
  titles: Record<string, string>;
  canRespond: boolean;
  onRespond: (o: OfferRow, status: "accepted" | "declined") => void;
}) {
  if (offers.length === 0)
    return <p className="py-6 text-center text-sm" style={{ color: MUTED }}>Asnjë ofertë.</p>;
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li key={o.id} className="rounded-2xl p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center justify-between">
            <Link to="/product/$id" params={{ id: o.listing_id }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: INK }}>{titles[o.listing_id] ?? "Artikull"}</p>
              <p className="text-xs" style={{ color: MUTED }}>{new Date(o.created_at).toLocaleString()}</p>
            </Link>
            <p className="shrink-0 text-xl font-bold" style={{ color: INK }}>€{o.amount}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
              backgroundColor: o.status === "accepted" ? "#d1f4e0" : o.status === "declined" ? "#f4d1d1" : DIVIDER,
              color: INK,
            }}>
              {o.status === "pending" ? "Në pritje" : o.status === "accepted" ? "Pranuar" : "Refuzuar"}
            </span>
            {canRespond && o.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => onRespond(o, "declined")} className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: DIVIDER }} aria-label="Refuzo">
                  <X className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onRespond(o, "accepted")} className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ backgroundColor: INK }} aria-label="Prano">
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

function SettingsTab() { return null; }
