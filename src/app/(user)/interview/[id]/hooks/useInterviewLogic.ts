"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMemoizedFn, useInterval } from "ahooks";
import { usePersonalizedChat } from "@/hooks/usePersonalizedChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { UIMessage } from "@ai-sdk/react";
import {
  addUserMessage,
  addAiMessage,
  getInterviewWithMessages,
} from "@/action/interview";
import { mergeMessagesToConversation } from "@/lib/chat-utils";
import { useSocket } from "@/hooks/useSocket";
import { differenceInSeconds } from "date-fns";
import { UserProfile } from "@/types/profile";
import type { SimpleMessage } from "@/types/message";

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

  // 语音转文字状态
  const [isSTTRecording, setIsSTTRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);

  // 加载历史消息
  const [historyMessages, setHistoryMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    // 加载历史对话
    const loadHistory = async () => {
      try {
        const result = await getInterviewWithMessages(interview.id);
        console.log("result", result);
        if (result.success && result.interview) {
          const { user_messages, ai_messages } = result.interview;

          if (user_messages.length > 0 || ai_messages.length > 0) {
            // 合并消息为对话格式
            const conversation = mergeMessagesToConversation(
              user_messages,
              ai_messages,
            );
            console.log("conversation", conversation);
            // 转换为 UIMessage 格式，保留时间戳
            const uiMessages: UIMessage[] = conversation.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              parts: [
                {
                  type: "text",
                  text: msg.content,
                },
              ],
              timestamp: msg.timestamp, // 添加时间戳
            }));
            console.log("uiMessages", uiMessages);
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
      console.log("没有历史消息，返回空数组");
      // 返回空数组，让AI根据用户档案动态生成个性化开场白
      // 这样AI会基于用户背景、求职意向等信息生成更智能的开场
      return [];
    }
  }, [historyMessages]);

  // 语音转文字 hook
  const {
    isListening: isSTTListening,
    transcript: sttTranscriptResult,
    interimTranscript: sttInterimTranscript,
    startListening: startSTTListening,
    stopListening: stopSTTListening,
    resetTranscript: resetSTTTranscript,
    isSupported: isSTTSupported,
    error: sttErrorResult,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setSttTranscript(transcript);
    },
    onError: (error) => {
      setSttError(error);
      setIsSTTRecording(false);
    },
    continuous: false,
    interimResults: true,
    language: "zh-CN",
  });

  // 使用自定义的个性化聊天hook
  const interviewChat = usePersonalizedChat({
    id: `interview-${interview.id}`,
    messages: initialMessages,
    userId: user?.id,
    enablePersonalization: true,
    onFinish: async (options) => {
      setInteractionCount((prev) => prev + 1);

      // 获取消息
      const aiMessage = options.message;
      const allMessages = options.messages || [];
      const lastUserMessage = allMessages
        .filter((msg: any) => msg.role === "user")
        .pop();

      // 为消息添加时间戳
      const currentTime = new Date().toISOString();
      if (lastUserMessage && !lastUserMessage.timestamp) {
        lastUserMessage.timestamp = currentTime;
      }
      if (aiMessage && !aiMessage.timestamp) {
        aiMessage.timestamp = currentTime;
      }

      // 保存消息到数据库
      try {
        // 保存用户消息
        await saveUserMessage(lastUserMessage);

        // 保存AI消息
        await saveAiMessage(aiMessage);

        // 清除待保存消息状态
        if (pendingUserMessage) {
          setPendingUserMessage(null);
        }
      } catch (error) {
        console.error(`❌ [Hook] 保存消息到数据库失败:`, error);
        setPendingUserMessage(null);
      }
    },
    onError: (error) => {
      console.error("❌ Interview chat error:", error);
    },
  });

  // 解构出需要的属性和方法
  const { messages, sendMessage, regenerate, stop, status, error } =
    interviewChat;
  const isLoading = status === "streaming" || status === "submitted";

  // 自己管理 input 状态，因为 AI SDK 5.0+ 不直接提供
  const [input, setInput] = useState("");

  // 存储待保存的用户消息
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );

  // 提取消息内容
  const extractMessageContent = (message: any): string => {
    if (message.content) {
      return message.content;
    } else if (message.parts && message.parts.length > 0) {
      return message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("");
    }
    return "";
  };

  // 保存用户消息到数据库
  const saveUserMessage = async (lastUserMessage: any) => {
    if (!lastUserMessage) {
      console.log(" 未找到用户消息，跳过保存");
      return;
    }

    const userContent = extractMessageContent(lastUserMessage);
    if (userContent) {
      console.log("保存用户消息:", userContent);
      await addUserMessage(interview.id, userContent);
    } else {
      console.log("无法提取用户消息内容，跳过保存");
    }
  };

  // 保存AI消息到数据库
  const saveAiMessage = async (aiMessage: any) => {
    if (!aiMessage || aiMessage.role !== "assistant") {
      return;
    }

    const aiContent = extractMessageContent(aiMessage);
    if (aiContent) {
      await addAiMessage(interview.id, aiContent);
    }
  };

  // AI主动开场：当没有历史消息时，触发AI生成开场白
  useEffect(() => {
    if (
      !isLoadingHistory &&
      historyMessages.length === 0 &&
      messages.length === 0 &&
      user?.id &&
      userProfile
    ) {
      // 让AI主动开始面试，不需要用户输入任何内容
      // 设置待保存消息为INIT_INTERVIEW，但这个消息不会被保存到数据库
      setPendingUserMessage("INIT_INTERVIEW");

      // 发送一个特殊的初始化请求
      sendMessage(
        {
          role: "system",
          parts: [
            {
              type: "text",
              text: "INIT_INTERVIEW", // 特殊标识，让后端知道这是面试初始化
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
    setPendingUserMessage,
  ]);

  // 适配 @ai-sdk/react 的 append 方法
  const append = useCallback(
    (message: SimpleMessage) => {
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

  const { sendUserSpeech, stopTTS, isConnected } = useSocket({
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
  const addMessage = useMemoizedFn(async (message: SimpleMessage) => {
    // 保存消息到数据库
    try {
      if (message.role === "user") {
        await addUserMessage(interview.id, message.content);
      } else if (message.role === "assistant") {
        await addAiMessage(interview.id, message.content);
      }
    } catch (error) {
      console.error(`Failed to save ${message.role} message:`, error);
    }

    append(message);
  });

  // 语音转文字切换函数
  const toggleSTTRecording = useMemoizedFn(() => {
    if (isSTTRecording) {
      stopSTTListening();
      // 结束一次会话后，清空转录，避免下一次会话首帧出现旧内容
      resetSTTTranscript();
      setSttTranscript("");
      setSttError(null);
      setIsSTTRecording(false);
    } else {
      // 开始前清空旧数据
      resetSTTTranscript();
      setSttTranscript("");
      setSttError(null);
      startSTTListening();
      setIsSTTRecording(true);
    }
  });

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

    // 语音转文字状态
    isSTTRecording,
    sttTranscript,
    sttInterimTranscript,
    sttError,
    isSTTSupported,

    // Actions
    handleSendMessage,
    handleRestart,
    reload,
    toggleRecording,
    toggleSTTRecording,
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
