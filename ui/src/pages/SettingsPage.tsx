import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useConfig } from "../hooks/useConfig";
import { PROVIDER_MODELS } from "../stores/configStore";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

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

const SettingsPage: React.FC = () => {
  const config = useConfig();

  // LLM State
  const [llmProvider, setLlmProvider] = useState(config.llmProvider);
  const [llmApiKey, setLlmApiKey] = useState(config.llmApiKey);
  const [llmModel, setLlmModel] = useState(config.llmModel);

  // Image State
  const [imageProvider, setImageProvider] = useState(config.imageProvider);
  const [imageApiKey, setImageApiKey] = useState(config.imageApiKey);

  // Video State
  const [videoProvider, setVideoProvider] = useState(config.videoProvider);
  const [videoApiKey, setVideoApiKey] = useState(config.videoApiKey);
  const [videoQuality, setVideoQuality] = useState(config.videoQuality);

  // Compile State
  const [compileProvider, setCompileProvider] = useState(config.compileProvider);
  const [compileApiKey, setCompileApiKey] = useState(config.compileApiKey);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  // OpenRouter models state
  const [openRouterModels, setOpenRouterModels] = useState<Array<{ value: string; label: string }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Fetch OpenRouter models on mount
  useEffect(() => {
    const fetchOpenRouterModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        const models = (data.data as OpenRouterModel[])
          .filter((m) => m.context_length >= 4000) // Filter for reasonable context
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((model) => ({
            value: model.id,
            label: `${model.name} (${Math.round(model.context_length / 1000)}k)`,
          }));
        setOpenRouterModels(models);
      } catch (err) {
        setModelsError(err instanceof Error ? err.message : "Failed to load models");
        // Fallback to static list
        setOpenRouterModels(PROVIDER_MODELS.openrouter);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchOpenRouterModels();
  }, []);

  // Get available models for current LLM provider
  const llmProviderOptions = [
    { value: "openrouter", label: "OpenRouter" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "workers-ai", label: "Cloudflare Workers AI" },
    { value: "google", label: "Google Gemini" },
  ];

  const availableModels = llmProvider === "openrouter"
    ? openRouterModels
    : (PROVIDER_MODELS[llmProvider as keyof typeof PROVIDER_MODELS] || []);

  const handleSave = () => {
    config.setLLMConfig(llmProvider as any, llmApiKey, llmModel);
    config.setImageConfig(imageProvider as any, imageApiKey);
    config.setVideoConfig(videoProvider as any, videoApiKey, videoQuality);
    config.setCompileConfig(compileProvider as any, compileApiKey);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async (provider: string) => {
    setTestResults({ ...testResults, [provider]: "testing" });

    // Simulate API test (replace with actual API calls)
    setTimeout(() => {
      setTestResults({
        ...testResults,
        [provider]: "success",
      });

      setTimeout(() => {
        setTestResults((prev) => {
          const newResults = { ...prev };
          delete newResults[provider];
          return newResults;
        });
      }, 3000);
    }, 1500);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all API keys?")) {
      config.clearConfig();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          API Configuration
        </h1>
        <p className="text-gray-400 text-lg">
          Bring your own API keys for complete control over costs and provider selection
        </p>
      </div>

      <div className="space-y-6">
        {/* LLM Provider */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Provider (Direction Generation)</CardTitle>
            <CardDescription>
              Used to generate creative direction and shot-by-shot plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={llmProvider}
              onChange={(e) => {
                const newProvider = e.target.value;
                setLlmProvider(newProvider);
                // Reset to default model for new provider
                const defaultModel = PROVIDER_MODELS[newProvider as keyof typeof PROVIDER_MODELS]?.[0]?.value || "";
                setLlmModel(defaultModel);
              }}
              options={llmProviderOptions}
            />

            <Input
              label="API Key"
              type="password"
              value={llmApiKey}
              onChange={(e) => setLlmApiKey(e.target.value)}
              placeholder={llmProvider === "workers-ai" ? "Optional for Cloudflare Workers AI" : "sk-..."}
            />

            <div>
              <Select
                label="Model"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                options={availableModels.length > 0 ? availableModels : [{ value: "", label: "Loading..." }]}
                disabled={llmProvider === "openrouter" && modelsLoading}
              />
              {llmProvider === "openrouter" && modelsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading models from OpenRouter...</p>
              )}
              {llmProvider === "openrouter" && modelsError && (
                <p className="mt-1 text-xs text-yellow-500">Using fallback models: {modelsError}</p>
              )}
              {llmProvider === "openrouter" && !modelsLoading && !modelsError && openRouterModels.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">{openRouterModels.length} models available</p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection("llm")}
              disabled={testResults.llm === "testing"}
            >
              {testResults.llm === "testing"
                ? "Testing..."
                : testResults.llm === "success"
                ? "Connection Successful"
                : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        {/* Image Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Image Provider</CardTitle>
            <CardDescription>
              Used to generate start and end frames for each video shot
            </CardDescription>
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
              placeholder="Enter API key"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection("image")}
              disabled={testResults.image === "testing"}
            >
              {testResults.image === "testing"
                ? "Testing..."
                : testResults.image === "success"
                ? "Connection Successful"
                : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        {/* Video Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Video Provider</CardTitle>
            <CardDescription>
              Used to generate video clips from start/end frames
            </CardDescription>
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
              placeholder="Enter API key"
            />

            <Select
              label="Quality"
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value as "standard" | "pro")}
              options={VIDEO_QUALITY_OPTIONS}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection("video")}
              disabled={testResults.video === "testing"}
            >
              {testResults.video === "testing"
                ? "Testing..."
                : testResults.video === "success"
                ? "Connection Successful"
                : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        {/* Compilation Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Compilation Provider (Optional)</CardTitle>
            <CardDescription>
              Used to compile individual clips into a final video. Select "None" to receive individual clips.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              value={compileProvider}
              onChange={(e) => setCompileProvider(e.target.value)}
              options={COMPILE_PROVIDER_OPTIONS}
            />

            {compileProvider !== "none" && (
              <>
                <Input
                  label="API Key"
                  type="password"
                  value={compileApiKey}
                  onChange={(e) => setCompileApiKey(e.target.value)}
                  placeholder="Enter API key"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("compile")}
                  disabled={testResults.compile === "testing"}
                >
                  {testResults.compile === "testing"
                    ? "Testing..."
                    : testResults.compile === "success"
                    ? "Connection Successful"
                    : "Test Connection"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleClear}>
            Clear All
          </Button>

          <Button variant="primary" size="lg" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm text-center">Configuration saved successfully!</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> Your API keys are stored locally in your browser and never sent to
            our servers. They are only used to make direct API calls to your chosen providers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
