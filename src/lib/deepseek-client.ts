import { createDeepSeek } from "@ai-sdk/deepseek";

/**
 * DeepSeek 客户端配置
 */
export const deepseekClient = createDeepSeek({
  apiKey: process.env.DEEPSEEK_V3_API ?? "",
});

/**
 * 获取 DeepSeek 客户端实例
 */
export function getDeepSeekClient() {
  if (!process.env.DEEPSEEK_V3_API) {
    throw new Error("DEEPSEEK_V3_API environment variable is not set");
  }

  return deepseekClient;
}

/**
 * 验证 DeepSeek API 配置
 */
export function validateDeepSeekConfig(): { isValid: boolean; error?: string } {
  if (!process.env.DEEPSEEK_V3_API) {
    return {
      isValid: false,
      error: "DEEPSEEK_V3_API environment variable is not set",
    };
  }

  if (process.env.DEEPSEEK_V3_API.length < 10) {
    return {
      isValid: false,
      error: "DEEPSEEK_V3_API appears to be invalid (too short)",
    };
  }

  return { isValid: true };
}
