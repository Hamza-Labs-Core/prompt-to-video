import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useConfig } from "../hooks/useConfig";
import type { VideoStyle, CreateProjectRequest } from "../types";

const STYLE_OPTIONS: Array<{ value: VideoStyle; label: string }> = [
  { value: "cinematic", label: "Cinematic" },
  { value: "minimal", label: "Minimal" },
  { value: "energetic", label: "Energetic" },
  { value: "documentary", label: "Documentary" },
  { value: "dramatic", label: "Dramatic" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
  { value: "artistic", label: "Artistic" },
];

const DURATION_OPTIONS = [
  { value: "30", label: "30 seconds" },
  { value: "45", label: "45 seconds" },
  { value: "60", label: "1 minute" },
  { value: "90", label: "1.5 minutes" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "1:1", label: "1:1 (Square)" },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { config, hasRequiredKeys } = useConfig();

  const [concept, setConcept] = useState("");
  const [style, setStyle] = useState<VideoStyle>("cinematic");
  const [duration, setDuration] = useState(60);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate config
    if (!hasRequiredKeys()) {
      setError("Please configure your API keys in Settings first.");
      return;
    }

    // Validate concept
    if (concept.trim().length < 10) {
      setError("Please provide a more detailed concept (at least 10 characters).");
      return;
    }

    setLoading(true);

    try {
      const projectRequest: CreateProjectRequest = {
        name: concept.substring(0, 50) + (concept.length > 50 ? "..." : ""),
        concept: concept.trim(),
        style,
        targetDuration: duration,
        aspectRatio,
        config,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const data = await response.json();

      if (data.success && data.data?.id) {
        navigate(`/project/${data.data.id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost = calculateEstimatedCost(duration);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create AI Videos from Text
        </h1>
        <p className="text-gray-400 text-lg">
          Describe your vision and let AI create a professional video with dynamic scenes,
          cinematic camera movements, and compelling visuals.
        </p>
      </div>

      {/* Config Warning */}
      {!hasRequiredKeys() && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
            You haven't configured your API keys yet.{" "}
            <button
              onClick={() => navigate("/settings")}
              className="underline hover:no-underline font-medium"
            >
              Go to Settings
            </button>
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Video Concept</CardTitle>
          <CardDescription>
            Describe what you want to create. Be as detailed as possible for best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              placeholder="Example: Epic blacksmith forge video revealing the Hamza Labs emblem with fire, molten gold, and dramatic lighting. The camera slowly pushes in on a medieval anvil as sparks fly..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={8}
              disabled={loading}
            />

            {/* Style Selection */}
            <Select
              label="Style"
              value={style}
              onChange={(e) => setStyle(e.target.value as VideoStyle)}
              options={STYLE_OPTIONS}
            />

            {/* Duration and Aspect Ratio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Duration"
                value={duration.toString()}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                options={DURATION_OPTIONS}
              />

              <Select
                label="Aspect Ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                options={ASPECT_RATIO_OPTIONS}
              />
            </div>

            {/* Cost Estimate */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">
                Estimated cost:{" "}
                <span className="font-semibold text-white">${estimatedCost.toFixed(2)}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Actual cost may vary based on final scene count and complexity
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!concept.trim() || loading}
              className="w-full"
            >
              {loading ? "Creating Project..." : "Generate Direction"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              This will create a project and generate a shot-by-shot plan using AI.
              You'll be able to review and refine before generating the video.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Calculate rough estimated cost based on duration
 * This is a placeholder - actual costs depend on provider rates
 */
function calculateEstimatedCost(durationSeconds: number): number {
  // Rough estimate:
  // - 1 shot per 5-7 seconds = ~6-12 shots per minute
  // - Each shot needs 2 images (~$0.05 each) + 1 video (~$0.25)
  // - LLM direction (~$0.10)

  const shotsEstimate = Math.ceil(durationSeconds / 6);
  const imageCost = shotsEstimate * 2 * 0.05;
  const videoCost = shotsEstimate * 0.25;
  const llmCost = 0.1;

  return imageCost + videoCost + llmCost;
}

export default HomePage;
