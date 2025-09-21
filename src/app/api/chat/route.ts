import { NextRequest, NextResponse } from "next/server";
import {
  getDeepSeekClient,
  validateDeepSeekConfig,
} from "@/lib/deepseek-client";
import { convertToCoreMessages } from "@/lib/chat-utils";
import { streamText } from "ai";

/**
 * 处理聊天消息的 POST 请求
 *
 * 调用路径：
 * - 前端：useChat hook -> /api/chat
 * - 组件：ChatInterface -> useInterviewLogic -> useChat -> /api/chat
 *
 * 请求格式：AI SDK 5.0 格式
 * {
 *   "messages": [...],
 *   "trigger": "submit-message"
 * }
 *
 * 响应格式：流式文本响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { messages, model = "deepseek-chat" } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error(`Invalid messages array:`, messages);
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // 2. 验证 DeepSeek 配置
    const configValidation = validateDeepSeekConfig();
    if (!configValidation.isValid) {
      console.error(
        `DeepSeek config validation failed:`,
        configValidation.error,
      );
      return NextResponse.json(
        { error: configValidation.error || "API key not configured" },
        { status: 500 },
      );
    }
    // 3. 转换 UIMessage 格式为 Core Messages 格式
    const coreMessages = convertToCoreMessages(messages);

    // 4. 使用 @ai-sdk/deepseek 调用 DeepSeek API
    const deepseekClient = getDeepSeekClient();
    const result = await streamText({
      model: deepseekClient(model),
      messages: coreMessages,
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    // 5. 返回流式响应 - 使用 toUIMessageStreamResponse 以支持 useChat
    const response = result.toUIMessageStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(` Chat API error:`, {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    let errorResponse = "Internal server error";

    if (errorMessage.includes("API key")) {
      statusCode = 500;
      errorResponse = "API key not configured";
    } else if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota")
    ) {
      statusCode = 429;
      errorResponse = "Rate limit exceeded";
    } else if (
      errorMessage.includes("invalid") ||
      errorMessage.includes("bad request")
    ) {
      statusCode = 400;
      errorResponse = "Invalid request";
    } else if (errorMessage.includes("timeout")) {
      statusCode = 504;
      errorResponse = "Request timeout";
    }

    return NextResponse.json(
      {
        error: errorResponse,
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    );
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
