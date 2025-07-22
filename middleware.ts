import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 需要鉴权的路由 - 所有(user)路由组下的页面
    const protectedRoutes = ["/dashboard", "/interview"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    );

    // 未登录用户访问受保护路由，重定向到登录页
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 已登录用户访问认证页面，重定向到dashboard
    if (session && request.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    // 如果获取session失败，对于受保护路由重定向到登录页
    const protectedRoutes = ["/dashboard", "/interview"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    );

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/interview/:path*", "/auth/:path*"],
};
