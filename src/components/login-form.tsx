"use client";

import type React from "react";
import { useState } from "react";
import { Mail, Lock, Github } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { loginWithGoogle, loginWithGithub } from "@/lib/auth-client";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateUserProfile } from "@/action/user-profile";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserInfo } = useUserStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        const userProfile = await getOrCreateUserProfile(data.user);
        if (userProfile) {
          setUserInfo(userProfile);
        }
        router.push("/dashboard");
        toast.success("登录成功~");
      }
    } catch {
      setError("登录时发生错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-8 min-h-[640px] flex flex-col justify-center">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-light text-[#141414] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-base text-[#666666]">
            Sign in to continue your interview practice
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 bg-white hover:bg-gray-50 text-[#141414] font-normal"
              onClick={loginWithGithub}
            >
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 bg-white hover:bg-gray-50 text-[#141414] font-normal"
              onClick={loginWithGoogle}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>

            <div className="relative py-2">
              <Separator className="bg-gray-200" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-[#666666]">
                Or continue with email
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-xs uppercase tracking-wide text-[#666666] font-medium"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666666]" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-11 h-12 bg-gray-50 border-gray-200 text-[#141414] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 focus-visible:bg-white transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-xs uppercase tracking-wide text-[#666666] font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666666]" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 bg-gray-50 border-gray-200 text-[#141414] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 focus-visible:bg-white transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#666666] hover:text-[#141414] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#059669] hover:bg-[#059669]/90 text-white font-medium text-base transition-all shadow-sm hover:shadow-md cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-xs text-center text-[#666666]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-[#141414] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
