import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as openai from "@livekit/agents-plugin-openai";
import { MiniMaxTTS } from "../plugins/minimax-tts-plugin";

export const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";
export const DEFAULT_MINIMAX_MODEL = "abab5.5s-chat";
export const DEFAULT_MINIMAX_TEMPERATURE = 0.7;

// 默认使用 Deepgram 的高精度通用模型
export const DEFAULT_DEEPGRAM_MODEL = "nova-2-general";
export const DEFAULT_DEEPGRAM_LANGUAGE = "zh-CN";
export const DEFAULT_DEEPGRAM_SMART_FORMAT = true;
export const DEEPGRAM_KEYTERM_LIMIT = 20;

export const DEFAULT_MINIMAX_VOICE_ID = "male-qn-qingse";

function requireEnv(name: string): string {
  const v = process.env[name];
  const resolved = typeof v === "string" ? v.trim() : "";
  if (!resolved) {
    throw new Error(`[Agent Config] Missing required env: ${name}`);
  }
  return resolved;
}

export function getMiniMaxApiKey(): string {
  return requireEnv("MINIMAX_API_KEY");
}

export function getDeepgramApiKey(): string {
  return requireEnv("DEEPGRAM_API_KEY");
}

export function getMiniMaxModel(): string {
  const v = process.env.MINIMAX_MODEL;
  const resolved = typeof v === "string" ? v.trim() : "";
  return resolved || DEFAULT_MINIMAX_MODEL;
}

export function getDeepgramModel(): string {
  const v = process.env.DEEPGRAM_MODEL;
  const resolved = typeof v === "string" ? v.trim() : "";
  return resolved || DEFAULT_DEEPGRAM_MODEL;
}

export function createDeepgramSTT(keyterm: string[]) {
  const cleanedKeyterms = Array.isArray(keyterm)
    ? keyterm
        .filter((k) => typeof k === "string" && k.trim())
        .slice(0, DEEPGRAM_KEYTERM_LIMIT)
    : [];
  const keywords: [string, number][] = cleanedKeyterms.map((keyword) => [
    keyword,
    1,
  ]);

  return new deepgram.STT({
    apiKey: getDeepgramApiKey(),
    // 使用 as any 绕过类型检查，最新模型在类型定义中可能缺失
    model: getDeepgramModel() as any,
    language: DEFAULT_DEEPGRAM_LANGUAGE,
    smartFormat: DEFAULT_DEEPGRAM_SMART_FORMAT,
    keywords,
    keyterm: cleanedKeyterms,
  });
}

export function createMiniMaxLLM() {
  return new openai.LLM({
    apiKey: getMiniMaxApiKey(),
    model: getMiniMaxModel(),
    baseURL: MINIMAX_BASE_URL,
    temperature: DEFAULT_MINIMAX_TEMPERATURE,
  });
}

export function createMiniMaxTTS() {
  return new MiniMaxTTS({
    apiKey: getMiniMaxApiKey(),
    voiceId: DEFAULT_MINIMAX_VOICE_ID,
  });
}
