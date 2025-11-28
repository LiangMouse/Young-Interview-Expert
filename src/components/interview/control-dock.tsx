"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Keyboard,
  MessageSquare,
  X,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("interview");
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={constraintsRef}
      className="pointer-events-none absolute inset-0 z-50 cursor-grab"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={constraintsRef}
        initial={{ x: "-50%", y: 0 }}
        className="pointer-events-auto absolute bottom-6 left-1/2 flex cursor-grab items-center gap-2 rounded-full border border-white/20 bg-white/80 px-2 py-3 shadow-lg backdrop-blur-md active:cursor-grabbing"
        whileDrag={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
      >
        {/* Drag Handle */}
        <div className="flex h-10 w-6 items-center justify-center text-gray-400">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Mic Toggle - Prominent emerald circle when active */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMicToggle}
          className={cn(
            "h-10 w-10 rounded-full p-0 transition-all",
            isMicActive
              ? "bg-[#10B981] text-white shadow-md hover:bg-[#10B981]/90"
              : "text-[#666666] hover:bg-gray-100 hover:text-[#141414]",
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
          className="h-10 w-10 rounded-full p-0 text-[#666666] hover:bg-gray-100 hover:text-[#141414]"
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
            placeholder={t("typeResponse")}
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
          {t("end")}
        </Button>

        {/* Drag Handle (right) */}
        <div className="flex h-10 w-6 items-center justify-center text-gray-400">
          <GripVertical className="h-4 w-4" />
        </div>
      </motion.div>
    </div>
  );
}
