import { voice, llm } from "@livekit/agents";
import {
  buildSystemPrompt,
  loadInterviewMessages,
} from "../services/context-loader";
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

    // Load history
    let historyMessages: any[] = [];
    const interviewId =
      typeof interview.id === "string"
        ? interview.id
        : String(interview.id || "");
    if (interviewId) {
      historyMessages = await loadInterviewMessages(interviewId);
    }

    const chatCtx = new llm.ChatContext();
    // Inject History
    if (historyMessages.length > 0) {
      for (const msg of historyMessages) {
        const role =
          msg.role === "user"
            ? "user"
            : msg.role === "assistant"
              ? "assistant"
              : "system";
        // Skip system messages to let the new instructions take precedence
        if (role === "system") continue;

        chatCtx.addMessage({
          role: role as any,
          content: msg.content,
        });
      }
      console.log(
        `[Interview] Restored ${historyMessages.length} messages into context.`,
      );
    }

    // updateAgent 内部会异步 handoff（创建/切换 AgentActivity）。
    // 若立刻 generateReply，新的 Agent 可能尚未绑定 activity，从而抛 “Agent activity not found”。
    const updatedAgent = new voice.Agent({
      instructions: newPrompt,
      chatCtx,
    });

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

    // Only greet if no history
    if (historyMessages.length === 0) {
      const greeting = candidateName
        ? `您好${candidateName},我是今天的面试官,如果你已经准备好,就请做个简单的自我介绍吧`
        : "您好,我是今天的面试官,如果你已经准备好,就请做个简单的自我介绍吧";

      await session.generateReply({
        userInput: "系统：面试开场",
        instructions: `只输出这句固定开场白，不要添加或修改任何内容：${greeting}`,
        allowInterruptions: true,
      });
    } else {
      console.log("[Interview] Skipped greeting due to existing history.");
    }
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
