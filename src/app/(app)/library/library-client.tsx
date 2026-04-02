"use client";

import { useState } from "react";

interface Exercise {
  id: string;
  opensetId: string | null;
  name: Record<string, string>;
  description: Record<string, string>;
  bodyParts: string[];
  category: string;
  equipment: string[];
  difficulty: number;
  metadata: Record<string, unknown> | null;
  mediaUrls: { photos?: { url: string; label: string }[] } | null;
}

const categories = ["All", "squat", "push", "pull", "hinge", "core", "gait", "carry", "rotation", "isolation"];
const bodyPartFilters = ["All", "upper_body", "lower_body", "core", "full_body"];

export function LibraryClient({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [bodyPartFilter, setBodyPartFilter] = useState("All");

  const filtered = exercises.filter((e) => {
    const nameMatch = (e.name.en || "").toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "All" || e.category === categoryFilter;
    const bpMatch = bodyPartFilter === "All" || e.bodyParts.includes(bodyPartFilter);
    return nameMatch && catMatch && bpMatch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="p-12 max-w-7xl mx-auto w-full">
      {/* Editorial Header */}
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="font-headline font-black text-6xl text-kp-on-surface leading-none tracking-tighter mb-4">
            EXERCISE
            <br />
            <span className="text-kp-primary-dim">LIBRARY</span>
          </h1>
          <p className="text-kp-on-surface-variant max-w-md font-sans leading-relaxed">
            Centralized repository for kinematically mapped movements. These
            presets define the prompt-logic for AI video generation.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-2">
            <span className="bg-kp-surface-container-highest px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest text-kp-secondary uppercase">
              {exercises.length} Active Assets
            </span>
          </div>
          <button className="bg-kp-surface-bright hover:bg-kp-primary hover:text-kp-on-primary transition-all duration-300 text-kp-primary px-8 py-3 rounded-full flex items-center gap-3 group">
            <span className="material-symbols-outlined text-lg">
              add_circle
            </span>
            <span className="font-headline font-bold uppercase tracking-widest text-sm">
              Add New Exercise
            </span>
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Featured Item */}
        {featured && (
          <div className="col-span-12 lg:col-span-8 bg-kp-surface-container-low rounded-xl overflow-hidden relative group h-[400px]">
            {featured.mediaUrls?.photos?.[0]?.url && (
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                src={featured.mediaUrls.photos[0].url}
                alt={featured.name.en}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-kp-background via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-10 w-full flex justify-between items-end">
              <div>
                <div className="bg-kp-secondary/10 backdrop-blur-md text-kp-secondary text-[10px] font-black px-3 py-1 rounded mb-4 inline-block tracking-widest">
                  FEATURED ASSET
                </div>
                <h2 className="font-headline font-black text-5xl tracking-tighter text-kp-on-surface uppercase mb-2">
                  {featured.name.en}
                </h2>
                <p className="text-kp-on-surface-variant max-w-lg text-sm leading-relaxed mb-6">
                  {featured.description.en}
                </p>
                <div className="flex gap-4">
                  <button className="bg-kp-primary px-6 py-2 rounded-full text-kp-on-primary font-black text-xs uppercase tracking-widest">
                    Edit Prompt
                  </button>
                  <button className="bg-kp-surface-container-highest/60 backdrop-blur-md px-6 py-2 rounded-full text-kp-on-surface font-black text-xs uppercase tracking-widest">
                    Preview AI
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-kp-on-surface-variant text-[10px] uppercase tracking-widest mb-1">
                  Difficulty
                </span>
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 w-6 ${
                        i <= featured.difficulty
                          ? "bg-kp-primary"
                          : "bg-kp-surface-container-highest"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Stats & Filters */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-kp-surface-container-highest p-8 rounded-xl flex-1">
            <h3 className="font-headline font-black text-xl uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-kp-primary">
                analytics
              </span>
              Asset Stats
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-kp-on-surface-variant">
                  Total Exercises
                </span>
                <span className="text-kp-primary font-headline font-bold text-lg">
                  {exercises.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-kp-on-surface-variant">
                  Categories
                </span>
                <span className="text-kp-on-surface font-headline font-bold text-lg uppercase">
                  {new Set(exercises.map((e) => e.category)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-kp-on-surface-variant">
                  Filtered
                </span>
                <span className="text-kp-on-surface font-headline font-bold text-lg">
                  {filtered.length}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-kp-surface-container-low p-8 rounded-xl flex-1">
            <h3 className="font-headline font-black text-xl uppercase tracking-tighter mb-4">
              Quick Search
            </h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-kp-surface-container-lowest rounded-lg p-3 text-xs text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40 mb-4"
            />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {bodyPartFilters.map((bp) => (
                  <button
                    key={bp}
                    onClick={() => setBodyPartFilter(bp)}
                    className={`text-[10px] font-bold px-4 py-2 rounded uppercase transition-colors ${
                      bodyPartFilter === bp
                        ? "bg-kp-primary text-kp-on-primary"
                        : "bg-kp-surface-container-highest text-kp-on-surface hover:bg-kp-surface-bright"
                    }`}
                  >
                    {bp === "All" ? "All" : bp.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded uppercase transition-colors ${
                      categoryFilter === cat
                        ? "bg-kp-secondary text-kp-on-secondary"
                        : "bg-kp-surface-container-highest text-kp-on-surface-variant hover:bg-kp-surface-bright"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Cards */}
        {rest.map((exercise) => (
          <div
            key={exercise.id}
            className="col-span-12 md:col-span-6 lg:col-span-4 bg-kp-surface-container-highest rounded-xl overflow-hidden group"
          >
            <div className="h-48 relative overflow-hidden">
              {exercise.mediaUrls?.photos?.[0]?.url ? (
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                  src={exercise.mediaUrls.photos[0].url}
                  alt={exercise.name.en}
                />
              ) : (
                <div className="w-full h-full bg-kp-surface-container-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/20">
                    fitness_center
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-kp-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="w-8 h-8 rounded-full bg-kp-background/80 backdrop-blur-md flex items-center justify-center hover:text-kp-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">
                    edit
                  </span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline font-bold text-2xl uppercase tracking-tighter">
                  {exercise.name.en}
                </h3>
                <span className="text-[10px] font-black text-kp-on-surface-variant tracking-widest px-2 py-0.5 bg-kp-surface-container-low rounded-sm uppercase">
                  {exercise.category}
                </span>
              </div>
              <p className="text-xs text-kp-on-surface-variant font-sans leading-relaxed mb-6 line-clamp-2">
                {exercise.description.en}
              </p>
              <div className="flex justify-between items-center pt-4">
                <span className="text-[10px] font-bold tracking-widest uppercase text-kp-on-surface-variant">
                  {exercise.bodyParts.join(", ").replace(/_/g, " ")}
                </span>
                <span className="material-symbols-outlined text-kp-primary cursor-pointer">
                  play_circle
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
