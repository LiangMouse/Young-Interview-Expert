import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as openai from "@livekit/agents-plugin-openai";
import { MiniMaxTTS } from "../plugins/minimax-tts-plugin";

export const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";
export const DEFAULT_MINIMAX_MODEL = "abab5.5s-chat";
export const DEFAULT_MINIMAX_TEMPERATURE = 0.4;

// 默认使用 Deepgram 的高精度通用模型（多语言）
export const DEFAULT_DEEPGRAM_MODEL = "nova-3-general";
export const DEFAULT_DEEPGRAM_LANGUAGE = "zh";
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

export function getDeepgramLanguage(): string {
  const v = process.env.DEEPGRAM_LANGUAGE;
  const resolved = typeof v === "string" ? v.trim() : "";
  if (!resolved) return DEFAULT_DEEPGRAM_LANGUAGE;

  const normalized = resolved.toLowerCase();
  if (normalized === "en-us" || normalized === "en") return "en-US";
  if (normalized === "zh-cn" || normalized === "zh_cn" || normalized === "zh")
    return "zh";
  return resolved;
}

function resolveDeepgramModel(language: string): string {
  const model = getDeepgramModel();
  const lang = language.toLowerCase();
  const isEnglish = lang === "en-us" || lang === "en";

  // nova-3 系列目前仅支持英文，非英文时提前回退，避免 400
  if (!isEnglish && model.startsWith("nova-3")) {
    return "nova-2-general";
  }

  return model;
}

export function createDeepgramSTT(keyterm: string[], language?: string) {
  const cleanedKeyterms = Array.isArray(keyterm)
    ? keyterm
        .filter((k) => typeof k === "string" && k.trim())
        .slice(0, DEEPGRAM_KEYTERM_LIMIT)
    : [];
  const resolvedLanguage = language || getDeepgramLanguage();
  const resolvedModel = resolveDeepgramModel(resolvedLanguage);
  const normalizedLanguage = resolvedLanguage.toLowerCase();
  const isEnglish =
    normalizedLanguage === "en" || normalizedLanguage === "en-us";

  // Deepgram 对非英文场景的 keyword boost 支持有限，且 SDK 会对 keywords 进行双重编码导致 400，
  // 因此仅保留 keyterm 作为提示词，keywords 置空。
  const keywords: [string, number][] = [];

  // 实验性：尝试为中文场景也启用 keyterm，测试是否能提升准确率
  const resolvedKeyterms = cleanedKeyterms;

  const sttInstance = new deepgram.STT({
    apiKey: getDeepgramApiKey(),
    // 使用 as any 绕过类型检查，最新模型在类型定义中可能缺失
    model: resolvedModel as any,
    language: resolvedLanguage,
    smartFormat: DEFAULT_DEEPGRAM_SMART_FORMAT,
    keywords,
    keyterm: resolvedKeyterms,
  });

  return sttInstance;
}

export function createMiniMaxLLM() {
  return new openai.LLM({
    apiKey: getMiniMaxApiKey(),
    model: getMiniMaxModel(),
    baseURL: MINIMAX_BASE_URL,
    temperature: DEFAULT_MINIMAX_TEMPERATURE,
  });
}

export function createMiniMaxTTS(language?: string) {
  // 根据语言选择音色，如果是英文用英文音色，中文用中文音色
  const isEnglish = language?.toLowerCase().startsWith("en");
  const voiceId = isEnglish ? "female-en-nina" : DEFAULT_MINIMAX_VOICE_ID;

  return new MiniMaxTTS({
    apiKey: getMiniMaxApiKey(),
    voiceId: voiceId,
  });
}
