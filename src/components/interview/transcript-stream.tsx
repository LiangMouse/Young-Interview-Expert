"use client";

import { Bot, User } from "lucide-react";

const mockTranscript = [
  {
    role: "interviewer",
    content:
      "Hello! Let's start with a warm-up question. Can you tell me about your experience with data structures?",
    timestamp: "00:12",
  },
  {
    role: "me",
    content:
      "I've worked extensively with arrays, linked lists, and hash maps in my previous projects.",
    timestamp: "00:35",
  },
  {
    role: "interviewer",
    content:
      "Great! Now, let's move to the coding challenge. I'd like you to reverse a linked list. Here's a code snippet to get you started:\n\n```javascript\nfunction reverseList(head) {\n  // Your implementation here\n}\n```",
    timestamp: "01:02",
  },
  {
    role: "me",
    content:
      "Let me think about this. I'll need to iterate through the list and reverse the pointers.",
    timestamp: "01:45",
  },
];

export function TranscriptStream() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {mockTranscript.map((message, index) => (
        <div
          key={index}
          className={
            message.role === "interviewer"
              ? "flex gap-3"
              : "flex gap-3 opacity-80"
          }
        >
          <div className="flex-shrink-0">
            {message.role === "interviewer" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Bot className="h-4 w-4 text-[#141414]" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5]">
                <User className="h-4 w-4 text-[#666666]" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#141414]">
                {message.role === "interviewer" ? "AI Interviewer" : "You"}
              </span>
              <span className="text-xs text-[#999999]">
                {message.timestamp}
              </span>
            </div>
            <div
              className={
                message.role === "interviewer"
                  ? "rounded-lg bg-white p-3 shadow-sm text-sm text-[#141414] leading-relaxed"
                  : "text-sm text-[#666666] leading-relaxed"
              }
            >
              {message.content.includes("```") ? (
                <div>
                  {message.content.split("```").map((part, i) => {
                    if (i % 2 === 1) {
                      const [lang, ...code] = part.split("\n");
                      return (
                        <pre
                          key={i}
                          className="my-2 overflow-x-auto rounded bg-[#1E1E20] p-3 text-xs"
                        >
                          <code className="text-[#E5E5E5]">
                            {code.join("\n")}
                          </code>
                        </pre>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
