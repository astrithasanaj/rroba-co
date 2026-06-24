import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery token in the URL hash and creates a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Fjalëkalimi duhet të ketë të paktën 6 karaktere");
      return;
    }
    if (password !== confirm) {
      toast.error("Fjalëkalimet nuk përputhen");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fjalëkalimi u përditësua");
    navigate({ to: "/profile", replace: true });
  };

  return (
    <MobileShell hideNav>
      <div className="px-5 py-10">
        <h1 className="font-display text-3xl">Vendos fjalëkalim të ri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Shkruaj fjalëkalimin e ri për llogarinë tënde."
            : "Duke verifikuar lidhjen e rivendosjes..."}
        </p>

        {ready ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              required
              minLength={6}
              placeholder="Fjalëkalim i ri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Konfirmo fjalëkalimin"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Duke ruajtur..." : "Ruaj fjalëkalimin"}
            </PrimaryButton>
          </form>
        ) : null}
      </div>
    </MobileShell>
  );
}
