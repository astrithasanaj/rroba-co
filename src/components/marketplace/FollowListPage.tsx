import { useEffect, useState } from "react";
import { ChevronLeft, ArrowLeft, Loader2, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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

const PAGE_SIZE = 20;

type Mode = "followers" | "following";
type Row = { id: string; name: string | null; avatar_url: string | null; city?: string | null };

export function FollowListPage({ userId, mode }: { userId: string; mode: Mode }) {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getCurrentUserId().then((id) => setMe(id));
  }, []);

  useEffect(() => {
    let active = true;
    setRows([]);
    setDone(false);
    setLoading(true);
    void loadPage(0, true, active);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mode]);

  const loadPage = async (offset: number, initial: boolean, active = true) => {
    const column = mode === "followers" ? "following_id" : "follower_id";
    const otherColumn = mode === "followers" ? "follower_id" : "following_id";
    const { data: rels } = await supabase
      .from("followers")
      .select(otherColumn)
      .eq(column, userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    const ids = Array.from(
      new Set(((rels ?? []) as any[]).map((r) => r[otherColumn]).filter(Boolean)),
    );
    if (ids.length === 0) {
      if (!active) return;
      setDone(true);
      if (initial) setRows([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    const { data: profs } = await supabase
      .from("public_profiles")
      .select("id,name,avatar_url,city")
      .in("id", ids);
    if (!active) return;
    // preserve order by ids
    const map = new Map<string, Row>();
    (profs ?? []).forEach((p: any) => map.set(p.id, p as Row));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean) as Row[];
    setRows((prev) => (initial ? ordered : [...prev, ...ordered]));

    const currentMe = (await getCurrentUserId());
    if (currentMe) {
      const { data: mine } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentMe)
        .in("following_id", ids);
      if (!active) return;
      setFollowingSet((prev) => {
        const next = new Set(prev);
        (mine ?? []).forEach((r: any) => next.add(r.following_id));
        return next;
      });
    }
    if (ids.length < PAGE_SIZE) setDone(true);
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
      if (error) {
        next.add(targetId);
        setFollowingSet(new Set(next));
      }
    } else {
      next.add(targetId);
      setFollowingSet(next);
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: me, following_id: targetId });
      if (error) {
        next.delete(targetId);
        setFollowingSet(new Set(next));
      }
    }
  };

  const title = mode === "followers" ? "Ndjekës" : "Duke ndjekur";
  const emptyText =
    mode === "followers" ? "Nuk ka ndjekës ende" : "Nuk ndjek askënd ende";

  return (
    <SwipeBackWrapper>
      <MobileShell hideNav>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: CREAM }}>
          {/* Header */}
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
            <h1
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 16,
                fontWeight: 600,
                color: INK,
                marginRight: 36,
              }}
            >
              {title}
            </h1>
          </div>


          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }} onScroll={onScroll}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", padding: 60 }}>
                <Loader2 className="animate-spin" size={22} color={MUTED} />
              </div>
            ) : rows.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  padding: "80px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    backgroundColor: "#f5e6e9",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Users size={28} color="#6e2438" strokeWidth={1.6} />

                </div>
                <p style={{ color: MUTED, fontSize: 14 }}>{emptyText}</p>
              </div>
            ) : (
              <ul>
                {rows.map((r) => {
                  const isMe = me === r.id;
                  const isFollowing = followingSet.has(r.id);
                  return (
                    <li
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        borderBottom: `1px solid ${DIVIDER}`,
                      }}
                    >
                      <button
                        onClick={() => navigate({ to: "/user/$id", params: { id: r.id } })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                          textAlign: "left",
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          WebkitTapHighlightColor: "transparent",
                        }}
                        className="active:opacity-70"
                      >
                        <img
                          src={
                            r.avatar_url ||
                            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(r.name || "U")}`
                          }
                          alt=""
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 999,
                            objectFit: "cover",
                            flexShrink: 0,
                            backgroundColor: CHIP_BG,
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: INK,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.name || "Përdorues"}
                          </p>
                          {r.city && (
                            <p
                              style={{
                                fontSize: 12,
                                color: MUTED,
                                marginTop: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.city}
                            </p>
                          )}
                        </div>
                      </button>
                      {!isMe && me && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(r.id);
                          }}
                          className="transition-all duration-150 active:opacity-80"
                          style={{
                            padding: "6px 16px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                            border: "none",
                            background: isFollowing ? "#f5e6e9" : "linear-gradient(120deg, #e8836a, #c65a7a)",
                            color: isFollowing ? "#6e2438" : "#ffffff",
                            WebkitTapHighlightColor: "transparent",
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

