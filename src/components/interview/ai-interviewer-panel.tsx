"use client";

import { AudioVisualizer } from "./audio-visualizer";
import { TranscriptStream, type TranscriptItemData } from "./transcript-stream";
import { ControlDock } from "./control-dock";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AIInterviewerPanelProps {
  /** 是否已连接到 LiveKit 房间 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
  /** 麦克风是否启用 */
  isMicEnabled: boolean;
  /** Agent 是否正在说话 */
  isAgentSpeaking: boolean;
  /** 用户是否正在说话 */
  isUserSpeaking: boolean;
  /** 转写内容 */
  transcript: TranscriptItemData[];
  /** 切换麦克风回调 */
  onMicToggle: () => void;
  /** 发送文本消息回调 */
  onSendMessage?: (text: string) => void;
  /** 结束面试回调 */
  onEndInterview?: () => void;
  /** 开始面试回调 */
  onStartInterview?: () => void;
}

export function AIInterviewerPanel({
  isConnected,
  isConnecting,
  isMicEnabled,
  isAgentSpeaking,
  isUserSpeaking,
  transcript,
  onMicToggle,
  onSendMessage,
  onEndInterview,
  onStartInterview,
}: AIInterviewerPanelProps) {
  const t = useTranslations("interview");
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  // 获取当前状态文本
  const getStatusText = () => {
    if (isConnecting) {
      return "连接中...";
    }
    if (!isConnected) {
      return "未连接";
    }
    if (isAgentSpeaking) {
      return t("speaking");
    }
    if (isUserSpeaking) {
      return "您正在发言";
    }
    return t("listening");
  };

  // 音频可视化是否活跃（Agent 说话或用户说话）
  const isAudioActive = isAgentSpeaking || isUserSpeaking;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#FDFCF8]">
      {/* 状态指示区域 */}
      <div className="flex flex-col items-center justify-center border-b border-[#E5E5E5] px-8 py-6">
        {isConnecting ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-[#10B981]" />
            <p className="text-sm text-[#666666]">正在连接面试官...</p>
          </div>
        ) : (
          <>
            <AudioVisualizer isActive={isAudioActive && isConnected} />
            <p className="mt-3 text-xs uppercase tracking-wide text-[#999999]">
              {getStatusText()}
            </p>
            {/* DEBUG INFO */}
            <p className="mt-1 text-[10px] text-gray-400">
              Debug: {isConnected ? "已连接到房间" : "未连接"}
              {isMicEnabled ? " | Mic On" : " | Mic Off"}
            </p>
          </>
        )}
      </div>

      {/* 转写流区域 */}
      <div className="flex-1 overflow-hidden">
        <TranscriptStream
          transcript={transcript}
          isConnected={isConnected}
          isConnecting={isConnecting}
        />
      </div>

      {/* 控制面板 */}
      <ControlDock
        isMicActive={isMicEnabled && isConnected}
        isVoiceMode={isVoiceMode}
        onMicToggle={onMicToggle}
        onModeToggle={() => setIsVoiceMode(!isVoiceMode)}
        onSendMessage={onSendMessage}
        onEndInterview={onEndInterview}
        disabled={!isConnected}
      />
    </div>
  );
}
