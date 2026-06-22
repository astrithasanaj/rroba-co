import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { NewListingDialog } from "@/components/marketplace/NewListingDialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sell")({
  component: SellPage,
});

function SellPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.user.id);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-2xl">Selg en artikkel</h1>
      </header>

      <div className="space-y-6 px-5 pb-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!userId}
          className="grid w-full place-items-center gap-3 rounded-3xl border-2 border-dashed border-border bg-secondary/40 px-6 py-12 text-center transition hover:bg-secondary disabled:opacity-50"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-foreground text-background">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg">Legg til bilder</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trykk her for å velge 3–10 bilder fra enheten
            </p>
          </div>
        </button>

        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Slik selger du raskt
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Bruk klare bilder i dagslys</li>
            <li>Skriv ærlig om tilstand og mål</li>
            <li>Velg riktig kategori og merke</li>
            <li>Sett en konkurransedyktig pris</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!userId}
          className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-5 py-3.5 text-sm font-semibold text-background disabled:opacity-50"
        >
          Start ny annonse
        </button>
      </div>

      {userId && <NewListingDialog open={open} onOpenChange={setOpen} userId={userId} />}
    </MobileShell>
  );
}
