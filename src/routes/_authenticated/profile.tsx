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
import { compressImage, AVATAR_OPTIONS } from "@/utils/compressImage";
import { hydrateListings, sortActiveFirst, type ListingRow, type ListingView, CITIES } from "@/lib/listings";
import { useUserCollections } from "@/lib/user-collections";
import { IosShareIcon } from "@/components/marketplace/IosShareIcon";
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
  const [heightOpen, setHeightOpen] = useState(false);


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
      supabase.from("listings").select("*").eq("user_id", user.id).in("status", ["active", "sold", "expired", "pending_review"]).order("sold", { ascending: true }).order("created_at", { ascending: false }),
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
      const { data } = await supabase.from("listings").select("*").in("id", ids).eq("status", "active").eq("sold", false);
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
      const { data } = await supabase.from("listings").select("*").in("id", ids).eq("status", "active").eq("sold", false);
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
    const url = `${window.location.origin}/user/${user.id}`;
    const shareData = { url, title: displayName, text: "Shiko profilin tim në Rroba" };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(url); toast.success("Lidhja u kopjua!"); }
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

  const mineListings = useMemo(() => {
    if (sort === "new") return sortActiveFirst(myListings);
    // For price sorts, still keep active-before-sold buckets
    const active = myListings.filter((l) => !l.sold).sort(sortFn);
    const sold = myListings.filter((l) => l.sold).sort(sortFn);
    return [...active, ...sold];
  }, [myListings, sort]);
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
    tab === "mine" ? mineListings :
    tab === "liked" ? sortedLiked :
    tab === "saved" ? sortedSaved :
    wardrobeListings;

  return (
    <MobileShell>
      <div style={{ backgroundColor: CREAM, color: INK }} className="min-h-screen pb-[90px]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: INK }}>
            <button onClick={() => navigate({ to: "/notifications" })} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Njoftimet">
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
          <h1 className="text-[15px] font-medium">{username}</h1>
          <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: INK }}>
            <button onClick={handleShare} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Shpërndaj">
              <IosShareIcon size={18} color="#f6f1e7" strokeWidth={1.6} />
            </button>
            <button onClick={() => setSettingsOpen(true)} className="grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Cilësimet">
              <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Profile section */}
        <section className="px-4 pt-5">
          <div className="flex items-center gap-4">
            <img
              src={avatar}
              alt=""
              className="h-[90px] w-[90px] shrink-0 rounded-full object-cover"
              style={{ border: `2px solid ${DIVIDER}` }}
            />
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-around">
                <Stat value={streak} label="streak" />
                <Stat value={followers} label="Ndjekësit" />
                <Stat value={following} label="Ndjek" />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setBenefitsOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 text-[14px] font-bold"
                  style={{ border: `1.5px solid ${INK}`, color: INK, backgroundColor: CREAM, height: 44 }}
                >
                  <Gem className="h-4 w-4" strokeWidth={1.8} /> Përfitimet
                </button>
                <button
                  onClick={() => setRatingsOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 text-[14px] font-bold"
                  style={{ border: `1.5px solid ${INK}`, color: INK, backgroundColor: CREAM, height: 44 }}
                >
                  {(profile?.rating_count ?? 0) > 0 ? (
                    <>
                      <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                      {(profile?.rating_avg ?? 0).toFixed(1)}
                    </>
                  ) : (
                    "Asnjë vlerësim"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[20px] font-bold leading-tight" style={{ color: INK }}>{displayName}</p>
              {profile?.city && (
                <p className="text-[15px] leading-tight" style={{ color: MUTED }}>{profile.city}</p>
              )}
            </div>
            <button
              onClick={() => setHeightOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 text-[13px]"
              style={{ color: MUTED, fontStyle: profile?.height_cm ? "normal" : "italic" }}
            >
              {profile?.height_cm ? (
                <>
                  <Ruler className="h-3.5 w-3.5" /> {profile.height_cm} cm
                </>
              ) : (
                "+ Shto gjatësinë"
              )}
            </button>
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
            <TabEmptyState tab={tab} />
          ) : (
            <ListingsGrid listings={currentGrid} manage={tab === "mine"} />
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

      {/* Height picker sheet */}
      <HeightSheet
        open={heightOpen}
        onOpenChange={setHeightOpen}
        userId={user.id}
        current={profile?.height_cm ?? null}
        onSaved={loadAll}
      />
    </MobileShell>

  );
}

function HeightSheet({
  open,
  onOpenChange,
  userId,
  current,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  current: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<number>(current ?? 175);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(current ?? 175);
  }, [open, current]);

  const options = useMemo(() => Array.from({ length: 220 - 140 + 1 }, (_, i) => 140 + i), []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ height_cm: value }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0" style={{ backgroundColor: CREAM }}>
        <SheetHeader className="px-5 pt-5">
          <SheetTitle style={{ color: INK }}>Gjatësia (cm)</SheetTitle>
        </SheetHeader>
        <div
          className="mx-5 mt-4 overflow-y-auto rounded-2xl"
          style={{ height: 220, border: `1px solid ${DIVIDER}`, scrollSnapType: "y mandatory" }}
        >
          {options.map((h) => {
            const selected = h === value;
            return (
              <button
                key={h}
                onClick={() => setValue(h)}
                className="flex w-full items-center justify-center py-2 text-[17px]"
                style={{
                  color: selected ? INK : MUTED,
                  fontWeight: selected ? 700 : 400,
                  backgroundColor: selected ? CARD : "transparent",
                  scrollSnapAlign: "center",
                }}
              >
                {h} cm
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={save}
            disabled={saving}
            className="h-12 w-full rounded-full text-[15px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: INK }}
          >
            {saving ? "Duke ruajtur..." : "Ruaj"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}



function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[22px] font-bold leading-tight" style={{ color: INK }}>{value}</p>
      <p className="mt-0.5 text-[12px] font-normal" style={{ color: MUTED }}>{label}</p>
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

function ListingsGrid({ listings, manage }: { listings: ListingView[]; manage?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: CREAM }}>
      {listings.map((l) => {
        const linkProps = manage
          ? ({ to: "/listing/$id/manage", params: { id: l.id } } as const)
          : ({ to: "/product/$id", params: { id: l.id } } as const);
        const isSold = l.sold;
        return (
          <Link
            key={l.id}
            {...linkProps}
            className="relative block aspect-square overflow-hidden"
            style={{ backgroundColor: CARD }}
          >
            {l.coverUrl && (
              <img
                src={l.coverUrl}
                alt={l.title}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                style={isSold ? { filter: "brightness(0.82) saturate(0.65)" } : undefined}
              />
            )}
            <span
              className="pointer-events-none absolute left-2 top-2 italic"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 10,
                color: "#ffffff",
                opacity: 0.8,
                textShadow: "0 1px 2px rgba(0,0,0,0.35)",
              }}
            >
              Rroba
            </span>
            {isSold && <SoldRibbon />}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 pt-10"
              style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)" }}
            >
              <p
                className="truncate text-[11px] text-white"
                style={{ opacity: isSold ? 0.75 : 0.85 }}
              >
                {[l.brand, l.size, `€${l.price}`].filter(Boolean).join(" · ")}
              </p>
              <p
                className="truncate text-[13px] font-bold text-white"
                style={{ opacity: isSold ? 0.75 : 1 }}
              >
                {l.title}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SoldRibbon() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: 18,
        right: -28,
        width: 110,
        background: SOLD,
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
        padding: "5px 0",
        transform: "rotate(45deg)",
        zIndex: 3,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      Shitur
    </div>
  );
}

function TabEmptyState({ tab }: { tab: Tab }) {
  const Icon =
    tab === "mine" ? Grid2x2 :
    tab === "liked" ? Heart :
    tab === "saved" ? Bookmark :
    Shirt;
  const subtitle =
    tab === "mine" ? "Artikujt që liston do të shfaqen këtu" :
    tab === "liked" ? "Artikujt që i pëlqen do të shfaqen këtu" :
    tab === "saved" ? "Artikujt që i ruan do të shfaqen këtu" :
    "Artikujt e shitur do të shfaqen këtu";
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <Icon size={32} strokeWidth={1.5} style={{ color: MUTED }} />
      <p className="mt-4 text-[15px] font-bold" style={{ color: INK }}>Asnjë artikull ende</p>
      <p className="mt-1 text-[13px]" style={{ color: MUTED }}>{subtitle}</p>
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

type SettingsView = "main" | "profile" | "notifications" | "preferences" | "faq" | "support";

function SettingsSheet({
  open, onOpenChange, profile, email, onSaved, onSignOut, onOpenOffers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile | null;
  email: string;
  onSaved: () => void;
  onSignOut: () => void;
  onOpenOffers: () => void;
}) {
  const [view, setView] = useState<SettingsView>("main");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => { if (open) setView("main"); }, [open]);

  const titles: Record<SettingsView, string> = {
    main: "Cilësimet",
    profile: "Ndrysho profilin",
    notifications: "Njoftimet",
    preferences: "Preferencat",
    faq: "Pyetjet e shpeshta",
    support: "Mbështetje",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto border-0 p-0"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 flex-row items-center gap-2 border-0 px-2 py-3" style={{ backgroundColor: CREAM }}>
          {view !== "main" ? (
            <button onClick={() => setView("main")} aria-label="Mbrapa" className="grid h-9 w-9 place-items-center rounded-full" style={{ color: INK }}>
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </button>
          ) : <span className="h-9 w-9" />}
          <SheetTitle className="flex-1 text-center text-[17px] font-bold" style={{ color: INK }}>
            {titles[view]}
          </SheetTitle>
          <button onClick={() => onOpenChange(false)} aria-label="Mbyll" className="grid h-9 w-9 place-items-center rounded-full" style={{ color: INK }}>
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </SheetHeader>

        <div className="px-0 pb-10">
          {view === "main" && (
            <SettingsMain
              onNavigate={setView}
              onOpenOffers={onOpenOffers}
              onLogout={() => setConfirmLogout(true)}
            />
          )}
          {view === "profile" && (
            <div className="px-5 pt-2">
              <ProfileForm profile={profile} email={email} onSaved={onSaved} />
            </div>
          )}
          {view === "notifications" && <NotificationsView />}
          {view === "preferences" && <PreferencesView />}
          {view === "faq" && <FaqView />}
          {view === "support" && <SupportView />}
        </div>

        <LogoutConfirm
          open={confirmLogout}
          onOpenChange={setConfirmLogout}
          onConfirm={() => { setConfirmLogout(false); onSignOut(); }}
        />
      </SheetContent>
    </Sheet>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED, backgroundColor: CREAM }}>
      {children}
    </div>
  );
}

function Row({
  icon: Icon, title, subtitle, onClick, danger,
}: {
  icon?: typeof UserIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-4 text-left"
      style={{ backgroundColor: CREAM }}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} style={{ color: danger ? SOLD : INK }} />}
      <div className="flex-1">
        <div className="text-[15px] font-semibold" style={{ color: danger ? SOLD : INK }}>{title}</div>
        {subtitle && <div className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{subtitle}</div>}
      </div>
      {!danger && <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: MUTED }} />}
    </button>
  );
}

