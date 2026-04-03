"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Exercise {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  generationPrompt: string | null;
  bodyParts: string[];
  category: string;
  equipment: string[];
  difficulty: number;
}

interface Trainer {
  id: string;
  name: string;
  baseImageUrl: string;
  baseImageKey: string;
}

interface Environment {
  id: string;
  name: string;
  prompt: string;
  previewUrl: string | null;
}

interface ExistingGeneration {
  id: string;
  exerciseId: string;
  trainerId: string;
  trainerName: string;
  imageUrl: string;
  videoUrl: string | null;
  status: string;
}

interface GenerationItem {
  exerciseId: string;
  exerciseName: string;
  generationId: string | null;
  imageStatus: "pending" | "generating" | "completed" | "failed";
  videoStatus: "idle" | "pending" | "generating" | "completed" | "failed";
  imageUrl: string | null;
  videoUrl: string | null;
  error: string | null;
  selectedForVideo: boolean;
}

type WizardStep = "coach-env" | "select-exercises" | "generate-images" | "review-images" | "generate-videos" | "done";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "select-exercises", label: "1. Exercises" },
  { key: "coach-env", label: "2. Coach & Env" },
  { key: "generate-images", label: "3. Images" },
  { key: "review-images", label: "4. Review" },
  { key: "generate-videos", label: "5. Videos" },
  { key: "done", label: "6. Done" },
];

const filterCategories = ["All", "push", "pull", "squat", "hinge", "core"];

function toProxyUrl(url: string): string {
  const match = url.match(/https:\/\/t3\.storageapi\.dev\/[^/]+\/(.+)/);
  if (match) return `/api/media/${match[1]}`;
  return url;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onResult: (index: number, result: T | null, error: Error | null) => void,
): Promise<void> {
  let nextIndex = 0;
  let active = 0;

  return new Promise((resolve) => {
    const runNext = () => {
      while (active < limit && nextIndex < tasks.length) {
        const idx = nextIndex++;
        active++;
        tasks[idx]()
          .then((result) => onResult(idx, result, null))
          .catch((err) => onResult(idx, null, err))
          .finally(() => {
            active--;
            if (nextIndex >= tasks.length && active === 0) resolve();
            else runNext();
          });
      }
      if (tasks.length === 0) resolve();
    };
    runNext();
  });
}

