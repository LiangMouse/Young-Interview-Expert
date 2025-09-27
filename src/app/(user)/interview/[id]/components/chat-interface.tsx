"use client";

import { forwardRef, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
// Temporarily avoid Radix ScrollArea to eliminate update-depth loops
import { Send, Loader2 } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";
import { MessageItem } from "./message-item";
import { VoiceControls } from "./voice-controls";

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
  sttError: string | null;
  ttsError: string | null;
  interimTranscript: string;
  onVoiceModeToggle: () => void;
  onStopTTS: () => void;
  onToggleRecording: () => void;
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
      sttError,
      ttsError,
      interimTranscript,
      onVoiceModeToggle,
      onStopTTS,
      onToggleRecording,
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

            {/* Bottom Input Area */}
            <div className="p-6 border-t border-white/20">
              <div className="flex items-center space-x-3">
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
                        : "输入你的问题或回答... (Shift+Enter换行，Enter发送)"
                    }
                    className="pr-12 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm resize-none min-h-[44px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !isActuallyLoading
                      ) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isActuallyLoading || isVoiceMode}
                    rows={1}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    size="sm"
                    className="absolute right-2 top-2 rounded-xl bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500"
                    disabled={isActuallyLoading || !input.trim() || isVoiceMode}
                  >
                    {isActuallyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
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

                <VoiceControls
                  isVoiceMode={isVoiceMode}
                  isSpeaking={isSpeaking}
                  isRecording={isRecording}
                  isLoading={isActuallyLoading}
                  onVoiceModeToggle={onVoiceModeToggle}
                  onStopTTS={onStopTTS}
                  onToggleRecording={onToggleRecording}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isActuallyLoading
                  ? "AI正在思考，请稍候..."
                  : isVoiceMode
                    ? isListening
                      ? "正在听取您的回答..."
                      : isSpeaking
                        ? "AI正在说话..."
                        : "点击麦克风开始回答"
                    : "支持文本和语音输入"}
              </p>
              {isVoiceMode && (sttError || ttsError) && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  {sttError || ttsError}
                </p>
              )}
              {isVoiceMode && interimTranscript && (
                <p className="text-xs text-blue-500 mt-1 text-center">
                  实时转录: {interimTranscript}
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
