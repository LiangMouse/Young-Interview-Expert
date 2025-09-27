"use client";

import { useState, useRef } from "react";
import { InterviewClientProps } from "@/lib/types/interview";
import { VoiceModeDialog } from "./components/voice-mode-dialog";
import { PageHeader } from "./components/page-header";
import { InterviewInfoPanel } from "./components/interview-info-panel";
import { useVoiceFeatures } from "./hooks/useVoiceFeatures";
import { useInterviewLogic } from "./hooks/useInterviewLogic";
import { ChatInterface } from "./components/chat-interface";
import type { SimpleMessage } from "@/types/message";

export default function InterviewClient({
  user,
  userProfile,
  interview,
}: InterviewClientProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userName = userProfile?.nickname || user?.email || "用户";

  // 面试逻辑 Hook
  const interviewLogic = useInterviewLogic({
    user,
    userProfile,
    interview,
    isVoiceMode,
    setIsVoiceMode,
  });

  // 语音功能 Hook
  const voiceFeatures = useVoiceFeatures({
    isVoiceMode,
    onUserSpeech: (transcript: string) => {
      // 转交到面试逻辑发送
      interviewLogic.sendUserSpeech(transcript);
    },
    onAppendMessage: (message: SimpleMessage) => {
      // 转交到面试逻辑添加
      interviewLogic.addMessage(message);
    },
  });

  // 处理语音模式切换
  const handleVoiceModeToggle = () => {
    interviewLogic.setIsVoiceModeDialogOpen(true);
  };

  const handleConfirmVoiceMode = () => {
    setIsVoiceMode(true);
    interviewLogic.setIsVoiceModeDialogOpen(false);
    if (voiceFeatures.isSTTSupported) {
      voiceFeatures.startListening();
      interviewLogic.setIsRecording(true);
    }
  };

  // 处理录音切换
  const handleToggleRecording = () => {
    if (!isVoiceMode) {
      interviewLogic.setIsVoiceModeDialogOpen(true);
      return;
    }

    if (interviewLogic.isRecording) {
      voiceFeatures.stopListening();
      interviewLogic.setIsRecording(false);
    } else {
      voiceFeatures.startListening();
      interviewLogic.setIsRecording(true);
    }
  };

  // 处理停止TTS
  const handleStopTTS = () => {
    voiceFeatures.stopSpeaking();
    interviewLogic.stopTTS();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-amber-50">
      <PageHeader
        userName={userName}
        userAvatar={user?.user_metadata?.avatar_url}
      />

      <div className="flex min-h-[calc(100vh-80px)] max-w-7xl mx-auto p-4 gap-4">
        {/* Sticky Interview Info Panel */}
        <div className="sticky top-1 self-start">
          <InterviewInfoPanel
            isLoading={interviewLogic.isLoading}
            isVoiceMode={isVoiceMode}
            isListening={voiceFeatures.isListening}
            isSpeaking={voiceFeatures.isSpeaking}
            elapsedTime={interviewLogic.elapsedTime}
            interactionCount={interviewLogic.interactionCount}
            onRestart={interviewLogic.handleRestart}
            onStop={interviewLogic.handleStop}
            isRecording={interviewLogic.isRecording}
          />
        </div>

        <ChatInterface
          ref={messagesEndRef}
          messages={interviewLogic.messages}
          isLoading={interviewLogic.isLoading}
          input={interviewLogic.input}
          setInput={interviewLogic.setInput}
          onSendMessage={interviewLogic.handleSendMessage}
          onReload={interviewLogic.reload}
          error={interviewLogic.error || null}
          isVoiceMode={isVoiceMode}
          isSpeaking={voiceFeatures.isSpeaking}
          isRecording={interviewLogic.isRecording}
          isListening={voiceFeatures.isListening}
          sttError={voiceFeatures.sttError}
          ttsError={voiceFeatures.ttsError}
          interimTranscript={voiceFeatures.interimTranscript}
          onVoiceModeToggle={handleVoiceModeToggle}
          onStopTTS={handleStopTTS}
          onToggleRecording={handleToggleRecording}
        />
      </div>

      <VoiceModeDialog
        isOpen={interviewLogic.isVoiceModeDialogOpen}
        onOpenChange={interviewLogic.setIsVoiceModeDialogOpen}
        onConfirm={handleConfirmVoiceMode}
      />
    </div>
  );
}
