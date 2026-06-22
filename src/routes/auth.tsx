import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/profile" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/profile" },
        });
        if (error) throw error;
        toast.success("Kontrollo emailin për të konfirmuar llogarinë");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/profile" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Diçka shkoi keq");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/profile",
    });
    if (result.error) {
      toast.error(result.error.message || "Hyrja dështoi");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/profile" });
  };

  return (
    <MobileShell hideNav>
      <div className="px-5 py-10">
        <h1 className="font-display text-3xl">
          {mode === "signin" ? "Mirë se erdhe" : "Krijo llogari"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hyr për të ngarkuar dhe ndarë fotot e tua.
        </p>

        <div className="mt-6 space-y-2">
          <PrimaryButton variant="secondary" onClick={() => handleOAuth("google")}>
            Vazhdo me Google
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => handleOAuth("apple")}>
            Vazhdo me Apple
          </PrimaryButton>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ose <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Fjalëkalim"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Duke pritur..." : mode === "signin" ? "Hyr" : "Regjistrohu"}
          </PrimaryButton>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline"
        >
          {mode === "signin"
            ? "Nuk ke llogari? Regjistrohu"
            : "Ke llogari? Hyr"}
        </button>
      </div>
    </MobileShell>
  );
}
