// 面试相关类型定义

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

export interface InterviewSession {
  id: string;
  userId: string;
  title: string;
  status: "active" | "paused" | "completed";
  startTime: Date;
  endTime?: Date;
  duration: number;
  messageCount: number;
  score?: number;
}

export interface AIComment {
  id: string;
  type:
    | "excellent"
    | "improvement"
    | "suggestion"
    | "technical"
    | "communication";
  title: string;
  content: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface InterviewStats {
  totalSessions: number;
  averageScore: number;
  totalDuration: number;
  improvementAreas: string[];
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
}

export interface InterviewRecord {
  date: string;
  type: string;
  score: number;
  duration: string;
  status: string;
}
