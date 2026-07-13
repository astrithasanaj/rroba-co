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
  name: "search_listings",
  title: "Search listings",
  description:
    "Search active Rroba listings by keyword, category, city, or price range. Returns active (unsold) items.",
  inputSchema: {
    query: z.string().optional().describe("Keyword matched against title/brand/description."),
    category: z.string().optional().describe("Category slug, e.g. 'mode'."),
    city: z.string().optional().describe("City name."),
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, city, min_price, max_price, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("listings")
      .select("id,title,price,brand,category,subcategory,city,created_at,user_id")
      .eq("status", "active")
      .eq("sold", false)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    if (city) q = q.ilike("city", city);
    if (typeof min_price === "number") q = q.gte("price", min_price);
    if (typeof max_price === "number") q = q.lte("price", max_price);
    if (query) {
      const like = `%${query}%`;
      q = q.or(`title.ilike.${like},brand.ilike.${like},description.ilike.${like}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { listings: data ?? [] },
    };
  },
});
