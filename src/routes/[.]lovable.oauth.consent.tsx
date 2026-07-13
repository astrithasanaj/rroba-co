import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Beta auth.oauth namespace — narrow local typing to avoid ambient any.
type OAuthDetails = {
  client?: { name?: string; client_uri?: string };
  redirect_uri?: string;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
type OAuthResult<T> = { data: T | null; error: { message: string } | null };
type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult<OAuthDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResult<OAuthDetails>>;
  denyAuthorization: (id: string) => Promise<OAuthResult<OAuthDetails>>;
};
function oauth(): OAuthAPI {
  return (supabase.auth as unknown as { oauth: OAuthAPI }).oauth;
}

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main style={{ background: CREAM, minHeight: "100dvh", padding: 24, color: INK }}>
      <p>Nuk mund të ngarkonim këtë kërkesë autorizimi: {String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauth();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Serveri i autorizimit nuk ktheu redirect.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "aplikacioni";

  return (
    <main
      style={{
        background: CREAM,
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: CARD,
          borderRadius: 20,
          padding: 24,
          maxWidth: 420,
          width: "100%",
          color: INK,
        }}
      >
        <h1
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 26,
            fontStyle: "italic",
            marginBottom: 8,
          }}
        >
          Lidh {clientName} me Rroba
        </h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>
          Kjo lejon {clientName} të përdorë mjetet e Rroba si ti — të shohë annonsat e tua,
          mesazhet dhe të veprojë me llogarinë tënde.
        </p>
        <p style={{ color: MUTED, fontSize: 12, marginBottom: 20 }}>
          Kjo nuk anashkalon lejet ose politikat e mbrapa të Rroba.
        </p>
        {error && (
          <p role="alert" style={{ color: "#e53935", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            style={{
              background: INK,
              color: "#fff",
              height: 52,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? "Duke pritur..." : "Aprovoj"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            style={{
              background: "transparent",
              color: CORAL,
              height: 48,
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 14,
              opacity: busy ? 0.5 : 1,
            }}
          >
            Anulo
          </button>
        </div>
      </div>
    </main>
  );
}
