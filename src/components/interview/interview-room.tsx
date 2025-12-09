"use client";

import { useEffect, useCallback, useRef } from "react";
import { AIInterviewerPanel } from "./ai-interviewer-panel";
import { CodeWorkbench } from "./code-workbench";
import { InterviewHeader } from "./interview-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";

interface InterviewRoomProps {
  interviewId: string;
}

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const hasConnectedRef = useRef(false);

  const {
    isConnected,
    isConnecting,
    isMicEnabled,
    isAgentSpeaking,
    isUserSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    toggleMicrophone,
    sendRpc,
    sendTextMessage,
  } = useLiveKitRoom({
    interviewId,
    onConnected: () => {
      console.log("[InterviewRoom] Connected to LiveKit room");
    },
    onDisconnected: () => {
      console.log("[InterviewRoom] Disconnected from LiveKit room");
    },
    onError: (err) => {
      console.error("[InterviewRoom] LiveKit error:", err);
    },
  });

  // 自动连接到房间
  useEffect(() => {
    if (hasConnectedRef.current) return;
    hasConnectedRef.current = true;

    connect();

    return () => {
      disconnect();
    };

    // 只执行一次
  }, []);

  // 连接成功后发送 start_interview RPC
  const handleStartInterview = useCallback(async () => {
    if (!isConnected) return;

    try {
      await sendRpc("start_interview", { interviewId });
      console.log("[InterviewRoom] Sent start_interview RPC");
    } catch (err) {
      console.error("[InterviewRoom] Failed to send start_interview:", err);
    }
  }, [isConnected, interviewId, sendRpc]);

  // 发送文本消息
  const handleSendMessage = useCallback(
    async (text: string) => {
      try {
        await sendTextMessage(text);
        console.log("[InterviewRoom] Sent text message:", text);
      } catch (err) {
        console.error("[InterviewRoom] Failed to send message:", err);
      }
    },
    [sendTextMessage],
  );

  // 结束面试
  const handleEndInterview = useCallback(() => {
    disconnect();
    // TODO: 导航回 dashboard 或显示面试总结
    window.location.href = "/dashboard";
  }, [disconnect]);

  // 连接成功后自动开始面试
  useEffect(() => {
    if (isConnected) {
      // 给 Agent 一点时间准备
      const timer = setTimeout(handleStartInterview, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, handleStartInterview]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8]">
      <InterviewHeader
        isConnected={isConnected}
        isConnecting={isConnecting}
        error={error}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel minSize={35} defaultSize={40} className="h-full">
            {/* LEFT PANEL: AI Interviewer */}
            <AIInterviewerPanel
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMicEnabled={isMicEnabled}
              isAgentSpeaking={isAgentSpeaking}
              isUserSpeaking={isUserSpeaking}
              transcript={transcript}
              onMicToggle={toggleMicrophone}
              onSendMessage={handleSendMessage}
              onEndInterview={handleEndInterview}
              onStartInterview={handleStartInterview}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={60}
            minSize={0}
            collapsible={true}
            className="h-full"
          >
            {/* RIGHT PANEL: Code Workbench */}
            <CodeWorkbench />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
