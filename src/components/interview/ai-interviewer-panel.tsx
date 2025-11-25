"use client";

import { AudioVisualizer } from "./audio-visualizer";
import { TranscriptStream } from "./transcript-stream";

interface AIInterviewerPanelProps {
  isSpeaking: boolean;
}

export function AIInterviewerPanel({ isSpeaking }: AIInterviewerPanelProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden bg-[#FDFCF8] lg:w-[40%]">
      <div className="flex flex-col items-center justify-center border-b border-[#E5E5E5] px-8 py-6">
        <AudioVisualizer isActive={isSpeaking} />
        <p className="mt-3 text-xs uppercase tracking-wide text-[#999999]">
          {isSpeaking ? "Speaking..." : "Listening..."}
        </p>
      </div>

      {/* Transcript Stream Section */}
      <div className="flex-1 overflow-hidden">
        <TranscriptStream />
      </div>
    </div>
  );
}
