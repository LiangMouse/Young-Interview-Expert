import {
  type JobContext,
  metrics,
  runWithJobContextAsync,
  voice,
} from "@livekit/agents";
import { RoomEvent } from "@livekit/rtc-node";
import * as silero from "@livekit/agents-plugin-silero";
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
import {
  createDeepgramSTT,
  createMiniMaxLLM,
  createMiniMaxTTS,
} from "../config/providers";

export async function agentEntry(ctx: JobContext) {
  await ctx.connect();

  const participant = await ctx.waitForParticipant();

  let userProfile: unknown = null;
  if (!participant.identity.startsWith("agent-")) {
    userProfile = await loadUserContext(participant.identity);
  }

  const currentPrompt = buildSystemPrompt(
    userProfile,
    BASE_SYSTEM_PROMPT,
    null,
  );
  const agent = new voice.Agent({
    instructions: currentPrompt,
    tools: {},
  });

  const session = new voice.AgentSession({
    stt: createDeepgramSTT(TECH_VOCABULARY),
    llm: createMiniMaxLLM(),
    tts: createMiniMaxTTS(),
    vad: ctx.proc.userData.vad as silero.VAD,
    voiceOptions: { allowInterruptions: true, minInterruptionDuration: 500 },
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

  // Transcript -> web
  session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
    publishDataToRoom(ctx.room, {
      type: "transcript",
      role: "user",
      text: ev.transcript,
      isFinal: true,
      timestamp: Date.now(),
    });
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

  ctx.room.on(RoomEvent.DataReceived, async (payload) => {
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

  await runWithJobContextAsync(ctx, async () => {
    await session.start({ agent, room: ctx.room });
  });
  sessionRunning = true;

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
      const nameHint = candidateName
        ? `请直接称呼候选人“${candidateName}”。`
        : "";
      await session.generateReply({
        userInput: "系统：面试开场",
        instructions: `你现在以“专业AI面试官”的身份做开场白。${nameHint}寒暄后请直接进入面试。输出请控制在1-2句。结尾必须是问句，并以全角问号“？”结束。最后一句必须包含且仅包含这句核心邀请：请做个简单的自我介绍？`,
        allowInterruptions: true,
      });
    }
  }
}
