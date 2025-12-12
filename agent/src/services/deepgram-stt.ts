import { ISTTService } from "../interfaces";
import { STT } from "@livekit/agents-plugin-deepgram";
import { stt as STTLib } from "@livekit/agents";
import { AudioFrame } from "@livekit/rtc-node";
import EventEmitter from "events";

export class DeepgramSTTService extends EventEmitter implements ISTTService {
  private sttInstance: STT;
  private sttStream: any; // Type needs to be inferred from library

  constructor(apiKey?: string) {
    super();
    this.sttInstance = new STT({
      apiKey,
      language: "zh",
      model: "nova-2-general",
      smart_format: true,
    });

    this.startStream();
  }

  private startStream() {
    this.sttStream = this.sttInstance.stream();

    // 启动异步循环监听结果
    (async () => {
      try {
        for await (const e of this.sttStream) {
          if (e.type === STTLib.SpeechEventType.INTERIM_TRANSCRIPT) {
            const text = e.alternatives?.[0]?.text;
            if (text) this.emit("interim", text);
          } else if (e.type === STTLib.SpeechEventType.FINAL_TRANSCRIPT) {
            const text = e.alternatives?.[0]?.text;
            if (text) this.emit("final", text);
          }
        }
      } catch (err) {
        console.error("[DeepgramSTT] Stream error:", err);
      }
    })();
  }

  pushFrame(frame: AudioFrame): void {
    if (this.sttStream) {
      this.sttStream.pushFrame(frame);
    }
  }

  close(): void {
    if (this.sttStream) {
      this.sttStream.close();
    }
  }
}
