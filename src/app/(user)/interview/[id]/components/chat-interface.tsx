"use client";

import { forwardRef, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
// Temporarily avoid Radix ScrollArea to eliminate update-depth loops
import { Loader2, Mic, AudioLines, ArrowUp } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";
import { MessageItem } from "./message-item";

interface ChatInterfaceProps {
  messages: UIMessage[];
  isLoading: boolean;
  input: string;
  setInput: (input: string) => void;
  onSendMessage: (message?: string) => void;
  onReload: () => void;
  error: Error | null;
  isVoiceMode: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  isListening: boolean;
  onVoiceModeToggle: () => void;
  onToggleRecording: () => void;
  // 语音转文字相关
  isSTTRecording: boolean;
  sttTranscript: string;
  sttInterimTranscript: string;
  sttError: string | null;
  isSTTSupported: boolean;
  onToggleSTTRecording: () => void;
}

export const ChatInterface = forwardRef<HTMLDivElement, ChatInterfaceProps>(
  (
    {
      messages,
      isLoading,
      input,
      setInput,
      onSendMessage,
      onReload,
      error,
      isVoiceMode,
      isSpeaking,
      isRecording,
      isListening,
      onVoiceModeToggle,
      // 语音转文字相关
      isSTTRecording,
      sttTranscript,
      sttInterimTranscript,
      sttError,
      isSTTSupported,
      onToggleSTTRecording,
    },
    messagesEndRef,
  ) => {
    // 本地 loading 状态，防止多次点击
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    // 文本区域引用，用于自动调整高度
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 合并 loading 状态
    const isActuallyLoading = isLoading || isLocalLoading;

    // 自动调整文本区域高度
    const adjustTextareaHeight = useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, []);

    // 当输入内容变化时调整高度
    useEffect(() => {
      adjustTextareaHeight();
    }, [input, adjustTextareaHeight]);

    // 语音转文字：在开始录音时记录输入的基线值
    const sttBaseInputRef = useRef("");
    const wasSTTRecordingRef = useRef(false);
    const sttJustStartedRef = useRef(false);
    useEffect(() => {
      if (isSTTRecording && !wasSTTRecordingRef.current) {
        // 录音刚开始，记录当前输入作为基线
        sttBaseInputRef.current = input;
        // 本次会话刚开始，首个 effect 周期忽略旧的残留转录
        sttJustStartedRef.current = true;
      }
      wasSTTRecordingRef.current = isSTTRecording;
    }, [isSTTRecording, input]);

    useEffect(() => {
      if (!isSTTRecording) return;
      // 首帧：只恢复基线，避免使用上一次会话残留的转录
      if (sttJustStartedRef.current) {
        sttJustStartedRef.current = false;
        setInput(sttBaseInputRef.current);
        return;
      }
      const liveText = `${sttTranscript || ""}${sttInterimTranscript || ""}`;
      setInput(sttBaseInputRef.current + liveText);
    }, [isSTTRecording, sttTranscript, sttInterimTranscript, setInput]);

    // 防重复点击的发送函数
    const handleSendMessage = useCallback(
      async (message?: string) => {
        if (isActuallyLoading || isVoiceMode) {
          return;
        }

        const content = (message || input).trim();
        if (!content) {
          return;
        }

        setIsLocalLoading(true);

        try {
          await onSendMessage(message);
          // 发送成功后重置文本区域高度
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        } catch (error) {
          console.error("Message send failed:", error);
        } finally {
          // 延迟重置本地 loading 状态，确保 UI 更新
          setTimeout(() => {
            setIsLocalLoading(false);
          }, 100);
        }
      },
      [isActuallyLoading, isVoiceMode, input, onSendMessage],
    );
    return (
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 backdrop-blur-md bg-white/60 border-white/30 shadow-xl rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800">Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 px-6 overflow-auto">
              <div className="space-y-4 pb-4">
                <AnimatePresence initial={false}>
                  {messages
                    .filter(
                      (m: UIMessage) =>
                        m.role === "user" || m.role === "assistant",
                    )
                    .map((message: UIMessage, index: number) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        index={index}
                      />
                    ))}
                </AnimatePresence>

                {isActuallyLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[70%] p-4 rounded-3xl bg-white/80 text-gray-800 border border-white/50">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI正在思考中...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <div className="max-w-[70%] p-4 rounded-3xl bg-red-50 text-red-600 border border-red-200">
                      <p className="text-sm">
                        发送失败: {error.message?.slice(0, 200)}
                      </p>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={onReload}
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

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 输入框 */}
            <div className="p-6 border-t border-white/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isActuallyLoading && !isVoiceMode && input.trim()) {
                    handleSendMessage();
                  }
                }}
                className="flex items-center space-x-3"
              >
                <motion.div
                  className="flex-1 relative"
                  whileFocus={{ scale: 1.01 }}
                >
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== input) setInput(v);
                    }}
                    placeholder={
                      isActuallyLoading
                        ? "AI正在回复中..."
                        : "输入你的问题或回答... "
                    }
                    className="pr-12 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm resize-none min-h-[44px] max-h-[120px]"
                    disabled={isActuallyLoading || isVoiceMode}
                    rows={1}
                  />
                  {/* Right action buttons */}
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    {/* Mic button - always visible */}
                    <button
                      type="button"
                      aria-label="语音转文字"
                      className={`h-8 w-8 rounded-full flex items-center justify-center border cursor-pointer ${
                        isSTTRecording
                          ? "bg-white text-red-600 border-red-500"
                          : "bg-white/70 hover:bg-white text-gray-800 border-white/50"
                      }`}
                      disabled={isActuallyLoading || !isSTTSupported}
                      onClick={onToggleSTTRecording}
                    >
                      <Mic
                        className={`h-4 w-4 ${isSTTRecording ? "text-red-600" : ""}`}
                      />
                    </button>
                    {/* Second button: when input empty -> AudioLines; when has input -> submit ArrowUp */}
                    {input.trim().length === 0 ? (
                      <button
                        type="button"
                        aria-label="语音聊天"
                        className={`h-8 w-8 rounded-full flex items-center justify-center border cursor-pointer ${
                          isVoiceMode
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white/70 hover:bg-white text-gray-800 border-white/50"
                        }`}
                        disabled={isActuallyLoading}
                        onClick={onVoiceModeToggle}
                      >
                        <AudioLines className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        aria-label="发送"
                        className="h-8 w-8 rounded-full bg-black text-white hover:bg-gray-900 flex items-center cursor-pointer justify-center"
                        disabled={isActuallyLoading}
                      >
                        {isActuallyLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isActuallyLoading
                  ? "AI正在思考，请稍候..."
                  : isSTTRecording
                    ? "正在听取您的语音..."
                    : sttInterimTranscript
                      ? `实时转录: ${sttInterimTranscript}`
                      : isVoiceMode
                        ? isListening
                          ? "正在听取您的回答..."
                          : isSpeaking
                            ? "AI正在说话..."
                            : "点击麦克风开始回答"
                        : "支持文本和语音输入"}
              </p>
              {sttError && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  语音识别错误: {sttError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
