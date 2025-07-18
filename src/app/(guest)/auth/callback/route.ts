import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    /**- 向 Supabase 的认证服务器发送一个请求，请求中包含了从 URL 中获取的 code 。
           Supabase 服务器验证这个 code 的有效性。
           如果验证通过，服务器会生成一个用户会话（Session），并将其返回给我们的 Next.js 服务器。
           auth-helpers-nextjs 库会自动将这个会话信息（通常是一个 JWT）打包并设置为一个安全的、HttpOnly 的 Cookie，然后附加到当前的响应中。
        */
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 在登录状态重定向到根页面下的dashboard页面
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
