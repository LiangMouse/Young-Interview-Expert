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
  defineAgent,
  WorkerOptions,
} from "@livekit/agents";
import { STT } from "@livekit/agents-plugin-deepgram";
import { LLM, TTS } from "@livekit/agents-plugin-openai";
import { RoomEvent } from "livekit-client";
import { fileURLToPath } from "node:url";

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
 * 定义 worker 对象供 LiveKit CLI 或自启动使用
 */
const agentWorker = {
  /**
   * prewarm: Worker 启动时预加载资源
   * 可在此预热模型、加载配置等
   */
  prewarm: async (proc: JobProcess) => {
    // 预加载工具上下文
    proc.userData.toolContext = createToolContext();
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

    // 获取预加载的工具上下文
    const toolContext =
      (ctx.proc.userData.toolContext as llm.ToolContext) ?? createToolContext();

    // 创建 Voice Agent
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

    // 监听用户转写事件（可用于日志/调试）
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      console.log("[interviewer] user:", ev.transcript);
    });

    // 监听 Agent 状态变化
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log("[interviewer] agent state:", ev.newState);
    });

    // 监听 DataReceived（start_interview RPC）
    const handleDataReceived = (...args: unknown[]) => {
      const payload = args[0];
      if (!(payload instanceof Uint8Array)) return;
      try {
        const decoded = new TextDecoder().decode(payload);
        const message = JSON.parse(decoded);
        if (message?.name === "start_interview") {
          const interviewId = message.data?.interviewId;
          console.log("[interviewer] received start_interview", interviewId);
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

// 默认导出（保持兼容性，供 CLI 工具使用）
export default agentWorker;

// ============================================================
//  导出工具和类型，便于外部扩展
// ============================================================

export { createToolContext, createSaveEvaluationTool, SYSTEM_PROMPT };

// ============================================================
//  自启动逻辑
// ============================================================

/**
 * 检查当前文件是否是被直接执行的入口文件
 * 如果是，则提供启动说明
 */
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  console.log("🚀 LiveKit Interviewer Agent");
  console.log("============================");
  console.log("");
  console.log("此文件现在可以作为独立进程常驻运行！");
  console.log("");
  console.log("启动方式：");
  console.log("1. 使用 LiveKit CLI (推荐):");
  console.log("   pnpm exec livekit-agent start agent/interviewer.ts");
  console.log("   或");
  console.log("   npx livekit-agent start agent/interviewer.ts");
  console.log("");
  console.log("2. 直接运行此文件 (需要环境变量):");
  console.log("   tsx agent/interviewer.ts");
  console.log("   或");
  console.log("   node dist/agent/interviewer.js (需要先编译)");
  console.log("");
  console.log("环境变量检查:");
  const requiredEnvVars = [
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "DEEPGRAM_API_KEY",
    "MINIMAX_API_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length > 0) {
    console.error(`❌ 缺少必要的环境变量: ${missingEnvVars.join(", ")}`);
    console.error("请确保已设置所有必需的环境变量。");
    process.exit(1);
  } else {
    console.log("✅ 所有必需的环境变量已设置");
  }

  console.log("");
  console.log("正在启动 Worker...");

  try {
    cli.runApp(
      new WorkerOptions({
        agent: fileURLToPath(import.meta.url),
      }),
    );
  } catch (error) {
    console.error("❌ 启动 Worker 失败:", error);
    console.error("");
    console.error("💡 请尝试使用 CLI 命令启动:");
    console.error("   pnpm exec livekit-agent start agent/interviewer.ts");
    process.exit(1);
  }
}

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
 * 启动方式（三种方式都可以）：
 *
 * 方式 1: 直接运行（推荐，代码会自动启动 Worker）
 *   tsx agent/interviewer.ts
 *   或
 *   node dist/agent/interviewer.js  (需要先编译)
 *
 * 方式 2: 使用 LiveKit CLI（稳定可靠）
 *   npx livekit-agent start agent/interviewer.ts
 *   或
 *   pnpm exec livekit-agent start agent/interviewer.ts
 *
 * 方式 3: 使用编程方式启动
 *   node -e "import('./agent/interviewer.ts')"
 *
 * 生产环境编译后运行：
 *   pnpm build
 *   node dist/agent/interviewer.js
 */
