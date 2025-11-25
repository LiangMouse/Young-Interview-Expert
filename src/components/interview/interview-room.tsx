"use client";

import { useState } from "react";
import { AIInterviewerPanel } from "./ai-interviewer-panel";
import { CodeWorkbench } from "./code-workbench";
import { ControlDock } from "./control-dock";
import { InterviewHeader } from "./interview-header";

export function InterviewRoom() {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8]">
      <InterviewHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: AI Interviewer */}
        <AIInterviewerPanel isSpeaking={isMicActive} />

        {/* RIGHT PANEL: Code Workbench */}
        <CodeWorkbench />
      </div>

      {/* BOTTOM DOCK: Control Center */}
      <ControlDock
        isMicActive={isMicActive}
        isVoiceMode={isVoiceMode}
        onMicToggle={() => setIsMicActive(!isMicActive)}
        onModeToggle={() => setIsVoiceMode(!isVoiceMode)}
      />
    </div>
  );
}
