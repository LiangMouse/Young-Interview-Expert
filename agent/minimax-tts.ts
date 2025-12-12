import { AudioFrame } from "@livekit/rtc-node";

interface MiniMaxTTSOptions {
  apiKey: string;
  voiceId?: string; // e.g. "male-qn-qingse", "female-yujie"
  sampleRate?: number; // default 32000
}

export class MiniMaxTTS {
  private apiKey: string;
  private voiceId: string;
  private sampleRate: number;
  private baseUrl = "https://api.minimax.chat/v1/t2a_v2";

  constructor(options: MiniMaxTTSOptions) {
    this.apiKey = options.apiKey;
    this.voiceId = options.voiceId || "male-qn-qingse";
    this.sampleRate = options.sampleRate || 32000;
  }

  // 生成语音流
  async *stream(
    textStream: AsyncIterable<string> | string,
  ): AsyncIterable<AudioFrame> {
    if (typeof textStream === "string") {
      // 单次调用
      yield* this.synthesize(textStream);
      return;
    }

    // 流式调用: 简单起见，我们将每段文本单独生成一个请求
    // 更好的做法是建立一个长连接或 websocket，但 MiniMax T2A 是 HTTP POST。
    // 为了降低延迟，我们可以并行请求，或者顺序请求。
    // 这里采用顺序请求：收到一段文本 -> 生成音频 -> 播放 -> 下一段
    for await (const text of textStream) {
      if (!text.trim()) continue;
      yield* this.synthesize(text);
    }
  }

  private async *synthesize(text: string): AsyncIterable<AudioFrame> {
    const start = Date.now();
    console.log(`[MiniMax TTS] Requesting for: "${text.substring(0, 10)}..."`);

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
          stream: true, // 开启流式
          voice_setting: {
            voice_id: this.voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: this.sampleRate,
            bitrate: 128000,
            format: "pcm", // 请求 PCM 格式
            channel: 1,
          },
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        console.error(`[MiniMax TTS] API Error ${response.status}: ${errText}`);
        return;
      }

      // 读取响应流
      // @ts-ignore: node-fetch stream typing
      const reader = response.body.getReader();
      const FRAME_SIZE_MS = 20; // LiveKit 推荐 20ms
      const BYTES_PER_SAMPLE = 2; // Int16 = 2 bytes
      const SAMPLES_PER_FRAME = (this.sampleRate * FRAME_SIZE_MS) / 1000; // e.g. 32000 * 0.02 = 640 samples
      const BYTES_PER_FRAME = SAMPLES_PER_FRAME * BYTES_PER_SAMPLE; // 1280 bytes

      let buffer = new Uint8Array(0);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 将新数据追加到 buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;

        // 切割出完整的音频帧
        while (buffer.length >= BYTES_PER_FRAME) {
          const frameData = buffer.slice(0, BYTES_PER_FRAME);
          buffer = buffer.slice(BYTES_PER_FRAME);

          // 转换为 Int16Array
          const int16Data = new Int16Array(
            frameData.buffer,
            frameData.byteOffset,
            frameData.byteLength / 2,
          );

          yield new AudioFrame(
            int16Data,
            this.sampleRate,
            1, // channels
            int16Data.length, // samplesPerChannel (since channels = 1)
          );
        }
      }
    } catch (e) {
      console.error("[MiniMax TTS] Synthesis error:", e);
    }
    const duration = Date.now() - start;
    // console.log(`[MiniMax TTS] Finished in ${duration}ms`);
  }
}