export function BulkGenerateClient({
  exercises,
  trainers,
  environments,
  existingGenerations,
}: {
  exercises: Exercise[];
  trainers: Trainer[];
  environments: Environment[];
  existingGenerations: ExistingGeneration[];
}) {
  const [step, setStep] = useState<WizardStep>("select-exercises");

  // Step 1: Coach & Environment
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");

  // Step 2: Exercise selection
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  // Map exerciseId -> selected existing generation id
  const [selectedExisting, setSelectedExisting] = useState<Map<string, string>>(new Map());

  // Group existing generations by exerciseId
  const generationsByExercise = existingGenerations.reduce<Record<string, ExistingGeneration[]>>((acc, g) => {
    if (!acc[g.exerciseId]) acc[g.exerciseId] = [];
    acc[g.exerciseId].push(g);
    return acc;
  }, {});

  // Exercises that need new image generation (selected but no existing image chosen)
  const exercisesNeedingNewImages = [...selectedExerciseIds].filter((id) => !selectedExisting.has(id));
  const exercisesWithExisting = [...selectedExerciseIds].filter((id) => selectedExisting.has(id));
  const needsCoachEnv = exercisesNeedingNewImages.length > 0;

  // Step 3-6: Generation tracking
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [veoVersion, setVeoVersion] = useState("veo-3.1-lite");
  const [duration, setDuration] = useState(4);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Filtered exercises for selection step
  const filtered = exercises.filter((e) => {
    const nameMatch = (e.name.en || "").toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "All" || e.category === categoryFilter;
    return nameMatch && catMatch;
  });

  const toggleExercise = (id: string) => {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Also remove any existing generation selection
        setSelectedExisting((prev) => { const m = new Map(prev); m.delete(id); return m; });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExistingGeneration = (exerciseId: string, generationId: string) => {
    setSelectedExerciseIds((prev) => { const next = new Set(prev); next.add(exerciseId); return next; });
    setSelectedExisting((prev) => {
      const next = new Map(prev);
      if (next.get(exerciseId) === generationId) {
        // Deselect existing — exercise stays selected for new generation
        next.delete(exerciseId);
      } else {
        next.set(exerciseId, generationId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((e) => next.add(e.id));
      return next;
    });
  };

  const deselectAll = () => { setSelectedExerciseIds(new Set()); setSelectedExisting(new Map()); };

  // --- Step 3: Bulk Image Generation ---
  const startGeneration = async () => {
    // Build items for all selected exercises
    const allSelected = exercises.filter((e) => selectedExerciseIds.has(e.id));

    // Items with existing images are already "completed"
    const newItems: GenerationItem[] = allSelected.map((e) => {
      const existingGenId = selectedExisting.get(e.id);
      const existingGen = existingGenId ? existingGenerations.find((g) => g.id === existingGenId) : null;

      if (existingGen) {
        return {
          exerciseId: e.id,
          exerciseName: e.name.en || e.name.hr || Object.values(e.name)[0] || "Exercise",
          generationId: existingGen.id,
          imageStatus: "completed" as const,
          videoStatus: "idle" as const,
          imageUrl: existingGen.imageUrl,
          videoUrl: null,
          error: null,
          selectedForVideo: true,
        };
      }
      return {
        exerciseId: e.id,
        exerciseName: e.name.en || e.name.hr || Object.values(e.name)[0] || "Exercise",
        generationId: null,
        imageStatus: "pending" as const,
        videoStatus: "idle" as const,
        imageUrl: null,
        videoUrl: null,
        error: null,
        selectedForVideo: true,
      };
    });

    setItems(newItems);

    // If no new images needed, skip straight to review
    const needNewImages = newItems.filter((it) => it.imageStatus === "pending");
    if (needNewImages.length === 0) {
      setStep("review-images");
      return;
    }

    setStep("generate-images");
    setIsGeneratingImages(true);

    // Only generate for exercises that need new images
    const newExercises = allSelected.filter((e) => !selectedExisting.has(e.id));
    const indexMap = newExercises.map((e) => newItems.findIndex((it) => it.exerciseId === e.id));

    const tasks = newExercises.map((exercise) => async () => {
      const body: Record<string, string | boolean> = {
        trainerId: selectedTrainerId,
        exerciseId: exercise.id,
      };
      if (selectedEnvId === "from-photo") {
        body.useTrainerEnvironment = true;
      } else {
        body.environmentId = selectedEnvId;
      }

      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Image generation failed" }));
        throw new Error(err.error || "Image generation failed");
      }
      return res.json() as Promise<{ generationId: string; imageUrl: string }>;
    });

    await runWithConcurrency(tasks, 3, (taskIdx, result, error) => {
      const itemIdx = indexMap[taskIdx];
      setItems((prev) => {
        const next = [...prev];
        if (error) {
          next[itemIdx] = { ...next[itemIdx], imageStatus: "failed", error: error.message, selectedForVideo: false };
        } else if (result) {
          next[itemIdx] = {
            ...next[itemIdx],
            imageStatus: "completed",
            generationId: result.generationId,
            imageUrl: result.imageUrl.startsWith("/") ? result.imageUrl : toProxyUrl(result.imageUrl),
          };
        }
        return next;
      });
    });

    setIsGeneratingImages(false);
  };

  const retryImageGeneration = async (idx: number) => {
    const item = items[idx];
    const exercise = exercises.find((e) => e.id === item.exerciseId);
    if (!exercise) return;

    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], imageStatus: "generating", error: null };
      return next;
    });

    try {
      const body: Record<string, string | boolean> = {
        trainerId: selectedTrainerId,
        exerciseId: exercise.id,
      };
      if (selectedEnvId === "from-photo") {
        body.useTrainerEnvironment = true;
      } else {
        body.environmentId = selectedEnvId;
      }

      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Image generation failed" }));
        throw new Error(err.error || "Image generation failed");
      }
      const result = await res.json();
      setItems((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          imageStatus: "completed",
          generationId: result.generationId,
          imageUrl: result.imageUrl.startsWith("/") ? result.imageUrl : toProxyUrl(result.imageUrl),
          selectedForVideo: true,
        };
        return next;
      });
    } catch (err: any) {
      setItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], imageStatus: "failed", error: err.message };
        return next;
      });
    }
  };

  // --- Step 5: Bulk Video Generation ---
  const startVideoGeneration = async () => {
    const videoItems = items.filter((it) => it.selectedForVideo && it.imageStatus === "completed" && it.generationId);
    if (videoItems.length === 0) return;

    // Mark selected items as pending video
    setItems((prev) =>
      prev.map((it) =>
        it.selectedForVideo && it.imageStatus === "completed" && it.generationId
          ? { ...it, videoStatus: "pending" }
          : it,
      ),
    );
    setStep("generate-videos");
    setIsGeneratingVideos(true);

    // Fire all video generation requests (they return immediately)
    const generationIds: string[] = [];
    for (const item of videoItems) {
      try {
        const res = await fetch("/api/generate/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId: item.generationId, veoVersion, durationSeconds: duration }),
        });
        if (res.ok) {
          generationIds.push(item.generationId!);
          setItems((prev) =>
            prev.map((it) =>
              it.generationId === item.generationId ? { ...it, videoStatus: "generating" } : it,
            ),
          );
        } else {
          const err = await res.json().catch(() => ({ error: "Failed to start video generation" }));
          setItems((prev) =>
            prev.map((it) =>
              it.generationId === item.generationId
                ? { ...it, videoStatus: "failed", error: err.error || "Failed to start video generation" }
                : it,
            ),
          );
        }
      } catch {
        setItems((prev) =>
          prev.map((it) =>
            it.generationId === item.generationId
              ? { ...it, videoStatus: "failed", error: "Network error" }
              : it,
          ),
        );
      }
    }

    // Start polling for all pending video generations
    if (generationIds.length > 0) {
      startPolling(generationIds);
    } else {
      setIsGeneratingVideos(false);
    }
  };

  const startPolling = useCallback((generationIds: string[]) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const poll = async () => {
      try {
        const res = await fetch(`/api/generations/batch-status?ids=${generationIds.join(",")}`);
        if (!res.ok) return;
        const statuses: { id: string; status: string; imageUrl: string | null; videoUrl: string | null; errorMessage: string | null }[] = await res.json();

        // Check completion from the API response directly (not inside React state callback)
        const allDone = generationIds.every((gid) => {
          const s = statuses.find((st) => st.id === gid);
          return s && (s.status === "COMPLETED" || s.status === "FAILED");
        });

        setItems((prev) =>
          prev.map((it) => {
            const status = statuses.find((s) => s.id === it.generationId);
            if (!status) return it;
            if (status.status === "COMPLETED" && status.videoUrl) {
              return { ...it, videoStatus: "completed", videoUrl: status.videoUrl };
            }
            if (status.status === "FAILED") {
              return { ...it, videoStatus: "failed", error: status.errorMessage || "Video generation failed" };
            }
            return it;
          }),
        );

        if (allDone) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsGeneratingVideos(false);
        }
      } catch {
        // Keep polling on network errors
      }
    };

    pollingRef.current = setInterval(poll, 5000);
    // Also poll immediately
    poll();
  }, []);

  // Computed values
  const imagesCompleted = items.filter((it) => it.imageStatus === "completed").length;
  const imagesFailed = items.filter((it) => it.imageStatus === "failed").length;
  const imagesGenerating = items.filter((it) => it.imageStatus === "generating" || it.imageStatus === "pending").length;
  const allImagesDone = !isGeneratingImages && imagesGenerating === 0;

  const videosCompleted = items.filter((it) => it.videoStatus === "completed").length;
  const videosFailed = items.filter((it) => it.videoStatus === "failed").length;
  const videosTotal = items.filter((it) => it.selectedForVideo && it.imageStatus === "completed").length;
  const allVideosDone = !isGeneratingVideos && items.filter((it) => it.videoStatus === "generating" || it.videoStatus === "pending").length === 0;

  const selectedForVideoCount = items.filter((it) => it.selectedForVideo && it.imageStatus === "completed").length;

  const resetWizard = () => {
    setStep("select-exercises");
    setSelectedTrainerId("");
    setSelectedEnvId("");
    setSelectedExerciseIds(new Set());
    setSelectedExisting(new Map());
    setItems([]);
    setSearch("");
    setCategoryFilter("All");
    setVeoVersion("veo-3.1-lite");
    setDuration(4);
    setIsGeneratingImages(false);
    setIsGeneratingVideos(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const stepKeys = STEPS.map((s) => s.key);
  const currentStepIdx = stepKeys.indexOf(step);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-headline font-bold tracking-tight text-kp-on-surface mb-8">Bulk Generate</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        {STEPS.map((s, idx) => {
          const isActive = step === s.key;
          const isPast = currentStepIdx > idx;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
                  isActive
                    ? "bg-kp-primary text-kp-on-primary"
                    : isPast
                      ? "bg-kp-primary/20 text-kp-primary"
                      : "text-kp-on-surface-variant/40"
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${isPast ? "bg-kp-primary" : "bg-kp-surface-container-highest"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Coach & Environment */}
      {step === "coach-env" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Select Trainer</h4>
              {trainers.length === 0 ? (
                <p className="text-xs text-kp-on-surface-variant/60">
                  No trainers yet. <a href="/trainers" className="text-kp-primary underline">Upload one</a>.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trainers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrainerId(t.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedTrainerId === t.id
                          ? "bg-kp-primary/10 ring-1 ring-kp-primary"
                          : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                      }`}
                    >
                      <img
                        src={t.baseImageKey ? `/api/media/${t.baseImageKey}` : "#"}
                        alt={t.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="font-headline font-bold text-sm">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Select Environment</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => setSelectedEnvId("from-photo")}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedEnvId === "from-photo"
                      ? "bg-kp-secondary/10 ring-1 ring-kp-secondary"
                      : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                  }`}
                >
                  <div className="font-headline font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Use From Photo
                  </div>
                  <p className="text-[10px] text-kp-on-surface-variant line-clamp-1 mt-1">
                    Keep the background from the trainer&apos;s image
                  </p>
                </button>
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedEnvId === env.id
                        ? "bg-kp-secondary/10 ring-1 ring-kp-secondary"
                        : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                    }`}
                  >
                    <div className="font-headline font-bold text-sm">{env.name}</div>
                    <p className="text-[10px] text-kp-on-surface-variant line-clamp-1 mt-1">{env.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 pt-2 flex gap-4">
              <button
                onClick={() => setStep("select-exercises")}
                className="bg-kp-surface-container-highest text-kp-on-surface-variant px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest"
              >
                Back
              </button>
              <button
                onClick={startGeneration}
                disabled={!selectedTrainerId || !selectedEnvId}
                className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(221,255,177,0.2)] transition-all"
              >
                Generate {exercisesNeedingNewImages.length} New Images{exercisesWithExisting.length > 0 ? ` + ${exercisesWithExisting.length} Existing` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Exercises */}
      {step === "select-exercises" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-kp-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-kp-on-surface placeholder:text-kp-on-surface-variant/40 border-none focus:ring-1 focus:ring-kp-primary w-64"
            />
            <div className="flex gap-1 flex-wrap">
              {filterCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    categoryFilter === cat
                      ? "bg-kp-primary text-kp-on-primary"
                      : "text-kp-on-surface-variant hover:text-kp-on-surface"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-kp-on-surface-variant">{selectedExerciseIds.size} selected</span>
              <button onClick={selectAllVisible} className="text-[10px] font-bold uppercase tracking-widest text-kp-primary hover:underline">
                Select All Visible
              </button>
              <button onClick={deselectAll} className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant hover:underline">
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-h-[60vh] overflow-y-auto">
            {filtered.map((ex) => {
              const isSelected = selectedExerciseIds.has(ex.id);
              const existing = generationsByExercise[ex.id] || [];
              const selectedGenId = selectedExisting.get(ex.id);
              return (
                <div
                  key={ex.id}
                  className={`rounded-lg transition-all ${
                    isSelected
                      ? "bg-kp-primary/10 ring-1 ring-kp-primary"
                      : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"
                  }`}
                >
                  <button
                    onClick={() => toggleExercise(ex.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                          isSelected ? "bg-kp-primary border-kp-primary" : "border-kp-on-surface-variant/30"
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-[12px] text-kp-on-primary">check</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-headline font-bold text-xs leading-tight line-clamp-2">{ex.name.en || ex.name.hr || ""}</div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-surface-container-high text-kp-on-surface-variant">
                            {ex.category}
                          </span>
                          {existing.filter((g) => g.videoUrl).length > 0 && (
                            <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-tertiary/20 text-kp-tertiary">
                              {existing.filter((g) => g.videoUrl).length} video{existing.filter((g) => g.videoUrl).length > 1 ? "s" : ""}
                            </span>
                          )}
                          {selectedGenId && (
                            <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-secondary/20 text-kp-secondary">
                              Existing image
                            </span>
                          )}
                          {isSelected && !selectedGenId && (
                            <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-primary/20 text-kp-primary">
                              New image
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  {existing.length > 0 && (
                    <div className="px-3 pb-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-kp-on-surface-variant/60 mb-1.5">
                        Existing images ({existing.length})
                      </p>
                      <div className="flex gap-1.5 overflow-x-auto">
                        {existing.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => toggleExistingGeneration(ex.id, g.id)}
                            className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                              selectedGenId === g.id
                                ? "ring-2 ring-kp-secondary scale-105"
                                : "opacity-60 hover:opacity-100"
                            }`}
                            title={`By ${g.trainerName}`}
                          >
                            <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 items-center">
            {needsCoachEnv ? (
              <button
                onClick={() => setStep("coach-env")}
                disabled={selectedExerciseIds.size === 0}
                className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(221,255,177,0.2)] transition-all"
              >
                Next: Select Coach ({exercisesNeedingNewImages.length} new)
              </button>
            ) : (
              <button
                onClick={startGeneration}
                disabled={selectedExerciseIds.size === 0}
                className="bg-gradient-to-r from-kp-secondary to-kp-primary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,227,253,0.2)] transition-all"
              >
                Continue with {exercisesWithExisting.length} Existing Images
              </button>
            )}
            {selectedExerciseIds.size > 0 && (
              <span className="text-xs text-kp-on-surface-variant">
                {exercisesWithExisting.length} existing, {exercisesNeedingNewImages.length} new
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Generate Images */}
      {step === "generate-images" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-kp-on-surface">
              Generating Images
            </h3>
            <div className="flex-1 h-2 bg-kp-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-kp-primary to-kp-secondary transition-all duration-500"
                style={{ width: `${items.length > 0 ? ((imagesCompleted + imagesFailed) / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm text-kp-on-surface-variant whitespace-nowrap">
              {imagesCompleted} / {items.length} done
              {imagesFailed > 0 && <span className="text-kp-error ml-1">({imagesFailed} failed)</span>}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={item.exerciseId}
                className={`rounded-xl overflow-hidden bg-kp-surface-container-highest ${
                  item.imageStatus === "failed" ? "ring-1 ring-kp-error" : ""
                }`}
              >
                <div className="aspect-square relative bg-kp-surface-container-high flex items-center justify-center">
                  {item.imageStatus === "completed" && item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.exerciseName} className="w-full h-full object-cover" />
                  ) : item.imageStatus === "failed" ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <span className="material-symbols-outlined text-kp-error text-2xl">error</span>
                      <p className="text-[10px] text-kp-error text-center line-clamp-2">{item.error}</p>
                      <button
                        onClick={() => retryImageGeneration(idx)}
                        className="text-[10px] font-bold uppercase tracking-widest text-kp-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-4 border-kp-primary/20 border-t-kp-primary animate-spin" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-headline font-bold text-xs line-clamp-1">{item.exerciseName}</p>
                  <p className="text-[10px] text-kp-on-surface-variant capitalize">{item.imageStatus}</p>
                </div>
              </div>
            ))}
          </div>

          {allImagesDone && (
            <button
              onClick={() => setStep("review-images")}
              className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(221,255,177,0.2)] transition-all"
            >
              Continue to Review ({imagesCompleted} images)
            </button>
          )}
        </div>
      )}

      {/* Step 4: Review Images */}
      {step === "review-images" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-kp-on-surface">
              Review Generated Images
            </h3>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-kp-on-surface-variant">{selectedForVideoCount} selected for video</span>
              <button
                onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selectedForVideo: it.imageStatus === "completed" })))}
                className="text-[10px] font-bold uppercase tracking-widest text-kp-primary hover:underline"
              >
                Select All
              </button>
              <button
                onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selectedForVideo: false })))}
                className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
            {items.map((item, idx) => {
              if (item.imageStatus !== "completed") return null;
              return (
                <button
                  key={item.exerciseId}
                  onClick={() =>
                    setItems((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], selectedForVideo: !next[idx].selectedForVideo };
                      return next;
                    })
                  }
                  className={`text-left rounded-xl overflow-hidden transition-all ${
                    item.selectedForVideo
                      ? "ring-2 ring-kp-primary"
                      : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <div className="aspect-square relative bg-kp-surface-container-high">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.exerciseName} className="w-full h-full object-cover" />
                    )}
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                        item.selectedForVideo ? "bg-kp-primary" : "bg-kp-surface-container-highest/80"
                      }`}
                    >
                      {item.selectedForVideo && (
                        <span className="material-symbols-outlined text-[14px] text-kp-on-primary">check</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-kp-surface-container-highest">
                    <p className="font-headline font-bold text-xs line-clamp-1">{item.exerciseName}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">
                Veo Model
              </label>
              <select
                value={veoVersion}
                onChange={(e) => setVeoVersion(e.target.value)}
                className="bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
              >
                <option value="veo-3.1">Veo 3.1 (Best)</option>
                <option value="veo-3.1-fast">Veo 3.1 Fast</option>
                <option value="veo-3.1-lite">Veo 3.1 Lite</option>
                <option value="veo-2.0">Veo 2.0</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
              >
                <option value={4}>4 sec</option>
                <option value={6}>6 sec</option>
                <option value={8}>8 sec</option>
              </select>
            </div>
            <button
              onClick={() => setStep("generate-images")}
              className="bg-kp-surface-container-highest text-kp-on-surface-variant px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest"
            >
              Back to Images
            </button>
            <button
              onClick={startVideoGeneration}
              disabled={selectedForVideoCount === 0}
              className="bg-gradient-to-r from-kp-secondary to-kp-primary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,227,253,0.2)] transition-all"
            >
              Generate {selectedForVideoCount} Videos
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Generate Videos */}
      {step === "generate-videos" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-kp-on-surface">
              Generating Videos
            </h3>
            <div className="flex-1 h-2 bg-kp-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-kp-secondary to-kp-primary transition-all duration-500"
                style={{ width: `${videosTotal > 0 ? ((videosCompleted + videosFailed) / videosTotal) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm text-kp-on-surface-variant whitespace-nowrap">
              {videosCompleted} / {videosTotal} done
              {videosFailed > 0 && <span className="text-kp-error ml-1">({videosFailed} failed)</span>}
            </span>
          </div>

          <p className="text-[10px] text-kp-on-surface-variant/60 mb-4">Videos may take a few minutes each. Progress updates automatically.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
            {items
              .filter((it) => it.selectedForVideo && it.imageStatus === "completed")
              .map((item) => (
                <div
                  key={item.exerciseId}
                  className={`rounded-xl overflow-hidden bg-kp-surface-container-highest ${
                    item.videoStatus === "failed" ? "ring-1 ring-kp-error" : ""
                  }`}
                >
                  <div className="aspect-video relative bg-kp-surface-container-high flex items-center justify-center">
                    {item.videoStatus === "completed" && item.videoUrl ? (
                      <video src={item.videoUrl} controls className="w-full h-full object-cover" />
                    ) : item.videoStatus === "failed" ? (
                      <div className="flex flex-col items-center gap-2 p-4">
                        <span className="material-symbols-outlined text-kp-error text-2xl">error</span>
                        <p className="text-[10px] text-kp-error text-center line-clamp-2">{item.error}</p>
                      </div>
                    ) : item.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img src={item.imageUrl} alt={item.exerciseName} className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border-4 border-kp-secondary/20 border-t-kp-secondary animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-4 border-kp-secondary/20 border-t-kp-secondary animate-spin" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-headline font-bold text-xs line-clamp-1">{item.exerciseName}</p>
                    <p className="text-[10px] text-kp-on-surface-variant capitalize">{item.videoStatus}</p>
                  </div>
                </div>
              ))}
          </div>

          {allVideosDone && videosCompleted > 0 && (
            <button
              onClick={() => setStep("done")}
              className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(221,255,177,0.2)] transition-all"
            >
              View Results
            </button>
          )}
        </div>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="material-symbols-outlined text-kp-primary text-3xl">check_circle</span>
            <div>
              <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-kp-primary">
                Batch Complete
              </h3>
              <p className="text-sm text-kp-on-surface-variant">
                {videosCompleted} videos generated
                {videosFailed > 0 && `, ${videosFailed} failed`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {items
              .filter((it) => it.videoStatus === "completed" && it.videoUrl)
              .map((item) => (
                <div key={item.exerciseId} className="rounded-xl overflow-hidden bg-kp-surface-container-highest">
                  <video src={item.videoUrl!} controls className="w-full aspect-video object-cover" />
                  <div className="p-3 flex items-center justify-between">
                    <p className="font-headline font-bold text-xs line-clamp-1">{item.exerciseName}</p>
                    <a
                      href={item.videoUrl!}
                      download
                      className="text-[10px] font-bold uppercase tracking-widest text-kp-primary hover:underline"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={resetWizard}
            className="bg-kp-surface-container-highest text-kp-on-surface px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest"
          >
            Start New Batch
          </button>
        </div>
      )}
    </div>
  );
}