function RowDivider() {
  return <div className="ml-[52px]" style={{ height: 1, backgroundColor: DIVIDER }} />;
}
function SectionDivider() {
  return <div style={{ height: 2, backgroundColor: DIVIDER }} />;
}

function SettingsMain({
  onNavigate, onOpenOffers, onLogout,
}: {
  onNavigate: (v: SettingsView) => void;
  onOpenOffers: () => void;
  onLogout: () => void;
}) {
  return (
    <div>
      <SectionHeader>Konto</SectionHeader>
      <Row icon={UserIcon} title="Ndrysho profilin" subtitle="Emri, bio, foto, qyteti" onClick={() => onNavigate("profile")} />
      <RowDivider />
      <Row icon={Tag} title="Ofertat" subtitle="Shih ofertat e marra dhe të dërguara" onClick={onOpenOffers} />
      <RowDivider />
      <Row icon={Bell} title="Njoftimet" subtitle="Menaxho njoftimet push dhe email" onClick={() => onNavigate("notifications")} />
      <RowDivider />
      <Row icon={SlidersHorizontal} title="Preferencat" subtitle="Kategoritë dhe madhësitë e preferuara" onClick={() => onNavigate("preferences")} />

      <SectionDivider />
      <SectionHeader>Ndihmë</SectionHeader>
      <Row icon={HelpCircle} title="Pyetjet e shpeshta" onClick={() => onNavigate("faq")} />
      <RowDivider />
      <Row icon={MessageSquare} title="Kontakto mbështetjen" onClick={() => onNavigate("support")} />

      <SectionDivider />
      <SectionHeader>Tjetër</SectionHeader>
      <Row icon={ShieldCheck} title="Privatësia" subtitle="Politikat dhe të dhënat e tua" />
      <RowDivider />
      <Row icon={LogOut} title="Dil" onClick={onLogout} danger />
    </div>
  );
}

