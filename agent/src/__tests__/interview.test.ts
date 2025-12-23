import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the context loader so we don't pull in supabase or heavy deps
vi.mock("../services/context-loader", () => {
  return {
    buildSystemPrompt: vi.fn(() => "PROMPT_FROM_BUILD"),
  };
});

// Mock @livekit/agents voice.Agent so we can control the handoff-wait loop
vi.mock("@livekit/agents", () => {
  class Agent {
    public _ready = false;
    public _instructions: string;
    constructor(opts: { instructions: string }) {
      this._instructions = opts.instructions;
    }
    get session() {
      if (!this._ready) {
        throw new Error("Agent activity not found");
      }
      return {};
    }
  }
  return { voice: { Agent } };
});

import { createInterviewApplier } from "../runtime/interview";

describe("runtime/interview.createInterviewApplier", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("updates agent and generates a natural kickoff that includes candidate name", async () => {
    const session = {
      updateAgent: vi.fn((agent: any) => {
        agent._ready = true;
      }),
      generateReply: vi.fn(async () => {}),
    };

    const apply = createInterviewApplier({
      session: session as any,
      userProfile: { nickname: "梁爽" },
    });

    await apply({ type: "frontend:beginner", duration: 10 });

    expect(session.updateAgent).toHaveBeenCalledTimes(1);
    const agentInstance = session.updateAgent.mock.calls[0][0];
    expect(agentInstance._instructions).toBe("PROMPT_FROM_BUILD");

    expect(session.generateReply).toHaveBeenCalledTimes(1);
    const arg = session.generateReply.mock.calls[0][0];
    expect(arg.userInput).toBe("系统：面试开场");
    expect(String(arg.instructions)).toContain(
      "只输出这句固定开场白，不要添加或修改任何内容：您好梁爽,我是今天的面试官,如果你已经准备好,就请做个简单的自我介绍吧",
    );
  });

  it("queues concurrent apply calls and runs them sequentially", async () => {
    vi.useFakeTimers();
    const events: string[] = [];

    const session = {
      updateAgent: vi.fn((agent: any) => {
        events.push("update");
        agent._ready = true;
      }),
      generateReply: vi.fn(async () => {
        events.push("reply");
        await new Promise((r) => setTimeout(r, 10));
      }),
    };

    const apply = createInterviewApplier({
      session: session as any,
      userProfile: { nickname: "梁爽" },
    });

    const p1 = apply({ type: "frontend:beginner" });
    const p2 = apply({ type: "frontend:intermediate" });

    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);

    expect(session.updateAgent).toHaveBeenCalledTimes(2);
    expect(session.generateReply).toHaveBeenCalledTimes(2);
    expect(events.filter((e) => e === "update").length).toBe(2);
    expect(events.filter((e) => e === "reply").length).toBe(2);
  });
});
