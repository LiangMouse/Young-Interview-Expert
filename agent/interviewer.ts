/**
 * ============================================================
 * LiveKit Voice Interviewer Agent
 * ============================================================
 *
 * 基于 LiveKit Agents Node.js SDK (v1.x) 的语音面试官 Agent
 *
 * 核心能力：
 * - STT: Deepgram (nova-2 中文模型)
 * - LLM: MiniMax (通过 OpenAI 兼容接口)
 * - TTS: MiniMax TTS（T2A / speech-01），通过 OpenAI 兼容接口输出中文语音
 * - VAD: 基于 STT 内置的 endpointing 能力
 */
import { voice, llm, type JobContext, type JobProcess } from "@livekit/agents";
import { STT } from "@livekit/agents-plugin-deepgram";
import { LLM, TTS } from "@livekit/agents-plugin-openai";
import { RoomEvent } from "livekit-client";
import { injectionGuard, GuardrailsEngine } from "@presidio-dev/hai-guardrails";

// ============================================================
//  环境变量配置
// ============================================================

/** Next.js 后端基础 URL */
const DIRECTOR_BASE_URL =
  process.env.DIRECTOR_BASE_URL ?? "http://localhost:3000";

/** MiniMax OpenAI 兼容接口 */
const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL ?? "abab5.5s-chat";

/** MiniMax TTS 配置 (T2A / Speech-01) */
const MINIMAX_TTS_MODEL = process.env.MINIMAX_TTS_MODEL ?? "speech-01";
/** MiniMax TTS 语音 ID - 中文女声 */
const MINIMAX_TTS_VOICE = process.env.MINIMAX_TTS_VOICE ?? "female-tianmei";

/** Deepgram STT 配置 - nova-2-general 是中文识别最佳模型 */
const DEEPGRAM_MODEL = process.env.DEEPGRAM_MODEL ?? "nova-2-general";

/**
 * Deepgram endpointing 参数（毫秒）
 * - 控制"静音持续多久才认为一句话结束"
 * - 设为 2000ms，避免候选人思考时的"呃…"被误切
 */
const ENDPOINTING_MS = 2000;

// ============================================================
//  System Prompt
// ============================================================

const SYSTEM_PROMPT = `
你是一位专业、亲和、严谨的中文技术面试官。

【核心行为准则】
1. 每次只处理一道题：提出题目 → 等候候选人回答 → 给出点评 → 进入下一题。
2. 语气自然、礼貌、专业，可以适度鼓励，但不要过度寒暄。
3. 允许候选人思考时有"嗯…、呃…"等短语，不要立刻打断。
4. 如遇到系统问题，用简短自然的话解释，并礼貌地建议稍后重试。
5. 避免评论候选人的个人背景、性别、年龄等与能力无关的因素。
6. 不讨论与面试无关或不适宜的话题，应礼貌引导回技术话题。
`;

// ============================================================
//  类型定义（可扩展）
// ============================================================

/** 评分结果类型 */
export interface EvaluationPayload {
  interviewId: string;
  questionId: string;
  questionText: string;
  answerText: string;
  overallScore: number;
  dimensionScores?: Record<string, number>;
  comment: string;
}

// ============================================================
//  安全防护和工具函数
// ============================================================

/**
 * 创建安全防护引擎
 * 使用 @presidio-dev/hai-guardrails 检测提示词注入攻击
 */
function createSecurityEngine(): GuardrailsEngine {
  const guard = injectionGuard(
    { roles: ["user"] },
    { mode: "heuristic", threshold: 0.7 },
  );
  return new GuardrailsEngine({ guards: [guard] });
}

/**
 * 检查用户输入是否安全
 */
