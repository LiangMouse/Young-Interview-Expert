"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMemoizedFn, useInterval } from "ahooks";
import { usePersonalizedChat } from "@/hooks/usePersonalizedChat";
import type { UIMessage } from "@ai-sdk/react";
import {
  addUserMessage,
  addAiMessage,
  getInterviewWithMessages,
} from "@/action/interview";
import {
  mergeMessagesToConversation,
  type MessageInput,
} from "@/lib/chat-utils";
import { useSocket } from "@/hooks/useSocket";
import { differenceInSeconds } from "date-fns";
import { SYSTEM_PROMPT } from "@/lib/prompt/analytics";
import { UserProfile } from "@/types/profile";

interface UseInterviewLogicProps {
  user: any;
  userProfile: UserProfile | null;
  interview: any;
  isVoiceMode: boolean;
  setIsVoiceMode: (value: boolean) => void;
}

export function useInterviewLogic({
  user,
  userProfile,
  interview,
  isVoiceMode,
  setIsVoiceMode,
}: UseInterviewLogicProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceModeDialogOpen, setIsVoiceModeDialogOpen] = useState(false);
  const [interviewStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [interactionCount, setInteractionCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const userName = userProfile?.nickname || user?.email || "用户";

  // 加载历史消息
  const [historyMessages, setHistoryMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getInterviewWithMessages(interview.id);
        if (result.success && result.interview) {
          const { user_messages, ai_messages } = result.interview;

          if (user_messages.length > 0 || ai_messages.length > 0) {
            // 合并消息为对话格式
            const conversation = mergeMessagesToConversation(
              user_messages,
              ai_messages,
            );

            // 转换为 UIMessage 格式
            const uiMessages: UIMessage[] = conversation.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              parts: [
                {
                  type: "text",
                  text: msg.content,
                },
              ],
            }));
            setHistoryMessages(uiMessages);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [interview.id]);

  // Memoize initial messages to prevent recreation on every render
  const initialMessages: UIMessage[] = useMemo(() => {
    // 如果有历史消息，使用历史消息，否则让AI动态生成个性化开场
    if (historyMessages.length > 0) {
      return historyMessages;
    } else {
      // 返回空数组，让AI根据用户档案动态生成个性化开场白
      // 这样AI会基于用户背景、求职意向等信息生成更智能的开场
      return [];
    }
  }, [historyMessages]);

  // 使用自定义的个性化聊天hook
  const interviewChat = usePersonalizedChat({
    id: `interview-${interview.id}`,
    messages: initialMessages,
    userId: user?.id,
    enablePersonalization: true,
    onFinish: async (options) => {
      setInteractionCount((prev) => prev + 1);

      // 获取 AI 响应消息
      const aiMessage = options.message;

      // 同时保存用户消息和 AI 消息到数据库
      try {
        // 保存用户消息（使用存储的待保存消息）
        if (pendingUserMessage) {
          await addUserMessage(interview.id, pendingUserMessage);
          setPendingUserMessage(null); // 清除待保存消息
        }

        // 保存 AI 响应
        if (aiMessage && aiMessage.role === "assistant") {
          let aiContent = "";

          // 根据 AI SDK 5.0 官方文档，从 parts 中提取文本内容
          if (aiMessage.parts && aiMessage.parts.length > 0) {
            aiContent = aiMessage.parts
              .filter((part: any) => part.type === "text")
              .map((part: any) => part.text)
              .join("");
          }

          if (aiContent) {
            await addAiMessage(interview.id, aiContent);
          }
        }
      } catch (error) {
        console.error(`❌ [Hook] 保存消息到数据库失败:`, error);
        // 如果保存失败，清除待保存消息
        setPendingUserMessage(null);
      }
    },
    onError: (error) => {
      console.error("Interview chat error:", error);
    },
  });

  // 解构出需要的属性和方法
  const { messages, sendMessage, regenerate, stop, status, error } =
    interviewChat;
  const isLoading = status === "streaming" || status === "submitted";

  // 自动触发自我介绍开场（仅在首次进入且无历史消息时）
  useEffect(() => {
    if (
      !isLoadingHistory &&
      historyMessages.length === 0 &&
      messages.length === 0 &&
      user?.id &&
      userProfile
    ) {
      // 发送一个触发词让AI执行“仅请求自我介绍”的开场
      sendMessage(
        {
          role: "user",
          parts: [
            {
              type: "text",
              text: "你好，我想开始面试",
            },
          ],
        },
        {
          body: {
            userId: user.id,
            enablePersonalization: true,
          },
        },
      );
    }
  }, [
    isLoadingHistory,
    historyMessages.length,
    messages.length,
    user?.id,
    userProfile,
    sendMessage,
  ]);

  // 自己管理 input 状态，因为 AI SDK 5.0+ 不直接提供
  const [input, setInput] = useState("");

  // 存储待保存的用户消息
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );

  // 适配 @ai-sdk/react 的 append 方法
  const append = useCallback(
    (message: MessageInput) => {
      try {
        sendMessage({
          role: message.role,
          parts: [
            {
              type: "text",
              text: message.content,
            },
          ],
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [sendMessage],
  );

  const reload = useCallback(() => {
    regenerate();
  }, [regenerate]); // regenerate 相当于 reload

  // Socket connection for real-time voice (callbacks can use append)
  const onAiResponse = useCallback(
    (response: string) => {
      console.log("AI Response received:", response);

      if (isVoiceMode && response) {
        append({ role: "assistant", content: response });
      }
    },
    [isVoiceMode, append],
  );
  // TODO
  const onAiSpeech = useCallback((speech: string) => {
    console.log("AI Speech received:", speech);
  }, []);

  const onSocketError = useCallback((error: string) => {
    console.error("Socket error:", error);
  }, []);

  const {
    sendUserSpeech,
    startInterview,
    stopTTS,
    lastAiResponse,
    isConnected,
  } = useSocket({
    interviewId: interview.id,
    userId: user.id,
    onAiResponse,
    onAiSpeech,
    onError: onSocketError,
  });

  // 无需向上层回传函数，避免循环依赖

  // Update elapsed time every second
  useInterval(() => {
    const seconds = differenceInSeconds(new Date(), interviewStartTime);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const newTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    setElapsedTime((prev) => (prev !== newTime ? newTime : prev));
  }, 1000);

  const handleSendMessage = useMemoizedFn(async (message?: string) => {
    const content = (message || input).trim();

    if (!content) {
      return;
    }

    // 存储待保存的用户消息
    setPendingUserMessage(content);

    // 发送消息到 AI（不立即保存到数据库）
    append({ role: "user", content });
    setInput("");
  });

  const handleRestart = useMemoizedFn(() => {
    reload();
    setInteractionCount(0);
  });

  // 直接向聊天里添加一条消息（不触发输入框逻辑）
  const addMessage = useMemoizedFn(
    async (message: { role: "user" | "assistant"; content: string }) => {
      // 保存消息到数据库
      try {
        if (message.role === "user") {
          await addUserMessage(interview.id, message.content);
        } else if (message.role === "assistant") {
          await addAiMessage(interview.id, message.content);
        }
        console.log(`${message.role} message saved to database`);
      } catch (error) {
        console.error(`Failed to save ${message.role} message:`, error);
      }

      append(message);
    },
  );

  const toggleRecording = useMemoizedFn(() => {
    if (!isVoiceMode) {
      setIsVoiceModeDialogOpen(true);
      return;
    }

    if (isRecording) {
      // stopListening will be called by the voice features hook
      setIsRecording(false);
    } else {
      // startListening will be called by the voice features hook
      setIsRecording(true);
    }
  });

  const handleConfirmVoiceMode = useMemoizedFn(() => {
    setIsVoiceMode(true);
    setIsVoiceModeDialogOpen(false);
    // 语音模式确认后，自动开始语音识别
    setIsRecording(true);
  });

  const handleStopTTS = useMemoizedFn(() => {
    // stopSpeaking will be called by the voice features hook
    stopTTS();
  });

  // 统一的停止处理函数
  const handleStop = useMemoizedFn(() => {
    if (isVoiceMode) {
      // 语音模式下停止录音和语音播放
      if (isRecording) {
        setIsRecording(false);
      }
      // stopSpeaking will be called by the voice features hook
      handleStopTTS();
    } else {
      // 文本模式下停止流式响应
      stop();
    }
  });

  return {
    // State
    isRecording,
    isVoiceModeDialogOpen,
    elapsedTime,
    interactionCount,
    messages,
    isLoading,
    isLoadingHistory,
    input,
    setInput,
    error,
    isConnected,

    // Actions
    handleSendMessage,
    handleRestart,
    reload,
    toggleRecording,
    handleConfirmVoiceMode,
    handleStopTTS,
    handleStop,
    setIsVoiceModeDialogOpen,
    setIsRecording,

    // Socket functions
    sendUserSpeech,
    stopTTS,

    // Chat helpers
    addMessage,
  };
}

function createSystemPrompt(
  jobTitle?: string,
  userProfile?: UserProfile | null,
) {
  let prompt = SYSTEM_PROMPT;
  if (jobTitle) {
    prompt += `\n\n候选人正在申请 ${jobTitle} 岗位。`;
  }
  if (userProfile) {
    prompt += `\n\n这是候选人的简历信息: ${JSON.stringify(
      {
        job_intention: userProfile.job_intention,
        skills: userProfile.skills,
        experience_years: userProfile.experience_years,
        work_experiences: userProfile.work_experiences,
        project_experiences: userProfile.project_experiences,
      },
      null,
      2,
    )}`;
  }
  return prompt;
}
