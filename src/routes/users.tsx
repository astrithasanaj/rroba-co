import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ArrowLeft, Loader2, Users } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";

const CREAM = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2d9c4";
const CORAL = "#c65a7a";
const CHIP_BG = "#efe7d6";
const CHIP_BORDER = "#d9cbb0";

const PAGE_SIZE = 30;

type Row = {
  id: string;
  name: string | null;
  display_name?: string | null;
  username?: string | null;
  avatar_url: string | null;
  city?: string | null;
};

export const Route = createFileRoute("/users")({
  component: UsersBrowsePage,
});

function UsersBrowsePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    void loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = async (offset: number, initial: boolean) => {
    const { data } = await supabase
      .from("public_profiles")
      .select("id,name,display_name,username,avatar_url,city")
      .order("rating_count", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    const list = (data ?? []) as Row[];
    setRows((prev) => (initial ? list : [...prev, ...list]));
    if (list.length < PAGE_SIZE) setDone(true);

    const currentMe = (await supabase.auth.getUser()).data.user?.id ?? null;
    if (currentMe && list.length > 0) {
      const ids = list.map((r) => r.id);
      const { data: mine } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentMe)
        .in("following_id", ids);
      setFollowingSet((prev) => {
        const next = new Set(prev);
        (mine ?? []).forEach((r: any) => next.add(r.following_id));
        return next;
      });
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore || done || loading) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      setLoadingMore(true);
      void loadPage(rows.length, false);
    }
  };

  const toggleFollow = async (targetId: string) => {
    if (!me || me === targetId) return;
    const isFollowing = followingSet.has(targetId);
    const next = new Set(followingSet);
    if (isFollowing) {
      next.delete(targetId);
      setFollowingSet(next);
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", targetId);
      if (error) setFollowingSet(new Set([...next, targetId]));
    } else {
      next.add(targetId);
      setFollowingSet(next);
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: me, following_id: targetId });
      if (error) {
        const revert = new Set(next);
        revert.delete(targetId);
        setFollowingSet(revert);
      }
    }
  };

  return (
    <SwipeBackWrapper>
      <MobileShell hideNav>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: CREAM }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 12px 10px",
              borderBottom: `1px solid ${DIVIDER}`,
              backgroundColor: CREAM,
            }}
          >
            <button
              type="button"
              onClick={() => window.history.back()}
              aria-label="Kthehu"
              className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
              style={{
                width: 36,
                height: 36,
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(226,226,222,0.8)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={22} color="#2d1521" strokeWidth={2} />
            </button>
            <h1 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 600, color: INK, marginRight: 36 }}>
              Të gjithë përdoruesit
            </h1>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }} onScroll={onScroll}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", padding: 60 }}>
                <Loader2 className="animate-spin" size={22} color={MUTED} />
              </div>
            ) : rows.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 24px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: CHIP_BG, display: "grid", placeItems: "center" }}>
                  <Users size={28} color={MUTED} strokeWidth={1.6} />
                </div>
                <p style={{ color: MUTED, fontSize: 14 }}>Asnjë përdorues</p>
              </div>
            ) : (
              <ul>
                {rows.map((r) => {
                  const isMe = me === r.id;
                  const isFollowing = followingSet.has(r.id);
                  const label = r.display_name || r.name || r.username || "Përdorues";
                  return (
                    <li
                      key={r.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${DIVIDER}` }}
                    >
                      <button
                        onClick={() => navigate({ to: "/user/$id", params: { id: r.id } })}
                        style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textAlign: "left", background: "transparent", border: 0, padding: 0 }}
                        className="active:opacity-70"
                      >
                        <img
                          src={r.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(label)}`}
                          alt=""
                          style={{ width: 48, height: 48, borderRadius: 999, objectFit: "cover", flexShrink: 0, backgroundColor: CHIP_BG }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {label}
                          </p>
                          {r.city && (
                            <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{r.city}</p>
                          )}
                        </div>
                      </button>
                      {!isMe && me && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(r.id);
                          }}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                            border: isFollowing ? "none" : "none",
                            backgroundColor: isFollowing ? "#f5e6e9" : CORAL,
                            color: isFollowing ? "#6e2438" : "#ffffff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isFollowing ? "Duke ndjekur" : "Ndiq"}
                        </button>
                      )}
                    </li>
                  );
                })}
                {loadingMore && (
                  <div style={{ display: "grid", placeItems: "center", padding: 20 }}>
                    <Loader2 className="animate-spin" size={18} color={MUTED} />
                  </div>
                )}
              </ul>
            )}
          </div>
        </div>
      </MobileShell>
    </SwipeBackWrapper>
  );
}
