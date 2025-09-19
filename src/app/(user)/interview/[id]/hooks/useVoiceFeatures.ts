"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMemoizedFn } from "ahooks";

interface UseVoiceFeaturesProps {
  isVoiceMode: boolean;
  onUserSpeech: (transcript: string) => void;
  onAppendMessage: (message: {
    role: "user" | "assistant";
    content: string;
  }) => void;
}

export function useVoiceFeatures({
  isVoiceMode,
  onUserSpeech,
  onAppendMessage,
}: UseVoiceFeaturesProps) {
  const [isSTTSupported, setIsSTTSupported] = useState(false);
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef("");

  // 动态加载语音功能
  useEffect(() => {
    const loadSpeechFeatures = async () => {
      try {
        // 检查浏览器支持
        if (typeof window !== "undefined") {
          const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
          setIsSTTSupported(!!SpeechRecognition);
          setIsTTSSupported("speechSynthesis" in window);
        }
      } catch (error) {
        console.error("加载语音功能失败:", error);
      }
    };

    loadSpeechFeatures();
  }, []);

  // 语音识别功能
  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !isSTTSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onstart = () => {
      setIsListening(true);
      setSttError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 累积最终转录结果
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;

        // 发送到服务端
        onUserSpeech(finalTranscriptRef.current);

        // 在语音模式下，将用户消息添加到聊天界面显示
        if (isVoiceMode) {
          onAppendMessage({
            role: "user",
            content: finalTranscriptRef.current,
          });
        }

        // 重置累积的转录结果
        finalTranscriptRef.current = "";
      }

      // 更新临时转录结果
      setInterimTranscript(interimTranscript);
    };

    recognition.onerror = (event) => {
      setSttError("语音识别错误");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSTTSupported, isVoiceMode, onUserSpeech, onAppendMessage]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  // 语音合成功能
  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !isTTSSupported) return;

      if (isSpeaking) {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.9;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setTtsError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setTtsError("语音合成错误");
      };

      speechSynthesis.speak(utterance);
    },
    [isSpeaking, isTTSSupported],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isSTTSupported,
    isTTSSupported,
    isListening,
    isSpeaking,
    interimTranscript,
    sttError,
    ttsError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
