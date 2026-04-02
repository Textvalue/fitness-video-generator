"use client";

import Link from "next/link";

interface Generation {
  id: string;
  status: string;
  exerciseName: string;
  trainerName: string;
  environmentName: string;
  imageUrl: string | null;
  videoUrl: string | null;
  totalCost: number | null;
  createdAt: string;
  imagePrompt: string | null;
}

interface DashboardData {
  totalVideos: number;
  recentCount: number;
  totalCost: number;
  recentGenerations: Generation[];
}

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div className="px-8 pt-8">
      {/* Hero Metrics */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-5xl font-black font-headline tracking-tighter text-kp-on-surface">
              Dashboard
            </h1>
            <p className="text-kp-on-surface-variant font-sans mt-2">
              Operational overview for session{" "}
              <span className="text-kp-secondary">#KR-2024-09X</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-kp-on-surface-variant font-headline">
              Status
            </div>
            <div className="flex items-center gap-2 text-kp-primary">
              <span className="w-2 h-2 bg-kp-primary rounded-full animate-pulse" />
              <span className="font-headline font-bold text-lg">
                SYSTEMS NOMINAL
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Videos */}
          <div className="bg-kp-surface-container-low p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[6rem]">
                movie
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-kp-on-surface-variant font-headline mb-4">
              Total Videos Generated
            </div>
            <div className="text-4xl font-black font-headline text-kp-on-surface">
              {data.totalVideos.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center text-kp-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm mr-1">
                trending_up
              </span>
              +12% from last cycle
            </div>
          </div>

          {/* Recent Generations */}
          <div className="bg-kp-surface-container-low p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[6rem]">
                speed
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-kp-on-surface-variant font-headline mb-4">
              Recent Generations
            </div>
            <div className="text-4xl font-black font-headline text-kp-on-surface">
              {data.recentCount}
            </div>
            <div className="mt-4 flex items-center text-kp-secondary text-xs font-bold">
              <span className="material-symbols-outlined text-sm mr-1">
                timer
              </span>
              Avg. Render: 4.2s
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-kp-surface-container-low p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[6rem]">
                payments
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-kp-on-surface-variant font-headline mb-4">
              Total API Cost
            </div>
            <div className="text-4xl font-black font-headline text-kp-on-surface">
              ${data.totalCost.toFixed(2)}
            </div>
            <div className="mt-4 flex items-center text-kp-error text-xs font-bold">
              <span className="material-symbols-outlined text-sm mr-1">
                info
              </span>
              Track your spending
            </div>
          </div>
        </div>
      </section>

      {/* Content Split */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* Recent Projects Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-headline font-bold text-kp-on-surface">
              Recent Projects
            </h2>
            <Link
              href="/library"
              className="text-xs font-headline tracking-widest text-kp-primary hover:underline uppercase"
            >
              View All Assets
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {data.recentGenerations.length > 0 ? (
              data.recentGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="bg-kp-surface-container-highest rounded-xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-video relative overflow-hidden bg-kp-surface-container-low">
                    {gen.imageUrl ? (
                      <img
                        src={gen.imageUrl}
                        alt={gen.exerciseName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/30">
                          image
                        </span>
                      </div>
                    )}
                    {gen.status === "COMPLETED" && gen.videoUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 bg-kp-secondary/80 backdrop-blur-md rounded-full flex items-center justify-center text-kp-on-secondary">
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            play_arrow
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-kp-secondary-container/40 backdrop-blur-md text-kp-on-secondary-container text-[8px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                        {gen.status === "COMPLETED"
                          ? "Rendered"
                          : gen.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline font-bold text-kp-on-surface">
                        {gen.exerciseName}
                      </h3>
                      <span className="text-[10px] text-kp-on-surface-variant font-headline uppercase">
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-kp-on-surface-variant line-clamp-1 mb-4">
                      {gen.imagePrompt || `${gen.trainerName} in ${gen.environmentName}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          gen.status === "COMPLETED"
                            ? "bg-kp-primary"
                            : gen.status === "FAILED"
                            ? "bg-kp-error"
                            : "bg-kp-secondary animate-ping"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-headline uppercase tracking-widest ${
                          gen.status === "COMPLETED"
                            ? "text-kp-primary"
                            : gen.status === "FAILED"
                            ? "text-kp-error"
                            : "text-kp-secondary"
                        }`}
                      >
                        {gen.status === "COMPLETED"
                          ? "Completed"
                          : gen.status === "FAILED"
                          ? "Failed"
                          : "Rendering..."}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Empty state placeholder cards */}
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-kp-surface-container-highest rounded-xl overflow-hidden"
                  >
                    <div className="aspect-video bg-kp-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/20">
                        movie
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-headline font-bold text-kp-on-surface-variant/40 mb-2">
                        No generations yet
                      </h3>
                      <p className="text-xs text-kp-on-surface-variant/30">
                        Start by creating a new generation in the Pipeline
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Sidebar Controls */}
        <aside className="space-y-6">
          <div className="bg-kp-surface-container-low p-6 rounded-xl">
            <h2 className="text-xs font-headline tracking-widest text-kp-primary uppercase mb-6">
              Quick Prompt
            </h2>
            <textarea
              className="w-full bg-kp-surface-container-lowest rounded-lg p-4 text-xs font-sans text-kp-on-surface h-32 focus:ring-1 focus:ring-kp-primary border-none placeholder:text-kp-on-surface-variant/30 resize-none"
              placeholder="Describe the scene you want to generate..."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {["Cinematic", "8K UHD", "Slow Motion"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-kp-surface-container-highest text-[9px] font-bold uppercase tracking-tighter text-kp-on-surface-variant rounded-sm cursor-pointer hover:bg-kp-surface-bright transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/pipeline"
              className="w-full mt-6 py-2 bg-kp-primary text-kp-on-primary font-headline font-black text-xs tracking-widest rounded-full hover:shadow-[0_0_15px_rgba(221,255,177,0.4)] transition-all block text-center"
            >
              GENERATE PREVIEW
            </Link>
          </div>

          <div className="bg-kp-surface-container-low p-6 rounded-xl">
            <h2 className="text-xs font-headline tracking-widest text-kp-secondary uppercase mb-6">
              Live Pipeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-kp-primary rounded-full" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-kp-on-surface uppercase">
                    Nano Banana: Ready
                  </div>
                  <div className="w-full h-1 bg-kp-surface-container-highest rounded-full mt-1">
                    <div className="w-full h-full bg-kp-primary rounded-full" />
                  </div>
                </div>
                <div className="text-[9px] text-kp-on-surface-variant">
                  READY
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-kp-secondary rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-kp-on-surface uppercase">
                    Veo 3.1: Active
                  </div>
                  <div className="w-full h-1 bg-kp-surface-container-highest rounded-full mt-1">
                    <div className="w-3/4 h-full bg-kp-secondary rounded-full" />
                  </div>
                </div>
                <div className="text-[9px] text-kp-on-surface-variant">
                  ACTIVE
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-2 h-2 bg-kp-on-surface-variant rounded-full" />
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-kp-on-surface uppercase">
                    Post-Processing
                  </div>
                  <div className="w-full h-1 bg-kp-surface-container-highest rounded-full mt-1">
                    <div className="w-0 h-full bg-kp-primary rounded-full" />
                  </div>
                </div>
                <div className="text-[9px] text-kp-on-surface-variant">
                  QUEUED
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="h-20" />
    </div>
  );
}
