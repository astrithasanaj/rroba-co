import { createFileRoute } from "@tanstack/react-router";

const TYPE_LABELS: Record<string, string> = {
  feed_top: "Krye i feed-it",
  category_top: "Krye i kategorisë",
  search_top: "Krye i kërkimit",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export const Route = createFileRoute("/api/public/notify-pending-promotion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify shared secret
        const token = request.headers.get("x-webhook-token");
        const expected = process.env.REPORT_WEBHOOK_TOKEN;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let promotionId: string | null = null;
        try {
          const body = (await request.json()) as { promotion_id?: string };
          promotionId = body?.promotion_id ?? null;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!promotionId) return new Response("Missing promotion_id", { status: 400 });

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        if (!RESEND_API_KEY || !ADMIN_EMAIL) {
          console.error("[notify-pending-promotion] missing RESEND_API_KEY or ADMIN_EMAIL");
          return Response.json({ ok: false, reason: "missing_config" });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: promo, error } = await supabaseAdmin
            .from("promotions")
            .select("*")
            .eq("id", promotionId)
            .maybeSingle();

          if (error || !promo) {
            console.error("[notify-pending-promotion] lookup failed", error);
            return Response.json({ ok: false, reason: "not_found" });
          }

          if ((promo as any).status !== "pending_payment") {
            return Response.json({ ok: true, skipped: true });
          }

          const p = promo as any;
          const [{ data: listing }, { data: seller }] = await Promise.all([
            supabaseAdmin
              .from("listings")
              .select("title, price, image_paths")
              .eq("id", p.listing_id)
              .maybeSingle(),
            supabaseAdmin
              .from("profiles")
              .select("display_name, username, city")
              .eq("id", p.seller_id)
              .maybeSingle(),
          ]);

          const l = (listing ?? {}) as any;
          const s = (seller ?? {}) as any;
          const typeLabel = TYPE_LABELS[p.type] ?? p.type;
          const reference = `PROMO-${String(p.listing_id ?? "").slice(0, 8).toUpperCase()}`;
          const appUrl = process.env.APP_URL ?? "https://rroba-style-discover.lovable.app";

          const html = `
<div style="font-family:Arial,sans-serif;background:#ffffff;color:#2d1521;max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:12px 0 20px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:28px;font-weight:600;color:#2d1521;">Rroba</div>
    <div style="font-size:12px;color:#a89f94;letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">Paneli i administratorit</div>
  </div>

  <div style="background:#fbf6f2;border-radius:16px;padding:24px;text-align:center;">
    <div style="font-size:32px;">💰</div>
    <div style="margin-top:8px;font-size:16px;font-weight:600;">Pagesë e re në pritje konfirmimi</div>
    <div style="margin-top:8px;font-size:28px;font-weight:700;color:#c65a7a;">€${Number(p.price_eur).toFixed(2)}</div>
  </div>

  <div style="background:#fbf6f2;border-radius:16px;padding:20px;margin-top:12px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;color:#a89f94;margin-bottom:12px;">Detajet e promovimit</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#a89f94;width:140px;">Lloji</td><td style="padding:6px 0;">${escapeHtml(typeLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Kohëzgjatja</td><td style="padding:6px 0;">${p.duration_days} ditë</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Çmimi</td><td style="padding:6px 0;">€${Number(p.price_eur).toFixed(2)}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Metoda pagese</td><td style="padding:6px 0;">${escapeHtml(p.payment_method ?? "E paspecifikuar")}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Referenca</td><td style="padding:6px 0;font-family:monospace;">${escapeHtml(p.payment_reference ?? reference)}</td></tr>
    </table>
  </div>

  <div style="background:#fbf6f2;border-radius:16px;padding:20px;margin-top:12px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;color:#a89f94;margin-bottom:12px;">Artikulli</div>
    <div style="font-size:15px;font-weight:600;">${escapeHtml(l.title ?? "—")}</div>
    <div style="font-size:14px;color:#a89f94;margin-top:4px;">€${l.price ?? "—"}</div>
  </div>

  <div style="background:#fbf6f2;border-radius:16px;padding:20px;margin-top:12px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;color:#a89f94;margin-bottom:12px;">Shitësi</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#a89f94;width:140px;">Emri</td><td style="padding:6px 0;">${escapeHtml(s.display_name ?? "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Username</td><td style="padding:6px 0;">@${escapeHtml(s.username ?? "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f94;">Qyteti</td><td style="padding:6px 0;">${escapeHtml(s.city ?? "—")}</td></tr>
    </table>
  </div>

  <div style="margin-top:20px;text-align:center;">
    <a href="${appUrl}/admin/promotions" style="display:inline-block;background:#2d1521;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;">Konfirmo pagesën →</a>
  </div>

  <div style="margin-top:24px;text-align:center;font-size:11px;color:#a89f94;">
    © ${new Date().getFullYear()} Rroba · Email automatik nga sistemi i promovimeve
  </div>
</div>`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Rroba promotions <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `💰 Pagesë e re në pritje — ${s.display_name ?? "shitës"} · €${Number(p.price_eur).toFixed(2)}`,
              html,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("[notify-pending-promotion] Resend error", res.status, text);
            return Response.json({ ok: false, reason: "resend_error", status: res.status });
          }
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[notify-pending-promotion] unexpected error", err);
          return Response.json({ ok: false, reason: "exception" });
        }
      },
    },
  },
});
