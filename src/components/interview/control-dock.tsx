"use client";

import { useRef, useState, useCallback, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Keyboard,
  MessageSquare,
  X,
  GripVertical,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ControlDockProps {
  /** 麦克风是否激活 */
  isMicActive: boolean;
  /** 是否为语音模式 */
  isVoiceMode: boolean;
  /** 切换麦克风 */
  onMicToggle: () => void;
  /** 切换语音/键盘模式 */
  onModeToggle: () => void;
  /** 发送文本消息 */
  onSendMessage?: (text: string) => void;
  /** 结束面试 */
  onEndInterview?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export function ControlDock({
  isMicActive,
  isVoiceMode,
  onMicToggle,
  onModeToggle,
  onSendMessage,
  onEndInterview,
  disabled = false,
}: ControlDockProps) {
  const t = useTranslations("interview");
  const constraintsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState("");

  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || disabled) return;
    onSendMessage?.(inputText.trim());
    setInputText("");
    inputRef.current?.focus();
  }, [inputText, disabled, onSendMessage]);

  // 键盘事件：回车发送
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

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
          disabled={disabled}
          className={cn(
            "h-10 w-10 rounded-full p-0 transition-all",
            isMicActive && !disabled
              ? "bg-[#10B981] text-white shadow-md hover:bg-[#10B981]/90"
              : "text-[#666666] hover:bg-gray-100 hover:text-[#141414]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {isMicActive && !disabled ? (
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
          disabled={disabled}
          className={cn(
            "h-10 w-10 rounded-full p-0 text-[#666666] hover:bg-gray-100 hover:text-[#141414]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {isVoiceMode ? (
            <Keyboard className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </Button>

        {/* Text Input (shown when not in voice mode) */}
        {!isVoiceMode && (
          <div className="mx-2 flex items-center gap-1">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("typeResponse")}
              disabled={disabled}
              className={cn(
                "h-10 w-64 border-[#E5E5E5] bg-white",
                disabled && "cursor-not-allowed opacity-50",
              )}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendMessage}
              disabled={disabled || !inputText.trim()}
              className={cn(
                "h-10 w-10 rounded-full p-0 text-[#10B981] hover:bg-[#10B981]/10",
                (disabled || !inputText.trim()) &&
                  "cursor-not-allowed opacity-50",
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-[#E5E5E5]" />

        {/* End Interview */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEndInterview}
          disabled={disabled}
          className={cn(
            "h-10 rounded-full px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700",
            disabled && "cursor-not-allowed opacity-50",
          )}
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
