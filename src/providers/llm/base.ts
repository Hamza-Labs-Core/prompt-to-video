import { LLMProviderConfig } from '../../types/providers';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  /**
   * Send a chat completion request
   * @param messages - Array of chat messages
   * @returns LLM response with content, usage, and cost
   */
  abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;

  /**
   * Estimate the cost for a given number of tokens
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Estimated cost in USD
   */
  abstract estimateCost(inputTokens: number, outputTokens: number): number;

  /**
   * Helper method for structured JSON output
   * @param messages - Array of chat messages
   * @param schema - Optional JSON schema for validation
   * @returns Parsed JSON object of type T
   */
  async json<T>(messages: LLMMessage[], schema?: object): Promise<T> {
    const response = await this.chat(messages);
    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
