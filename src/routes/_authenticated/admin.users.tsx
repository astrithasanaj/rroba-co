import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ArrowLeft, Loader2, Search, ShieldOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { useServerFn } from "@tanstack/react-start";
import { blockUser, unblockUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("is_admin", { _uid: user.id });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: () => (
    <SwipeBackWrapper>
      <AdminUsers />
    </SwipeBackWrapper>
  ),
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";
const ERR = "#e53935";
const DIVIDER = "#e2e2de";

const BLOCK_REASONS = [
  "Mashtrim / Scam",
  "Ngacmim / Harassment",
  "Përmbajtje e papërshtatshme",
  "Aktivitet i dyshimtë",
  "Shkelje e kushteve",
  "Tjetër",
];

type Profile = {
  id: string;
  name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  phone: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  listings_count?: number;
  reports_count?: number;
};

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState(BLOCK_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [busy, setBusy] = useState(false);

  const blockFn = useServerFn(blockUser);
  const unblockFn = useServerFn(unblockUser);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, name, display_name, username, avatar_url, city, phone, is_blocked, blocked_reason, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    const ids = (data ?? []).map((u: any) => u.id);
    let counts: Record<string, { listings: number; reports: number }> = {};
    if (ids.length) {
      const { data: ls } = await supabase
        .from("listings")
        .select("user_id")
        .in("user_id", ids);
      const { data: rs } = await supabase
        .from("reports")
        .select("product_id, listings:listings!reports_product_id_fkey(user_id)");
      for (const l of ls ?? []) {
        const uid = (l as any).user_id;
        counts[uid] = counts[uid] ?? { listings: 0, reports: 0 };
        counts[uid].listings += 1;
      }
      for (const r of rs ?? []) {
        const uid = (r as any).listings?.user_id;
        if (!uid) continue;
        counts[uid] = counts[uid] ?? { listings: 0, reports: 0 };
        counts[uid].reports += 1;
      }
    }
    setUsers(
      (data as any[])?.map((u) => ({
        ...u,
        listings_count: counts[u.id]?.listings ?? 0,
        reports_count: counts[u.id]?.reports ?? 0,
      })) ?? [],
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(s) ||
      (u.username ?? "").toLowerCase().includes(s) ||
      (u.display_name ?? "").toLowerCase().includes(s) ||
      (u.phone ?? "").toLowerCase().includes(s)
    );
  });

  const submitBlock = async (userId: string) => {
    const finalReason = reason === "Tjetër" ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Zgjidh një arsye");
      return;
    }
    setBusy(true);
    try {
      await blockFn({ data: { userId, reason: finalReason } });
      toast.success("Përdoruesi u bllokua");
      setOpenId(null);
      setCustomReason("");
      setReason(BLOCK_REASONS[0]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gabim");
    } finally {
      setBusy(false);
    }
  };

  const submitUnblock = async (userId: string) => {
    setBusy(true);
    try {
      await unblockFn({ data: { userId } });
      toast.success("Përdoruesi u zhbllokua");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gabim");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell hideNav>
      <div
        className="min-h-screen px-5 py-6"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
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
          <h1 className="text-2xl font-bold">Përdoruesit</h1>
        </div>

        <div className="relative mb-4">
          <Search
            size={18}
            style={{ color: MUTED }}
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kërko sipas emrit, @username ose telefonit"
            className="w-full text-[14px] outline-none"
            style={{
              background: CARD,
              color: INK,
              height: 44,
              borderRadius: 12,
              padding: "0 12px 0 38px",
            }}
          />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm opacity-70">Nuk ka përdorues.</p>
        ) : (
          <ul className="space-y-3 pb-20">
            {filtered.map((u) => (
              <li
                key={u.id}
                className="p-3"
                style={{ background: CARD, borderRadius: 14 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 overflow-hidden"
                    style={{ width: 44, height: 44, borderRadius: 22, background: DIVIDER }}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-[14px] font-semibold">
                        {u.display_name || u.name || "—"}
                      </div>
                      {u.is_blocked && (
                        <span
                          className="text-[10px] font-bold uppercase"
                          style={{
                            color: ERR,
                            border: `1px solid ${ERR}`,
                            borderRadius: 6,
                            padding: "1px 6px",
                          }}
                        >
                          BLOKUAR
                        </span>
                      )}
                    </div>
                    <div className="text-[12px]" style={{ color: MUTED }}>
                      @{u.username || "—"} · {u.city || "—"}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: MUTED }}>
                      📦 {u.listings_count} artikuj · ⚠️ {u.reports_count} raporte
                    </div>
                    {u.phone && (
                      <div className="text-[12px]" style={{ color: MUTED }}>
                        📞 {u.phone}
                      </div>
                    )}
                    {u.is_blocked && u.blocked_reason && (
                      <div className="mt-1 text-[12px]" style={{ color: ERR }}>
                        Arsyeja: {u.blocked_reason}
                      </div>
                    )}
                  </div>
                  {u.is_blocked ? (
                    <button
                      onClick={() => submitUnblock(u.id)}
                      disabled={busy}
                      className="flex items-center gap-1 text-[12px] font-semibold disabled:opacity-50"
                      style={{
                        background: INK,
                        color: "#fff",
                        height: 34,
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      <ShieldOff size={14} /> Zhblloko
                    </button>
                  ) : (
                    <button
                      onClick={() => setOpenId(u.id === openId ? null : u.id)}
                      className="flex items-center gap-1 text-[12px] font-semibold"
                      style={{
                        background: ERR,
                        color: "#fff",
                        height: 34,
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      <ShieldAlert size={14} /> Blloko
                    </button>
                  )}
                </div>

                {openId === u.id && !u.is_blocked && (
                  <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: DIVIDER }}>
                    <label className="block text-[12px]" style={{ color: MUTED }}>
                      Arsyeja
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full text-[14px] outline-none"
                      style={{
                        background: CREAM,
                        color: INK,
                        height: 40,
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      {BLOCK_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {reason === "Tjetër" && (
                      <input
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Përshkruaj arsyen"
                        className="w-full text-[14px] outline-none"
                        style={{
                          background: CREAM,
                          color: INK,
                          height: 40,
                          borderRadius: 10,
                          padding: "0 12px",
                        }}
                      />
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setOpenId(null)}
                        className="flex-1 text-[13px] font-semibold"
                        style={{
                          background: CREAM,
                          color: INK,
                          height: 38,
                          borderRadius: 10,
                        }}
                      >
                        Anulo
                      </button>
                      <button
                        onClick={() => submitBlock(u.id)}
                        disabled={busy}
                        className="flex-1 text-[13px] font-semibold disabled:opacity-50"
                        style={{
                          background: ERR,
                          color: "#fff",
                          height: 38,
                          borderRadius: 10,
                        }}
                      >
                        {busy ? "..." : "Konfirmo bllokimin"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