function ProfileForm({ profile, email, onSaved }: { profile: Profile | null; email: string; onSaved: () => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [height, setHeight] = useState<string>(profile?.height_cm?.toString() ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setCity(profile?.city ?? "");
    setHeight(profile?.height_cm?.toString() ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, AVATAR_OPTIONS);
      const ext = compressed.type === "image/webp" ? "webp" : "jpg";
      const path = `avatars/${profile.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (error) { toast.error(error.message); return; }
      const { data: signed } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ngarkimi dështoi");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const h = height.trim() === "" ? null : Math.max(0, Math.min(260, parseInt(height, 10) || 0));
    const { error } = await supabase
      .from("profiles")
      .update({ name, bio, city, avatar_url: avatarUrl || null, height_cm: h })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profili u ruajt"); onSaved(); }
  };

  const inputStyle = { backgroundColor: CARD, color: INK, borderColor: DIVIDER } as const;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <img src={avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "U")}`} alt="" className="h-16 w-16 rounded-full object-cover" style={{ boxShadow: `0 0 0 2px ${DIVIDER}` }} />
        <label className="cursor-pointer rounded-full px-3 py-2 text-xs font-medium" style={{ backgroundColor: CARD, color: INK }}>
          {uploading ? "Po ngarkohet..." : "Ndrysho foton"}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </label>
      </div>
      <div><Label style={{ color: INK }}>Email</Label><Input value={email} disabled style={inputStyle} /></div>
      <div><Label style={{ color: INK }}>Emri</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={inputStyle} /></div>
      <div><Label style={{ color: INK }}>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} style={inputStyle} /></div>
      <div>
        <Label style={{ color: INK }}>Lartësia (cm)</Label>
        <Input type="number" inputMode="numeric" min={0} max={260} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="p.sh. 175" style={inputStyle} />
      </div>
      <div>
        <Label style={{ color: INK }}>Qyteti</Label>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-10 w-full rounded-md px-3 text-sm" style={{ backgroundColor: CARD, border: `1px solid ${DIVIDER}`, color: INK }}>
          <option value="">Zgjidh</option>
          {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <button onClick={save} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: INK, color: "#ffffff" }}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Ruaj
      </button>
    </div>
  );
}

