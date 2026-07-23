import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/favorites")({
  component: () => (
    <SwipeBackWrapper>
      <Favorites />
    </SwipeBackWrapper>
  ),
});

type LoadState = "loading" | "ready" | "error";

function Favorites() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<ListingView[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setState("loading");
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = { user: await getCurrentUser() };
        if (!u.user) {
          navigate({ to: "/auth" });
          return;
        }
        const { data: likes, error: likesErr } = await supabase
          .from("listing_likes")
          .select("listing_id")
          .eq("user_id", u.user.id);
        if (likesErr) throw likesErr;
        const ids = (likes ?? []).map((l) => l.listing_id);
        if (ids.length === 0) {
          if (active) {
            setItems([]);
            setState("ready");
          }
          return;
        }
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .in("id", ids)
          .eq("status", "active")
          .eq("sold", false);
        if (error) throw error;
        const hydrated = await hydrateListings((data ?? []) as ListingRow[], {
          thumbnail: true,
          mode: "cover",
        });
        if (active) {
          setItems(hydrated);
          setState("ready");
        }
      } catch {
        if (active) setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  const count = items.length;

  return (
    <MobileShell>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 backdrop-blur"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-surface) 92%, transparent)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <h1
          className="font-display text-3xl truncate"
          style={{ color: "var(--brand-ink)" }}
        >
          {t("favorites.title")}
        </h1>
        <span
          aria-live="polite"
          className="tabular-nums text-sm font-medium min-w-[2ch] text-right"
          style={{ color: "var(--brand-ink-secondary)" }}
        >
          {state === "ready" && count > 0 ? count : ""}
        </span>
      </header>

      {state === "loading" ? (
        <div
          role="status"
          aria-live="polite"
          className="grid grid-cols-2 gap-3 px-5 py-3"
        >
          <span className="sr-only">{t("favorites.loading_sr")}</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="animate-pulse rounded-2xl"
              style={{
                aspectRatio: "3 / 4",
                backgroundColor: "var(--brand-cream)",
              }}
            />
          ))}
        </div>
      ) : state === "error" ? (
        <div role="alert" className="px-5 py-10">
          <EmptyState
            icon={<Heart className="h-6 w-6" aria-hidden="true" />}
            title={t("favorites.error_title")}
            description={t("favorites.error_body")}
            action={
              <button
                type="button"
                onClick={retry}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]"
                style={{
                  backgroundColor: "var(--brand-ink)",
                  color: "var(--brand-surface)",
                }}
              >
                {t("common.retry")}
              </button>
            }
          />
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" aria-hidden="true" />}
          title={t("favorites.empty_title")}
          description={t("favorites.empty_body")}
          action={
            <Link to="/" className="focus-visible:outline-none">
              <PrimaryButton>{t("favorites.empty_cta")}</PrimaryButton>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 py-3">
          {items.map((l, i) => (
            <ListingCard key={l.id} listing={l} eager={i < 4} />
          ))}
        </div>
      )}
    </MobileShell>
  );
}
