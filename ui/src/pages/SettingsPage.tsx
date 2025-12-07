import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useSettings } from "../hooks/useSettings";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

const LLM_PROVIDER_OPTIONS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "workers-ai", label: "Cloudflare Workers AI" },
  { value: "google", label: "Google Gemini" },
];

const IMAGE_PROVIDER_OPTIONS = [
  { value: "fal-flux", label: "fal.ai Flux" },
  { value: "fal-sdxl", label: "fal.ai SDXL" },
  { value: "replicate", label: "Replicate" },
  { value: "openai-dalle", label: "OpenAI DALL-E" },
  { value: "stability", label: "Stability AI" },
];

const VIDEO_PROVIDER_OPTIONS = [
  { value: "fal-kling", label: "fal.ai Kling" },
  { value: "runway", label: "Runway Gen-3" },
  { value: "pika", label: "Pika" },
  { value: "luma", label: "Luma Dream Machine" },
  { value: "minimax", label: "Minimax" },
];

const COMPILE_PROVIDER_OPTIONS = [
  { value: "none", label: "None (Individual clips)" },
  { value: "creatomate", label: "Creatomate" },
  { value: "shotstack", label: "Shotstack" },
];

const VIDEO_QUALITY_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "pro", label: "Pro" },
];

const STATIC_LLM_MODELS: Record<string, Array<{ value: string; label: string }>> = {
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
  ],
  'google': [
    { value: 'gemini-pro-1.5', label: 'Gemini Pro 1.5' },
    { value: 'gemini-flash-1.5', label: 'Gemini Flash 1.5' },
  ],
};

