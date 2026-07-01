import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Megaphone,
  Pencil,
  Send,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/_authenticated/listing/$id/manage")({
  component: () => (<SwipeBackWrapper><ManageListingPage /></SwipeBackWrapper>),
});

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const DANGER = "#e53935";

function ManageListingPage() {
  const { id } = useParams({ from: "/_authenticated/listing/$id/manage" });
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [priceOpen, setPriceOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    if (!row) {
      setLoading(false);
      return;
    }
    if (row.user_id !== user.id) {
      navigate({ to: "/product/$id", params: { id } });
      return;
    }
    const [hydrated] = await hydrateListings([row as ListingRow]);
    const { count } = await supabase
      .from("listing_likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", id);
    setListing(hydrated);
    setLikeCount(count ?? 0);
    setNewPrice(String(hydrated.price));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const savePrice = async () => {
    const v = parseFloat(newPrice);
    if (!Number.isFinite(v) || v < 0) {
      toast.error("Çmim i pavlefshëm");
      return;
    }
    setSavingPrice(true);
    const { error } = await supabase
      .from("listings")
      .update({ price: v, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSavingPrice(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Çmimi u përditësua");
    setPriceOpen(false);
    load();
  };

  const toggleSold = async () => {
    if (!listing) return;
    setWorking(true);
    const next = !listing.sold;
    const { error } = await supabase
      .from("listings")
      .update({
        sold: next,
        status: next ? "sold" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setWorking(false);
    setConfirmSold(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Artikulli u shënua si i shitur" : "Artikulli u rikthye si aktiv");
    load();
  };

  const deleteListing = async () => {
    setWorking(true);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    setWorking(false);
    setConfirmDelete(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Artikulli u fshi");
    navigate({ to: "/profile" });
  };

  const share = async () => {
    if (!listing) return;
    const url = `${window.location.origin}/product/${listing.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: listing.title, text: "Shiko këtë artikull në Rroba" });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lidhja u kopjua!");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (loading || !listing) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center" style={{ backgroundColor: CREAM }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      </MobileShell>
    );
  }

  const breadcrumb = [listing.category, listing.gender].filter(Boolean).join(" / ");
  const lastEdited = new Date(listing.created_at).toLocaleDateString("sq-AL", {
    day: "numeric",
    month: "long",
  });

  return (
    <MobileShell>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center px-4 pt-4 pb-3" style={{ backgroundColor: CREAM }}>
          <button
            onClick={() => window.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1
            className="flex-1 truncate px-3 text-center text-base font-bold"
            style={{ color: INK }}
          >
            {listing.title}
          </h1>
          <div className="h-10 w-10" />
        </header>

        {/* Top section */}
        <section className="px-4 pt-2">
          <div className="flex gap-4">
            <div
              className="overflow-hidden rounded-2xl"
              style={{ width: "45%", aspectRatio: "1 / 1", backgroundColor: CARD }}
            >
              {listing.coverUrl && (
                <img src={listing.coverUrl} alt={listing.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="line-clamp-2 text-xl font-bold leading-tight" style={{ color: INK }}>
                {listing.title}
              </p>
              {breadcrumb && (
                <p className="mt-1 truncate text-xs" style={{ color: MUTED }}>
                  {breadcrumb}
                </p>
              )}
              <p className="mt-4 text-2xl font-bold" style={{ color: INK }}>
                {listing.price} €
              </p>
              <button
                onClick={() => setPriceOpen(true)}
                className="mt-0.5 self-start text-sm font-medium underline underline-offset-2"
                style={{ color: INK }}
              >
                Ndrysho çmimin
              </button>
              <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: MUTED }}>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {likeCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> —
                </span>
              </div>
              <Link
                to="/product/$id"
                params={{ id: listing.id }}
                className="mt-3 grid place-items-center rounded-full border py-2.5 text-sm font-semibold"
                style={{ borderColor: INK, color: INK, backgroundColor: CREAM }}
              >
                Shiko artikullin
              </Link>
            </div>
          </div>
        </section>

        {/* Action list */}
        <section className="mt-8 px-4">
          <ActionRow
            icon={<Pencil className="h-5 w-5" style={{ color: INK }} />}
            title="Ndrysho"
            subtitle={`Ndryshuar për herë të fundit më ${lastEdited}`}
            chevron
            onClick={() => navigate({ to: "/listing/$id/edit", params: { id } })}
          />
          <Divider />
          <ActionRow
            icon={<Megaphone className="h-5 w-5" style={{ color: INK }} />}
            title="Promovo"
            subtitle="Rrit shanset për të shitur duke promovuar artikullin tënd!"
            chevron
            onClick={() => toast.info("Promovimi vjen së shpejti")}
          />
          <Divider />
          <ActionRow
            icon={<Send className="h-5 w-5" style={{ color: INK }} />}
            title="Ndaj"
            onClick={share}
          />
          <Divider />
          {listing.sold ? (
            <ActionRow
              icon={<RotateCcw className="h-5 w-5" style={{ color: INK }} />}
              title="Shëno si aktiv"
              onClick={() => setConfirmSold(true)}
            />
          ) : (
            <ActionRow
              icon={<CheckCircle2 className="h-5 w-5" style={{ color: INK }} />}
              title="Shëno si shitur"
              onClick={() => setConfirmSold(true)}
            />
          )}
          <Divider />
          <ActionRow
            icon={<Trash2 className="h-5 w-5" style={{ color: DANGER }} />}
            title="Fshij këtë artikull"
            titleColor={DANGER}
            onClick={() => setConfirmDelete(true)}
          />
        </section>

        <div className="h-32" />
      </div>

      {/* Price sheet */}
      <Sheet open={priceOpen} onOpenChange={setPriceOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 p-0"
          style={{ backgroundColor: CREAM }}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full" style={{ backgroundColor: DIVIDER }} />
          <SheetHeader className="px-6 pt-4 text-left">
            <SheetTitle style={{ color: INK }}>Ndrysho çmimin</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6 pt-4">
            <div
              className="flex items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: CARD }}
            >
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="no-spinner border-0 bg-transparent p-0 text-lg font-bold shadow-none focus-visible:ring-0"
                style={{ color: INK }}
              />
              <span className="ml-2 text-lg font-bold" style={{ color: INK }}>
                €
              </span>
            </div>
            <button
              onClick={savePrice}
              disabled={savingPrice}
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: INK, color: CREAM }}
            >
              {savingPrice ? "Duke ruajtur…" : "Ruaj"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mark sold / active */}
      <AlertDialog open={confirmSold} onOpenChange={setConfirmSold}>
        <AlertDialogContent style={{ backgroundColor: CREAM, borderColor: DIVIDER }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: INK }}>
              {listing.sold ? "Ktheje këtë artikull si aktiv?" : "A e ke shitur këtë artikull?"}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: MUTED }}>
              {listing.sold
                ? "Artikulli do të rishfaqet në feed dhe në profilin tënd si aktiv."
                : "Artikulli do të shënohet si i shitur dhe nuk do të jetë më i blegishëm."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full border-0"
              style={{ backgroundColor: CARD, color: INK }}
            >
              Anulo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleSold}
              disabled={working}
              className="rounded-full"
              style={{ backgroundColor: INK, color: CREAM }}
            >
              {listing.sold ? "Po, aktivizoje" : "Po, e shita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent style={{ backgroundColor: CREAM, borderColor: DIVIDER }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: INK }}>
              A je i sigurt që do ta fshish këtë artikull?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: MUTED }}>
              Ky veprim nuk mund të zhbëhet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full border-0"
              style={{ backgroundColor: CARD, color: INK }}
            >
              Anulo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteListing}
              disabled={working}
              className="rounded-full"
              style={{ backgroundColor: DANGER, color: "#ffffff" }}
            >
              Fshij
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  );
}

function Divider() {
  return <div className="h-px" style={{ backgroundColor: DIVIDER }} />;
}

function ActionRow({
  icon,
  title,
  subtitle,
  chevron,
  titleColor = INK,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  chevron?: boolean;
  titleColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 py-4 text-left"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold" style={{ color: titleColor }}>
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug" style={{ color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {chevron && <ChevronRight className="h-5 w-5 shrink-0" style={{ color: MUTED }} />}
    </button>
  );
}