function ToggleRow({ title, subtitle, value, onChange }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4" style={{ backgroundColor: CREAM }}>
      <div className="flex-1">
        <div className="text-[15px] font-semibold" style={{ color: INK }}>{title}</div>
        {subtitle && <div className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{subtitle}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: value ? INK : DIVIDER }}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full transition-all"
          style={{ left: value ? "calc(100% - 26px)" : "2px", backgroundColor: CREAM, boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
        />
      </button>
    </div>
  );
}

function NotificationsView() {
  const [push, setPush] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [offers, setOffers] = useState(true);
  const [messages, setMessages] = useState(true);
  const [marketing, setMarketing] = useState(false);
  return (
    <div>
      <SectionHeader>Kanalet</SectionHeader>
      <ToggleRow title="Njoftime push" subtitle="Në telefonin tënd" value={push} onChange={setPush} />
      <RowDivider />
      <ToggleRow title="Email" subtitle="Përmbledhje në email" value={emailNotif} onChange={setEmailNotif} />
      <SectionDivider />
      <SectionHeader>Llojet</SectionHeader>
      <ToggleRow title="Oferta të reja" value={offers} onChange={setOffers} />
      <RowDivider />
      <ToggleRow title="Mesazhe" value={messages} onChange={setMessages} />
      <RowDivider />
      <ToggleRow title="Promovime" subtitle="Lajme dhe oferta speciale" value={marketing} onChange={setMarketing} />
    </div>
  );
}

const PREF_CATEGORIES = ["Topp", "Bukse", "Fustan", "Këpucë", "Xhup", "Aksesorë", "Çantë"];
const PREF_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
      style={{
        backgroundColor: selected ? INK : CARD,
        color: selected ? "#ffffff" : INK,
      }}
    >
      {label}
    </button>
  );
}