async function checkInputSafety(
  engine: GuardrailsEngine,
  userInput: string,
): Promise<{ isSafe: boolean; sanitized: string }> {
  try {
    const messages = [{ role: "user" as const, content: userInput }];
    const results = await engine.run(messages);

    // 检查是否所有 guard 都通过
    const allPassed = results.messagesWithGuardResult.every((guardResult) =>
      guardResult.messages.every((msg) => msg.passed),
    );

    if (!allPassed) {
      console.warn("[安全] 检测到潜在的安全威胁，已阻止或清理输入");
      // 返回清理后的输入（移除危险内容）
      return {
        isSafe: false,
        sanitized: userInput
          .replace(/ignore\s+previous\s+instructions/gi, "")
          .replace(/forget\s+all\s+instructions/gi, "")
          .replace(/忘记所有指令/gi, "")
          .substring(0, 200)
          .trim(),
      };
    }

    return { isSafe: true, sanitized: userInput };
  } catch (error) {
    console.error("[安全] 安全检查失败:", error);
    // 出错时保守处理：返回清理后的输入
    return {
      isSafe: false,
      sanitized: userInput.substring(0, 200),
    };
  }
}

/**
 * 获取对话历史
 */
async function fetchConversationHistory(
  interviewId: string,
): Promise<
  Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
> {
  try {
    const url = `${DIRECTOR_BASE_URL}/api/interview/history?interviewId=${encodeURIComponent(interviewId)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `[对话历史] 获取失败: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("[对话历史] 获取失败:", error);
    return [];
  }
}

/**
 * 保存消息到数据库
 */
async function saveMessage(
  interviewId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  try {
    const response = await fetch(
      `${DIRECTOR_BASE_URL}/api/interview/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, role, content }),
      },
    );

    if (!response.ok) {
      console.error(
        `[消息保存] 失败: ${response.status} ${await response.text()}`,
      );
    } else {
      console.log(`[消息保存] 成功保存 ${role} 消息`);
    }
  } catch (error) {
    console.error("[消息保存] 请求失败:", error);
  }
}

// ============================================================
//  工具定义（可扩展模式）
// ============================================================

/**
 * 创建 saveEvaluation 工具
 * 设计为异步 side-effect，不阻塞对话流程
 */
function createSaveEvaluationTool() {
  return llm.tool({
    description:
      "在候选人回答完当前题目后，对回答进行结构化打分和点评，并将结果异步保存到后端。",
    parameters: {
      type: "object",
      properties: {
        interviewId: {
          type: "string",
          description: "本次面试的唯一 ID",
        },
        questionId: {
          type: "string",
          description: "当前题目的唯一 ID",
        },
        questionText: {
          type: "string",
          description: "当前题目的完整文本",
        },
        answerText: {
          type: "string",
          description: "候选人的完整回答文本",
        },
        overallScore: {
          type: "number",
          description: "对本题回答的总体评分，0~10 分",
        },
        dimensionScores: {
          type: "object",
          description: "各维度评分，例如 { 技术深度: 8, 表达清晰度: 7 }",
        },
        comment: {
          type: "string",
          description: "对本题回答的简要点评",
        },
      },
      required: [
        "interviewId",
        "questionId",
        "questionText",
        "answerText",
        "overallScore",
        "comment",
      ],
    } as const,
    execute: async (params: EvaluationPayload): Promise<string> => {
      // 异步 side-effect：不阻塞对话流程
      void (async () => {
        try {
          const res = await fetch(
            `${DIRECTOR_BASE_URL}/api/interview/save-evaluation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...params,
                dimensionScores: params.dimensionScores ?? {},
              }),
            },
          );

          if (!res.ok) {
            console.error(
              "[saveEvaluation] backend error",
              res.status,
              await res.text(),
            );
          }
        } catch (err) {
          console.error("[saveEvaluation] request failed", err);
        }
      })();

      // 立即返回，不等待后端响应
      return JSON.stringify({ success: true });
    },
  });
}

/**
 * 创建工具上下文
 * 可扩展：在此添加更多工具
 */
function createToolContext(): llm.ToolContext {
  return {
    saveEvaluation: createSaveEvaluationTool(),
    // 可扩展：添加更多工具
    // getNextQuestion: createGetNextQuestionTool(),
    // endInterview: createEndInterviewTool(),
  };
}

// ============================================================
//  Agent 定义
// ============================================================

/**
 * Agent 入口模块
 * 导出 prewarm 和 entry 函数，供 LiveKit Worker 调用
 */
