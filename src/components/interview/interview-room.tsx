"use client";

import { useState } from "react";
import { AIInterviewerPanel } from "./ai-interviewer-panel";
import { CodeWorkbench } from "./code-workbench";
import { InterviewHeader } from "./interview-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function InterviewRoom() {
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8]">
      <InterviewHeader />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel minSize={35} defaultSize={40} className="h-full">
            {/* LEFT PANEL: AI Interviewer */}
            <AIInterviewerPanel
              isSpeaking={isMicActive}
              isVoiceMode={isVoiceMode}
              onMicToggle={() => setIsMicActive(!isMicActive)}
              onModeToggle={() => setIsVoiceMode(!isVoiceMode)}
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
