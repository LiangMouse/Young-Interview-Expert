import type { User } from "@supabase/auth-helpers-nextjs";

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  emoji?: string;
}

export interface VoiceWave {
  id: number;
  height: number;
  delay: number;
}

export interface InterviewClientProps {
  user: User;
}
