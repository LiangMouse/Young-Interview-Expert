import EventEmitter from "events";
import {
  ILLMService,
  ITTSService,
  ISTTService,
  ChatMessage,
} from "../interfaces";
import { AudioFrame } from "@livekit/rtc-node";

export type AgentState = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING";

export class InterviewAgent extends EventEmitter {
  private llm: ILLMService;
  private tts: ITTSService;
  private stt: ISTTService;

  private _state: AgentState = "IDLE";
  private history: ChatMessage[] = [];
  private systemPrompt: string;

  // 控制 TTS 播放的取消
  private isSpeakingCancelled = false;

  constructor(
    llm: ILLMService,
    tts: ITTSService,
    stt: ISTTService,
    systemPrompt: string,
  ) {
    super();
    this.llm = llm;
    this.tts = tts;
    this.stt = stt;
    this.systemPrompt = systemPrompt;

    this.setupSTT();
  }

  public async start() {
    console.log("[Agent] Starting interview session...");
    // 主动开场：通过 System Instruction 引导 LLM 打招呼
    const startInstruction =
      "现在面试正式开始。请热情且专业地向候选人打招呼，确认已进入面试，并请候选人先做一个简短的自我介绍。";

    this.history.push({ role: "system", content: startInstruction });

    this.setState("PROCESSING");
    await this.generateAndSpeakResponse();
  }

  public updateSystemPrompt(newPrompt: string) {
    this.systemPrompt = newPrompt;
    console.log("[Agent] System Prompt updated.");
  }

  private setState(newState: AgentState) {
    if (this._state === newState) return;
    console.log(`[Agent] State Transition: ${this._state} -> ${newState}`);
    this._state = newState;
    this.emit("state_change", newState);
  }

  private setupSTT() {
    // STT 识别到说话（含中间结果）
    this.stt.on("interim", (text) => {
      // 打断逻辑
      if (this._state === "SPEAKING") {
        console.log("[Agent] User interrupted! Stopping TTS.");
        this.isSpeakingCancelled = true;
        this.setState("LISTENING");
      }
    });

    // STT 识别到整句（经过防抖）
    this.stt.on("final", async (text) => {
      console.log(`[Agent] User Final: ${text}`);
      this.emit("user_transcript", text); // UI update

      // 状态流转
      if (this._state === "PROCESSING") return; // 已经在思考了，忽略后续碎片？或者追加？

      // 简单处理：收到 input 就思考
      await this.processTurn(text);
    });
  }

  private async processTurn(userText: string) {
    this.setState("PROCESSING");
    this.history.push({ role: "user", content: userText });
    await this.generateAndSpeakResponse();
  }

  private async generateAndSpeakResponse() {
    try {
      // 1. LLM 生成
      const llmStream = this.llm.generateResponse(
        this.history,
        this.systemPrompt,
      );

      // 我们需要一个流来暂存完整的 AI 回复，用于存入历史
      let fullAiResponse = "";

      // 重新封装 llmStream 以便同时用于 history recording
      const textIterator = llmStream[Symbol.asyncIterator]();

      const ttsInputGenerator = async function* () {
        let result = await textIterator.next();
        while (!result.done) {
          const chunk = result.value;
          fullAiResponse += chunk;
          // Emit UI update
          yield chunk;
          result = await textIterator.next();
        }
      };

      // 启动 TTS 转换
      const wrappedGenerator = (async function* (agent: InterviewAgent) {
        const inner = ttsInputGenerator();
        for await (const chunk of inner) {
          agent.emit("agent_text_delta", chunk);
          yield chunk;
        }
      })(this);

      const audioStream = this.tts.streamAudio(wrappedGenerator);

      this.setState("SPEAKING");
      this.isSpeakingCancelled = false;

      for await (const frame of audioStream) {
        if (this.isSpeakingCancelled) {
          break;
        }
        this.emit("agent_audio_frame", frame);
      }

      // 结束一轮
      if (!this.isSpeakingCancelled) {
        this.history.push({ role: "assistant", content: fullAiResponse });
        this.setState("LISTENING");
      }
    } catch (err) {
      console.error("[Agent] Error processing turn:", err);
      this.setState("LISTENING");
    }
  }

  // 暴露给 Bridge 喂音频数据
  public pushAudio(frame: AudioFrame) {
    this.stt.pushFrame(frame);
  }
}
