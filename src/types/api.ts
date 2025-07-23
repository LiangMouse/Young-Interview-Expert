// API响应类型定义

import type { User } from "./auth";
import type { InterviewSession, Message } from "./interview";
import type { ApiResponse } from "./common";

// 认证API
export interface AuthApiResponse extends ApiResponse {
  data: {
    user: User;
    session: any;
  };
}

// 面试API
export interface InterviewApiResponse extends ApiResponse {
  data: InterviewSession;
}

export interface MessagesApiResponse extends ApiResponse {
  data: {
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface CreateMessageRequest {
  content: string;
  type: "user" | "ai";
  sessionId: string;
}

export interface CreateInterviewRequest {
  title: string;
  type: "practice" | "mock" | "real";
}

export interface UpdateInterviewRequest {
  title?: string;
  status?: "active" | "paused" | "completed";
  score?: number;
}

// 文件上传API
export interface FileUploadResponse extends ApiResponse {
  data: {
    url: string;
    filename: string;
    size: number;
    type: string;
  };
}

export interface UploadResumeRequest {
  file: File;
  userId: string;
}

// AI分析API
export interface AIAnalysisRequest {
  messages: Message[];
  sessionId: string;
}

export interface AIAnalysisResponse extends ApiResponse {
  data: {
    score: number;
    comments: Array<{
      type: string;
      content: string;
      suggestions: string[];
    }>;
    improvements: string[];
  };
}
