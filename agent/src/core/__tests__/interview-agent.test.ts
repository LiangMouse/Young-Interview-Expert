import { describe, it, expect, vi, beforeEach } from "vitest";
import { InterviewAgent } from "../interview-agent";
import { buildSystemPrompt } from "../../services/context-loader";
import {
  ILLMService,
  ITTSService,
  ISTTService,
  ChatMessage,
} from "../../interfaces";
import { AudioFrame } from "@livekit/rtc-node";
import EventEmitter from "events";

// Mocks
class MockLLM implements ILLMService {
  async *generateResponse(
    history: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    yield "Hello ";
    yield "there!";
  }
}

class MockTTS implements ITTSService {
  async *streamAudio(
    textStream: AsyncGenerator<string> | string,
  ): AsyncGenerator<AudioFrame> {
    // Consume the text stream
    if (typeof textStream !== "string") {
      const iterator = textStream[Symbol.asyncIterator]();
      let result = await iterator.next();
      while (!result.done) {
        result = await iterator.next();
      }
    }
    // Yield some dummy frames
    yield { data: new Uint8Array([1]) } as unknown as AudioFrame;
    yield { data: new Uint8Array([2]) } as unknown as AudioFrame;
  }
}

class MockSTT extends EventEmitter implements ISTTService {
  pushFrame(frame: AudioFrame): void {}
  close(): void {}
}

describe("InterviewAgent", () => {
  let agent: InterviewAgent;
  let llm: MockLLM;
  let tts: MockTTS;
  let stt: MockSTT;

  beforeEach(() => {
    llm = new MockLLM();
    tts = new MockTTS();
    stt = new MockSTT();
    agent = new InterviewAgent(llm, tts, stt, "System Prompt");
  });

  it("should perform initial greeting on start", async () => {
    const stateSpy = vi.fn();
    agent.on("state_change", stateSpy);

    await agent.start();

    // Expect sequence: PROCESSING -> SPEAKING -> LISTENING
    const calls = stateSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain("PROCESSING");
    expect(calls).toContain("SPEAKING");
    expect(calls[calls.length - 1]).toBe("LISTENING");
    expect((agent as any)._state).toBe("LISTENING");
  });

  it("should process user input and speak response", async () => {
    await agent.start();
    const stateSpy = vi.fn();
    agent.on("state_change", stateSpy);

    // Simulate User Input
    stt.emit("final", "Hello Agent");

    // Wait for the full cycle
    await vi.waitFor(
      () => {
        // Expect sequence: PROCESSING -> SPEAKING -> LISTENING
        const calls = stateSpy.mock.calls.map((c) => c[0]);
        expect(calls).toContain("PROCESSING");
        expect(calls).toContain("SPEAKING");
        expect(calls[calls.length - 1]).toBe("LISTENING");
      },
      { timeout: 1000 },
    );
  });

  it("should handle interruption during speaking", async () => {
    await agent.start();
    const stateSpy = vi.fn();
    agent.on("state_change", stateSpy);

    // Mock TTS to be slow so we can interrupt
    vi.spyOn(tts, "streamAudio").mockImplementation(async function* () {
      yield { data: new Uint8Array([1]) } as unknown as AudioFrame;
      await new Promise((r) => setTimeout(r, 100)); // Delay
      yield { data: new Uint8Array([2]) } as unknown as AudioFrame;
    });

    // Start a turn
    stt.emit("final", "Talk to me");

    // Wait for SPEAKING
    await vi.waitFor(
      () => {
        expect((agent as any)._state).toBe("SPEAKING");
      },
      { timeout: 500 },
    );

    // Interrupt!
    stt.emit("interim", "Stop!");

    // Expect state to go to LISTENING immediately
    expect((agent as any)._state).toBe("LISTENING");
    expect((agent as any).isSpeakingCancelled).toBe(true);

    // Wait a bit to ensure it doesn't flip back unexpectedly or crash
    await new Promise((r) => setTimeout(r, 150));

    // The last state should still be LISTENING (and not set twice ideally, or at least ends in listening)
    expect((agent as any)._state).toBe("LISTENING");
  });
});

describe("buildSystemPrompt", () => {
  it("should wrap candidate/interview context with readonly tags", () => {
    const base = "BASE_PROMPT";
    const profile = {
      nickname: "Alice",
      job_intention: "Frontend",
      experience_years: 3,
      skills: ["React", "TypeScript"],
      work_experiences: [
        {
          company: "Acme",
          position: "Engineer",
          start_date: "2022",
          end_date: "2024",
          description: "Did things",
        },
      ],
      project_experiences: [
        {
          project_name: "Proj",
          role: "Owner",
          tech_stack: ["Next.js"],
          description: "Built stuff",
        },
      ],
    };
    const interview = { type: "frontend:mid", duration: 30, status: "active" };

    const full = buildSystemPrompt(profile, base, interview);

    expect(full).toContain(base);
    expect(full).toContain('<candidate_context readonly="true">');
    expect(full).toContain("</candidate_context>");
    expect(full).toContain('<interview_context readonly="true">');
    expect(full).toContain("</interview_context>");
    expect(full).toContain('<runtime_directives readonly="true">');
    expect(full).toContain("</runtime_directives>");
  });
});
