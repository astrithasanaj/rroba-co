import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const CREAM = "#f6f1e7";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";

type Mode = "followers" | "following";
type Row = { id: string; name: string | null; avatar_url: string | null };

export function FollowListSheet({
  open,
  onOpenChange,
  userId,
  mode,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  mode: Mode;
  currentUserId: string | null;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !userId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      // fetch follow relations
      const column = mode === "followers" ? "following_id" : "follower_id";
      const otherColumn = mode === "followers" ? "follower_id" : "following_id";
      const { data: rels } = await supabase
        .from("followers")
        .select(`${otherColumn}`)
        .eq(column, userId);
      const ids = Array.from(
        new Set((rels ?? []).map((r: any) => r[otherColumn]).filter(Boolean)),
      );
      if (ids.length === 0) {
        if (active) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id,name,avatar_url")
        .in("id", ids);
      if (!active) return;
      setRows((profs ?? []) as Row[]);

      if (currentUserId) {
        const { data: mine } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", currentUserId)
          .in("following_id", ids);
        if (!active) return;
        setFollowingSet(new Set((mine ?? []).map((r: any) => r.following_id)));
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [open, userId, mode, currentUserId]);

  const toggleFollow = async (targetId: string) => {
    if (!currentUserId || currentUserId === targetId) return;
    const isFollowing = followingSet.has(targetId);
    const next = new Set(followingSet);
    if (isFollowing) {
      next.delete(targetId);
      setFollowingSet(next);
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetId);
    } else {
      next.add(targetId);
      setFollowingSet(next);
      await supabase
        .from("followers")
        .insert({ follower_id: currentUserId, following_id: targetId });
    }
  };

  const goToUser = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/user/$id", params: { id } });
  };

  const title = mode === "followers" ? "Ndjekës" : "Duke ndjekur";
  const emptyText =
    mode === "followers" ? "Nuk ka ndjekës ende" : "Nuk ndjek askënd ende";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="p-0 border-0"
        style={{ backgroundColor: CREAM, height: "85vh" }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: `1px solid ${DIVIDER}`,
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 600, color: INK }}>{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Mbyll"
              style={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 999,
              }}
            >
              <X size={20} color={INK} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
                <Loader2 className="animate-spin" size={22} color={MUTED} />
              </div>
            ) : rows.length === 0 ? (
              <p
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: MUTED,
                  fontSize: 14,
                }}
              >
                {emptyText}
              </p>
            ) : (
              <ul>
                {rows.map((r) => {
                  const isMe = currentUserId === r.id;
                  const isFollowing = followingSet.has(r.id);
                  return (
                    <li
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 18px",
                        borderBottom: `1px solid ${DIVIDER}`,
                      }}
                    >
                      <button
                        onClick={() => goToUser(r.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                          textAlign: "left",
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
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: INK,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name || "Përdorues"}
                        </span>
                      </button>
                      {!isMe && currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(r.id);
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                            border: isFollowing ? `1px solid #c8c3b9` : "none",
                            backgroundColor: isFollowing ? CREAM : INK,
                            color: isFollowing ? INK : "#fff",
                          }}
                        >
                          {isFollowing ? "Duke ndjekur" : "Ndiq"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