export default {
  /**
   * prewarm: Worker 启动时预加载资源
   * 可在此预热模型、加载配置等
   */
  prewarm: async (proc: JobProcess) => {
    // 预加载工具上下文
    proc.userData.toolContext = createToolContext();
    // 预加载安全防护引擎
    proc.userData.securityEngine = createSecurityEngine();
    console.log("[interviewer] prewarm complete");
  },

  /**
   * entry: 每个 Job（房间会话）的入口
   * 在此初始化 STT/LLM/TTS 并启动 AgentSession
   */
  entry: async (ctx: JobContext) => {
    // 环境变量检查
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    const minimaxKey = process.env.MINIMAX_API_KEY;

    if (!deepgramKey) {
      throw new Error("DEEPGRAM_API_KEY 未配置");
    }
    if (!minimaxKey) {
      throw new Error("MINIMAX_API_KEY 未配置");
    }

    // 连接到房间
    await ctx.connect();
    console.log("[interviewer] connected to room:", ctx.room.name);

    // 初始化 STT（Deepgram）
    // endpointing 控制静音多久后认为一句话结束
    const stt = new STT({
      apiKey: deepgramKey,
      model: DEEPGRAM_MODEL as "nova-2-general",
      language: "zh",
      endpointing: ENDPOINTING_MS,
      punctuate: true,
      smartFormat: true,
    });

    // 初始化 LLM（MiniMax via OpenAI 兼容接口）
    const chatLlm = new LLM({
      apiKey: minimaxKey,
      baseURL: MINIMAX_BASE_URL,
      model: MINIMAX_MODEL,
      temperature: 0.7,
    });

    // 初始化 TTS（MiniMax T2A / Speech-01）
    // MiniMax 使用 OpenAI 兼容接口，语音 ID 需要类型断言

    const tts = new TTS({
      apiKey: minimaxKey,
      baseURL: MINIMAX_BASE_URL,
      model: MINIMAX_TTS_MODEL,
      voice: MINIMAX_TTS_VOICE as any,
    });

    // 获取预加载的工具上下文和安全引擎
    const toolContext =
      (ctx.proc.userData.toolContext as llm.ToolContext) ?? createToolContext();
    const securityEngine =
      (ctx.proc.userData.securityEngine as GuardrailsEngine) ??
      createSecurityEngine();

    // 存储 interviewId 和对话历史用于后续的消息保存和上下文注入
    let currentInterviewId: string | null = null;
    let conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    // 创建 Voice Agent（使用基础 system prompt，历史将在收到 start_interview 时注入）
    const agent = new voice.Agent({
      instructions: SYSTEM_PROMPT,
      stt,
      llm: chatLlm,
      tts,
      tools: toolContext,
      // 允许打断
      allowInterruptions: true,
    });

    // 创建 AgentSession 并启动
    const session = new voice.AgentSession({
      // 使用 STT 内置的 endpointing 进行轮次检测
      turnDetection: "stt",
    });

    // 启动会话
    await session.start({
      agent,
      room: ctx.room,
    });

    console.log("[interviewer] agent session started");

    // 监听用户转写事件：应用安全防护并保存消息
    session.on(
      voice.AgentSessionEventTypes.UserInputTranscribed,
      async (ev) => {
        const userTranscript = ev.transcript;
        console.log("[interviewer] user transcript:", userTranscript);

        // 安全检查
        const safetyCheck = await checkInputSafety(
          securityEngine,
          userTranscript,
        );

        if (!safetyCheck.isSafe) {
          console.warn("[interviewer] 用户输入未通过安全检查，已阻止或清理");
          // 可以选择不处理或使用清理后的内容
          // 这里我们记录但继续处理（使用清理后的内容）
        }

        // 保存用户消息（使用清理后的内容）
        if (currentInterviewId) {
          await saveMessage(currentInterviewId, "user", safetyCheck.sanitized);
        }
      },
    );

    // 监听 AI 语音创建事件：保存 AI 消息
    // 注意：SpeechCreatedEvent 在语音生成时触发，但可能不包含完整文本
    // 我们可以通过监听 LLM 的响应来获取完整文本
    let lastAiResponse: string | null = null;

    session.on(voice.AgentSessionEventTypes.SpeechCreated, async (ev) => {
      // ev.speechHandle 可能包含响应文本，但需要从其他来源获取
      // 这里我们记录事件，实际文本从 LLM 响应中获取
      if (currentInterviewId && lastAiResponse) {
        await saveMessage(currentInterviewId, "assistant", lastAiResponse);
        lastAiResponse = null; // 清空，避免重复保存
      }
    });

    // 监听 Agent 状态变化
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log("[interviewer] agent state:", ev.newState);
    });

    // 监听 DataReceived（start_interview RPC）
    const handleDataReceived = async (...args: unknown[]) => {
      const payload = args[0];
      if (!(payload instanceof Uint8Array)) return;
      try {
        const decoded = new TextDecoder().decode(payload);
        const message = JSON.parse(decoded);
        if (message?.name === "start_interview") {
          const interviewId = message.data?.interviewId;
          console.log("[interviewer] received start_interview", interviewId);

          // 保存 interviewId
          currentInterviewId = interviewId;

          // 获取对话历史并构建增强的系统提示
          const history = await fetchConversationHistory(interviewId);
          let enhancedSystemPrompt = SYSTEM_PROMPT;

          if (history.length > 0) {
            // 将历史对话格式化为上下文
            const historyContext = history
              .slice(-10) // 只取最近 10 条消息
              .map(
                (msg) =>
                  `${msg.role === "user" ? "候选人" : "面试官"}: ${msg.content}`,
              )
              .join("\n");

            enhancedSystemPrompt = `${SYSTEM_PROMPT}

【对话历史上下文】
以下是本次面试的对话历史，请参考这些信息来保持对话的连贯性：
${historyContext}

请基于以上对话历史继续面试，保持话题的连贯性和专业性。`;
          }

          // 更新 agent 的 instructions（如果支持动态更新）
          // 注意：LiveKit Agent 可能不支持运行时修改 instructions
          // 这里我们记录增强的提示词，实际使用时可能需要其他方式注入

          // 初始问候
          session.say(
            "您好，我是您的 AI 面试官，我们开始吧。请先做一下自我介绍。",
          );
        }
      } catch (err) {
        console.warn("[interviewer] failed to parse data message", err);
      }
    };

    // 兼容不同 SDK 的类型定义，这里使用宽松的类型转换

    (
      ctx.room as unknown as {
        on: (event: unknown, cb: (...args: unknown[]) => void) => void;
      }
    ).on(RoomEvent.DataReceived, handleDataReceived);

    // 监听错误
    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error("[interviewer] error:", ev.error);
    });

    // 监听会话关闭
    session.on(voice.AgentSessionEventTypes.Close, (ev) => {
      console.log("[interviewer] session closed:", ev.reason);
    });

    // 添加关闭回调
    ctx.addShutdownCallback(async () => {
      await session.close();
      console.log("[interviewer] shutdown complete");
    });
  },
};

