"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, LayoutDashboard, User, LogOut } from "lucide-react";
import { useUserStore } from "@/store/user";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const router = useRouter();
  const { userInfo, clearUserInfo } = useUserStore();
  const isLoggedIn = !!userInfo;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUserInfo();
    router.push("/");
    router.refresh();
  };

  const getInitials = (nickname?: string | null) => {
    if (nickname) {
      return nickname
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Interview Lab
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </div>

          {/* Action Buttons - 根据登录状态动态显示 */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* 已登录：显示 Dashboard 按钮和用户头像 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex gap-2"
                  onClick={() => router.push("/dashboard")}
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative size-9 rounded-full p-0"
                    >
                      <Avatar className="size-9 border-2 border-primary/20">
                        <AvatarImage
                          src={userInfo.avatar_url || undefined}
                          alt={userInfo.nickname || "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(userInfo.nickname)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="size-8">
                        <AvatarImage src={userInfo.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(userInfo.nickname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[160px]">
                          {userInfo.nickname || "User"}
                        </span>
                        {userInfo.job_intention && (
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {userInfo.job_intention}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="mr-2 size-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      <User className="mr-2 size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* 未登录：显示 Login 和 Get Started */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => router.push("/auth/sign-in")}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push("/auth/sign-up")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
