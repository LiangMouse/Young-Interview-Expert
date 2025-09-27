import { NextResponse } from "next/server";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import {
  processInterviewSpeech,
  getInterviewHistory,
} from "@/action/interview";

// 全局 Socket.io 实例
let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export async function GET() {
  if (!io) {
    console.log("Initializing Socket.io server...");
    const httpServer = createServer();
    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: "/api/socket",
      cors: { origin: "*" }, // In production, change this to your domain
    });

    io.on("connection", (socket: Socket) => {
      console.log("User connected:", socket.id);

      // 加入面试房间
      socket.on("join-interview", async (data: { interviewId: string }) => {
        console.log(`User ${socket.id} joined interview: ${data.interviewId}`);
        socket.join(data.interviewId);

        // 发送欢迎消息
        socket.emit("ai-response", {
          text: "欢迎参加AI面试！我是你的面试官，准备好后请开始回答。",
          interviewId: data.interviewId,
        });
      });

      // 处理用户语音转录
      socket.on(
        "user-speech",
        async (data: {
          transcript: string;
          interviewId: string;
          userId: string;
        }) => {
          console.log("Received user speech:", data.transcript);

          try {
            // 获取对话历史
            const historyResult = await getInterviewHistory(data.interviewId);
            const conversationHistory =
              historyResult.success && historyResult.messages
                ? historyResult.messages.map((msg) => ({
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    timestamp: msg.timestamp,
                  }))
                : [];

            // 处理面试语音并生成回应
            const result = await processInterviewSpeech({
              transcript: data.transcript,
              interviewId: data.interviewId,
            });

            if (result.success) {
              // 发送AI回应
              socket.emit("ai-response", {
                text: result.response,
                interviewId: data.interviewId,
              });
            } else {
              // 发送错误信息
              socket.emit("ai-response", {
                text: "抱歉，我遇到了一些技术问题，请稍后再试。",
                interviewId: data.interviewId,
              });
            }
          } catch (error) {
            console.error("处理用户语音失败:", error);
            socket.emit("ai-response", {
              text: "抱歉，处理您的回答时出现了问题，请重试。",
              interviewId: data.interviewId,
            });
          }
        },
      );

      // 处理停止TTS请求
      socket.on("stop-tts", (data: { interviewId: string }) => {
        console.log(`Stop TTS requested for interview: ${data.interviewId}`);
        // 这里可以添加停止TTS的逻辑，比如取消正在进行的语音合成
        // 目前只是记录日志，实际项目中可能需要更复杂的TTS管理
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  return NextResponse.json({ status: "Socket.io server initialized" });
}
