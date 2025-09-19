import { NextRequest, NextResponse } from "next/server";

// DeepSeek API proxy - DeepSeek is OpenAI compatible
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Chat API request started`);

  try {
    // 1. 解析请求参数
    const body = await request.json();
    console.log(`[${requestId}] Request body:`, {
      messagesCount: body.messages?.length || 0,
      model: body.model || "deepseek-chat",
      hasStream: body.stream !== false,
    });

    const { messages, model = "deepseek-chat" } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error(`[${requestId}] Invalid messages array:`, messages);
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // 2. 检查环境变量
    if (!process.env.DEEPSEEK_V3_API) {
      console.error(
        `[${requestId}] DEEPSEEK_V3_API environment variable is not set`,
      );
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    // 3. 转换 UIMessage 格式为 DeepSeek 格式
    const convertedMessages = messages.map((message: any) => {
      // 如果是 UIMessage 格式（有 parts 属性）
      if (message.parts && Array.isArray(message.parts)) {
        // 提取文本内容
        const textContent = message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("");

        return {
          role: message.role,
          content: textContent,
        };
      }
      // 如果已经是传统格式（有 content 属性）
      return {
        role: message.role,
        content: message.content,
      };
    });

    console.log(`[${requestId}] Converted messages:`, convertedMessages);

    // 4. 构建请求参数
    const requestPayload = {
      model,
      messages: convertedMessages,
      stream: true,
      temperature: 0.7,
    };

    console.log(`[${requestId}] Sending request to DeepSeek:`, {
      model: requestPayload.model,
      messagesCount: requestPayload.messages.length,
      stream: requestPayload.stream,
      temperature: requestPayload.temperature,
    });

    // 4. 发送请求到 DeepSeek
    const upstream = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_V3_API}`,
        },
        body: JSON.stringify(requestPayload),
      },
    );

    console.log(`[${requestId}] DeepSeek response status:`, upstream.status);
    console.log(
      `[${requestId}] DeepSeek response headers:`,
      Object.fromEntries(upstream.headers.entries()),
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error(`[${requestId}] DeepSeek API error:`, {
        status: upstream.status,
        statusText: upstream.statusText,
        response: text,
      });
      throw new Error(`DeepSeek API error: ${upstream.status} ${text}`);
    }

    // 5. 检查响应体
    if (!upstream.body) {
      console.error(`[${requestId}] DeepSeek response body is null`);
      throw new Error("DeepSeek response body is null");
    }

    console.log(
      `[${requestId}] Successfully received stream from DeepSeek, converting to AI SDK 5.0+ format`,
    );

    // 6. 转换 DeepSeek 格式为 AI SDK 5.0+ 的 UIMessageChunk 格式
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log(`[${requestId}] Raw chunk:`, chunk);

            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  console.log(`[${requestId}] Stream completed`);
                  // 发送结束信号
                  const messageId = `msg-${Date.now()}`;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "text-end", id: messageId })}\n\n`,
                    ),
                  );
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  console.log(`[${requestId}] Parsed data:`, parsed);

                  // 转换为 AI SDK 5.0+ 的 UIMessageChunk 格式
                  const choices = parsed.choices || [];
                  const messageId = parsed.id || `msg-${Date.now()}`;

                  for (const choice of choices) {
                    const delta = choice.delta || {};

                    // 如果是角色开始，发送 text-start
                    if (delta.role) {
                      const textStartChunk = {
                        type: "text-start",
                        id: messageId,
                      };
                      console.log(
                        `[${requestId}] Sending text-start:`,
                        textStartChunk,
                      );
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify(textStartChunk)}\n\n`,
                        ),
                      );
                    }

                    // 如果有内容增量，发送 text-delta
                    if (delta.content) {
                      const textDeltaChunk = {
                        type: "text-delta",
                        delta: delta.content,
                        id: messageId,
                      };
                      console.log(
                        `[${requestId}] Sending text-delta:`,
                        textDeltaChunk,
                      );
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify(textDeltaChunk)}\n\n`,
                        ),
                      );
                    }

                    // 如果完成，发送 text-end
                    if (choice.finish_reason) {
                      const textEndChunk = {
                        type: "text-end",
                        id: messageId,
                      };
                      console.log(
                        `[${requestId}] Sending text-end:`,
                        textEndChunk,
                      );
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify(textEndChunk)}\n\n`,
                        ),
                      );
                    }
                  }
                } catch (e) {
                  console.warn(`[${requestId}] Invalid JSON in stream:`, data);
                }
              }
            }
          }
        } catch (error) {
          console.error(`[${requestId}] Stream processing error:`, error);
          controller.error(error);
        } finally {
          try {
            reader.releaseLock();
            controller.close();
          } catch (e) {
            // Controller might already be closed
            console.warn(`[${requestId}] Controller already closed`);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Chat API error:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        requestId,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
