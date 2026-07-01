import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
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

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Innloggingen feilet. Prøv igjen.";
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Feil e-post eller passord.";
  }
  if (lower.includes("email not confirmed")) {
    return "E-posten må bekreftes før du kan logge inn.";
  }
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("Të dërguam një email me lidhjen për rivendosjen e fjalëkalimit");
      setMode("signin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dërgimi dështoi";
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/profile" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setAuthError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        if (data.session && data.user) {
          // Auto-confirm enabled — go straight to onboarding
          await router.invalidate();
          navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success("Kontrollo emailin për të konfirmuar llogarinë");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session || !data.user) {
          throw new Error("Innloggingen ble ikke fullført. Prøv igjen.");
        }
        await router.invalidate();
        navigate({ to: "/profile", replace: true });
      }
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setAuthError(message);
      toast.error(message);
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

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError("");
              }}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
            {authError ? <p className="px-2 text-sm text-destructive">{authError}</p> : null}
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Duke dërguar..." : "Dërgo lidhjen"}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError("");
              }}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Fjalëkalim"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError("");
              }}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
            {authError ? <p className="px-2 text-sm text-destructive">{authError}</p> : null}
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Duke pritur..." : mode === "signin" ? "Hyr" : "Regjistrohu"}
            </PrimaryButton>
            {mode === "signin" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setAuthError("");
                }}
                className="w-full pt-1 text-center text-xs text-muted-foreground underline"
              >
                Keni harruar fjalëkalimin?
              </button>
            ) : null}
          </form>
        )}

        <button
          onClick={() => {
            setAuthError("");
            if (mode === "forgot") setMode("signin");
            else setMode(mode === "signin" ? "signup" : "signin");
          }}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline"
        >
          {mode === "forgot"
            ? "Kthehu tek hyrja"
            : mode === "signin"
              ? "Nuk ke llogari? Regjistrohu"
              : "Ke llogari? Hyr"}
        </button>
      </div>
    </MobileShell>
  );
}

