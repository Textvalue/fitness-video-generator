"use client";

import { useState } from "react";

interface Video {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseCategory: string;
  trainerName: string;
  trainerImageUrl: string;
  environmentName: string;
  imageUrl: string | null;
  videoUrl: string;
  veoVersion: string;
  duration: number | null;
  completedAt: string;
  totalCost: number | null;
}

const filterCategories = ["All", "push", "pull", "squat", "hinge", "core"];

export function VideosClient({ videos }: { videos: Video[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [trainerFilter, setTrainerFilter] = useState("All");
  const [groupBy, setGroupBy] = useState<"none" | "exercise" | "trainer">("exercise");

  const trainers = [...new Set(videos.map((v) => v.trainerName))];

  const filtered = videos.filter((v) => {
    const nameMatch = v.exerciseName.toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "All" || v.exerciseCategory === categoryFilter;
    const trainerMatch = trainerFilter === "All" || v.trainerName === trainerFilter;
    return nameMatch && catMatch && trainerMatch;
  });

  // Group videos
  const grouped = groupBy === "none"
    ? { "All Videos": filtered }
    : filtered.reduce<Record<string, Video[]>>((acc, v) => {
        const key = groupBy === "exercise" ? v.exerciseName : v.trainerName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
      }, {});

  const groupKeys = Object.keys(grouped).sort();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this generation?")) return;
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-kp-on-surface">Videos</h1>
          <p className="text-sm text-kp-on-surface-variant mt-1">{filtered.length} video{filtered.length !== 1 ? "s" : ""} generated</p>
        </div>
      </div>

      {/* Filters */}
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
        {trainers.length > 1 && (
          <select
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            className="bg-kp-surface-container-highest rounded-lg px-3 py-2 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
          >
            <option value="All">All Trainers</option>
            {trainers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <div className="ml-auto flex gap-1">
          {(["exercise", "trainer", "none"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                groupBy === g
                  ? "bg-kp-secondary/20 text-kp-secondary"
                  : "text-kp-on-surface-variant hover:text-kp-on-surface"
              }`}
            >
              {g === "none" ? "Flat" : `By ${g}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-kp-surface-container-lowest rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/30 mb-4 block">videocam_off</span>
          <p className="text-sm text-kp-on-surface-variant">No videos yet. Generate some from the <a href="/bulk-generate" className="text-kp-primary underline">Bulk Generate</a> page.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map((groupName) => (
            <div key={groupName}>
              {groupBy !== "none" && (
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-kp-on-surface">
                    {groupName}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-kp-surface-container-highest text-kp-on-surface-variant">
                    {grouped[groupName].length}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[groupName].map((video) => (
                  <div
                    key={video.id}
                    className="rounded-xl overflow-hidden bg-kp-surface-container-lowest group"
                  >
                    <div className="aspect-video relative bg-kp-surface-container-high">
                      <video
                        src={video.videoUrl}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-headline font-bold text-sm line-clamp-1">{video.exerciseName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-surface-container-highest text-kp-on-surface-variant">
                              {video.exerciseCategory}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-kp-primary/10 text-kp-primary">
                              {video.veoVersion.replace("-generate-preview", "").replace("-generate-001", "")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <a
                            href={video.videoUrl}
                            download
                            className="w-8 h-8 rounded-lg bg-kp-surface-container-highest flex items-center justify-center hover:bg-kp-primary/10 transition-colors"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[16px] text-kp-on-surface-variant">download</span>
                          </a>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="w-8 h-8 rounded-lg bg-kp-surface-container-highest flex items-center justify-center hover:bg-kp-error/10 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[16px] text-kp-error">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-kp-on-surface-variant/60">
                        <span>{video.trainerName}</span>
                        <span>·</span>
                        <span>{video.environmentName}</span>
                        <span>·</span>
                        <span>{new Date(video.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
