"use client";

import { memo, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { UIMessage } from "@ai-sdk/react";
// TODO 考虑抽出一个可独立发包的组件
interface MessageItemProps {
  message: UIMessage;
  index: number;
}

export const MessageItem = memo(({ message, index }: MessageItemProps) => {
  return (
    <motion.div
      key={message.id}
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: 0, // 移除基于index的延迟，避免重新渲染时的抖动
        ease: "easeOut",
      }}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] p-4 rounded-3xl overflow-hidden ${
          message.role === "user"
            ? "bg-gradient-to-r from-sky-400 to-purple-400 text-white"
            : "bg-white/80 text-gray-800 border border-white/50"
        }`}
      >
        <motion.div
          whileHover={{ scale: 1.01 }} // 减小缩放幅度，避免布局投影重计算
          transition={{ duration: 0.2 }}
          className="flex items-start space-x-2"
        >
          {message.role === "assistant" && (
            <motion.span
              className="text-lg inline-flex items-center justify-center w-5 flex-none leading-none"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🤖
            </motion.span>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.parts
              ?.filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("") || ""}
          </p>
        </motion.div>
        <p
          className={`text-xs mt-2 ${
            message.role === "user" ? "text-white/70" : "text-gray-500"
          }`}
        >
          {format(new Date(), "HH:mm")}
        </p>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = "MessageItem";
