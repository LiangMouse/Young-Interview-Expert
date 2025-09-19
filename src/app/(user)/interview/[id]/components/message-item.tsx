"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { UIMessage } from "@ai-sdk/react";

interface MessageItemProps {
  message: UIMessage;
  index: number;
}

export const MessageItem = memo(({ message, index }: MessageItemProps) => (
  <motion.div
    key={message.id}
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.3,
      delay: index * 0.05,
      ease: "easeOut",
    }}
    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
  >
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`max-w-[70%] p-4 rounded-3xl ${
        message.role === "user"
          ? "bg-gradient-to-r from-sky-400 to-purple-400 text-white"
          : "bg-white/80 text-gray-800 border border-white/50"
      }`}
    >
      <div className="flex items-start space-x-2">
        {message.role === "assistant" && (
          <motion.span
            className="text-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🤖
          </motion.span>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.parts
            ?.filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("") || ""}
        </p>
      </div>
      <p
        className={`text-xs mt-2 ${
          message.role === "user" ? "text-white/70" : "text-gray-500"
        }`}
      >
        {format(new Date(), "HH:mm")}
      </p>
    </motion.div>
  </motion.div>
));

MessageItem.displayName = "MessageItem";
