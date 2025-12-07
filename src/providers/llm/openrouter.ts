// OpenRouter LLM Provider Implementation

import { BaseLLMProvider, LLMMessage, LLMResponse } from './base';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

// Pricing per million tokens (input and output)
export const OPENROUTER_PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.52, output: 0.75 },
};

interface OpenRouterChatCompletionRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: OpenRouterUsage;
  model: string;
}

interface OpenRouterErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenRouterProvider extends BaseLLMProvider {
  /**
   * Send a chat completion request to OpenRouter
   */
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || OPENROUTER_API_BASE;

    const requestBody: OpenRouterChatCompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompt-to-video.workers.dev',
        'X-Title': 'Prompt to Video',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json() as OpenRouterErrorResponse;
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json() as OpenRouterChatCompletionResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter API returned no choices');
    }

    const usage = data.usage;
    const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost,
    };
  }

  /**
   * Estimate the cost for given token counts
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    return this.calculateCost(inputTokens, outputTokens);
  }

  /**
   * Calculate cost based on token usage and model pricing
   */
  private calculateCost(promptTokens: number, completionTokens: number): number {
    const pricing = OPENROUTER_PRICING[this.config.model];

    if (!pricing) {
      console.warn(`No pricing data for model: ${this.config.model}`);
      return 0;
    }

    // Pricing is per million tokens
    const inputCost = (promptTokens * pricing.input) / 1_000_000;
    const outputCost = (completionTokens * pricing.output) / 1_000_000;

    return inputCost + outputCost;
  }
}
