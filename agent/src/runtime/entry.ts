import {
  type JobContext,
  llm,
  metrics,
  runWithJobContextAsync,
  voice,
} from "@livekit/agents";
import { Room, RoomEvent, RemoteParticipant } from "@livekit/rtc-node";
import * as silero from "@livekit/agents-plugin-silero";
import * as livekit from "@livekit/agents-plugin-livekit";
import { RoomServiceClient } from "livekit-server-sdk";
import {
  loadInterviewContext,
  loadUserContext,
  buildSystemPrompt,
} from "../services/context-loader";
import { BASE_SYSTEM_PROMPT } from "../constants/prompts";
import { TECH_VOCABULARY } from "../constants/vocabulary";
import type { InterviewContext } from "./types";
import { publishDataToRoom } from "./livekit";
import { getCandidateName } from "./profile";
import { createInterviewApplier } from "./interview";
import { createUserTextResponder } from "./responders";
import { TurnCoordinator } from "./turn-coordinator";
import {
  createDeepgramSTT,
  createMiniMaxLLM,
  createMiniMaxTTS,
} from "../config/providers";
import {
  saveUserMessage,
  saveAiMessage,
} from "../services/message-persistence";

/**
 * Kick all existing agents from a room before connecting.
 * This prevents duplicate agents during hot-reloads.
 */
