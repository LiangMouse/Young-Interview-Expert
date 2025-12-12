import { AudioFrame } from "@livekit/rtc-node";

// 聊天消息结构
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 1. LLM 服务接口
export interface ILLMService {
  /**
   * 流式生成回复
   * @param history 对话历史
   * @param systemPrompt 系统预设
   */
  generateResponse(
    history: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string>;
}

// 2. TTS 服务接口
export interface ITTSService {
  /**
   * 将文本流转换为音频帧流
   * @param textStream 文本输入流 (或单个字符串)
   */
  streamAudio(
    textStream: AsyncGenerator<string> | string,
  ): AsyncGenerator<AudioFrame>;
}

// 3. STT 服务接口
// STT通常是推送式模型：推入音频 -> 触发事件
export interface ISTTService {
  /**
   * 推送音频帧进行识别
   */
  pushFrame(frame: AudioFrame): void;

  /**
   * 订阅识别结果
   * @param event 事件类型
   * @param callback 回调函数
   */
  on(event: "interim", callback: (text: string) => void): void;
  on(event: "final", callback: (text: string) => void): void;

  /**
   * 关闭服务
   */
  close(): void;
}
