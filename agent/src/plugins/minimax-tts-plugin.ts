import { AudioByteStream, shortuuid, tokenize, tts } from "@livekit/agents";
import type { AudioFrame } from "@livekit/rtc-node";

export interface MiniMaxTTSOptions {
  apiKey: string;
  voiceId?: string;
  model?: string;
  sampleRate?: number;
}

type ResolvedOptions = Required<Pick<MiniMaxTTSOptions, "apiKey">> &
  Required<Pick<MiniMaxTTSOptions, "voiceId" | "model" | "sampleRate">>;

const DEFAULT_VOICE_ID = "male-qn-qingse";
const DEFAULT_MODEL = "speech-01-turbo";
const DEFAULT_SAMPLE_RATE = 32000;
const DEFAULT_CHANNELS = 1;
const MINIMAX_TTS_URL = "https://api.minimax.chat/v1/t2a_v2";

/**
 * MiniMax TTS（实现 LiveKit Agents 官方 tts.TTS 接口）
 *
 * - `synthesize(text)`：返回 ChunkedStream（音频可边拉取边产出）
 * - `stream()`：通过 LiveKit 内置 StreamAdapter 将“按句合成”适配为流式输入
 */
export class MiniMaxTTS extends tts.TTS {
  label = "minimax.TTS";
  private readonly opts: ResolvedOptions;

  constructor(options: MiniMaxTTSOptions) {
    const resolved: ResolvedOptions = {
      apiKey: options.apiKey,
      voiceId: options.voiceId ?? DEFAULT_VOICE_ID,
      model: options.model ?? DEFAULT_MODEL,
      sampleRate: options.sampleRate ?? DEFAULT_SAMPLE_RATE,
    };

    if (!resolved.apiKey) {
      throw new Error("MINIMAX_API_KEY missing");
    }

    // MiniMax 支持音频流式返回（HTTP response body streaming）
    super(resolved.sampleRate, DEFAULT_CHANNELS, { streaming: true });
    this.opts = resolved;
  }

  synthesize(text: string): MiniMaxChunkedStream {
    return new MiniMaxChunkedStream(this, text, this.opts);
  }

  stream(): tts.SynthesizeStream {
    // MiniMax 的输入端不支持 token-by-token 的“真正流式文本输入”，
    // 用 StreamAdapter 做“按句 flush -> synthesize”的适配，仍可在语音侧边播边出。
    const sentenceTokenizer = new tokenize.basic.SentenceTokenizer();
    return new tts.StreamAdapter(this, sentenceTokenizer).stream();
  }
}

class MiniMaxChunkedStream extends tts.ChunkedStream {
  label = "minimax.ChunkedStream";
  private readonly opts: ResolvedOptions;

  constructor(ttsInstance: MiniMaxTTS, text: string, opts: ResolvedOptions) {
    super(text, ttsInstance);
    this.opts = opts;
  }

  protected async run(): Promise<void> {
    const requestId = shortuuid();
    const segmentId = requestId;

    const response = await fetch(MINIMAX_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.opts.model,
        text: this.inputText,
        stream: true,
        voice_setting: {
          voice_id: this.opts.voiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: this.opts.sampleRate,
          bitrate: 128000,
          format: "pcm",
          channel: DEFAULT_CHANNELS,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(无法读取响应体)");
      throw new Error(
        `[MiniMax TTS] HTTP ${response.status}: ${errorBody.slice(0, 500)}`,
      );
    }

    if (!response.body) {
      throw new Error("[MiniMax TTS] Response body is empty");
    }

    const reader = response.body.getReader();
    const audioByteStream = new AudioByteStream(
      this.opts.sampleRate,
      DEFAULT_CHANNELS,
    );

    let lastFrame: AudioFrame | undefined;

    const sendLastFrame = (final: boolean) => {
      if (!lastFrame) return;
      this.queue.put({
        requestId,
        segmentId,
        frame: lastFrame,
        final,
      });
      lastFrame = undefined;
    };

    // MiniMax stream=true 返回 text/event-stream
    // 每条 event 的 data 是 JSON，其中 audio 为十六进制编码的 PCM 数据：
    // data: {"audio":"<hex>","status":1}
    // data: {"status":2}
    const textDecoder = new TextDecoder();
    let pendingText = "";
    let endedByStatus = false;
    let multiLineDataBuffer = ""; // 用于合并多行 data: 的缓冲区

    const handleAudioBytes = (pcmBytes: ArrayBuffer) => {
      const frames = audioByteStream.write(pcmBytes);
      for (const frame of frames) {
        // 延迟发送一帧，保证最后一帧可被标记为 final=true
        sendLastFrame(false);
        lastFrame = frame;
      }
    };

    const handleEventDataLine = (line: string) => {
      const trimmed = line.trim();

      // SSE 规范：支持多行 data: 合并
      if (trimmed.startsWith("data:")) {
        const content = trimmed.slice("data:".length).trim();
        multiLineDataBuffer += content;
        return; // 继续累积，直到遇到空行
      }

      // 空行表示事件结束，处理累积的 JSON
      if (trimmed === "" && multiLineDataBuffer) {
        const jsonText = multiLineDataBuffer;
        multiLineDataBuffer = ""; // 重置缓冲区

        if (!jsonText) return;

        let payload: unknown;
        try {
          payload = JSON.parse(jsonText);
        } catch (e) {
          console.warn("[MiniMax TTS] JSON 解析失败:", jsonText.slice(0, 100));
          return;
        }

        const isRecord = (v: unknown): v is Record<string, unknown> =>
          typeof v === "object" && v !== null;

        if (!isRecord(payload)) return;

        // MiniMax SSE 的结构是：
        // { data: { audio: "<hex>", status: 1|2, ... }, trace_id: "...", base_resp: ... }
        const inner = isRecord(payload.data) ? payload.data : payload;
        const status = inner.status;
        const audio = inner.audio;

        // 处理 status 为数字或字符串的情况
        const statusNum =
          typeof status === "string" ? parseInt(status, 10) : status;
        if (statusNum === 2) {
          endedByStatus = true;
          return;
        }

        if (typeof audio === "string" && audio.length > 0) {
          // audio 为 hex 编码的 PCM bytes
          const buf = Buffer.from(audio, "hex");
          if (buf.byteLength > 0) {
            handleAudioBytes(
              buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
            );
          }
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      pendingText += textDecoder.decode(value, { stream: true });

      // SSE 以换行分隔，通常是 \n\n 结束一个 event；这里按行解析即可
      const lines = pendingText.split(/\r?\n/);
      pendingText = lines.pop() ?? "";

      for (const line of lines) {
        handleEventDataLine(line);
        if (endedByStatus) break;
      }

      if (endedByStatus) break;
    }

    // 【高优先级修复】处理残留的 pendingText（EOF 时未发送 status=2 的情况）
    if (pendingText.trim()) {
      const lines = pendingText.split(/\r?\n/);
      for (const line of lines) {
        handleEventDataLine(line);
      }
      // 处理最后可能未闭合的多行 data:
      if (multiLineDataBuffer) {
        handleEventDataLine(""); // 触发空行处理逻辑
      }
    }

    // 输出剩余缓存
    for (const frame of audioByteStream.flush()) {
      sendLastFrame(false);
      lastFrame = frame;
    }

    // 最后一帧标记为 final
    sendLastFrame(true);
    this.queue.close();
  }
}
