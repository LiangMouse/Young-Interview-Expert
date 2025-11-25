"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";

/**
 * Navbar 操作按钮组件（客户端组件）
 *
 * Next.js 最佳实践：
 * 1. 将需要客户端交互的部分抽成独立的客户端组件
 * 2. 保持主组件为 Server Component 以获得更好的性能
 * 3. 使用 useRouter 进行程序化导航
 *
 * 替代方案（简单路由跳转）：
 * 可以使用 Link + asChild，例如：
 * <Button asChild size="sm">
 *   <Link href="/auth/login">Login</Link>
 * </Button>
 */
export function NavbarActions() {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const [mounted, setMounted] = useState(false);

  // 确保在客户端渲染后再检查用户状态（避免 hydration 不匹配）
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleGetStarted = () => {
    // 如果已登录，跳转到 dashboard；否则跳转到注册页
    if (userInfo) {
      router.push("/dashboard");
    } else {
      router.push("/auth/register");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={handleLogin}
      >
        Login
      </Button>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleGetStarted}
      >
        {mounted && userInfo ? "Dashboard" : "Get Started"}
      </Button>
    </div>
  );
}
