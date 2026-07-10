import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SettingsSchema = z.object({
  ai_provider: z.string().min(1).max(40),
  ai_model: z.string().min(1).max(120),
  ai_api_key: z.string().max(500).optional().nullable(),
  ai_base_url: z.string().max(300).optional().nullable(),
});

function maskKey(k: string | null | undefined): string {
  if (!k) return "";
  if (k.length <= 8) return "••••";
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { data, error } = await supabase
      .from("app_settings")
      .select("ai_provider, ai_model, ai_api_key, ai_base_url, updated_at")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });

    return {
      ai_provider: data?.ai_provider ?? "lovable",
      ai_model: data?.ai_model ?? "google/gemini-3-flash-preview",
      ai_api_key_masked: maskKey(data?.ai_api_key),
      has_api_key: Boolean(data?.ai_api_key),
      ai_base_url: data?.ai_base_url ?? "",
      updated_at: data?.updated_at ?? null,
      lovable_key_present: Boolean(process.env.LOVABLE_API_KEY),
    };
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SettingsSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    // Only update ai_api_key if a non-empty value is provided; empty string means "leave as-is"
    const hasNewKey = typeof data.ai_api_key === "string" && data.ai_api_key.trim().length > 0;
    const update = {
      ai_provider: data.ai_provider,
      ai_model: data.ai_model,
      ai_base_url: data.ai_base_url?.trim() || null,
      updated_by: userId,
      ...(hasNewKey ? { ai_api_key: (data.ai_api_key as string).trim() } : {}),
    };

    const { error } = await supabase
      .from("app_settings")
      .update(update)
      .eq("singleton", true);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const clearAiApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });
    const { error } = await supabase
      .from("app_settings")
      .update({ ai_api_key: null, updated_by: userId })
      .eq("singleton", true);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });
