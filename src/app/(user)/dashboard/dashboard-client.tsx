"use client";
import { useState } from "react";
import type { User } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Clock,
  MessageCircle,
  Settings,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const userName =
    user.user_metadata?.name || user.email?.split("@")[0] || "用户";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      {/* 顶部导航栏 */}
      <header className="backdrop-blur-md bg-white/70 border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              AI智能面试助手
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
              <AvatarImage
                src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/interview">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">开始面试</h3>
                <p className="text-sm text-gray-600">开始新的AI模拟面试</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/practice">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">练习模式</h3>
                <p className="text-sm text-gray-600">轻松练习面试技巧</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">面试记录</h3>
                <p className="text-sm text-gray-600">查看历史面试记录</p>
              </CardContent>
            </Card>
          </Link>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 学习进度 */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <Target className="w-5 h-5 mr-2" />
                  学习进度
                </CardTitle>
                <CardDescription>你的面试技能提升情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      基础面试技巧
                    </span>
                    <span className="text-sm text-gray-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      行为面试问题
                    </span>
                    <span className="text-sm text-gray-600">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      技术面试准备
                    </span>
                    <span className="text-sm text-gray-600">58%</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      沟通表达能力
                    </span>
                    <span className="text-sm text-gray-600">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 统计信息 */}
          <div className="space-y-6">
            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <Calendar className="w-5 h-5 mr-2" />
                  本周统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span className="text-sm text-gray-600">练习时长</span>
                  </div>
                  <span className="font-semibold text-gray-800">2小时15分</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">面试次数</span>
                  </div>
                  <span className="font-semibold text-gray-800">8次</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">平均得分</span>
                  </div>
                  <span className="font-semibold text-gray-800">82分</span>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <Award className="w-5 h-5 mr-2" />
                  成就徽章
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200">
                    <div className="text-2xl mb-1">🏆</div>
                    <p className="text-xs text-amber-700 font-medium">
                      面试达人
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="text-2xl mb-1">⭐</div>
                    <p className="text-xs text-green-700 font-medium">
                      连续练习
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl border border-blue-200">
                    <div className="text-2xl mb-1">🎯</div>
                    <p className="text-xs text-blue-700 font-medium">
                      精准回答
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                    <div className="text-2xl mb-1">💪</div>
                    <p className="text-xs text-purple-700 font-medium">
                      进步之星
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  date: "2024-01-15",
                  type: "技术面试",
                  score: 85,
                  duration: "25分钟",
                  status: "completed",
                },
                {
                  date: "2024-01-14",
                  type: "行为面试",
                  score: 78,
                  duration: "18分钟",
                  status: "completed",
                },
                {
                  date: "2024-01-13",
                  type: "基础面试",
                  score: 92,
                  duration: "22分钟",
                  status: "completed",
                },
              ].map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/30"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-purple-400 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {record.type}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {record.date} · {record.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={record.score >= 80 ? "default" : "secondary"}
                      className={
                        record.score >= 80
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }
                    >
                      {record.score}分
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sky-600 hover:text-sky-700"
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
