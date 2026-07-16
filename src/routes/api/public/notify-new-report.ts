import { createFileRoute } from "@tanstack/react-router";

const REASON_LABELS: Record<string, string> = {
  scam: "Mashtrim ose përmbajtje e dyshimtë",
  counterfeit: "Artikull i falsifikuar",
  misleading: "Çmim ose përshkrim mashtrues",
  inappropriate: "Përmbajtje e papërshtatshme ose ofenduese",
  spam: "Spam ose njoftim i përsëritur",
  prohibited: "Artikull i ndaluar ose i paligjshëm",
  other: "Shqetësim tjetër",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export const Route = createFileRoute("/api/public/notify-new-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify shared secret
        const token = request.headers.get("x-webhook-token");
        const expected = process.env.REPORT_WEBHOOK_TOKEN;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let reportId: string | null = null;
        try {
          const body = (await request.json()) as { report_id?: string };
          reportId = body?.report_id ?? null;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!reportId) return new Response("Missing report_id", { status: 400 });

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        if (!RESEND_API_KEY || !ADMIN_EMAIL) {
          console.error("[notify-new-report] missing RESEND_API_KEY or ADMIN_EMAIL");
          // Always 200 — do not let email failures retry/block the report row.
          return Response.json({ ok: false, reason: "missing_config" });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: report, error } = await supabaseAdmin
            .from("reports")
            .select(
              "id, reason, details, created_at, product_id, reporter_id, " +
                "product:listings!reports_product_id_fkey(title), " +
                "reporter:profiles!reports_reporter_id_fkey(name)",
            )
            .eq("id", reportId)
            .maybeSingle();

          if (error || !report) {
            console.error("[notify-new-report] report lookup failed", error);
            return Response.json({ ok: false, reason: "report_not_found" });
          }

          const r = report as any;
          const reasonLabel = REASON_LABELS[r.reason] ?? r.reason;
          const productTitle = r.product?.title ?? "(unknown listing)";
          const reporterName = r.reporter?.name ?? r.reporter_id;

          const html = `
            <div style="font-family:Arial,sans-serif;color:#2d1521;max-width:560px;margin:0 auto;padding:24px;">
              <h2 style="margin:0 0 12px 0;">New report submitted</h2>
              <p style="margin:0 0 16px 0;color:#555;">A user reported a listing on Rroba.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:6px 0;color:#777;width:120px;">Listing</td><td style="padding:6px 0;">${escapeHtml(productTitle)}</td></tr>
                <tr><td style="padding:6px 0;color:#777;">Listing ID</td><td style="padding:6px 0;font-family:monospace;">${escapeHtml(r.product_id)}</td></tr>
                <tr><td style="padding:6px 0;color:#777;">Reason</td><td style="padding:6px 0;">${escapeHtml(reasonLabel)}</td></tr>
                <tr><td style="padding:6px 0;color:#777;">Reporter</td><td style="padding:6px 0;">${escapeHtml(String(reporterName))}</td></tr>
                <tr><td style="padding:6px 0;color:#777;">Submitted</td><td style="padding:6px 0;">${escapeHtml(new Date(r.created_at).toISOString())}</td></tr>
                ${r.details ? `<tr><td style="padding:6px 0;color:#777;vertical-align:top;">Details</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(r.details)}</td></tr>` : ""}
              </table>
              <p style="margin:20px 0 0 0;">
                <a href="https://rroba-style-discover.lovable.app/admin/reports"
                   style="display:inline-block;background:#c65a7a;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600;">
                  Review in admin
                </a>
              </p>
            </div>
          `;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Rroba reports <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `New report: ${productTitle} — ${reasonLabel}`,
              html,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("[notify-new-report] Resend error", res.status, text);
            return Response.json({ ok: false, reason: "resend_error", status: res.status });
          }
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[notify-new-report] unexpected error", err);
          return Response.json({ ok: false, reason: "exception" });
        }
      },
    },
  },
});
