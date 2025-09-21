import { NextRequest, NextResponse } from "next/server";
import {
  getDeepSeekClient,
  validateDeepSeekConfig,
} from "@/lib/deepseek-client";
import { convertToCoreMessages } from "@/lib/chat-utils";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  extractPersonalizedContext,
  generatePersonalizedInterviewPrompt,
} from "@/lib/profile-rag";
import {
  retrieveRelevantDocuments,
  generateIntelligentAnalysisPrompt,
} from "@/lib/vector-rag";
import {
  BASE_INTERVIEWER_PROMPT,
  CONVERSATION_HISTORY_GUIDANCE,
  FIRST_CONVERSATION_GUIDANCE,
  FALLBACK_PROMPT,
} from "@/lib/prompt";
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

    const {
      messages,
      model = "deepseek-chat",
      userId,
      enablePersonalization = true,
    } = body;

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

    // 3. 获取用户档案并生成个性化提示词
    let systemPrompt = "";
    if (enablePersonalization && userId) {
      try {
        const supabase = await createClient();

        // 获取用户档案
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!profileError && userProfile) {
          // 生成个性化面试提示词
          const personalizedContext = extractPersonalizedContext(userProfile);
          systemPrompt =
            generatePersonalizedInterviewPrompt(personalizedContext);

          // 添加对话历史管理指导
          systemPrompt += CONVERSATION_HISTORY_GUIDANCE;

          // 如果是第一次对话，让AI面试官主动开始
          if (messages.length === 1 && messages[0].role === "user") {
            systemPrompt += FIRST_CONVERSATION_GUIDANCE;
          } else {
            // 非首次对话，添加对话历史指导
            systemPrompt += "\n\n## 对话历史指导\n";
            systemPrompt +=
              "请仔细回顾之前的对话内容，避免重复提问，基于候选人的回答进行深入的技术追问。";

            // 使用 RAG 进行深度分析（可选）
            try {
              // 提取最近的消息内容作为查询
              const recentMessages = messages.slice(-3); // 取最近3条消息
              const queryText = recentMessages
                .map((msg) => {
                  if (msg.role === "user") {
                    return (
                      msg.parts?.map((part: any) => part.text || "").join("") ||
                      ""
                    );
                  }
                  return "";
                })
                .join(" ");

              if (queryText.trim()) {
                // 检索相关文档
                const relevantDocs = await retrieveRelevantDocuments(
                  queryText,
                  userId,
                );

                if (relevantDocs.length > 0) {
                  // 生成智能分析提示词
                  const ragContext = {
                    relevantDocuments: relevantDocs,
                    userProfile: userProfile,
                    analysisPrompt: "",
                  };
                  const ragAnalysis =
                    generateIntelligentAnalysisPrompt(ragContext);
                  systemPrompt += "\n\n" + ragAnalysis;
                }
              }
            } catch (ragError) {
              console.warn("RAG 分析失败:", ragError);
              // RAG 失败不影响主要功能
            }
          }
        }
      } catch (error) {
        console.error("获取用户档案失败:", error);
        // 如果获取用户档案失败，使用默认提示词
        systemPrompt = FALLBACK_PROMPT;
      }
    } else {
      systemPrompt = FALLBACK_PROMPT;
    }

    // 4. 构建消息数组，添加系统提示词
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // 5. 转换 UIMessage 格式为 Core Messages 格式
    const coreMessages = convertToCoreMessages(messagesWithSystem);

    // 6. 使用 @ai-sdk/deepseek 调用 DeepSeek API
    const deepseekClient = getDeepSeekClient();
    const result = await streamText({
      model: deepseekClient(model),
      messages: coreMessages,
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    // 7. 返回流式响应 - 使用 toUIMessageStreamResponse 以支持 useChat
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
