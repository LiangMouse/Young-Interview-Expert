"use client";

import { Mic, MicOff, Keyboard, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ControlDockProps {
  isMicActive: boolean;
  isVoiceMode: boolean;
  onMicToggle: () => void;
  onModeToggle: () => void;
}

export function ControlDock({
  isMicActive,
  isVoiceMode,
  onMicToggle,
  onModeToggle,
}: ControlDockProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-6 py-3 shadow-lg backdrop-blur-md">
        {/* Mic Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMicToggle}
          className={cn(
            "h-10 w-10 rounded-full p-0 transition-all",
            isMicActive
              ? "bg-[#10B981] text-white hover:bg-[#10B981]/90"
              : "text-[#666666] hover:text-[#141414]",
          )}
        >
          {isMicActive ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>

        {/* Voice/Keyboard Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onModeToggle}
          className="h-10 w-10 rounded-full p-0 text-[#666666] hover:text-[#141414]"
        >
          {isVoiceMode ? (
            <Keyboard className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </Button>

        {/* Text Input (shown when not in voice mode) */}
        {!isVoiceMode && (
          <Input
            placeholder="Type your response..."
            className="mx-2 h-10 w-64 border-[#E5E5E5] bg-white"
          />
        )}

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-[#E5E5E5]" />

        {/* End Interview */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <X className="mr-2 h-4 w-4" />
          End
        </Button>
      </div>
    </div>
  );
}
