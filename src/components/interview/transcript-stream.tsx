"use client";

import { Bot, User, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { type TranscriptItem } from "@/hooks/useLiveKitRoom";

// 为了向后兼容，导出别名
export type { TranscriptItem as TranscriptItemData };

interface TranscriptStreamProps {
  /** 转写内容列表 */
  transcript: TranscriptItem[];
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
}

/** 格式化时间戳为 mm:ss */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function TranscriptStream({
  transcript,
  isConnected,
  isConnecting,
}: TranscriptStreamProps) {
  const t = useTranslations("interview");

  // 空状态：未连接或无转写内容
  if (!isConnected && !isConnecting) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-6">
        <MessageSquare className="h-12 w-12 text-[#CCCCCC] mb-4" />
        <p className="text-sm text-[#999999]">等待连接...</p>
      </div>
    );
  }

  if (transcript.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-6">
        <MessageSquare className="h-12 w-12 text-[#CCCCCC] mb-4" />
        <p className="text-sm text-[#999999]">
          {isConnecting ? "正在连接面试官..." : "面试即将开始，请稍候..."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {transcript.map((message) => (
        <div
          key={message.id}
          className={
            message.role === "agent" ? "flex gap-3" : "flex gap-3 opacity-80"
          }
        >
          <div className="flex-shrink-0">
            {message.role === "agent" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Bot className="h-4 w-4 text-[#141414]" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5]">
                <User className="h-4 w-4 text-[#666666]" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#141414]">
                {message.role === "agent" ? t("aiInterviewer") : t("you")}
              </span>
              <span className="text-xs text-[#999999]">
                {formatTimestamp(message.timestamp)}
              </span>
              {!message.isFinal && (
                <span className="text-xs text-[#10B981]">•</span>
              )}
            </div>
            <div
              className={
                message.role === "agent"
                  ? "rounded-lg bg-white p-3 shadow-sm text-sm text-[#141414] leading-relaxed"
                  : "text-sm text-[#666666] leading-relaxed"
              }
            >
              {message.text.includes("```") ? (
                <div>
                  {message.text.split("```").map((part, i) => {
                    if (i % 2 === 1) {
                      const [, ...code] = part.split("\n");
                      return (
                        <pre
                          key={i}
                          className="my-2 overflow-x-auto rounded bg-[#1E1E20] p-3 text-xs"
                        >
                          <code className="text-[#E5E5E5]">
                            {code.join("\n")}
                          </code>
                        </pre>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              ) : (
                message.text
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
