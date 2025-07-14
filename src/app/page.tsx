import { redirect } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * 根路由：
 *  - 有登录会话 ➜ 跳转 /dashboard
 *  - 无会话     ➜ 跳转 /auth/login
 *
 * 该文件为 Server Component，不再含 "use client"。
 */
export default async function Home() {
  const supabase = createClientComponentClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  redirect(session ? "/dashboard" : "/auth/login");
}
