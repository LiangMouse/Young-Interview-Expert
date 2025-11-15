"use client";

import { InterviewClientProps } from "@/lib/types/interview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, RotateCcw, LogOut } from "lucide-react";
import { HeaderAvatar } from "@/components/header-avatar";
import { useRouter } from "next/navigation";
import { getInterviewWithMessages } from "@/action/interview";
import { useEffect, useState } from "react";

export default function VoiceClient({
  user,
  userProfile,
  interview,
}: InterviewClientProps) {
  const router = useRouter();
  const userName = userProfile?.nickname || user?.email || "用户";
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [aiAvatarError, setAiAvatarError] = useState(false);

  // 获取当前问题（最后一条AI消息）
  useEffect(() => {
    const loadCurrentQuestion = async () => {
      try {
        const result = await getInterviewWithMessages(interview.id);
        if (result.success && result.interview) {
          const { ai_messages } = result.interview;
          if (ai_messages && ai_messages.length > 0) {
            // 获取最后一条AI消息作为当前问题
            const lastAiMessage = ai_messages[ai_messages.length - 1];
            setCurrentQuestion(lastAiMessage.content || "");
          }
        }
      } catch (error) {
        console.error("Failed to load current question:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentQuestion();
  }, [interview.id]);

  // 高亮关键词（简单实现，高亮加粗的文本）
  const highlightKeywords = (text: string) => {
    // 匹配 **text** 格式的加粗文本
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const keyword = part.slice(2, -2);
        return (
          <span
            key={index}
            className="bg-muted px-1.5 py-0.5 rounded font-semibold"
          >
            {keyword}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleRepeat = () => {
    // TODO: 实现重复问题的逻辑
    console.log("Repeat question");
  };

  const handleLeaveInterview = () => {
    // TODO: 实现离开面试的逻辑
    router.push("/dashboard");
  };

  // 获取面试类型显示文本
  const interviewType = interview?.type || "技术面试";
  const interviewCategory = "Technical Interview"; // 可以根据interview数据调整

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* 深色网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 顶部区域 */}
        <header className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
                小面
              </h1>
            </div>
            <HeaderAvatar
              avatarUrl={user?.user_metadata?.avatar_url}
              userName={userName}
            />
          </div>
        </header>

        {/* 面试信息栏 */}
        <div className="px-6 py-3 border-b border-border/40 bg-card/50">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-full border border-purple-500/30">
              <span className="text-sm font-medium text-foreground">
                {interviewType}
              </span>
            </div>
            <Badge variant="outline" className="bg-secondary/50">
              {interviewCategory}
            </Badge>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧面板 - AI Interviewer */}
            <div className="relative rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-purple-700/20 border border-purple-500/30 p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative">
                {/* AI头像 */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-1 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                    {!aiAvatarError ? (
                      <img
                        src="/ai-avatar.png"
                        alt="AI Interviewer"
                        className="w-full h-full object-cover"
                        onError={() => setAiAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageCircle className="w-16 h-16 text-purple-400" />
                      </div>
                    )}
                  </div>
                </div>
                {/* 状态徽章 */}
                <div className="absolute -bottom-2 -right-2 flex flex-col gap-1">
                  <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                </div>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-foreground">
                AI Interviewer
              </h2>
            </div>

            {/* 右侧面板 - 用户 */}
            <div className="relative rounded-2xl bg-card border border-border/50 p-8 flex flex-col items-center justify-center min-h-[400px]">
              <Avatar className="w-32 h-32">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={userName}
                />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-sky-400 to-purple-400 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-6 text-xl font-semibold text-foreground">
                {userName} (You)
              </h2>
            </div>
          </div>
        </div>

        {/* 问题显示区域 */}
        {currentQuestion && (
          <div className="px-6 py-4 border-t border-border/40 bg-card/50">
            <div className="max-w-7xl mx-auto">
              <div className="rounded-xl bg-card border border-border/50 p-4">
                <p className="text-base text-foreground leading-relaxed">
                  {isLoading ? (
                    <span className="text-muted-foreground">加载中...</span>
                  ) : (
                    highlightKeywords(currentQuestion)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="px-6 py-4 border-t border-border/40 bg-card/30">
          <div className="flex items-center justify-center gap-4 max-w-7xl mx-auto">
            <Button
              variant="outline"
              onClick={handleRepeat}
              className="rounded-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重复问题
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveInterview}
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              离开面试
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
