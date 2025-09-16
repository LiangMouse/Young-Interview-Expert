import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * 获取当前用户的session
 * 注意：此函数应该只在已经通过中间件鉴权的页面中使用
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * 获取完整的session信息
 */
export async function getCurrentSession() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}
