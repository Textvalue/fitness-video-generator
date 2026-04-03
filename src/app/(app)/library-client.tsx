"use client";

import { useState, useEffect } from "react";

interface Exercise {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  generationPrompt: string | null;
  bodyParts: string[];
  category: string;
  equipment: string[];
  difficulty: number;
  mediaUrls: { photos?: { url: string; label: string }[] } | null;
}

interface Generation {
  id: string;
  exerciseId: string;
  imageUrl: string | null;
  videoUrl: string | null;
  veoVersion: string | null;
  completedAt: string | null;
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

const allCategories = ["squat", "push", "pull", "hinge", "core", "gait", "carry", "rotation", "isolation"];
const filterCategories = ["All", "push", "pull", "squat", "hinge", "core"];

function toProxyUrl(url: string): string {
  const match = url.match(/https:\/\/t3\.storageapi\.dev\/[^/]+\/(.+)/);
  if (match) return `/api/media/${match[1]}`;
  return url;
}

export function LibraryClient({
  exercises: initialExercises,
  generations: initialGenerations,
}: {
  exercises: Exercise[];
  generations: Generation[];
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [generations, setGenerations] = useState(initialGenerations);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Add/Edit exercise
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exForm, setExForm] = useState({ name: "", description: "", generationPrompt: "", category: "push", bodyParts: "", equipment: "", difficulty: 1 });
  const [exSaving, setExSaving] = useState(false);

  // Pipeline state
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [veoVersion, setVeoVersion] = useState("veo-3.1-lite");
  const [step, setStep] = useState<"select" | "image" | "review" | "video" | "done">("select");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedExercise) {
      fetch("/api/trainers").then((r) => r.json()).then(setTrainers).catch(() => {});
      fetch("/api/environments").then((r) => r.json()).then(setEnvironments).catch(() => {});
    }
  }, [selectedExercise]);

  const filtered = exercises.filter((e) => {
    const nameMatch = (e.name.en || "").toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "All" || e.category === categoryFilter;
    return nameMatch && catMatch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [search, categoryFilter]);

  const getVideosForExercise = (exerciseId: string) =>
    generations.filter((g) => g.exerciseId === exerciseId && g.videoUrl);

  const resetPipeline = () => {
    setStep("select");
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setGenerationId(null);
    setError(null);
    setLoading(false);
  };

  const closeModal = () => {
    setSelectedExercise(null);
    resetPipeline();
  };

  // Exercise CRUD
  const openAddExercise = () => {
    setExForm({ name: "", description: "", generationPrompt: "", category: "push", bodyParts: "", equipment: "", difficulty: 1 });
    setEditingExercise(null);
    setShowAddExercise(true);
  };

  const openEditExercise = (ex: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setExForm({
      name: ex.name.en || "",
      description: ex.description.en || "",
      generationPrompt: ex.generationPrompt || "",
      category: ex.category,
      bodyParts: ex.bodyParts.join(", "),
      equipment: ex.equipment.join(", "),
      difficulty: ex.difficulty,
    });
    setEditingExercise(ex);
    setShowAddExercise(true);
  };

  const handleSaveExercise = async () => {
    if (!exForm.name.trim() || !exForm.category) return;
    setExSaving(true);
    const body = {
      name: { en: exForm.name.trim() },
      description: { en: exForm.description.trim() },
      generationPrompt: exForm.generationPrompt.trim() || null,
      category: exForm.category,
      bodyParts: exForm.bodyParts.split(",").map((s) => s.trim()).filter(Boolean),
      equipment: exForm.equipment.split(",").map((s) => s.trim()).filter(Boolean),
      difficulty: exForm.difficulty,
    };
    try {
      if (editingExercise) {
        const res = await fetch(`/api/exercises/${editingExercise.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === editingExercise.id
              ? { ...ex, ...body, name: body.name as Record<string, string>, description: body.description as Record<string, string>, generationPrompt: body.generationPrompt }
              : ex
          )
        );
      } else {
        const res = await fetch("/api/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        window.location.reload();
      }
      setShowAddExercise(false);
      setEditingExercise(null);
    } catch {
      alert("Failed to save exercise");
    } finally {
      setExSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this exercise and all its generations?")) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (res.ok) setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleDeleteGeneration = async (genId: string) => {
    if (!confirm("Delete this generation?")) return;
    const res = await fetch(`/api/generations/${genId}`, { method: "DELETE" });
    if (res.ok) setGenerations((prev) => prev.filter((g) => g.id !== genId));
  };

  // Generation pipeline
  const handleGenerateImage = async () => {
    if (!selectedExercise || !selectedTrainerId || (!selectedEnvId && selectedEnvId !== "from-photo")) return;
    setLoading(true);
    setError(null);
    setStep("image");
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId: selectedTrainerId, environmentId: selectedEnvId === "from-photo" ? null : selectedEnvId, exerciseId: selectedExercise.id, useTrainerEnvironment: selectedEnvId === "from-photo" }),
      });
      if (!res.ok) { const text = await res.text(); try { const d = JSON.parse(text); throw new Error(d.error || "Failed"); } catch (e) { if (e instanceof SyntaxError) throw new Error(text || `Server error (${res.status})`); throw e; } }
      const result = await res.json();
      setGeneratedImageUrl(toProxyUrl(result.imageUrl));
      setGenerationId(result.generationId);
      setStep("review");
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
    setStep("video");
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, veoVersion }),
      });
      if (!res.ok) { const text = await res.text(); try { const d = JSON.parse(text); throw new Error(d.error || "Failed"); } catch (e) { if (e instanceof SyntaxError) throw new Error(text || `Server error (${res.status})`); throw e; } }

      // Poll for completion
      const poll = async (): Promise<void> => {
        const statusRes = await fetch(`/api/generations/${generationId}`);
        if (!statusRes.ok) throw new Error("Failed to check status");
        const data = await statusRes.json();

        if (data.status === "COMPLETED" && data.videoUrl) {
          setGeneratedVideoUrl(toProxyUrl(data.videoUrl));
          setStep("done");
          setLoading(false);
          // Refresh generations list
          setGenerations((prev) => [
            { id: generationId!, exerciseId: selectedExercise!.id, imageUrl: generatedImageUrl, videoUrl: data.videoUrl, veoVersion, completedAt: new Date().toISOString() },
            ...prev,
          ]);
          return;
        }
        if (data.status === "FAILED") {
          throw new Error(data.errorMessage || "Video generation failed");
        }
        // Still generating — poll again in 5s
        await new Promise((r) => setTimeout(r, 5000));
        return poll();
      };

      await poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed");
      setStep("review");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
          <div>
            <h1 className="font-headline font-black text-5xl lg:text-6xl text-kp-on-surface leading-none tracking-tighter mb-3">
              EXERCISE<br />
              <span className="text-kp-primary-dim">LIBRARY</span>
            </h1>
            <p className="text-kp-on-surface-variant max-w-md font-sans text-sm leading-relaxed">
              Select an exercise to generate AI images and videos.
            </p>
          </div>
          <button
            onClick={openAddExercise}
            className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest shrink-0 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Exercise
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-kp-surface-container-lowest rounded-lg px-4 py-2.5 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40 w-48"
          />
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-[10px] font-bold px-4 py-2.5 rounded-lg uppercase transition-colors ${
                categoryFilter === cat
                  ? "bg-kp-primary text-kp-on-primary"
                  : "bg-kp-surface-container-highest text-kp-on-surface-variant hover:bg-kp-surface-bright"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-[10px] text-kp-on-surface-variant/40 ml-2">{filtered.length} results</span>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map((exercise) => {
            const videos = getVideosForExercise(exercise.id);
            const imageUrl = exercise.mediaUrls?.photos?.[0]?.url;
            return (
              <div
                key={exercise.id}
                onClick={() => { setSelectedExercise(exercise); resetPipeline(); }}
                className="cursor-pointer text-left bg-kp-surface-container-highest rounded-xl overflow-hidden group hover:ring-1 hover:ring-kp-primary/40 transition-all relative"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  {imageUrl ? (
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={imageUrl} alt={exercise.name.en} loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-kp-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/20">fitness_center</span>
                    </div>
                  )}
                  {videos.length > 0 && (
                    <div className="absolute top-3 left-3 bg-kp-primary/90 text-kp-on-primary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">play_circle</span>
                      {videos.length}
                    </div>
                  )}
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openEditExercise(exercise, e)}
                      className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteExercise(exercise.id, e)}
                      className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-headline font-bold text-sm uppercase tracking-tight leading-tight">{exercise.name.en}</h3>
                    <span className="text-[9px] font-bold text-kp-on-surface-variant tracking-widest px-2 py-0.5 bg-kp-surface-container-low rounded uppercase shrink-0 ml-2">{exercise.category}</span>
                  </div>
                  <p className="text-[11px] text-kp-on-surface-variant leading-relaxed line-clamp-1 mt-1">
                    {exercise.bodyParts.join(", ").replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((c) => c + 20)}
              className="bg-kp-surface-container-highest text-kp-on-surface-variant px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest hover:bg-kp-surface-bright transition-colors"
            >
              Load More ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-kp-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">search_off</span>
            <p className="text-sm">No exercises match your filters.</p>
          </div>
        )}
      </div>

      {/* ===== Add/Edit Exercise Modal ===== */}
      {showAddExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAddExercise(false); }}>
          <div className="bg-kp-surface-container rounded-2xl max-w-lg w-full p-8">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tighter mb-6">
              {editingExercise ? "Edit Exercise" : "Add Exercise"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Name</label>
                <input type="text" value={exForm.name} onChange={(e) => setExForm({ ...exForm, name: e.target.value })} placeholder="Exercise name" className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Description</label>
                <textarea value={exForm.description} onChange={(e) => setExForm({ ...exForm, description: e.target.value })} rows={3} placeholder="Describe the exercise..." className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Generation Prompt</label>
                <textarea value={exForm.generationPrompt} onChange={(e) => setExForm({ ...exForm, generationPrompt: e.target.value })} rows={3} placeholder="Detailed instructions for AI generation, e.g. 'Feet shoulder-width apart, barbell on upper back, squat down until thighs are parallel to floor, knees tracking over toes, chest up, back straight...'" className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40 resize-none" />
                <p className="text-[9px] text-kp-on-surface-variant/50 mt-1">Specific body positioning and technique details for image/video generation. If empty, the description is used instead.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Category</label>
                  <select value={exForm.category} onChange={(e) => setExForm({ ...exForm, category: e.target.value })} className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary">
                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Difficulty (1-4)</label>
                  <input type="number" min={1} max={4} value={exForm.difficulty} onChange={(e) => setExForm({ ...exForm, difficulty: parseInt(e.target.value) || 1 })} className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Body Parts (comma-separated)</label>
                <input type="text" value={exForm.bodyParts} onChange={(e) => setExForm({ ...exForm, bodyParts: e.target.value })} placeholder="e.g. upper_body, chest" className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Equipment (comma-separated)</label>
                <input type="text" value={exForm.equipment} onChange={(e) => setExForm({ ...exForm, equipment: e.target.value })} placeholder="e.g. barbell, bench" className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveExercise} disabled={exSaving || !exForm.name.trim()} className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30">
                  {exSaving ? "Saving..." : editingExercise ? "Update" : "Create"}
                </button>
                <button onClick={() => { setShowAddExercise(false); setEditingExercise(null); }} className="bg-kp-surface-container-highest text-kp-on-surface-variant px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Exercise Detail + Pipeline Modal ===== */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-kp-surface-container rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header image */}
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              {selectedExercise.mediaUrls?.photos?.[0]?.url ? (
                <img className="w-full h-full object-cover" src={selectedExercise.mediaUrls.photos[0].url} alt={selectedExercise.name.en} />
              ) : (
                <div className="w-full h-full bg-kp-surface-container-low" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-kp-surface-container via-kp-surface-container/40 to-transparent" />
              <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-kp-background/60 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:bg-kp-background/80 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute bottom-4 left-6">
                <h2 className="font-headline font-black text-3xl uppercase tracking-tighter text-kp-on-surface">{selectedExercise.name.en}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded bg-kp-secondary/10 text-kp-secondary uppercase tracking-widest">{selectedExercise.category}</span>
                  {selectedExercise.bodyParts.map((bp) => (
                    <span key={bp} className="text-[10px] font-bold px-3 py-1 rounded bg-kp-surface-container-highest/60 text-kp-on-surface-variant uppercase tracking-widest backdrop-blur-sm">{bp.replace(/_/g, " ")}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <p className="text-sm text-kp-on-surface-variant leading-relaxed mb-6">{selectedExercise.description.en}</p>

              {/* Existing videos with delete */}
              {(() => {
                const videos = getVideosForExercise(selectedExercise.id);
                return videos.length > 0 ? (
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Generated Videos ({videos.length})</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {videos.map((gen) => (
                        <div key={gen.id} className="rounded-xl overflow-hidden bg-kp-surface-container-lowest group/vid relative">
                          <video src={gen.videoUrl!} controls className="w-full" />
                          <div className="px-4 py-2 flex justify-between text-[10px] text-kp-on-surface-variant uppercase tracking-widest">
                            <span>{gen.veoVersion}</span>
                            {gen.completedAt && <span>{new Date(gen.completedAt).toLocaleDateString()}</span>}
                          </div>
                          <button
                            onClick={() => handleDeleteGeneration(gen.id)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-error transition-colors opacity-0 group-hover/vid:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* ===== Generation Pipeline ===== */}
              <div className="bg-kp-surface-container-lowest rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {[
                    { key: "select", label: "1. Select" },
                    { key: "image", label: "2. Image" },
                    { key: "review", label: "3. Review" },
                    { key: "video", label: "4. Video" },
                    { key: "done", label: "5. Done" },
                  ].map((s, idx, arr) => {
                    const steps = ["select", "image", "review", "video", "done"];
                    const currentIdx = steps.indexOf(step);
                    const isActive = step === s.key;
                    const isPast = currentIdx > idx;
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
                          isActive ? "bg-kp-primary text-kp-on-primary" : isPast ? "bg-kp-primary/20 text-kp-primary" : "text-kp-on-surface-variant/40"
                        }`}>{s.label}</span>
                        {idx < arr.length - 1 && <div className={`w-6 h-0.5 ${isPast ? "bg-kp-primary" : "bg-kp-surface-container-highest"}`} />}
                      </div>
                    );
                  })}
                </div>

                {error && <div className="mb-4 p-3 rounded-lg bg-kp-error-container/20 text-kp-error text-sm">{error}</div>}

                {step === "select" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Select Trainer</h4>
                      {trainers.length === 0 ? (
                        <p className="text-xs text-kp-on-surface-variant/60">No trainers yet. <a href="/trainers" className="text-kp-primary underline">Upload one</a>.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {trainers.map((t) => (
                            <button key={t.id} onClick={() => setSelectedTrainerId(t.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedTrainerId === t.id ? "bg-kp-primary/10 ring-1 ring-kp-primary" : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"}`}>
                              <img src={t.baseImageKey ? `/api/media/${t.baseImageKey}` : "#"} alt={t.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span className="font-headline font-bold text-sm">{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Select Environment</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <button onClick={() => setSelectedEnvId("from-photo")} className={`w-full text-left p-3 rounded-lg transition-all ${selectedEnvId === "from-photo" ? "bg-kp-secondary/10 ring-1 ring-kp-secondary" : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"}`}>
                          <div className="font-headline font-bold text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                            Use From Photo
                          </div>
                          <p className="text-[10px] text-kp-on-surface-variant line-clamp-1 mt-1">Keep the background from the trainer&apos;s image</p>
                        </button>
                        {environments.map((env) => (
                          <button key={env.id} onClick={() => setSelectedEnvId(env.id)} className={`w-full text-left p-3 rounded-lg transition-all ${selectedEnvId === env.id ? "bg-kp-secondary/10 ring-1 ring-kp-secondary" : "bg-kp-surface-container-highest hover:bg-kp-surface-bright"}`}>
                            <div className="font-headline font-bold text-sm">{env.name}</div>
                            <p className="text-[10px] text-kp-on-surface-variant line-clamp-1 mt-1">{env.prompt}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="lg:col-span-2 pt-2">
                      <button onClick={handleGenerateImage} disabled={!selectedTrainerId || !selectedEnvId || loading} className="bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(221,255,177,0.2)] transition-all">
                        Generate Image
                      </button>
                    </div>
                  </div>
                )}

                {step === "image" && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full border-4 border-kp-primary/20 border-t-kp-primary animate-spin mb-6" />
                    <p className="text-sm text-kp-on-surface-variant font-headline uppercase tracking-widest">Generating image...</p>
                  </div>
                )}

                {step === "review" && generatedImageUrl && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant mb-3">Generated Image</h4>
                    <img src={generatedImageUrl} alt="Generated" className="w-full max-w-2xl rounded-xl mb-6" />
                    <div className="flex items-end gap-4 flex-wrap">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Veo Version</label>
                        <select value={veoVersion} onChange={(e) => setVeoVersion(e.target.value)} className="bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary">
                          <option value="veo-3.1">Veo 3.1 (Best)</option>
                          <option value="veo-3.1-fast">Veo 3.1 Fast</option>
                          <option value="veo-3.1-lite">Veo 3.1 Lite</option>
                          <option value="veo-2.0">Veo 2.0</option>
                        </select>
                      </div>
                      <button onClick={handleGenerateVideo} className="bg-gradient-to-r from-kp-secondary to-kp-primary text-kp-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,227,253,0.2)] transition-all">
                        Generate Video
                      </button>
                      <button onClick={resetPipeline} className="bg-kp-surface-container-highest text-kp-on-surface-variant px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest">
                        Retry Image
                      </button>
                    </div>
                  </div>
                )}

                {step === "video" && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full border-4 border-kp-secondary/20 border-t-kp-secondary animate-spin mb-6" />
                    <p className="text-sm text-kp-on-surface-variant font-headline uppercase tracking-widest">Generating video with {veoVersion}...</p>
                    <p className="text-[10px] text-kp-on-surface-variant/60 mt-2">This may take a few minutes.</p>
                  </div>
                )}

                {step === "done" && generatedVideoUrl && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-kp-primary mb-3">Video Ready</h4>
                    <video src={generatedVideoUrl} controls className="w-full max-w-2xl rounded-xl mb-6" />
                    <div className="flex gap-4">
                      <a href={generatedVideoUrl} download className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest">Download</a>
                      <button onClick={resetPipeline} className="bg-kp-surface-container-highest text-kp-on-surface px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest">Generate Another</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
