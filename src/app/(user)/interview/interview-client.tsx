"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Mic,
  MicOff,
  Upload,
  FileText,
  ChevronRight,
  ChevronDown,
  Pause,
  RotateCcw,
  Settings,
  MessageCircle,
  Heart,
  Star,
  ArrowLeft,
  Home,
} from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  emoji?: string;
}

interface VoiceWave {
  id: number;
  height: number;
  delay: number;
}

interface InterviewClientProps {
  user: User;
}

export default function InterviewClient({ user }: InterviewClientProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "你好！我是小智，你的AI面试助手 😊 很高兴认识你！我们可以开始一场轻松的模拟面试，帮你提升面试技巧。准备好了吗？",
      timestamp: new Date(),
      emoji: "👋",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceWaves, setVoiceWaves] = useState<VoiceWave[]>([]);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const userName =
    user.user_metadata?.name || user.email?.split("@")[0] || "用户";

  // 生成语音波纹动画数据
  useEffect(() => {
    const waves = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      height: Math.random() * 40 + 10,
      delay: i * 0.1,
    }));
    setVoiceWaves(waves);
  }, []);

  // 智能滚动处理 - 只在有新消息时滚动，避免初始消息导致的不必要滚动
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // 模拟AI回复
    setTimeout(() => {
      setIsAISpeaking(true);
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content:
            "很好的问题！让我来为你详细分析一下。在面试中，这类问题通常是为了了解你的思维过程和解决问题的能力。你可以这样回答...",
          timestamp: new Date(),
          emoji: "🤔",
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsAISpeaking(false);
      }, 2000);
    }, 500);
  };
  // 简历上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      {/* 顶部导航栏 */}
      <header className="backdrop-blur-md bg-white/70 border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-purple-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              AI智能面试助手
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-4 h-4" />
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

      <div className="flex min-h-[calc(100vh-80px)] max-w-7xl mx-auto p-4 gap-4">
        {/* 左侧 - AI数字人 */}
        <div className="w-80 flex flex-col">
          <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-sky-200/50">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="bg-gradient-to-r from-sky-400 to-purple-400 text-white text-2xl">
                      智
                    </AvatarFallback>
                  </Avatar>
                  {isAISpeaking && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800">小智 AI面试官</h3>
                <p className="text-sm text-gray-600">专业 · 友善 · 耐心</p>
              </div>

              {/* 语音波纹动画 */}
              {isAISpeaking && (
                <div className="flex items-center justify-center space-x-1 mb-4">
                  {voiceWaves.map((wave) => (
                    <div
                      key={wave.id}
                      className="w-1 bg-gradient-to-t from-sky-400 to-purple-400 rounded-full animate-pulse"
                      style={{
                        height: `${wave.height}px`,
                        animationDelay: `${wave.delay}s`,
                        animationDuration: "1.5s",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 状态指示 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-2xl">
                  <span className="text-sm text-gray-600">面试模式</span>
                  <Badge
                    variant="secondary"
                    className="bg-sky-100 text-sky-700"
                  >
                    练习模式
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-2xl">
                  <span className="text-sm text-gray-600">已进行时间</span>
                  <span className="text-sm font-medium text-gray-800">
                    05:23
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-2xl">
                  <span className="text-sm text-gray-600">互动次数</span>
                  <span className="text-sm font-medium text-gray-800">
                    12次
                  </span>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-2xl border-sky-200 hover:bg-sky-50 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  重新开始
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-2xl border-purple-200 hover:bg-purple-50 bg-transparent"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  暂停
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中间 - 聊天界面 */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-800">
                  对话交流
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    👏
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    👍
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    ❓
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-3xl ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-sky-400 to-purple-400 text-white"
                            : "bg-white/80 text-gray-800 border border-white/50"
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.emoji && message.type === "ai" && (
                            <span className="text-lg">{message.emoji}</span>
                          )}
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        <p
                          className={`text-xs mt-2 ${message.type === "user" ? "text-white/70" : "text-gray-500"}`}
                        >
                          {message.timestamp.toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="p-6 border-t border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="输入你的问题或回答..."
                      className="pr-12 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    size="lg"
                    className="rounded-2xl"
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  支持语音输入 · 按住说话 · 松开发送
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 简历预览和AI点评 */}
        <div
          className={`transition-all duration-300 ${isRightPanelOpen ? "w-80" : "w-12"}`}
        >
          <div className="h-full flex flex-col">
            {/* 折叠按钮 */}
            <Button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              variant="ghost"
              size="sm"
              className="mb-2 rounded-2xl backdrop-blur-md bg-white/60"
            >
              {isRightPanelOpen ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {isRightPanelOpen && (
              <div className="flex-1 space-y-4">
                {/* 简历上传 */}
                <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-800 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      简历管理
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadedFile ? (
                      <div className="p-4 bg-white/50 rounded-2xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-purple-400 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 rounded-xl bg-transparent"
                        >
                          重新上传
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer block p-6 border-2 border-dashed border-sky-200 rounded-2xl hover:border-sky-300 transition-colors"
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-sky-400" />
                          <p className="text-sm text-gray-600">上传简历</p>
                          <p className="text-xs text-gray-500 mt-1">
                            支持 PDF、Word 格式
                          </p>
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI智能点评 */}
                <Card className="backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-800 flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        AI智能点评
                      </div>
                      <Button
                        onClick={() => setIsCommentExpanded(!isCommentExpanded)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full p-1 h-6 w-6"
                      >
                        {isCommentExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`space-y-3 transition-all duration-300 overflow-hidden ${
                        isCommentExpanded ? "max-h-none" : "max-h-32"
                      }`}
                    >
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm font-medium text-green-700">
                            表现优秀
                          </span>
                        </div>
                        <p className="text-xs text-green-600">
                          回答逻辑清晰，表达流畅自然，展现了良好的沟通能力。
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <span className="text-sm font-medium text-amber-700">
                            待改进
                          </span>
                        </div>
                        <p className="text-xs text-amber-600">
                          可以增加更多具体的项目经验描述，让回答更有说服力。
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                          <span className="text-sm font-medium text-sky-700">
                            建议
                          </span>
                        </div>
                        <p className="text-xs text-sky-600">
                          建议准备一些关于团队合作的具体案例，这是常见的面试问题。
                        </p>
                      </div>

                      {/* 额外的点评内容，用于演示收起功能 */}
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-sm font-medium text-purple-700">
                            技术深度
                          </span>
                        </div>
                        <p className="text-xs text-purple-600">
                          在技术问题回答中，可以更深入地讨论实现细节和技术选型的考虑因素。
                        </p>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl border border-rose-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                          <span className="text-sm font-medium text-rose-700">
                            沟通技巧
                          </span>
                        </div>
                        <p className="text-xs text-rose-600">
                          注意在回答问题时保持适当的眼神交流，语速适中，展现自信的态度。
                        </p>
                      </div>
                    </div>

                    {!isCommentExpanded && (
                      <div className="text-center mt-2">
                        <Button
                          onClick={() => setIsCommentExpanded(true)}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          查看更多点评...
                        </Button>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="text-center">
                      <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span>综合评分: 85分</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        继续加油，你很棒！
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
