import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowLeft, Flag, Link2, Share, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CREAM = "#ffffff";
const INK = "#1a1a1a";
const DIVIDER = "#ddd8ce";
const CANCEL_BG = "#ffffff";
const DISABLED = "#ddd8ce";
const RED = "#e53935";
const CORAL = "#e8826a";

type Reason = {
  key: "scam" | "counterfeit" | "misleading" | "inappropriate" | "spam" | "prohibited" | "other";
  label: string;
};

const REASONS: Reason[] = [
  { key: "scam", label: "Mashtrim ose përmbajtje e dyshimtë" },
  { key: "counterfeit", label: "Artikull i falsifikuar" },
  { key: "misleading", label: "Çmim ose përshkrim mashtrues" },
  { key: "inappropriate", label: "Përmbajtje e papërshtatshme ose ofenduese" },
  { key: "spam", label: "Spam ose njoftim i përsëritur" },
  { key: "prohibited", label: "Artikull i ndaluar ose i paligjshëm" },
  { key: "other", label: "Shqetësim tjetër" },
];

export function MoreSheet({
  open,
  onOpenChange,
  productId,
  productUrl,
  productTitle,
  reporterId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  productUrl: string;
  productTitle: string;
  reporterId: string | null;
}) {
  const [view, setView] = useState<"more" | "report">("more");
  const [reason, setReason] = useState<Reason["key"] | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setView("more");
      setReason(null);
      setDetails("");
    }, 250);
  };

  const sendWithApp = async () => {
    if (!reporterId) {
      toast.error("Identifikohu për të vazhduar");
      return;
    }
    const text = `${productTitle} — ${productUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lidhja u kopjua! Ngjite në një bisedë.");
    } catch {}
    close();
  };

  const shareNative = async () => {
    try {
      if (navigator.share) await navigator.share({ url: productUrl, title: productTitle });
      else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Lidhja u kopjua!");
      }
    } catch {}
    close();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success("Lidhja u kopjua!");
    } catch {}
    close();
  };

  const submitReport = async () => {
    if (!reason) return;
    if (!reporterId) {
      toast.error("Identifikohu për të raportuar");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      product_id: productId,
      reporter_id: reporterId,
      reason,
      details: reason === "other" ? details.trim() || null : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Faleminderit! Raporti u dërgua te ekipi ynë.");
    close();
  };

  const submitEnabled = !!reason && !submitting;

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="p-0 border-0 rounded-t-2xl max-h-[88vh] overflow-hidden"
        style={{ backgroundColor: CREAM }}
      >
        {view === "more" ? (
          <div className="flex flex-col">
            <div className="relative flex items-center justify-center px-4 pt-5 pb-4">
              <h2 className="text-base font-bold" style={{ color: INK }}>
                Më shumë
              </h2>
              <button
                onClick={close}
                className="absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-sm font-medium"
                style={{ backgroundColor: CANCEL_BG, color: INK }}
              >
                Anulo
              </button>
            </div>
            <div style={{ height: 1, backgroundColor: DIVIDER }} />

            <Row
              onClick={sendWithApp}
              label="Dërgo me Rroba"
              icon={
                <span
                  className="grid h-7 w-7 place-items-center rounded-md"
                  style={{ backgroundColor: CORAL }}
                >
                  <Send size={15} color="#fff" strokeWidth={2} />
                </span>
              }
            />
            <Divider />
            <Row onClick={shareNative} label="Ndaj me..." icon={<Share size={20} color={INK} strokeWidth={1.5} />} />
            <Divider />
            <Row onClick={copyLink} label="Kopjo lidhjen" icon={<Link2 size={20} color={INK} strokeWidth={1.5} />} />
            <Divider />
            <Row
              onClick={() => setView("report")}
              label="Raporto"
              labelColor={RED}
              icon={<Flag size={20} color={RED} strokeWidth={1.5} />}
            />
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="relative flex items-center justify-center px-4 pt-5 pb-4">
              <button onClick={() => setView("more")} className="absolute left-4 top-4 p-1" aria-label="Mbrapa">
                <ArrowLeft size={22} color={INK} strokeWidth={1.6} />
              </button>
              <h2 className="text-base font-bold" style={{ color: INK }}>
                Raporto artikullin
              </h2>
            </div>
            <div style={{ height: 1, backgroundColor: DIVIDER }} />
            <p className="px-5 pt-4 pb-2 text-sm" style={{ color: "#a89f94" }}>
              Çfarë nuk shkon me këtë artikull?
            </p>

            <div className="max-h-[50vh] overflow-y-auto">
              {REASONS.map((r, i) => {
                const selected = reason === r.key;
                return (
                  <div key={r.key}>
                    {i > 0 && <Divider />}
                    <button
                      onClick={() => setReason(r.key)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="pr-3 text-[15px]" style={{ color: INK }}>
                        {r.label}
                      </span>
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
                        style={{
                          borderColor: selected ? INK : "#bcb3a4",
                          backgroundColor: selected ? INK : "transparent",
                        }}
                      >
                        {selected && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CREAM }} />}
                      </span>
                    </button>
                  </div>
                );
              })}
              {reason === "other" && (
                <div className="px-5 pt-2 pb-1">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Përshkruaj problemin..."
                    rows={4}
                    className="w-full resize-none rounded-xl border bg-transparent p-3 text-sm outline-none"
                    style={{ borderColor: DIVIDER, color: INK }}
                  />
                </div>
              )}
            </div>

            <div className="px-5 pt-3 pb-5">
              <button
                onClick={submitReport}
                disabled={!submitEnabled}
                className="w-full rounded-full py-3.5 text-sm font-semibold transition"
                style={{
                  backgroundColor: submitEnabled ? RED : DISABLED,
                  color: submitEnabled ? "#fff" : "#7a7164",
                }}
              >
                Dërgo raportin
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  onClick,
  label,
  icon,
  labelColor = INK,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  labelColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 px-5 py-4 text-left active:opacity-70"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center">{icon}</span>
      <span className="text-[15px] font-medium" style={{ color: labelColor }}>
        {label}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="ml-[60px]" style={{ height: 1, backgroundColor: DIVIDER }} />;
}