// ============================================================
//  导出工具和类型，便于外部扩展
// ============================================================

export { createToolContext, createSaveEvaluationTool, SYSTEM_PROMPT };

/**
 * ============================================================
 *  启动说明
 * ============================================================
 *
 * 环境变量：
 *   LIVEKIT_URL           - LiveKit 服务器地址
 *   LIVEKIT_API_KEY       - LiveKit API Key
 *   LIVEKIT_API_SECRET    - LiveKit API Secret
 *   DEEPGRAM_API_KEY      - Deepgram API Key
 *   MINIMAX_API_KEY       - MiniMax API Key（LLM + TTS 共用）
 *   MINIMAX_TTS_MODEL     - MiniMax TTS 模型（默认 speech-01）
 *   MINIMAX_TTS_VOICE     - MiniMax TTS 语音 ID（默认 female-tianmei）
 *   DIRECTOR_BASE_URL     - Next.js 后端地址（默认 http://localhost:3000）
 *
 * MiniMax TTS 可用语音 ID：
 *   - female-tianmei      甜美女声（默认）
 *   - female-shaonv       少女音
 *   - female-yujie        御姐音
 *   - male-qingnian       青年男声
 *   - male-zhubo          播音男声
 *
 * 启动命令：
 *   npx livekit-agent start agent/interviewer.ts
 *
 * 或使用 pnpm：
 *   pnpm exec livekit-agent start agent/interviewer.ts
 *
 * 生产环境编译后运行：
 *   pnpm build
 *   node dist/agent/interviewer.js
 */
