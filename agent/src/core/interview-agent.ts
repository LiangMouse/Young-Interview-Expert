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

  public start() {
    this.setState("LISTENING");
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

    try {
      // 1. LLM 生成
      const llmStream = this.llm.generateResponse(
        this.history,
        this.systemPrompt,
      );

      // 我们需要一个流来暂存完整的 AI 回复，用于存入历史
      let fullAiResponse = "";

      // 创建一个 PassThrough 流或者简单的 AsyncGenerator 分发
      // 这里为了简单，我们采用这种模式：
      // LLM 产生 text chunk -> 1. 发给 UI  2. 喂给 TTS buffer
      // 但 LLM 和 TTS 速率不匹配。我们需要一个中间 buffer 或者 pipe。

      // 最简单的 Pipeline 实现：
      // 启动 TTS 生成任务，它消费 llmStream
      // 同时我们在消费过程中记录文本

      // 重新封装 llmStream 以便同时用于 history recording
      const textIterator = llmStream[Symbol.asyncIterator]();

      const ttsInputGenerator = async function* () {
        let result = await textIterator.next();
        while (!result.done) {
          const chunk = result.value;
          fullAiResponse += chunk;
          // Emit UI update
          // 注意：这里 `this` 绑定问题，改用箭头函数或闭包
          yield chunk;
          result = await textIterator.next();
        }
      };

      // 启动 TTS 转换
      // 注意：我们需要在 ttsInputGenerator 里 emit 文本事件，这样 UI 才能看到字打出来
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
