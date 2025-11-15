"use client";

import { useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import TextClient from "./TextClient";
import VoiceClient from "./VoiceClient";
import type { User } from "@/types/auth";

interface InterviewPageClientProps {
  interview: any;
  user: User;
}

export default function InterviewPageClient({
  interview,
  user,
}: InterviewPageClientProps) {
  const searchParams = useSearchParams();
  // query param 来判断是语音还是文本，前者常用于进行中面试，后者常用于查看历史会话内容
  const isTextMode = searchParams.get("mode") === "text";
  const { userInfo } = useUserStore();
  const Client = isTextMode ? TextClient : VoiceClient;
  return <Client interview={interview} user={user} userProfile={userInfo} />;
}
