import { voice } from "@livekit/agents";
import { buildSystemPrompt } from "../services/context-loader";
import { BASE_SYSTEM_PROMPT } from "../constants/prompts";
import { getCandidateName } from "./profile";
import type { InterviewContext } from "./types";

export function createInterviewApplier(args: {
  session: voice.AgentSession;
  userProfile: unknown;
}) {
  const { session, userProfile } = args;

  let applying: Promise<void> | null = null;
  let queued: InterviewContext | null = null;

  const doApply = async (interview: InterviewContext) => {
    const interviewType = String(interview.type ?? "").trim();
    const candidateName = getCandidateName(userProfile);
    const newPrompt = buildSystemPrompt(
      userProfile,
      BASE_SYSTEM_PROMPT,
      interview,
    );

    // updateAgent 内部会异步 handoff（创建/切换 AgentActivity）。
    // 若立刻 generateReply，新的 Agent 可能尚未绑定 activity，从而抛 “Agent activity not found”。
    const updatedAgent = new voice.Agent({ instructions: newPrompt });
    session.updateAgent(updatedAgent);

    // 等待 handoff 完成：当 updatedAgent.session 可访问时，说明 activity 已绑定
    const deadline = Date.now() + 2500;
    while (true) {
      try {
        void updatedAgent.session;
        break;
      } catch {
        if (Date.now() > deadline) break;
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    const nameHint = candidateName
      ? `请直接称呼候选人“${candidateName}”。`
      : "";
    const interviewHint = interviewType
      ? `今天面试主题是“${interviewType}”。`
      : "";

    await session.generateReply({
      userInput: "系统：面试开场",
      instructions: `你现在以“专业AI面试官”的身份做开场白。${interviewHint}${nameHint}寒暄后请直接进入面试，不要让候选人再确认“面试方向/岗位”。输出请控制在1-2句。结尾必须是问句，并以全角问号“？”结束。最后一句必须包含且仅包含这句核心邀请：请做个简单的自我介绍？`,
      allowInterruptions: true,
    });
  };

  return async (interview: InterviewContext) => {
    if (applying) {
      queued = interview;
      await applying;
      return;
    }

    applying = (async () => {
      await doApply(interview);
      while (queued) {
        const next = queued;
        queued = null;
        await doApply(next);
      }
    })().finally(() => {
      applying = null;
    });

    await applying;
  };
}
