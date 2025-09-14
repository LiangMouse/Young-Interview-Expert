"use client";

import type React from "react";
import { InterviewClientProps } from "@/lib/types";
import { useState, useRef, useEffect, memo } from "react";
import { useDebounce } from "use-debounce";
import { useMemoizedFn, useInterval } from "ahooks";
import { useLocalStorage } from "react-use";
import { motion, AnimatePresence } from "framer-motion";
import { throttle } from "lodash";
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
  Loader2,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";

interface VoiceWave {
  id: number;
  height: number;
  delay: number;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// 优化的消息组件，使用 memo 和 framer-motion 动画
const MessageItem = memo(
  ({ message, index }: { message: Message; index: number }) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`max-w-[70%] p-4 rounded-3xl ${
          message.role === "user"
            ? "bg-gradient-to-r from-sky-400 to-purple-400 text-white"
            : "bg-white/80 text-gray-800 border border-white/50"
        }`}
      >
        <div className="flex items-start space-x-2">
          {message.role === "assistant" && (
            <motion.span
              className="text-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🤖
            </motion.span>
          )}
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <p
          className={`text-xs mt-2 ${message.role === "user" ? "text-white/70" : "text-gray-500"}`}
        >
          {new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </motion.div>
    </motion.div>
  ),
);

MessageItem.displayName = "MessageItem";

