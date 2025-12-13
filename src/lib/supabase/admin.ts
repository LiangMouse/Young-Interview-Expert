import { createClient } from "@supabase/supabase-js";

// 注意：此客户端用于服务器环境（Next.js API Routes 或 独立 Agent），
// 不应在客户端组件中使用，因为它可能使用 Service Role Key。

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 优先尝试 Service Role Key 以获得完整权限（绕过 RLS），
// 否则使用 Anon Key（受 RLS 限制）。
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
