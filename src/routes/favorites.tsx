import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: likes } = await supabase.from("listing_likes").select("listing_id").eq("user_id", u.user.id);
      const ids = (likes ?? []).map((l) => l.listing_id);
      if (ids.length === 0) {
        if (active) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.from("listings").select("*").in("id", ids);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (active) {
        setItems(hydrated);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl">Të ruajtura</h1>
      </header>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Ruaj artikujt që të pëlqejnë."
          description="Prek zemrën në çdo artikull për ta gjetur më vonë."
          action={
            <Link to="/">
              <PrimaryButton>Shfleto artikuj</PrimaryButton>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 py-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </MobileShell>
  );
}
