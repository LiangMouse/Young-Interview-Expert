import { ISTTService } from "../interfaces";
import { AudioFrame } from "@livekit/rtc-node";
import EventEmitter from "events";

export class DebouncedSTTService extends EventEmitter implements ISTTService {
  private internalSTT: ISTTService;
  private debounceMs: number;
  private timer: NodeJS.Timeout | null = null;
  private buffer: string = "";

  constructor(internalSTT: ISTTService, debounceMs: number = 3000) {
    super();
    this.internalSTT = internalSTT;
    this.debounceMs = debounceMs;
    this.setupListeners();
  }

  private setupListeners() {
    // Forward raw events if needed, but primarily we manage the 'final' logic
    this.internalSTT.on("interim", (text) => {
      this.emit("interim", text);
      this.resetTimer();
    });

    this.internalSTT.on("final", (text) => {
      // 这里我们拦截原本的 final，把它视为句子片段
      // 只有防抖结束后，才对外抛出真正的 heavy-weight 'final_sentence'
      // 但为了 UI 显示，原本的 final 也可以抛出一个 lightweight 事件，比如 'fragment'
      this.emit("fragment", text); // 此事件接口中未定义，属于扩展

      this.buffer += (this.buffer ? " " : "") + text;
      this.resetTimer();
    });
  }

  private resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  private flush() {
    if (!this.buffer.trim()) return;

    // 触发真正的“一句话结束”
    // 注意：这里我们复用了 'final' 事件名，表示对于 Consumer 来说，用来做 LLM 输入的最终文本
    this.emit("final", this.buffer);
    this.buffer = "";
    this.timer = null;
  }

  pushFrame(frame: AudioFrame): void {
    this.internalSTT.pushFrame(frame);
  }

  close(): void {
    if (this.timer) clearTimeout(this.timer);
    this.internalSTT.close();
  }
}
