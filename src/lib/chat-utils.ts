// 聊天相关的工具函数
import type { UIMessage } from "@ai-sdk/react";
import type { CoreMessage } from "ai";
import { sanitizeMessageContent } from "@/lib/security/prompt-injection";

// 聊天消息接口 - 与 src/types/interview.ts 中的 Message 保持一致
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
}

// 导入公共类型
import type { MessageRole } from "@/types/message";

/**
 * 将 UIMessage 格式转换为 Core Messages 格式（用于 @ai-sdk/deepseek）
 */
export function convertToCoreMessages(uiMessages: UIMessage[]): CoreMessage[] {
  return uiMessages
    .map((message) => {
      // 如果是 UIMessage 格式（有 parts 属性）
      if (message.parts && Array.isArray(message.parts)) {
        // 提取文本内容
        const textContent = message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("");

        // 清理用户消息内容（防止注入）
        const cleanedContent =
          message.role === "user"
            ? sanitizeMessageContent(textContent)
            : textContent;

        return {
          role: message.role,
          content: cleanedContent,
        };
      }
      // 如果已经是传统格式（有 content 属性）
      const rawContent = (message as any).content || "";
      const cleanedContent =
        message.role === "user"
          ? sanitizeMessageContent(rawContent)
          : rawContent;

      return {
        role: message.role,
        content: cleanedContent,
      };
    })
    .filter((message) => message.content.trim() !== ""); // 过滤掉空消息
}

/**
 * 将 Core Messages 格式转换为 UIMessage 格式（用于前端显示）
 */
export function convertToUIMessages(coreMessages: CoreMessage[]): UIMessage[] {
  return coreMessages
    .filter((message) => message.role !== "tool") // 过滤掉 tool 类型的消息
    .map((message, index) => ({
      id: `msg-${Date.now()}-${index}`,
      role: message.role as "system" | "user" | "assistant",
      parts: [
        {
          type: "text" as const,
          text:
            typeof message.content === "string"
              ? message.content
              : String(message.content),
        },
      ],
    }));
}

/**
 * 合并用户消息和AI消息为对话格式（用于前端显示）
 */
export function mergeMessagesToConversation(
  userMessages: ChatMessage[],
  aiMessages: ChatMessage[],
): Array<{
  role: MessageRole;
  content: string;
  id: string;
  timestamp: string;
}> {
  const conversation: Array<{
    role: MessageRole;
    content: string;
    id: string;
    timestamp: string;
  }> = [];

  // 添加用户消息
  userMessages.forEach((msg) => {
    conversation.push({
      role: "user",
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp,
    });
  });

  // 添加AI消息
  aiMessages.forEach((msg) => {
    conversation.push({
      role: "assistant",
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp,
    });
  });

  // 按时间戳排序
  return conversation.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
