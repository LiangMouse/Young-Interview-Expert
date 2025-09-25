"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Award,
  Clock,
  MessageCircle,
  Settings,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/store/user";
import { IncompleteProfileDialog } from "./components/incomplete-profile-dialog";
import { createInterview } from "@/action/create-interview";
import { logOut as logout } from "@/action/auth";
import RecentInterviews from "./components/recentInterviews";

export default function DashboardClient() {
  const { userInfo } = useUserStore();
  console.log(userInfo, "用户信息");
  const [loading, setLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 如果没有用户信息，等待一段时间让持久化状态恢复
    if (!userInfo) {
      const timer = setTimeout(() => {
        if (!useUserStore.getState().userInfo) {
          router.push("/auth/login");
        }
      }, 100); // 给持久化状态恢复一些时间

      return () => clearTimeout(timer);
    }
    // 明确返回 undefined 当 userInfo 存在时
    return undefined;
  }, [userInfo, router]);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
  };

  // 防抖处理函数
  const handleClickInterview = useCallback(async () => {
    // 如果正在loading，直接返回
    if (interviewLoading) {
      return;
    }

    if (!userInfo?.job_intention || !userInfo?.resume_url) {
      setDialogOpen(true);
      return;
    }

    try {
      setInterviewLoading(true);
      const result = await createInterview();

      if (result.interviewId) {
        router.push(`/interview/${result.interviewId}`);
      } else {
        // Handle error, maybe show a toast notification
        console.error(result.error);
        // 可以在这里添加错误提示
      }
    } catch (error) {
      console.error("创建面试失败:", error);
      // 可以在这里添加错误提示
    } finally {
      setInterviewLoading(false);
    }
  }, [userInfo, interviewLoading, router]);

  if (!userInfo) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>正在重定向到登录页面...</p>
      </div>
    );
  }

  const userName = userInfo.nickname || "用户";
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      <IncompleteProfileDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={() => router.push("/profile")}
      />
      {/* 顶部导航栏 */}
      <header className="backdrop-blur-md bg-white/70 border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              AI面试官 - 小面
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={userInfo.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            你好，{userName}！👋
          </h2>
          <p className="text-gray-600">
            欢迎回到AI面试助手，继续你的面试练习之旅
          </p>
        </div>
        {/* 快速操作卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <Card
            className={`backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl transition-all duration-300 group ${
              interviewLoading
                ? "cursor-not-allowed opacity-60"
                : "hover:shadow-2xl cursor-pointer"
            }`}
            onClick={handleClickInterview}
          >
            <CardContent className="p-6 text-center">
              <div
                className={`w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform ${
                  interviewLoading ? "animate-pulse" : "group-hover:scale-110"
                }`}
              >
                {interviewLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {interviewLoading ? "创建面试中..." : "开始面试"}
              </h3>
              <p className="text-sm text-gray-600">
                {interviewLoading
                  ? "请稍候，正在为您准备面试"
                  : "开始新的AI模拟面试"}
              </p>
            </CardContent>
          </Card>

          <Link href="/profile">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">个人资料</h3>
                <p className="text-sm text-gray-600">管理个人信息</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 最近面试记录 */}
        <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-gray-800">
                <Clock className="w-5 h-5 mr-2" />
                最近面试记录
              </CardTitle>
              <Link href="/history">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sky-600 hover:text-sky-700"
                >
                  来一次新的面试🥳
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentInterviews />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
