import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiSuggestion = {
  title: string;
  brand: string;
  size: string;
  color: string;
  condition: string;
};

const CONDITIONS = ["I ri me etiketë", "Shkëlqyeshëm", "Shumë mirë", "Mirë"];

export const suggestListingFromPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { images?: unknown };
    if (!d || !Array.isArray(d.images) || d.images.length === 0) {
      throw new Error("Asnjë foto për analizë");
    }
    const images = d.images.filter((x): x is string => typeof x === "string").slice(0, 6);
    if (images.length === 0) throw new Error("Foto të pavlefshme");
    return { images };
  })
  .handler(async ({ data }): Promise<AiSuggestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI nuk është konfiguruar");

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text:
          "Analizo këto foto të një artikulli të rrobave/këpucëve/aksesoreve që do të shitet online. " +
          "Përgjigju VETËM me JSON të vlefshëm pa shpjegime, në formatin: " +
          `{"title": string (shqip, max 60 karaktere, p.sh. 'Xhaketë Zara Oversized'), "brand": string, "size": string, "color": string (shqip), "condition": një nga [${CONDITIONS.map((c) => `'${c}'`).join(", ")}]}. ` +
          "Nëse nuk je i sigurt për një fushë, vendos string bosh ''. Mos shto fjalë të tjera.",
      },
      ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI dështoi: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI nuk ktheu JSON");
    const parsed = JSON.parse(match[0]) as Partial<AiSuggestion>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      brand: typeof parsed.brand === "string" ? parsed.brand : "",
      size: typeof parsed.size === "string" ? parsed.size : "",
      color: typeof parsed.color === "string" ? parsed.color : "",
      condition:
        typeof parsed.condition === "string" && CONDITIONS.includes(parsed.condition)
          ? parsed.condition
          : "",
    };
  });
