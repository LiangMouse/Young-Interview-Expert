import { ILLMService, ChatMessage } from "../interfaces";
import * as llm from "@livekit/agents-plugin-openai";

interface OpenAILLMOptions {
  apiKey: string;
  model: string;
  baseURL?: string;
  temperature?: number;
}

export class OpenAILLMAdapter implements ILLMService {
  private llmInstance: llm.LLM;

  constructor(options: OpenAILLMOptions) {
    this.llmInstance = new llm.LLM({
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

    const stream = await this.llmInstance.chat({ chatCtx });

    for await (const chunk of stream) {
      const content = chunk.delta?.content ?? "";
      if (content) {
        yield content;
      }
    }
  }
}
