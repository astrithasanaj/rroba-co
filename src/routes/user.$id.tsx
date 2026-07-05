import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Loader2, MapPin, Star } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/user/$id")({
  component: () => (<SwipeBackWrapper><UserProfile /></SwipeBackWrapper>),
});

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
};

function UserProfile() {
  const { id } = useParams({ from: "/user/$id" });
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [p, l] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("listings")
          .select("*")
          .eq("user_id", id)
          .in("status", ["active", "sold"])
          .order("sold", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);
      const hydrated = await hydrateListings((l.data ?? []) as ListingRow[]);
      if (!active) return;
      setProfile(p.data as Profile | null);
      setListings(hydrated);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  if (!profile) {
    return (
      <MobileShell>
        <div className="p-10 text-center text-sm text-muted-foreground">Përdoruesi nuk u gjet.</div>
      </MobileShell>
    );
  }

  const avatar =
    profile.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile.name || "U")}`;

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => window.history.back()}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl">@{(profile.name || "perdorues").toLowerCase()}</h1>
      </header>

      <section className="px-5">
        <div className="flex items-start gap-4">
          <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-border" />
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-1">
              <p className="font-display text-lg">{profile.name || "Përdorues"}</p>
              <BadgeCheck className="h-4 w-4 text-accent" fill="currentColor" />
            </div>
            {profile.city && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {profile.city}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
              <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">· {profile.rating_count} vlerësime</span>
            </div>
          </div>
        </div>
        {profile.bio && (
          <p className="mt-3 text-sm text-foreground/85">{profile.bio}</p>
        )}
      </section>

      <section className="mt-6 px-5">
        <h3 className="mb-3 font-display text-xl">Artikujt aktivë</h3>
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Asnjë artikull aktiv.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} aspect="1/1" />
            ))}
          </div>
        )}
      </section>
    </MobileShell>
  );
}