async function kickOldAgents(roomName: string): Promise<void> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL || process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    console.warn("[kickOldAgents] Missing LiveKit credentials, skipping");
    return;
  }

  // Convert ws:// to http:// for API calls
  const httpUrl = wsUrl.replace(/^ws(s)?:\/\//, "http$1://");

  try {
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    const participants = await roomService.listParticipants(roomName);

    const oldAgents = participants.filter((p) =>
      p.identity.startsWith("agent-"),
    );

    if (oldAgents.length > 0) {
      for (const agent of oldAgents) {
        try {
          await roomService.removeParticipant(roomName, agent.identity);
        } catch (e) {
          console.warn(`[kickOldAgents] Failed to kick ${agent.identity}:`, e);
        }
      }
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    // Room might not exist yet, which is fine
    console.log(
      `[kickOldAgents] Could not check room "${roomName}":`,
      errorMessage,
    );
  }
}

export async function agentEntry(ctx: JobContext) {
  // Get room name from job info (more reliable than ctx.room.name before connect)
  const roomName = ctx.job?.room?.name || ctx.room.name;

  // Kick old agents before connecting (hot-reload cleanup)
  if (roomName) await kickOldAgents(roomName);

  await ctx.connect();

  const participant = await ctx.waitForParticipant();
  const vad = ctx.proc.userData.vad as silero.VAD;

  await runWithJobContextAsync(ctx, async () => {
    await runAgentSession(ctx.room, participant, vad);
  });
}

export async function runAgentSession(
  room: Room,
  participant: RemoteParticipant,
  vad: silero.VAD,
) {
  let userProfile: unknown = null;
  if (!participant.identity.startsWith("agent-")) {
    userProfile = await loadUserContext(participant.identity);
  }

  const currentPrompt = buildSystemPrompt(
    userProfile,
    BASE_SYSTEM_PROMPT,
    null,
  );
  // 从参与者元数据中获取语言设置 (locale)
  let locale = "zh";
  try {
    if (participant.metadata) {
      const metadata = JSON.parse(participant.metadata);
      if (metadata.locale) {
        locale = metadata.locale;
        console.log(`[Agent Session] Detected user locale: ${locale}`);
      }
    }
  } catch (e) {
    console.warn("[Agent Session] Failed to parse participant metadata", e);
  }

  // 定义Agent如何处理音频输入和输出
  const session = new voice.AgentSession({
    stt: createDeepgramSTT(TECH_VOCABULARY, locale),
    llm: createMiniMaxLLM(),
    tts: createMiniMaxTTS(locale),
    vad: vad,
    // 使用 Turn Detector 多语言模型，基于语义理解判断用户是否说完
    // 可以理解"让我想想..."这类语句，不会在用户思考时打断
    turnDetection: new livekit.turnDetector.MultilingualModel(),
    voiceOptions: {
      allowInterruptions: false,
      minInterruptionDuration: 500,
      minInterruptionWords: 0,
      minEndpointingDelay: 1000,
      // 面试场景：允许候选人最长 25 秒的思考时间
      maxEndpointingDelay: 25000,
    },
  });
  const turnCoordinator = new TurnCoordinator(session);

  class InterviewAgent extends voice.Agent {
    async onUserTurnCompleted(
      _chatCtx: llm.ChatContext,
      newMessage: llm.ChatMessage,
    ) {
      const text = newMessage?.textContent?.trim();
      if (text) {
        turnCoordinator.handleUserTurnEnd(text);
      }
      throw new voice.StopResponse();
    }
  }

  const agent = new InterviewAgent({
    instructions: currentPrompt,
    tools: {},
  });

  // Metrics / errors
  const usageCollector = new metrics.UsageCollector();
  session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
    metrics.logMetrics(ev.metrics);
    usageCollector.collect(ev.metrics);
  });
  session.on(voice.AgentSessionEventTypes.Error, (ev) => {
    console.error("[Agent Error]", ev.error);
  });

  session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
    if (ev.transcript?.trim()) {
      turnCoordinator.markVoiceActivity();
    }
  });

  // 使用 ConversationItemAdded 事件处理用户和 Agent 的消息
  // 结合 TurnCoordinator 进行用户轮次合并，避免短暂停顿导致多次回复
  session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
    const item = ev.item;
    if (item.type !== "message") return;
    const text = item.textContent?.trim();
    if (!text) return;

    if (item.role === "user") {
      // 过滤掉以"系统："开头的内部指令，不发送到前端
      if (text.startsWith("系统：") || text.startsWith("系统:")) {
        return;
      }
      if (!turnCoordinator.shouldPublishUserMessage(item)) {
        return;
      }
      // 用户轮次结束，发送完整的用户消息
      publishDataToRoom(room, {
        type: "transcript",
        role: "user",
        text,
        isFinal: true,
        timestamp: Date.now(),
      });

      // 保存用户消息到数据库
      if (latestInterview && typeof latestInterview.id === "string") {
        saveUserMessage(latestInterview.id, text);
      }
    } else if (item.role === "assistant") {
      // Agent 回复
      publishDataToRoom(room, {
        type: "agent_speech",
        text,
        timestamp: Date.now(),
      });

      // 保存 Agent 消息到数据库
      if (latestInterview && typeof latestInterview.id === "string") {
        saveAiMessage(latestInterview.id, text);
      }
    }
  });

  // state for rpc/order
  let sessionRunning = false;
  let pendingInterview: InterviewContext | null = null;
  const pendingUserTexts: string[] = [];
  let startInterviewHandled = false;
  let latestInterview: InterviewContext | null = null;
  let applyInterviewScheduled = false;
  let resolveStartInterview: ((v: InterviewContext) => void) | null = null;
  const startInterviewPromise = new Promise<InterviewContext>((resolve) => {
    resolveStartInterview = resolve;
  });

  const applyInterview = createInterviewApplier({ session, userProfile });
  const respondToUserText = createUserTextResponder({ session });

  const scheduleApplyLatestInterview = () => {
    if (!sessionRunning) return;
    if (!latestInterview) return;
    if (applyInterviewScheduled) return;
    applyInterviewScheduled = true;
    setTimeout(async () => {
      applyInterviewScheduled = false;
      if (!sessionRunning || !latestInterview) return;
      startInterviewHandled = true;
      await applyInterview(latestInterview);
    }, 0);
  };

  const getInterviewId = (m: Record<string, unknown>): string | null => {
    if (m.name !== "start_interview") return null;
    const data = m.data;
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const interviewId = d.interviewId;
    return typeof interviewId === "string" && interviewId ? interviewId : null;
  };

  room.on(RoomEvent.DataReceived, async (payload) => {
    try {
      const msg = JSON.parse(new TextDecoder().decode(payload)) as Record<
        string,
        unknown
      >;

      const interviewId = getInterviewId(msg);
      if (interviewId) {
        const interview = (await loadInterviewContext(
          interviewId,
        )) as InterviewContext | null;
        if (interview) {
          latestInterview = interview;
          if (!sessionRunning) pendingInterview = interview;
          resolveStartInterview?.(interview);
          resolveStartInterview = null;
          scheduleApplyLatestInterview();
          return;
        }
      }

      if (msg.type === "user_text" && typeof msg.text === "string") {
        turnCoordinator.markManualTextInput();
        if (!sessionRunning) {
          pendingUserTexts.push(msg.text);
          return;
        }
        await respondToUserText(msg.text);
      }
    } catch (e) {
      console.error("[RPC] Error processing data message:", e);
    }
  });

  await session.start({ agent, room });
  sessionRunning = true;
  // 给 SDK 一点点时间完成内部 Activity 绑定
  await new Promise((resolve) => setTimeout(resolve, 100));

  while (pendingUserTexts.length) {
    const t = pendingUserTexts.shift();
    if (t) await respondToUserText(t);
  }
  if (pendingInterview) {
    latestInterview = pendingInterview;
    pendingInterview = null;
    scheduleApplyLatestInterview();
  }

  if (!startInterviewHandled) {
    const interviewOrNull = await Promise.race([
      startInterviewPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);

    if (interviewOrNull) {
      latestInterview = interviewOrNull;
      scheduleApplyLatestInterview();
    } else {
      const candidateName = getCandidateName(userProfile);
      const greeting = candidateName
        ? `您好${candidateName},我是今天的面试官,如果你已经准备好,就请做个简单的自我介绍吧`
        : "您好,我是今天的面试官,如果你已经准备好,就请做个简单的自我介绍吧";
      await session.generateReply({
        userInput: "系统：面试开场",
        instructions: `只输出这句固定开场白，不要添加或修改任何内容：${greeting}`,
        allowInterruptions: true,
      });
    }
  }
}