function PreferencesView() {
  const [cats, setCats] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div>
      <SectionHeader>Kategoritë e preferuara</SectionHeader>
      <div className="flex flex-wrap gap-2 px-5 pt-2">
        {PREF_CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={cats.includes(c)} onClick={() => toggle(cats, setCats, c)} />
        ))}
      </div>
      <SectionHeader>Madhësitë</SectionHeader>
      <div className="flex flex-wrap gap-2 px-5 pt-2">
        {PREF_SIZES.map((s) => (
          <Chip key={s} label={s} selected={sizes.includes(s)} onClick={() => toggle(sizes, setSizes, s)} />
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  { q: "Si mund të shes një artikull?", a: "Shko te tab-i 'Shit', ngarko deri në 10 foto, plotëso detajet dhe publikojeni. Artikulli yt do të shfaqet menjëherë në feed." },
  { q: "Si funksionojnë ofertat?", a: "Blerësit mund të dërgojnë një ofertë më të ulët se çmimi. Ti mund ta pranosh, refuzosh ose të kundërpërgjigjesh me një çmim tjetër." },
  { q: "Si paguhem për një shitje?", a: "Pasi blerësi konfirmon marrjen, pagesa lëshohet në llogarinë tënde brenda 2 ditëve të punës." },
  { q: "Çfarë ndodh nëse artikulli nuk arrin?", a: "Na kontakto nga 'Mbështetje' brenda 7 ditëve dhe ne do të hetojmë rastin dhe do të rimbursojmë nëse është e nevojshme." },
  { q: "Si mund ta fshij llogarinë time?", a: "Na shkruaj nga 'Mbështetje' me kërkesën tënde dhe llogaria do të fshihet brenda 30 ditëve." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ backgroundColor: CREAM }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <div className="flex-1 text-[15px] font-bold" style={{ color: INK }}>{q}</div>
        {open
          ? <Minus className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: MUTED }} />
          : <Plus className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: MUTED }} />}
      </button>
      {open && <div className="px-5 pb-4 text-[14px] leading-relaxed" style={{ color: MUTED }}>{a}</div>}
    </div>
  );
}

function FaqView() {
  return (
    <div className="pt-2">
      {FAQS.map((f, i) => (
        <div key={f.q}>
          <FaqItem {...f} />
          {i < FAQS.length - 1 && <RowDivider />}
        </div>
      ))}
    </div>
  );
}

function SupportView() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const inputBase = "w-full rounded-xl px-4 py-3 text-[15px] outline-none placeholder:font-normal";
  const inputStyle = { backgroundColor: CARD, color: INK } as const;
  const placeholderStyle = { ["--tw-placeholder-color" as never]: MUTED };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Plotëso të gjitha fushat"); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setSubject(""); setBody("");
    toast.success("Mesazhi u dërgua");
  };

  return (
    <div className="space-y-3 px-5 pt-4">
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Tema"
        className={inputBase}
        style={{ ...inputStyle, ...placeholderStyle }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Përshkruaj problemin..."
        rows={6}
        className={inputBase + " resize-none"}
        style={{ ...inputStyle, ...placeholderStyle }}
      />
      <style>{`textarea::placeholder, input::placeholder { color: ${MUTED}; }`}</style>
      <button
        onClick={send}
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-[15px] font-semibold disabled:opacity-50"
        style={{ backgroundColor: INK, color: "#ffffff" }}
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" />}
        Dërgo
      </button>
    </div>
  );
}

function LogoutConfirm({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-6" style={{ backgroundColor: "rgba(26,26,26,0.45)" }} onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: CREAM, color: INK }} onClick={(e) => e.stopPropagation()}>
        <div className="text-[17px] font-bold" style={{ color: INK }}>Dil nga llogaria?</div>
        <div className="mt-2 text-[14px]" style={{ color: INK }}>A je i sigurt që dëshiron të dalësh?</div>
        <div className="mt-5 flex gap-2">
          <button onClick={() => onOpenChange(false)} className="flex-1 rounded-full py-3 text-[14px] font-semibold" style={{ backgroundColor: CARD, color: INK }}>
            Anulo
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-full py-3 text-[14px] font-semibold" style={{ backgroundColor: SOLD, color: "#ffffff" }}>
            Dil
          </button>
        </div>
      </div>
    </div>
  );
}

