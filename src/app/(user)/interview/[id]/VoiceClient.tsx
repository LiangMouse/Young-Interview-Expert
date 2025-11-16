"use client";

import type { InterviewClientProps } from "@/lib/types/interview";
import Image from "next/image";
import { useState } from "react";
import type { SavedMessage } from "@/types/message";
import { cn } from "@/lib/utils";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export default function VoiceClient({
  interview,
  user,
  userProfile,
}: InterviewClientProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const userName = userProfile?.nickname || user.email;
  const lastMessage = messages[messages.length - 1]?.content || "";
  return (
    <>
      <div className="call-view">
        {/* AI 面试官左侧卡片*/}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* 用户右侧卡片 */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100",
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => console.log("预期用vapi实现低时延的语音agent node")}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden",
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "开始面试"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button
            className="btn-disconnect"
            onClick={() => console.log("预期用vapi实现低时延的语音agent node")}
          >
            结束面试
          </button>
        )}
      </div>
    </>
  );
}
