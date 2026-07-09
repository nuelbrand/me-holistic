import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Verify admin via has_role RPC
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    // Use service-role admin client to call admin_stats (revoked from authenticated)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_stats", { _days: 30 });
    if (error) throw new Response(error.message, { status: 500 });
    return (Array.isArray(data) ? data[0] : data) as {
      total_users: number; dau: number; wau: number; mau: number;
      posts_last: number; moods_last: number; journals_last: number; xp_last: number;
      by_action: Record<string, number>;
      daily_active: { day: string; users: number }[];
    };
  });
