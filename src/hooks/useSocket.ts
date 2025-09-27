import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

interface UseSocketProps {
  interviewId: string;
  userId: string;
  onAiResponse?: (response: string) => void;
  onAiSpeech?: (speech: string) => void;
  onError?: (error: string) => void;
}

export const useSocket = ({
  interviewId,
  userId,
  onAiResponse,
  onAiSpeech,
  onError,
}: UseSocketProps) => {
  const [socket, setSocket] =
    useState<Socket<ServerToClientEvents, ClientToServerEvents>>();
  const [isConnected, setIsConnected] = useState(false);

  // 保持回调的最新引用，避免因依赖变化导致重复初始化
  const onAiResponseRef = useRef(onAiResponse);
  const onAiSpeechRef = useRef(onAiSpeech);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAiResponseRef.current = onAiResponse;
  }, [onAiResponse]);

  useEffect(() => {
    onAiSpeechRef.current = onAiSpeech;
  }, [onAiSpeech]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // 仅初始化一次 socket 与事件监听
  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: "/api/socket",
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("ai-response", (data) => {
      console.log("AI Response:", data.text);
      onAiResponseRef.current?.(data.text);
    });

    newSocket.on("ai-speech", (data) => {
      console.log("AI Speech:", data.speech);
      onAiSpeechRef.current?.(data.speech);
    });

    newSocket.on("error", (data) => {
      console.error("Socket error:", (data as any)?.message ?? data);
      onErrorRef.current?.((data as any)?.message ?? "socket error");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // interviewId 变化时加入对应面试房间
  useEffect(() => {
    if (socket && isConnected && interviewId) {
      socket.emit("join-interview", { interviewId });
    }
  }, [socket, isConnected, interviewId]);

  const sendUserSpeech = useCallback(
    (transcript: string) => {
      if (socket && isConnected) {
        socket.emit("user-speech", {
          transcript,
          interviewId,
          userId,
        });
      }
    },
    [socket, interviewId, userId, isConnected],
  );

  const stopTTS = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("stop-tts", { interviewId });
    }
  }, [socket, interviewId, isConnected]);

  return {
    socket,
    sendUserSpeech,
    stopTTS,
    isConnected,
  };
};
