import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 根路由：
 *  - 有登录会话 ➜ 跳转 /dashboard
 *  - 无会话     ➜ 跳转 /auth/login
 *
 * 该文件为 Server Component，不再含 "use client"。
 */
export default async function Home() {
  let session = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    session = user && !error ? { user } : null;
  } catch {
    /* ignore – 多数为未配置 env */
  }

  redirect(session ? "/dashboard" : "/auth/login");
}
