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
import {
  voice,
  llm,
  type JobContext,
  type JobProcess,
  cli,
  WorkerOptions,
} from "@livekit/agents";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

import { fetchConversationHistory } from "./utils";
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

    if (!deepgramKey) throw new Error("DEEPGRAM_API_KEY 未配置");
    if (!minimaxKey) throw new Error("MINIMAX_API_KEY 未配置");

    const livekitKey = process.env.LIVEKIT_API_KEY;
    console.log(
      `[Config Check] LiveKit API Key Prefix: ${livekitKey?.substring(0, 4)}***`,
    );

    // 连接到房间
    await ctx.connect();
    console.log(`connected to room: ${ctx.room.name}`);

    // 延迟初始化以等待环境就绪
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 初始化组件
    // 初始化 STT（Deepgram）
    let stt = undefined;
    try {
      stt = new STT({
        apiKey: deepgramKey,
        model: DEEPGRAM_MODEL as "nova-2-general",
        language: "zh",
      });
      console.log("STT Initialized");
    } catch (e) {
      console.warn("STT Init Failed:", e);
    }

    const chatLlm = new LLM({
      apiKey: minimaxKey,
      baseURL: MINIMAX_BASE_URL,
      model: MINIMAX_MODEL,
      temperature: 0.7,
    });

    const tts = new TTS({
      apiKey: minimaxKey,
      baseURL: MINIMAX_BASE_URL,
      model: MINIMAX_TTS_MODEL,
      voice: MINIMAX_TTS_VOICE as any,
    });

    const toolContext =
      (ctx.proc.userData.toolContext as llm.ToolContext) ?? createToolContext();
    const securityEngine =
      (ctx.proc.userData.securityEngine as GuardrailsEngine) ??
      createSecurityEngine();

    let currentInterviewId: string | null = null;
    let agent: voice.Agent | null = null;

    try {
      console.log("Initializing Voice Agent...");
      agent = new voice.Agent({
        instructions: SYSTEM_PROMPT,
        stt: undefined as any,
        llm: chatLlm,
        tts,
        tools: toolContext,
        allowInterruptions: true,
      });

      // (agent as any).start(ctx.room);
      console.log("Voice Agent initialized (no start call)");

      (agent as any).on("start", () =>
        console.log("[interviewer] agent start event"),
      );
    } catch (err) {
      console.error("FATAL: Failed to initialize Voice Agent:", err);
    }

    // 监听 DataReceived
    ctx.room.on(
      RoomEvent.DataReceived,
      async (
        payload: Uint8Array,
        participant: any,
        kind: any,
        topic?: string,
      ) => {
        if (!(payload instanceof Uint8Array)) return;
        try {
          const decoded = new TextDecoder().decode(payload);
          let message;
          try {
            message = JSON.parse(decoded);
          } catch {
            return;
          }

          // Start Interview RPC
          if (message?.name === "start_interview") {
            const interviewId = message.data?.interviewId;
            console.log("[interviewer] received start_interview", interviewId);
            currentInterviewId = interviewId;

            const history = await fetchConversationHistory(interviewId);

            if (agent) {
              // 尝试调用 agent.say
              // 注意：v1 SDK 中可能没有 agent.say，而是 agent.synthesize 或 context 操作
              // 我们这里仅作尝试，如果失败仅 Log
              try {
                // @ts-ignore
                if (typeof agent.say === "function")
                  await agent.say(
                    "您好，我是您的 AI 面试官，我们开始吧。请先做一下自我介绍。",
                  );
              } catch (e) {
                console.debug("agent.say not available");
              }
            }
            return;
          }

          // User Text
          if (message?.type === "user_text") {
            const userText = message.text;
            console.log("[interviewer] received text message:", userText);
            console.log("DEBUG: SUPER SIMPLE TEST - NO LOGIC RUNNING");
          }
        } catch (err) {
          console.warn("[interviewer] failed to parse data message", err);
        }
      },
    );

    // 保持进程运行
    await new Promise(() => {});
  },
};

// ============================================================
//  导出工具和类型，便于外部扩展
// ============================================================

// ... [existing exports] ...
export { createToolContext, createSaveEvaluationTool, SYSTEM_PROMPT };

// Check if directly being run
const isMainModule =
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith(path.basename(fileURLToPath(import.meta.url)));

if (isMainModule || require.main === module) {
  console.log("AGENT VERSION: DEBUG-004-FRESH-FILE");
  const key = process.env.LIVEKIT_API_KEY;
  console.log(
    `[Startup] Loading with LiveKit Key: ${key ? key.substring(0, 4) + "***" : "UNDEFINED"}`,
  );
  cli.runApp(
    new WorkerOptions({
      agent: fileURLToPath(import.meta.url),
    }),
  );
}