export default function InterviewClient({ user }: InterviewClientProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  // 使用 react-use 的 useLocalStorage 持久化面板状态
  const [isRightPanelOpen, setIsRightPanelOpen] = useLocalStorage(
    "interview-right-panel-open",
    true,
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [voiceWaves, setVoiceWaves] = useState<VoiceWave[]>([]);
  // 持久化评论展开状态
  const [isCommentExpanded, setIsCommentExpanded] = useLocalStorage(
    "interview-comment-expanded",
    false,
  );
  const [interviewStartTime] = useState(new Date());
  const [interactionCount, setInteractionCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用 useChat hook
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
    onFinish: () => {
      setInteractionCount((prev) => prev + 1);
    },
    onError: (error) => {
      console.error("聊天错误:", error);
    },
  });

  // 使用 use-debounce 库优化滚动
  const [messagesLength] = useDebounce(messages.length, 100);

  // 使用 lodash throttle 和 ahooks useMemoizedFn 优化滚动函数
  const scrollToBottom = useMemoizedFn(
    throttle(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 200), // 200ms 节流
  );
  // TODO 待修复
  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const systemPrompt = `你是一位专业的AI面试官，名叫小智。你的任务是帮助求职者进行模拟面试练习。

请遵循以下原则：
1. 保持专业、友善、耐心的态度
2. 根据用户的岗位需求提出相关的面试问题
3. 对用户的回答给出建设性的反馈和建议
4. 逐步深入，从基础问题到深度问题
5. 适时给予鼓励和指导
6. 用中文进行交流

现在请向用户问好，并询问他们想要面试什么岗位。`;

      sendMessage(systemPrompt, "system");
    }
  }, [messages.length, sendMessage]);

  // 使用 ahooks 的 useInterval 优化时间更新
  useInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  // 不再需要手动清理定时器，use-debounce 会自动处理

  const userName =
    user.user_metadata?.name || user.email?.split("@")[0] || "用户";
  // 智能滚动处理 - 使用防抖的消息长度
  useEffect(() => {
    if (messagesLength > 0) {
      scrollToBottom();
    }
  }, [messagesLength, scrollToBottom]);

  // 计算面试进行时间
  const getElapsedTime = () => {
    const elapsed = Math.floor(
      (currentTime.getTime() - interviewStartTime.getTime()) / 1000,
    );
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage;
    setInputMessage("");

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  const handleRestart = () => {
    clearMessages();
    setInteractionCount(0);
    // 重新发送系统消息
    setTimeout(() => {
      const systemPrompt = `你是一位专业的AI面试官，名叫小智。我们重新开始一场模拟面试。

请遵循以下原则：
1. 保持专业、友善、耐心的态度
2. 根据用户的岗位需求提出相关的面试问题
3. 对用户的回答给出建设性的反馈和建议
4. 逐步深入，从基础问题到深度问题
5. 适时给予鼓励和指导
6. 用中文进行交流

现在请向用户问好，并询问他们想要面试什么岗位。`;

      sendMessage(systemPrompt, "system");
    }, 100);
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
                  {isLoading && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800">小智 AI面试官</h3>
                <p className="text-sm text-gray-600">专业 · 友善 · 耐心</p>
              </div>

              {/* 语音波纹动画 */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    key="voice-waves"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center space-x-1 mb-4"
                  >
                    {voiceWaves.map((wave) => (
                      <motion.div
                        key={wave.id}
                        className="w-1 bg-gradient-to-t from-sky-400 to-purple-400 rounded-full"
                        animate={{
                          height: [
                            wave.height * 0.5,
                            wave.height,
                            wave.height * 0.5,
                          ],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: wave.delay,
                          ease: "easeInOut",
                        }}
                        style={{ height: `${wave.height}px` }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

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
                    {getElapsedTime()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-2xl">
                  <span className="text-sm text-gray-600">互动次数</span>
                  <span className="text-sm font-medium text-gray-800">
                    {interactionCount}次
                  </span>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="flex space-x-2 mt-4">
                <motion.div
                  className="flex-1"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-2xl border-sky-200 hover:bg-sky-50 bg-transparent"
                    disabled={isLoading}
                  >
                    <motion.div
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={{
                        duration: 1,
                        repeat: isLoading ? Infinity : 0,
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                    </motion.div>
                    重新开始
                  </Button>
                </motion.div>
                <motion.div
                  className="flex-1"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-2xl border-purple-200 hover:bg-purple-50 bg-transparent"
                    disabled={isLoading}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    暂停
                  </Button>
                </motion.div>
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
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => (
                      <MessageItem
                        key={index}
                        message={message}
                        index={index}
                      />
                    ))}

                    {/* 加载状态 */}
                    {isLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[70%] p-4 rounded-3xl bg-white/80 text-gray-800 border border-white/50">
                          <div className="flex items-center space-x-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Loader2 className="w-4 h-4" />
                            </motion.div>
                            <span className="text-sm">AI正在思考中...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 错误状态 */}
                    {error && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex justify-center"
                      >
                        <div className="max-w-[70%] p-4 rounded-3xl bg-red-50 text-red-600 border border-red-200">
                          <p className="text-sm">发送失败: {error}</p>
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => handleSendMessage()}
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              重试
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="p-6 border-t border-white/20">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="flex-1 relative"
                    whileFocus={{ scale: 1.01 }}
                  >
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        isLoading ? "AI正在回复中..." : "输入你的问题或回答..."
                      }
                      className="pr-12 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm"
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSendMessage()
                      }
                      disabled={isLoading}
                    />
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Button
                        onClick={handleSendMessage}
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500"
                        disabled={isLoading || !inputMessage.trim()}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Send className="w-4 h-4" />
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    animate={
                      isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isRecording ? Infinity : 0,
                    }}
                  >
                    <Button
                      onClick={toggleRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="lg"
                      className="rounded-2xl"
                      disabled={isLoading}
                    >
                      <motion.div
                        animate={
                          isRecording
                            ? { rotate: [0, 10, -10, 0] }
                            : { rotate: 0 }
                        }
                        transition={{
                          duration: 0.5,
                          repeat: isRecording ? Infinity : 0,
                        }}
                      >
                        {isRecording ? (
                          <MicOff className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {isLoading
                    ? "AI正在思考，请稍候..."
                    : "支持语音输入 · 按住说话 · 松开发送"}
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
                    {/* <span>&emsp;</span>  */}
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
