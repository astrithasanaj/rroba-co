import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
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
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/delete-account.functions";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { StarRow } from "@/components/marketplace/RatingsDialog";
import { ReviewsSheet } from "@/components/marketplace/ReviewsSheet";

import { supabase } from "@/integrations/supabase/client";
import { compressImage, AVATAR_OPTIONS } from "@/utils/compressImage";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { CityPicker } from "@/components/marketplace/CityPicker";
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
  city_id: string | null;
  bio: string;
  rating_avg: number;
  rating_count: number;
  height_cm: number | null;
  created_at?: string;
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

const CREAM = "#ffffff";
const CARD = "#ffffff";
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
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  


  const loadAll = useCallback(async () => {
    setLoading(true);
    const [prof, mine, offRec, offSent, fCount, gCount] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("*").eq("user_id", user.id).in("status", ["active", "sold"]).order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("offers").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
    ]);
    setFollowers(fCount.count ?? 0);
    setFollowing(gCount.count ?? 0);
    setProfile(prof.data as Profile | null);
    const hydratedMine = await hydrateListings((mine.data ?? []) as ListingRow[]);
    const sortedMine = [
      ...hydratedMine.filter((p) => p.status === "active"),
      ...hydratedMine.filter((p) => p.status === "sold"),
    ];
    setMyListings(sortedMine);

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
      // DELETE events don't include user_id in default REPLICA IDENTITY, so listen broadly and let loadAll reconcile.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "listings" }, () => loadAll())
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
    const active = myListings.filter((l) => l.status === "active").sort(sortFn);
    const sold = myListings.filter((l) => l.status === "sold").sort(sortFn);
    return [...active, ...sold];
  }, [myListings, sort]);
  const wardrobeListings = useMemo(() => myListings.filter((l) => l.status === "sold").sort(sortFn), [myListings, sort]);
  const sortedLiked = useMemo(() => [...likedListings].sort(sortFn), [likedListings, sort]);
  const sortedSaved = useMemo(() => [...savedListings].sort(sortFn), [savedListings, sort]);

  const salesCount = useMemo(() => myListings.filter((l) => l.status === "sold").length, [myListings]);
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
      <div
        style={{
          backgroundColor: CREAM,
          color: INK,
          WebkitFontSmoothing: "antialiased",
          WebkitTapHighlightColor: "transparent",
        }}
        className="min-h-screen pb-[90px]"
      >
        {/* Header */}
        <header
          className="flex items-center justify-between"
          style={{ padding: "10px 16px 6px", backgroundColor: CREAM }}
        >
          <div
            className="flex items-center"
            style={{ backgroundColor: CARD, borderRadius: 20, padding: "7px 12px", gap: 8 }}
          >
            <button
              onClick={() => navigate({ to: "/notifications" })}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0 }}
              aria-label="Njoftimet"
            >
              <Bell style={{ width: 15, height: 15 }} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setSortOpen(true)}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0 }}
              aria-label="Filtro"
            >
              <SlidersHorizontal style={{ width: 15, height: 15 }} strokeWidth={1.8} />
            </button>
          </div>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1px",
              color: INK,
            }}
          >
            {username}
          </h1>
          <div
            className="flex items-center"
            style={{ backgroundColor: CARD, borderRadius: 20, padding: "7px 12px", gap: 8 }}
          >
            <button
              onClick={handleShare}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0 }}
              aria-label="Shpërndaj"
            >
              <IosShareIcon size={15} color={INK} strokeWidth={1.6} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0 }}
              aria-label="Cilësimet"
            >
              <SettingsIcon style={{ width: 15, height: 15 }} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Profile section */}
        <section>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 16px 12px" }}>
            <img
              src={avatar}
              alt=""
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${DIVIDER}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Stat value={myListings.filter((l) => l.status === "active").length} label="artikuj" />
                <Stat
                  value={followers}
                  label="ndjekës"
                  onClick={() => navigate({ to: "/user/$id/followers", params: { id: user.id } })}
                />
                <Stat
                  value={following}
                  label="ndjek"
                  onClick={() => navigate({ to: "/user/$id/following", params: { id: user.id } })}
                />


              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={() => setBenefitsOpen(true)}
                  className="profile-btn"
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid #c8c3b9",
                    backgroundColor: CREAM,
                    color: INK,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Gem style={{ width: 12, height: 12 }} strokeWidth={1.8} />
                  Përfitimet
                </button>
                <button
                  onClick={() => setRatingsOpen(true)}
                  className="profile-btn"
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid #c8c3b9",
                    backgroundColor: CREAM,
                    color: INK,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {(profile?.rating_count ?? 0) > 0 ? (
                    <>
                      <Star style={{ width: 12, height: 12 }} fill="currentColor" strokeWidth={0} />
                      {(profile?.rating_avg ?? 0).toFixed(1)}
                    </>
                  ) : (
                    "Asnjë vlerësim"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px 14px" }}>
            <p
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                color: INK,
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </p>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>
                {profile?.city || ""}
              </span>
              <button
                onClick={() => setHeightOpen(true)}
                className="profile-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 12,
                  color: MUTED,
                  fontStyle: profile?.height_cm ? "normal" : "italic",
                }}
              >
                {profile?.height_cm ? (
                  <>
                    <Ruler style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                    {profile.height_cm} cm
                  </>
                ) : (
                  "+ Shto gjatësinë"
                )}
              </button>
            </div>
            {profile?.bio && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: INK }}>
                {profile.bio}
              </p>
            )}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: DIVIDER, width: "100%" }} />

        {/* Tabs */}
        <div>
          <div className="grid grid-cols-4" style={{ backgroundColor: CREAM }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="profile-btn relative flex items-center justify-center"
                  style={{ height: 40, background: "transparent", border: "none" }}
                >
                  <Icon
                    style={{ width: 20, height: 20, color: active ? INK : "#c8c3b9" }}
                    strokeWidth={active ? 2 : 1.7}
                  />
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: 20,
                        height: 2,
                        backgroundColor: INK,
                      }}
                    />
                  )}
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
          <div
            style={{
              position: "fixed",
              bottom: 90,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              padding: "10px 0 8px",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <button
              onClick={() => setSortOpen(true)}
              className="profile-btn"
              style={{
                pointerEvents: "auto",
                backgroundColor: INK,
                color: CREAM,
                height: 36,
                borderRadius: 24,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.2px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
              }}
            >
              <ArrowDownUp style={{ width: 14, height: 14 }} strokeWidth={2} />
              Rendit
            </button>
          </div>
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

      {/* Benefits sheet — full-page slide-in from right */}
      <Sheet open={benefitsOpen} onOpenChange={setBenefitsOpen}>
        <SheetContent
          side="right"
          hideClose
          className="h-[100dvh] w-full !max-w-none p-0 border-0"
          style={{ backgroundColor: CREAM, WebkitFontSmoothing: "antialiased", overscrollBehavior: "contain" }}
        >
          {/* Header — matches Vlerësimet */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${DIVIDER}`,
              backgroundColor: CREAM,
            }}
          >
            <div style={{ width: 72, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
              <button
                onClick={() => setBenefitsOpen(false)}
                aria-label="Mbrapa"
                style={{
                  background: CARD,
                  color: INK,
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  border: 0,
                  WebkitTapHighlightColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Përfitimet</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>e shitësit</div>
            </div>
            <div style={{ width: 72 }} />
          </div>

          <div style={{ overflowY: "auto", height: "calc(100dvh - 60px)", paddingBottom: 40 }}>
            <p style={{ fontSize: 13, color: MUTED, textAlign: "center", padding: "16px 24px 20px", lineHeight: 1.5, margin: 0 }}>
              Sa më shumë shet, aq më shumë përfitime.
            </p>
            <TierCard emoji="🥉" title="Fillestar" range="0–4 shitje" body="Akses bazë në listim dhe shitje." active={tier === "starter"} />
            <TierCard emoji="🥈" title="I besueshëm" range="5–19 shitje" body="Prioritet në kërkim dhe shenjë e verifikuar." active={tier === "trusted"} />
            <TierCard emoji="🥇" title="Top shitës" range="20+ shitje" body="Promovim falas, shenjë e artë dhe shfaqje në kryefaqe." active={tier === "top"} />
          </div>
        </SheetContent>
      </Sheet>


      {/* Reviews dialog */}
      <ReviewsSheet
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
        sellerUsername={username}
        sellerCreatedAt={profile?.created_at}
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



function Stat({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) {
  const inner = (
    <>
      <p style={{ fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 400, color: MUTED, marginTop: 2, letterSpacing: "0.2px" }}>
        {label}
      </p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="active:opacity-70"
        style={{
          textAlign: "center",
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {inner}
      </button>
    );
  }
  return <div style={{ textAlign: "center" }}>{inner}</div>;
}



function TierCard({ emoji, title, range, body, active }: { emoji: string; title: string; range: string; body: string; active: boolean }) {
  return (
    <div
      style={{
        background: active ? INK : CARD,
        borderRadius: 16,
        padding: 18,
        margin: "0 16px 10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: active ? CREAM : INK }}>
          {emoji} {title}
        </span>
        <span
          style={{
            fontSize: 12,
            color: active ? CREAM : MUTED,
            background: active ? "rgba(255,255,255,0.12)" : CREAM,
            padding: "4px 10px",
            borderRadius: 10,
          }}
        >
          {range}
        </span>
      </div>
      <p style={{ fontSize: 13, color: active ? "rgba(255,255,255,0.65)" : MUTED, lineHeight: 1.5, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}


function ListingsGrid({ listings, manage }: { listings: ListingView[]; manage?: boolean }) {
  return (
    <div
      className="grid grid-cols-2"
      style={{ gap: 1.5, backgroundColor: "#ffffff" }}
    >
      {listings.map((l) => (
        <ListingGridTile key={l.id} listing={l} manage={manage} />
      ))}
    </div>
  );
}

function ListingGridTile({ listing: l, manage }: { listing: ListingView; manage?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (!l.coverUrl || broken) return null;
  const linkProps = manage
    ? ({ to: "/listing/$id/manage", params: { id: l.id } } as const)
    : ({ to: "/product/$id", params: { id: l.id } } as const);
  const isSold = l.status === "sold" || l.sold;
  return (
    <Link
      {...linkProps}
      className="relative block aspect-square overflow-hidden"
      style={{ backgroundColor: "transparent", borderRadius: 0 }}
    >
      <img
        src={l.coverUrl}
        alt={l.title}
        className="h-full w-full"
        loading="lazy"
        onError={() => setBroken(true)}
        style={{
          objectFit: "cover",
          objectPosition: "center top",
          ...(isSold ? { filter: "brightness(0.80) saturate(0.60)" } : {}),
        }}
      />
      <span
        className="pointer-events-none absolute italic"
        style={{
          top: 0,
          left: 0,
          padding: "6px 7px",
          fontFamily: "var(--font-voice), Georgia, serif",
          fontSize: 9,
          color: "#ffffff",
          opacity: 0.75,
          textShadow: "0 1px 2px rgba(0,0,0,0.35)",
        }}
      >
        Rroba
      </span>
      {isSold && <SoldRibbon />}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          padding: "10px 8px 8px",
          backgroundImage: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.58) 100%)",
        }}
      >
        <p
          className="truncate"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "0.1px",
            opacity: isSold ? 0.85 : 1,
          }}
        >
          {l.title}
        </p>
        <p
          className="truncate"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.82)",
            marginTop: 2,
          }}
        >
          {[l.brand, l.size, `€${l.price}`].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}


function SoldRibbon() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: 13,
        right: -23,
        width: 82,
        background: SOLD,
        color: "#ffffff",
        fontSize: 9,
        fontWeight: 700,
        textAlign: "center",
        padding: "4px 0",
        transform: "rotate(45deg)",
        zIndex: 3,
        letterSpacing: "0.8px",
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
                <button onClick={() => onRespond(o, "declined")} className="grid h-11 w-11 place-items-center rounded-full" style={{ backgroundColor: DIVIDER }} aria-label="Refuzo">
                  <X className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onRespond(o, "accepted")} className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ backgroundColor: INK }} aria-label="Prano">
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

type SettingsView =
  | "main" | "profile" | "notifications" | "preferences"
  | "faq" | "support" | "privacy" | "terms";

function SettingsSheet({
  open, onOpenChange, profile, email, onSaved, onSignOut,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile | null;
  email: string;
  onSaved: () => void;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
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
    privacy: "Privatësia",
    terms: "Kushtet e shërbimit",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="w-full !max-w-full h-full overflow-y-auto border-0 p-0 sm:!max-w-full"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            backgroundColor: CREAM,
          }}
        >
          <button
            onClick={() => (view !== "main" ? setView("main") : onOpenChange(false))}
            aria-label="Mbrapa"
            style={{
              background: CARD,
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
          >
            <i className="ti ti-chevron-left" style={{ fontSize: 18, color: INK }} />
          </button>
          <SheetTitle
            className="italic"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 500,
              color: INK,
              letterSpacing: "0.1px",
            }}
          >
            {titles[view]}
          </SheetTitle>
          <div style={{ width: 36 }} />
        </div>

        <div className="px-0 pb-6">
          {view === "main" && (
            <SettingsMain
              onNavigate={setView}
              onLogout={() => setConfirmLogout(true)}
              onDeleteAccount={() => navigate({ to: "/profile/delete-account" })}
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
          {view === "privacy" && <PrivacyView />}
          {view === "terms" && <TermsView />}
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
    <div
      className="uppercase"
      style={{
        color: MUTED,
        backgroundColor: CREAM,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.8px",
        padding: "20px 20px 8px",
      }}
    >
      {children}
    </div>
  );
}

function Row({
  icon, title, subtitle, onClick, isLast,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  isLast?: boolean;
}) {
  return (
    <button onClick={onClick} className="settings-row" style={{ borderBottom: isLast ? "none" : `1px solid ${DIVIDER}` }}>
      <i className={`ti ${icon} settings-icon`} aria-hidden />
      <div className="settings-text">
        <div className="settings-title">{title}</div>
        {subtitle && <div className="settings-subtitle">{subtitle}</div>}
      </div>
      <i className="ti ti-chevron-right settings-chevron" aria-hidden />
    </button>
  );
}

function RowDivider() {
  return <div style={{ height: 1, backgroundColor: DIVIDER, marginLeft: 20, marginRight: 20 }} />;
}
function SectionDivider() {
  return <div style={{ height: 1, backgroundColor: DIVIDER }} />;
}

function SettingsMain({
  onNavigate, onLogout, onDeleteAccount,
}: {
  onNavigate: (v: SettingsView) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {

  return (
    <div>
      <SectionHeader>Konto</SectionHeader>
      <div>
        <Row icon="ti-user" title="Ndrysho profilin" subtitle="Emri, bio, foto, qyteti" onClick={() => onNavigate("profile")} />
        <Row icon="ti-bell" title="Njoftimet" subtitle="Menaxho njoftimet push dhe email" onClick={() => onNavigate("notifications")} />
        <Row icon="ti-adjustments-horizontal" title="Preferencat" subtitle="Kategoritë dhe madhësitë e preferuara" onClick={() => onNavigate("preferences")} isLast />
      </div>

      <SectionHeader>Ndihmë</SectionHeader>
      <div>
        <Row icon="ti-help-circle" title="Pyetjet e shpeshta" onClick={() => onNavigate("faq")} />
        <Row icon="ti-message" title="Kontakto mbështetjen" onClick={() => onNavigate("support")} isLast />
      </div>

      <SectionHeader>Tjetër</SectionHeader>
      <div>
        <Row icon="ti-shield" title="Privatësia" subtitle="Politikat dhe të dhënat e tua" onClick={() => onNavigate("privacy")} />
        <Row icon="ti-file-text" title="Kushtet e shërbimit" onClick={() => onNavigate("terms")} isLast />
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="settings-row"
        style={{
          borderTop: `1px solid ${DIVIDER}`,
          borderBottom: "none",
          justifyContent: "center",
          marginTop: 32,
          padding: "18px 20px",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: SOLD }}>Dilni nga llogaria</span>
      </button>

      {/* Delete account */}
      <div style={{ height: 1, backgroundColor: DIVIDER, margin: "24px 20px 0" }} />
      <button
        onClick={onDeleteAccount}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          width: "100%",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <i className="ti ti-trash" style={{ fontSize: 20, color: "#e53935", width: 22 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e53935", lineHeight: 1.3 }}>
            Fshij llogarinë
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.3 }}>
            Fshi përgjithmonë të gjitha të dhënat tuaja
          </div>
        </div>
      </button>

      {/* Version */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 0 24px",
          fontSize: 11,
          color: "#c8c3b9",
          letterSpacing: "0.3px",
        }}
      >
        Rroba v1.0.0
      </div>
    </div>
  );
}

function LegalPage({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <div className="px-5 pt-2 pb-6">
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: INK, marginBottom: 12 }}>{title}</h2>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: 14, lineHeight: 1.55, color: INK }}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function PrivacyView() {
  return (
    <LegalPage
      title="Privatësia"
      paragraphs={[
        "Ne respektojmë privatësinë tënde. Të dhënat që mbledhim përdoren vetëm për të ofruar shërbimin Rroba dhe për të përmirësuar përvojën tënde.",
        "Emri, email-i dhe fotoja e profilit shfaqen publikisht kur listoni artikuj. Adresa dhe informacionet e pagesës mbahen private.",
        "Ti mund të kërkosh fshirjen e llogarisë dhe të dhënave në çdo kohë përmes seksionit të mbështetjes.",
      ]}
    />
  );
}

function TermsView() {
  return (
    <LegalPage
      title="Kushtet e shërbimit"
      paragraphs={[
        "Duke përdorur Rroba, ti pranon këto kushte. Përdoruesit janë përgjegjës për saktësinë e informacionit të artikujve dhe për transaksionet e tyre.",
        "Ndalohen artikujt e falsifikuar, të vjedhur ose të papërshtatshëm. Rroba rezervon të drejtën të heqë artikuj që shkelin këto kushte.",
        "Pagesat, kthimet dhe mosmarrëveshjet trajtohen sipas politikave tona. Për pyetje, kontakto mbështetjen.",
      ]}
    />
  );
}

function ProfileForm({ profile, email, onSaved }: { profile: Profile | null; email: string; onSaved: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [cityId, setCityId] = useState<string | null>(profile?.city_id ?? null);
  const [height, setHeight] = useState<string>(profile?.height_cm?.toString() ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setCity(profile?.city ?? "");
    setCityId(profile?.city_id ?? null);
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
      .update({ name, bio, city, city_id: cityId, avatar_url: avatarUrl || null, height_cm: h })
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
      <div>
        <div className="flex items-center justify-between">
          <Label style={{ color: INK }}>Email</Label>
          <button
            type="button"
            onClick={() => navigate({ to: "/profile/change-email" })}
            className="text-xs font-semibold underline"
            style={{ color: INK, background: "transparent", border: "none", cursor: "pointer" }}
          >
            Ndrysho email-in
          </button>
        </div>
        <Input value={email} disabled style={inputStyle} />
      </div>
      <div><Label style={{ color: INK }}>Emri</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={inputStyle} /></div>
      <div><Label style={{ color: INK }}>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} style={inputStyle} /></div>
      <div>
        <Label style={{ color: INK }}>Lartësia (cm)</Label>
        <Input type="number" inputMode="numeric" min={0} max={260} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="p.sh. 175" style={inputStyle} />
      </div>
      <div>
        <Label style={{ color: INK }}>Qyteti</Label>
        <div className="mt-1">
          <CityPicker
            value={cityId}
            onChange={(id, c) => {
              setCityId(id);
              setCity(c.name);
            }}
          />
        </div>
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
  { q: "Si mund të shes një artikull?", a: "Shko te butonin \"+\" në fund të ekranit, ngarko deri në 10 foto, plotëso detajet (kategoria, madhësia, çmimi, gjendja) dhe publiko. Artikulli yt do të shfaqet menjëherë në feed." },
  { q: "Si funksionojnë ofertat?", a: "Blerësit mund të dërgojnë një ofertë më të ulët se çmimi. Ti mund ta pranosh, refuzosh ose të kundërpërgjigjesh me një çmim tjetër nëpërmjet mesazheve." },
  { q: "Si bëhet pagesa?", a: "Blerësi dhe shitësi takohen personalisht dhe pagesa bëhet me para në dorë. Rroba nuk përpunon pagesa — çdo transaksion ndodh drejtpërdrejt midis palëve." },
  { q: "Si organizohet takimi?", a: "Pasi blerësi shfaq interes, komunikoni nëpërmjet mesazheve në aplikacion dhe vendosni vendin dhe orën e takimit. Rekomandojmë takime në vende publike dhe të sigurta." },
  { q: "Çfarë ndodh nëse artikulli nuk është siç përshkruhet?", a: "Na kontakto nga \"Mbështetje\" brenda 7 ditëve nga takimi dhe ne do të hetojmë rastin." },
  { q: "A është e sigurt të takohem me blerës/shitës të panjohur?", a: "Rekomandojmë gjithmonë takime në vende publike si qendra tregtare, kafene ose zona të frekuentuara. Mos u takoni kurrë në vende të izoluara." },
  { q: "Si të raportoj një përdorues problematik?", a: "Shko te profili i përdoruesit ose njoftimi, trokit \"⋯\" dhe zgjidh \"Raporto\". Ekipi ynë do të shqyrtojë rastin brenda 24 orëve." },
  { q: "Si funksionon sistemi i vlerësimeve?", a: "Pas çdo shitjeje të konfirmuar, blerësi mund të lërë një vlerësim me yje (1-5) dhe koment për shitësin. Vlerësimet ndihmojnë komunitetin të blejë me besim." },
  { q: "A mund të anuloj një shitje?", a: "Po, mund të anulosh një shitje para takimit duke e njoftuar blerësin nëpërmjet mesazheve. Rekomandojmë komunikim të hapur dhe të respektosh blerësin." },
  { q: "Sa kohë mbetet aktiv një njoftim?", a: "Njoftimet mbeten aktive 60 ditë (90 ditë për Designer/Premium dhe 45 ditë për Elektronikë). Pas kësaj, mund ta rinovosh falas deri në 3 herë." },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ backgroundColor: open ? "#ffffff" : CREAM, borderRadius: open ? "0 0 10px 10px" : 0, transition: "background-color 160ms ease" }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
        style={{ padding: "16px 20px", WebkitTapHighlightColor: "transparent" }}
      >
        <div className="flex-1 text-[14px] font-bold" style={{ color: "#1a1a1a" }}>{q}</div>
        <ChevronRight
          className="h-4 w-4 shrink-0"
          strokeWidth={2}
          style={{
            color: "#c8c3b9",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease",
        }}
      >
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#a89f94", lineHeight: 1.6 }}>{a}</div>
      </div>
    </div>
  );
}

function FaqView() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="pt-2">
      {FAQS.map((f, i) => (
        <div key={f.q}>
          <FaqItem
            q={f.q}
            a={f.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx((cur) => (cur === i ? null : i))}
          />
          {i < FAQS.length - 1 && <div style={{ height: 1, backgroundColor: "#ddd8ce" }} />}
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
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: "rgba(26,26,26,0.45)" }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-6 pb-8"
        style={{ backgroundColor: CREAM, color: INK, maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: INK, textAlign: "center" }}>A jeni i sigurt?</div>
        <div style={{ fontSize: 13, color: MUTED, textAlign: "center", marginTop: 6 }}>
          Do të dilni nga llogaria juaj.
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            style={{ backgroundColor: INK, color: "#ffffff", height: 50, borderRadius: 12, fontSize: 14, fontWeight: 600, width: "100%" }}
          >
            Po, dilni
          </button>
          <button
            onClick={() => onOpenChange(false)}
            style={{ backgroundColor: "#ffffff", color: INK, height: 50, borderRadius: 12, fontSize: 14, fontWeight: 600, width: "100%" }}
          >
            Anulo
          </button>
        </div>
      </div>
    </div>
  );
}


