import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "mark_listing_sold",
  title: "Mark listing as sold",
  description: "Mark one of the signed-in user's listings as sold.",
  inputSchema: {
    listing_id: z.string().uuid().describe("The listing UUID to mark sold."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ listing_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("listings")
      .update({ sold: true })
      .eq("id", listing_id)
      .eq("user_id", ctx.getUserId())
      .select("id,title,sold")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "Listing not found or not owned by you." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Marked "${data.title}" as sold.` }],
      structuredContent: { listing: data },
    };
  },
});
