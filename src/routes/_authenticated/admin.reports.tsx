import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("is_admin", { _uid: user.id });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: () => (<SwipeBackWrapper><AdminReports /></SwipeBackWrapper>),
});

const REASON_LABELS: Record<string, string> = {
  scam: "Mashtrim ose përmbajtje e dyshimtë",
  counterfeit: "Artikull i falsifikuar",
  misleading: "Çmim ose përshkrim mashtrues",
  inappropriate: "Përmbajtje e papërshtatshme",
  spam: "Spam ose njoftim i përsëritur",
  prohibited: "Artikull i ndaluar",
  other: "Shqetësim tjetër",
};

type Report = {
  id: string;
  product_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "action_taken" | "dismissed";
  created_at: string;
  reporter?: { name: string | null } | null;
  product?: { title: string; status: string } | null;
};

function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(name), product:listings!reports_product_id_fkey(title,status)")
      .order("created_at", { ascending: false });
    setReports((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Report["status"]) => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Statusi u përditësua");
    load();
  };

  const removeListing = async (productId: string) => {
    const { error } = await supabase.from("listings").update({ status: "removed" }).eq("id", productId);
    if (error) return toast.error(error.message);
    toast.success("Artikulli u hoq");
    load();
  };

  return (
    <MobileShell hideNav>
      <div className="min-h-screen px-5 py-6" style={{ backgroundColor: "#ffffff", color: "#2d1521" }}>
        <h1 className="mb-4 text-2xl font-bold">Raportet</h1>
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : reports.length === 0 ? (
          <p className="text-sm opacity-70">Nuk ka raporte.</p>
        ) : (
          <ul className="space-y-3 pb-20">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border p-4" style={{ borderColor: "#e2e2de", backgroundColor: "#fff" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/product/$id" params={{ id: r.product_id }} className="font-semibold underline">
                      {r.product?.title ?? r.product_id}
                    </Link>
                    <p className="mt-1 text-sm">{REASON_LABELS[r.reason] ?? r.reason}</p>
                    {r.details && <p className="mt-1 text-xs opacity-80">"{r.details}"</p>}
                    <p className="mt-2 text-xs opacity-60">
                      Nga: {r.reporter?.name || r.reporter_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs opacity-60">Listing status: {r.product?.status ?? "—"}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "#ffffff" }}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value as Report["status"])}
                    className="rounded-full border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#e2e2de", backgroundColor: "#ffffff" }}
                  >
                    <option value="pending">pending</option>
                    <option value="reviewed">reviewed</option>
                    <option value="action_taken">action_taken</option>
                    <option value="dismissed">dismissed</option>
                  </select>
                  <button
                    onClick={() => removeListing(r.product_id)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: "#e53935" }}
                  >
                    Hiq artikullin
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