const SettingsPage: React.FC = () => {
  const { settings, isLoading, saveSettings, isSaving } = useSettings();

  // Form state - starts empty, populated from server
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("anthropic/claude-3.5-sonnet");

  const [imageProvider, setImageProvider] = useState("fal-flux");
  const [imageApiKey, setImageApiKey] = useState("");

  const [videoProvider, setVideoProvider] = useState("fal-kling");
  const [videoApiKey, setVideoApiKey] = useState("");
  const [videoQuality, setVideoQuality] = useState<"standard" | "pro">("standard");

  const [compileProvider, setCompileProvider] = useState("none");
  const [compileApiKey, setCompileApiKey] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // OpenRouter models state
  const [openRouterModels, setOpenRouterModels] = useState<Array<{ value: string; label: string }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Populate form from settings when loaded
  useEffect(() => {
    if (settings) {
      if (settings.llm.providerName) setLlmProvider(settings.llm.providerName);
      if (settings.llm.model) setLlmModel(settings.llm.model);
      if (settings.image.providerName) setImageProvider(settings.image.providerName);
      if (settings.video.providerName) setVideoProvider(settings.video.providerName);
      if (settings.video.extraConfig?.quality) {
        setVideoQuality(settings.video.extraConfig.quality as "standard" | "pro");
      }
      if (settings.compile.providerName) setCompileProvider(settings.compile.providerName);
    }
  }, [settings]);

  // Fetch OpenRouter models on mount
  useEffect(() => {
    const fetchOpenRouterModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        const models = (data.data as OpenRouterModel[])
          .filter((m) => m.context_length >= 4000)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((model) => ({
            value: model.id,
            label: `${model.name} (${Math.round(model.context_length / 1000)}k)`,
          }));
        setOpenRouterModels(models);
      } catch {
        // Fallback
        setOpenRouterModels([
          { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
          { value: 'openai/gpt-4o', label: 'GPT-4o' },
        ]);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchOpenRouterModels();
  }, []);

  const getAvailableModels = () => {
    if (llmProvider === "openrouter") {
      return openRouterModels.length > 0 ? openRouterModels : [{ value: "", label: "Loading..." }];
    }
    return STATIC_LLM_MODELS[llmProvider] || [];
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);

    try {
      const settingsToSave = [
        {
          provider: 'llm' as const,
          apiKey: llmApiKey,
          providerName: llmProvider,
          model: llmModel,
        },
        {
          provider: 'image' as const,
          apiKey: imageApiKey,
          providerName: imageProvider,
        },
        {
          provider: 'video' as const,
          apiKey: videoApiKey,
          providerName: videoProvider,
          extraConfig: { quality: videoQuality },
        },
        {
          provider: 'compile' as const,
          apiKey: compileApiKey,
          providerName: compileProvider,
        },
      ];

      await saveSettings(settingsToSave);
      setSaveSuccess(true);

      // Clear API key fields after save (they're now stored securely on server)
      setLlmApiKey("");
      setImageApiKey("");
      setVideoApiKey("");
      setCompileApiKey("");

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-500 mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          API Configuration
        </h1>
        <p className="text-gray-400 text-lg">
          Your API keys are encrypted and stored securely on our servers
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Provider */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>LLM Provider (Direction Generation)</CardTitle>
                <CardDescription>
                  Used to generate creative direction and shot-by-shot plans
                </CardDescription>
              </div>
              {settings?.llm.hasKey && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={llmProvider}
              onChange={(e) => {
                setLlmProvider(e.target.value);
                const models = STATIC_LLM_MODELS[e.target.value];
                if (models?.[0]) setLlmModel(models[0].value);
              }}
              options={LLM_PROVIDER_OPTIONS}
            />

            <Input
              label="API Key"
              type="password"
              value={llmApiKey}
              onChange={(e) => setLlmApiKey(e.target.value)}
              placeholder={settings?.llm.hasKey ? "Enter new key to update" : "Enter API key"}
            />

            <div>
              <Select
                label="Model"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                options={getAvailableModels()}
                disabled={llmProvider === "openrouter" && modelsLoading}
              />
              {llmProvider === "openrouter" && modelsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading models...</p>
              )}
              {llmProvider === "openrouter" && !modelsLoading && openRouterModels.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">{openRouterModels.length} models available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Provider */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Image Provider</CardTitle>
                <CardDescription>
                  Used to generate start and end frames for each video shot
                </CardDescription>
              </div>
              {settings?.image.hasKey && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={imageProvider}
              onChange={(e) => setImageProvider(e.target.value)}
              options={IMAGE_PROVIDER_OPTIONS}
            />

            <Input
              label="API Key"
              type="password"
              value={imageApiKey}
              onChange={(e) => setImageApiKey(e.target.value)}
              placeholder={settings?.image.hasKey ? "Enter new key to update" : "Enter API key"}
            />
          </CardContent>
        </Card>

        {/* Video Provider */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Video Provider</CardTitle>
                <CardDescription>
                  Used to generate video clips from start/end frames
                </CardDescription>
              </div>
              {settings?.video.hasKey && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={videoProvider}
              onChange={(e) => setVideoProvider(e.target.value)}
              options={VIDEO_PROVIDER_OPTIONS}
            />

            <Input
              label="API Key"
              type="password"
              value={videoApiKey}
              onChange={(e) => setVideoApiKey(e.target.value)}
              placeholder={settings?.video.hasKey ? "Enter new key to update" : "Enter API key"}
            />

            <Select
              label="Quality"
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value as "standard" | "pro")}
              options={VIDEO_QUALITY_OPTIONS}
            />
          </CardContent>
        </Card>

        {/* Compilation Provider */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Compilation Provider (Optional)</CardTitle>
                <CardDescription>
                  Used to compile individual clips into a final video
                </CardDescription>
              </div>
              {settings?.compile.hasKey && compileProvider !== "none" && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={compileProvider}
              onChange={(e) => setCompileProvider(e.target.value)}
              options={COMPILE_PROVIDER_OPTIONS}
            />

            {compileProvider !== "none" && (
              <Input
                label="API Key"
                type="password"
                value={compileApiKey}
                onChange={(e) => setCompileApiKey(e.target.value)}
                placeholder={settings?.compile.hasKey ? "Enter new key to update" : "Enter API key"}
              />
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {saveError && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm text-center">Settings saved securely!</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Security:</strong> Your API keys are encrypted with AES-256-GCM using a
            key derived from your account. They are stored securely on Cloudflare's edge
            network and only decrypted when making API calls on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
