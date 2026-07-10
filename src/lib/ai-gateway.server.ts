import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_BASE_URL = "https://ai.gateway.lovable.dev/v1";

export function createLovableAiGatewayProvider(apiKey: string, baseURL?: string) {
  const url = baseURL?.trim() || LOVABLE_BASE_URL;
  const isLovable = url === LOVABLE_BASE_URL;
  return createOpenAICompatible({
    name: "lovable",
    baseURL: url,
    headers: isLovable
      ? { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }
      : { Authorization: `Bearer ${apiKey}` },
  });
}

export type AiConfig = {
  provider: string;
  model: string;
  apiKey: string;
  baseURL?: string;
};

/**
 * Resolve the AI config: prefer admin-configured app_settings, fall back to
 * LOVABLE_API_KEY + default model. Requires a Supabase admin client so we
 * bypass RLS to read the settings even from unauthenticated server routes.
 */
export async function getAiConfig(): Promise<AiConfig> {
  const fallbackKey = process.env.LOVABLE_API_KEY || "";
  let provider = "lovable";
  let model = "google/gemini-3-flash-preview";
  let apiKey = fallbackKey;
  let baseURL: string | undefined;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("ai_provider, ai_model, ai_api_key, ai_base_url")
      .eq("singleton", true)
      .maybeSingle();
    if (data) {
      provider = data.ai_provider || provider;
      model = data.ai_model || model;
      if (data.ai_api_key && data.ai_api_key.trim()) apiKey = data.ai_api_key.trim();
      if (data.ai_base_url && data.ai_base_url.trim()) baseURL = data.ai_base_url.trim();
    }
  } catch {
    // Fall through to defaults
  }

  if (!apiKey) throw new Error("No AI API key configured. Set one in Admin → AI Settings.");
  return { provider, model, apiKey, baseURL };
}
