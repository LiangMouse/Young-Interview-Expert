import { ITTSService } from "../interfaces";
import { AudioFrame } from "@livekit/rtc-node";

interface MiniMaxTTSOptions {
  apiKey: string;
  voiceId?: string;
  sampleRate?: number;
}

export class MiniMaxTTSAdapter implements ITTSService {
  private apiKey: string;
  private voiceId: string;
  private sampleRate: number;
  private baseUrl = "https://api.minimax.chat/v1/t2a_v2";

  constructor(options: MiniMaxTTSOptions) {
    this.apiKey = options.apiKey;
    this.voiceId = options.voiceId || "male-qn-qingse";
    this.sampleRate = options.sampleRate || 32000;
  }

  async *streamAudio(
    textStream: AsyncGenerator<string> | string,
  ): AsyncGenerator<AudioFrame> {
    if (typeof textStream === "string") {
      yield* this.synthesize(textStream);
      return;
    }

    for await (const text of textStream) {
      if (!text.trim()) continue;
      yield* this.synthesize(text);
    }
  }

  private async *synthesize(text: string): AsyncGenerator<AudioFrame> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "speech-01-turbo",
          text: text,
          stream: true,
          voice_setting: {
            voice_id: this.voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: this.sampleRate,
            bitrate: 128000,
            format: "pcm",
            channel: 1,
          },
        }),
      });

      if (!response.ok || !response.body) {
        console.error(`[MiniMax TTS] Error ${response.status}`);
        return;
      }

      // @ts-ignore
      const reader = response.body.getReader();
      const BYTES_PER_SAMPLE = 2;
      const FRAME_SIZE_MS = 20;
      const SAMPLES_PER_FRAME = (this.sampleRate * FRAME_SIZE_MS) / 1000;
      const BYTES_PER_FRAME = SAMPLES_PER_FRAME * BYTES_PER_SAMPLE;

      let buffer = new Uint8Array(0);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;

        while (buffer.length >= BYTES_PER_FRAME) {
          const frameData = buffer.slice(0, BYTES_PER_FRAME);
          buffer = buffer.slice(BYTES_PER_FRAME);

          const int16Data = new Int16Array(
            frameData.buffer,
            frameData.byteOffset,
            frameData.byteLength / 2,
          );

          yield new AudioFrame(int16Data, this.sampleRate, 1, int16Data.length);
        }
      }
    } catch (e) {
      console.error("[TTS Adapter] Error:", e);
    }
  }
}
