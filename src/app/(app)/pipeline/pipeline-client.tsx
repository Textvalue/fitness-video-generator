"use client";

import { useState } from "react";

interface PipelineData {
  trainers: { id: string; name: string; baseImageUrl: string }[];
  environments: { id: string; name: string; prompt: string }[];
  exercises: { id: string; name: string; description: string }[];
}

type Step = "select" | "image" | "video" | "complete";

export function PipelineClient({ data }: { data: PipelineData }) {
  const [step, setStep] = useState<Step>("select");
  const [trainerId, setTrainerId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [veoVersion, setVeoVersion] = useState("veo-3.1");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  const selectedExercise = data.exercises.find((e) => e.id === exerciseId);
  const selectedEnvironment = data.environments.find((e) => e.id === environmentId);
  const selectedTrainer = data.trainers.find((t) => t.id === trainerId);

  const handleGenerateImage = async () => {
    if (!trainerId || !environmentId || !exerciseId) return;
    setLoading(true);
    setError(null);
    setStep("image");

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId, environmentId, exerciseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image generation failed");
      }

      const result = await res.json();
      setGeneratedImageUrl(result.imageUrl);
      setGenerationId(result.generationId);
      setStep("video");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generationId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, veoVersion }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Video generation failed");
      }

      const result = await res.json();
      setGeneratedVideoUrl(result.videoUrl);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-headline font-black text-6xl text-kp-on-surface leading-none tracking-tighter mb-4">
          GENERATION
          <br />
          <span className="text-kp-secondary">PIPELINE</span>
        </h1>
        <p className="text-kp-on-surface-variant max-w-md">
          Select a trainer, environment, and exercise to generate an AI-powered
          fitness video.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-12">
        {(["select", "image", "video", "complete"] as Step[]).map((s, idx) => {
          const labels = ["1. Select", "2. Image", "3. Video", "4. Complete"];
          const isActive = step === s;
          const isPast =
            ["select", "image", "video", "complete"].indexOf(step) > idx;
          return (
            <div key={s} className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-full text-xs font-headline font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-kp-primary text-kp-on-primary"
                    : isPast
                    ? "bg-kp-primary/20 text-kp-primary"
                    : "bg-kp-surface-container-highest text-kp-on-surface-variant"
                }`}
              >
                {labels[idx]}
              </div>
              {idx < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    isPast ? "bg-kp-primary" : "bg-kp-surface-container-highest"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-kp-error-container/20 text-kp-error text-sm">
          {error}
        </div>
      )}

      {/* Step: Select */}
      {step === "select" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trainer Selection */}
          <div className="bg-kp-surface-container-low p-8 rounded-xl">
            <h3 className="font-headline font-bold text-lg uppercase tracking-tighter mb-6 text-kp-primary">
              Select Trainer
            </h3>
            <div className="space-y-3">
              {data.trainers.length === 0 && (
                <p className="text-xs text-kp-on-surface-variant">
                  No trainers uploaded yet. Go to Trainers page first.
                </p>
              )}
              {data.trainers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTrainerId(t.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                    trainerId === t.id
                      ? "bg-kp-primary/10 ring-1 ring-kp-primary"
                      : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                  }`}
                >
                  <img
                    src={t.baseImageUrl}
                    alt={t.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="font-headline font-bold text-sm">
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Environment Selection */}
          <div className="bg-kp-surface-container-low p-8 rounded-xl">
            <h3 className="font-headline font-bold text-lg uppercase tracking-tighter mb-6 text-kp-secondary">
              Select Environment
            </h3>
            <div className="space-y-3">
              {data.environments.length === 0 && (
                <p className="text-xs text-kp-on-surface-variant">
                  No environments configured yet.
                </p>
              )}
              {data.environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvironmentId(env.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    environmentId === env.id
                      ? "bg-kp-secondary/10 ring-1 ring-kp-secondary"
                      : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                  }`}
                >
                  <div className="font-headline font-bold text-sm mb-1">
                    {env.name}
                  </div>
                  <p className="text-[10px] text-kp-on-surface-variant line-clamp-2">
                    {env.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Selection */}
          <div className="bg-kp-surface-container-low p-8 rounded-xl">
            <h3 className="font-headline font-bold text-lg uppercase tracking-tighter mb-6 text-kp-on-surface">
              Select Exercise
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {data.exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setExerciseId(ex.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    exerciseId === ex.id
                      ? "bg-kp-primary/10 ring-1 ring-kp-primary"
                      : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                  }`}
                >
                  <div className="font-headline font-bold text-sm mb-1">
                    {ex.name}
                  </div>
                  <p className="text-[10px] text-kp-on-surface-variant line-clamp-1">
                    {ex.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Image Preview / Video */}
      {(step === "image" || step === "video") && (
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-kp-surface-container-low p-8 rounded-xl">
            <h3 className="font-headline font-bold text-lg uppercase tracking-tighter mb-6">
              Generated Image
            </h3>
            {loading && step === "image" ? (
              <div className="aspect-video bg-kp-surface-container-highest rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="relative w-16 h-1 bg-kp-surface-container-highest overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-kp-secondary animate-pulse" />
                </div>
                <span className="text-[10px] font-headline uppercase tracking-widest text-kp-secondary">
                  Generating with Nano Banana...
                </span>
              </div>
            ) : generatedImageUrl ? (
              <img
                src={generatedImageUrl}
                alt="Generated"
                className="w-full aspect-video object-cover rounded-xl"
              />
            ) : null}
          </div>

          <div className="bg-kp-surface-container-low p-8 rounded-xl">
            <h3 className="font-headline font-bold text-lg uppercase tracking-tighter mb-6">
              Configuration
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-kp-on-surface-variant block mb-2">
                  Exercise
                </label>
                <div className="text-kp-on-surface font-bold">
                  {selectedExercise?.name}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-kp-on-surface-variant block mb-2">
                  Environment
                </label>
                <div className="text-kp-on-surface font-bold">
                  {selectedEnvironment?.name}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase tracking-widest text-kp-on-surface-variant block mb-2">
                  Veo Version
                </label>
                <select
                  value={veoVersion}
                  onChange={(e) => setVeoVersion(e.target.value)}
                  className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
                >
                  <option value="veo-3.1">Veo 3.1 (Best Quality)</option>
                  <option value="veo-3.1-fast">Veo 3.1 Fast</option>
                  <option value="veo-3.0">Veo 3.0</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && generatedVideoUrl && (
        <div className="bg-kp-surface-container-low p-8 rounded-xl">
          <h3 className="font-headline font-bold text-2xl uppercase tracking-tighter mb-6 text-kp-primary">
            Generation Complete
          </h3>
          <video
            src={generatedVideoUrl}
            controls
            className="w-full max-w-3xl mx-auto rounded-xl"
          />
          <div className="mt-8 flex justify-center gap-4">
            <a
              href={generatedVideoUrl}
              download
              className="bg-kp-primary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest"
            >
              Download Video
            </a>
            <button
              onClick={() => {
                setStep("select");
                setGeneratedImageUrl(null);
                setGeneratedVideoUrl(null);
                setGenerationId(null);
              }}
              className="bg-kp-surface-container-highest text-kp-on-surface px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest"
            >
              New Generation
            </button>
          </div>
        </div>
      )}

      {/* Action Button */}
      {step === "select" && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleGenerateImage}
            disabled={!trainerId || !environmentId || !exerciseId || loading}
            className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-12 py-4 rounded-full font-headline font-black text-lg uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(221,255,177,0.3)] transition-all"
          >
            {loading ? "Generating..." : "Generate Image"}
          </button>
        </div>
      )}

      {step === "video" && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleGenerateVideo}
            disabled={loading}
            className="bg-gradient-to-r from-kp-secondary to-kp-primary text-kp-on-primary px-12 py-4 rounded-full font-headline font-black text-lg uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(0,227,253,0.3)] transition-all"
          >
            {loading ? "Generating Video..." : "Generate Video"}
          </button>
        </div>
      )}
    </div>
  );
}
