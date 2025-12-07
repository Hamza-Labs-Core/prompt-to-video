import { useConfigStore } from '../stores/configStore';
import type { ProjectConfig } from '../types';

export interface UseConfigReturn {
  // Current config values
  config: ProjectConfig;

  // LLM
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;

  // Image
  imageProvider: string;
  imageApiKey: string;

  // Video
  videoProvider: string;
  videoApiKey: string;
  videoQuality: 'standard' | 'pro';

  // Compile
  compileProvider: string;
  compileApiKey: string;

  // Actions
  setLLMConfig: (provider: any, apiKey: string, model: string) => void;
  setImageConfig: (provider: any, apiKey: string) => void;
  setVideoConfig: (provider: any, apiKey: string, quality: 'standard' | 'pro') => void;
  setCompileConfig: (provider: any, apiKey: string) => void;

  // Validation
  hasRequiredKeys: () => boolean;
  clearConfig: () => void;
}

/**
 * Hook to access and manage provider configuration
 * Provides access to API keys and provider settings stored in localStorage
 */
export function useConfig(): UseConfigReturn {
  const store = useConfigStore();

  return {
    config: store.getConfig(),

    llmProvider: store.llmProvider,
    llmApiKey: store.llmApiKey,
    llmModel: store.llmModel,

    imageProvider: store.imageProvider,
    imageApiKey: store.imageApiKey,

    videoProvider: store.videoProvider,
    videoApiKey: store.videoApiKey,
    videoQuality: store.videoQuality,

    compileProvider: store.compileProvider,
    compileApiKey: store.compileApiKey,

    setLLMConfig: store.setLLMConfig,
    setImageConfig: store.setImageConfig,
    setVideoConfig: store.setVideoConfig,
    setCompileConfig: store.setCompileConfig,

    hasRequiredKeys: store.hasRequiredKeys,
    clearConfig: store.clearConfig,
  };
}
