import { ILLMService, ChatMessage } from "../interfaces";
import * as openaiPlugin from "@livekit/agents-plugin-openai";
import { llm } from "@livekit/agents";

interface OpenAILLMOptions {
  apiKey: string;
  model: string;
  baseURL?: string;
  temperature?: number;
}

export class OpenAILLMAdapter implements ILLMService {
  private llmInstance: openaiPlugin.LLM;

  constructor(options: OpenAILLMOptions) {
    this.llmInstance = new openaiPlugin.LLM({
      apiKey: options.apiKey,
      model: options.model,
      baseURL: options.baseURL,
      temperature: options.temperature,
    });
  }

  async *generateResponse(
    history: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    const chatCtx = new llm.ChatContext();

    if (systemPrompt) {
      chatCtx.addMessage({ role: "system", content: systemPrompt });
    }

    for (const msg of history) {
      chatCtx.addMessage({ role: msg.role, content: msg.content });
    }

    // Debug: Print messages being sent
    const debugMessages = [];
    if (systemPrompt)
      debugMessages.push({ role: "system", content: systemPrompt });
    debugMessages.push(...history);
    console.log("[OpenAILLMAdapter] Sending messages:", debugMessages);
    const stream = await this.llmInstance.chat({ chatCtx });

    for await (const chunk of stream) {
      const c = chunk as any;
      const content = c.choices?.[0]?.delta?.content ?? c.content ?? "";
      if (content) {
        yield content;
      }
    }
  }
}
