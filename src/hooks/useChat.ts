import { useState, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { useMemoizedFn } from "ahooks";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UseChatOptions {
  onFinish?: (message: string) => void;
  onError?: (error: Error) => void;
  systemPrompt?: string;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, role?: "user" | "system") => Promise<void>;
  clearMessages: () => void;
}

// 聊天核心交互LLM Hook
export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAssistantMessageRef = useRef<string>("");

  // 使用 lodash 的防抖函数优化消息更新
  const updateMessage = useMemoizedFn((content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage?.role === "assistant") {
        lastMessage.content = content;
      } else {
        newMessages.push({ role: "assistant", content });
      }
      return newMessages;
    });
  });

  // 使用 lodash debounce 创建防抖更新函数
  const debouncedUpdateMessage = useRef(
    debounce((content: string) => {
      updateMessage(content);
    }, 50), // 50ms 防抖延迟
  ).current;

  // 立即更新消息函数（用于最终确认）
  const immediateUpdateMessage = useMemoizedFn((content: string) => {
    // 取消待执行的防抖函数
    debouncedUpdateMessage.cancel();
    updateMessage(content);
  });

  const sendMessage = useCallback(
    async (content: string, role: "user" | "system" = "user") => {
      // 如果是系统消息，直接发送给 API，不显示在界面上
      if (role === "system") {
        setIsLoading(true);
        setError(null);
        currentAssistantMessageRef.current = "";

        const systemMessage: Message = { role: "system", content };

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [systemMessage],
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let assistantMessage = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      assistantMessage += parsed.content;
                      currentAssistantMessageRef.current = assistantMessage;
                      debouncedUpdateMessage(assistantMessage);
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // 确保最终消息被正确设置
          immediateUpdateMessage(assistantMessage);
          options.onFinish?.(assistantMessage);
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Unknown error");
          setError(error.message);
          options.onError?.(error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 普通用户消息处理
      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      currentAssistantMessageRef.current = "";

      try {
        // 构建消息数组，如果有自定义系统提示词则使用，否则使用默认的
        const messagesToSend = options.systemPrompt
          ? [
              { role: "system" as const, content: options.systemPrompt },
              ...messages,
              userMessage,
            ]
          : [...messages, userMessage];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messagesToSend,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantMessage += parsed.content;
                    currentAssistantMessageRef.current = assistantMessage;
                    debouncedUpdateMessage(assistantMessage);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        // 确保最终消息被正确设置
        immediateUpdateMessage(assistantMessage);
        options.onFinish?.(assistantMessage);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error.message);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, options, debouncedUpdateMessage, immediateUpdateMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } as UseChatReturn;
}
