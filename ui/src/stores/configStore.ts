import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectConfig, LLMProviderConfig, ImageProviderConfig, VideoProviderConfig, CompileProviderConfig } from '../types';

interface ConfigState {
  // LLM Config
  llmProvider: 'openrouter' | 'openai' | 'anthropic' | 'workers-ai' | 'google';
  llmApiKey: string;
  llmModel: string;

  // Image Config
  imageProvider: 'fal-flux' | 'fal-sdxl' | 'replicate' | 'openai-dalle' | 'stability';
  imageApiKey: string;

  // Video Config
  videoProvider: 'fal-kling' | 'runway' | 'pika' | 'luma' | 'minimax';
  videoApiKey: string;
  videoQuality: 'standard' | 'pro';

  // Compile Config
  compileProvider: 'creatomate' | 'shotstack' | 'none';
  compileApiKey: string;

  // Actions
  setLLMConfig: (provider: ConfigState['llmProvider'], apiKey: string, model: string) => void;
  setImageConfig: (provider: ConfigState['imageProvider'], apiKey: string) => void;
  setVideoConfig: (provider: ConfigState['videoProvider'], apiKey: string, quality: ConfigState['videoQuality']) => void;
  setCompileConfig: (provider: ConfigState['compileProvider'], apiKey: string) => void;

  // Getters
  getConfig: () => ProjectConfig;
  hasRequiredKeys: () => boolean;
  clearConfig: () => void;
}

const DEFAULT_MODELS: Record<ConfigState['llmProvider'], string> = {
  'openrouter': 'anthropic/claude-3.5-sonnet',
  'openai': 'gpt-4o',
  'anthropic': 'claude-3-5-sonnet-20241022',
  'workers-ai': '@cf/meta/llama-3.1-8b-instruct',
  'google': 'gemini-pro-1.5',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Default values
      llmProvider: 'openrouter',
      llmApiKey: '',
      llmModel: DEFAULT_MODELS['openrouter'],

      imageProvider: 'fal-flux',
      imageApiKey: '',

      videoProvider: 'fal-kling',
      videoApiKey: '',
      videoQuality: 'standard',

      compileProvider: 'none',
      compileApiKey: '',

      // Actions
      setLLMConfig: (provider, apiKey, model) => {
        set({
          llmProvider: provider,
          llmApiKey: apiKey,
          llmModel: model || DEFAULT_MODELS[provider],
        });
      },

      setImageConfig: (provider, apiKey) => {
        set({
          imageProvider: provider,
          imageApiKey: apiKey,
        });
      },

      setVideoConfig: (provider, apiKey, quality) => {
        set({
          videoProvider: provider,
          videoApiKey: apiKey,
          videoQuality: quality,
        });
      },

      setCompileConfig: (provider, apiKey) => {
        set({
          compileProvider: provider,
          compileApiKey: apiKey,
        });
      },

      getConfig: (): ProjectConfig => {
        const state = get();

        const llmConfig: LLMProviderConfig = {
          provider: state.llmProvider,
          apiKey: state.llmApiKey,
          model: state.llmModel,
        };

        const imageConfig: ImageProviderConfig = {
          provider: state.imageProvider,
          apiKey: state.imageApiKey,
        };

        const videoConfig: VideoProviderConfig = {
          provider: state.videoProvider,
          apiKey: state.videoApiKey,
          quality: state.videoQuality,
        };

        const compileConfig: CompileProviderConfig = {
          provider: state.compileProvider,
          apiKey: state.compileApiKey,
        };

        return {
          llm: llmConfig,
          image: imageConfig,
          video: videoConfig,
          compile: compileConfig,
        };
      },

      hasRequiredKeys: (): boolean => {
        const state = get();

        // Check LLM (Workers AI doesn't need key if using Cloudflare's free tier)
        const hasLLMKey = state.llmProvider === 'workers-ai' || state.llmApiKey.length > 0;

        // Image and Video providers always need keys
        const hasImageKey = state.imageApiKey.length > 0;
        const hasVideoKey = state.videoApiKey.length > 0;

        // Compile provider only needs key if not 'none'
        const hasCompileKey = state.compileProvider === 'none' || state.compileApiKey.length > 0;

        return hasLLMKey && hasImageKey && hasVideoKey && hasCompileKey;
      },

      clearConfig: () => {
        set({
          llmProvider: 'openrouter',
          llmApiKey: '',
          llmModel: DEFAULT_MODELS['openrouter'],
          imageProvider: 'fal-flux',
          imageApiKey: '',
          videoProvider: 'fal-kling',
          videoApiKey: '',
          videoQuality: 'standard',
          compileProvider: 'none',
          compileApiKey: '',
        });
      },
    }),
    {
      name: 'prompt-to-video-config',
    }
  )
);

// Helper to get available models per provider
export const PROVIDER_MODELS: Record<ConfigState['llmProvider'], Array<{ value: string; label: string }>> = {
  'openrouter': [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  ],
  'openai': [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  'anthropic': [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  'workers-ai': [
    { value: '@cf/meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
    { value: '@cf/meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { value: '@cf/qwen/qwen1.5-14b-chat-awq', label: 'Qwen 1.5 14B' },
  ],
  'google': [
    { value: 'gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'gemini-flash-1.5', label: 'Gemini Flash 1.5' },
  ],
};
