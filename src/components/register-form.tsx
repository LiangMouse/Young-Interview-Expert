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
import { createClient } from "@/lib/supabase/client";
import { getOrCreateUserProfile } from "@/action/user-profile";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const supabase = createClient();
export function RegisterForm() {
  const { setUserInfo } = useUserStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 确认所有字段填写
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("请填写全部字段");
      return;
    }

    // 密码一致性校验
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    // 密码合法性基础校验
    if (password.length < 6) {
      setError("密码长度不能少于6位");
      return;
    }

    setLoading(true);

    try {
      // 注册 Supabase 账户
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.user) {
        // 自动创建用户 Profile 信息
        await getOrCreateUserProfile(data.user);
        toast.success("注册成功，请前往邮箱验证账户");
        router.push("/auth/login");
      }
    } catch (_err) {
      setError("注册时发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-8 min-h-[640px] flex flex-col justify-center">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-light text-[#141414] tracking-tight">
            Create Account
          </h1>
          <p className="text-base text-[#666666]">
            Sign up to start your interview practice journey
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

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="register-email"
                  className="text-xs uppercase tracking-wide text-[#666666] font-medium"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666666]" />
                  <Input
                    id="register-email"
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
                  htmlFor="register-password"
                  className="text-xs uppercase tracking-wide text-[#666666] font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666666]" />
                  <Input
                    id="register-password"
                    type="password"
                    className="pl-11 h-12 bg-gray-50 border-gray-200 text-[#141414] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 focus-visible:bg-white transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-confirm-password"
                  className="text-xs uppercase tracking-wide text-[#666666] font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666666]" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    className="pl-11 h-12 bg-gray-50 border-gray-200 text-[#141414] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600 focus-visible:bg-white transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#059669] hover:bg-[#059669]/90 text-white font-medium text-base transition-all shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              {/* <p className="text-xs text-center text-[#666666]">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-[#141414] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#141414] hover:underline"
                >
                  Privacy Policy
                </Link>
              </p> */}
            </form>

            <p className="text-xs text-center text-[#666666]">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-[#141414] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
