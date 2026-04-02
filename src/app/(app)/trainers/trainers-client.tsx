"use client";

import { useState, useRef } from "react";

interface Trainer {
  id: string;
  name: string;
  baseImageUrl: string;
  createdAt: string;
}

interface Environment {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  previewUrl: string | null;
}

export function TrainersClient({
  data,
}: {
  data: { trainers: Trainer[]; environments: Environment[] };
}) {
  const [trainers, setTrainers] = useState(data.trainers);
  const [environments] = useState(data.environments);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(/\.[^.]+$/, "").toUpperCase());

      const res = await fetch("/api/trainers", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const trainer = await res.json();
        setTrainers((prev) => [trainer, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const featured = trainers[0];

  return (
    <main className="pt-16 pb-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        {/* Header */}
        <div className="mb-20 flex justify-between items-end">
          <div>
            <h1 className="font-headline text-5xl font-black text-kp-primary tracking-tighter leading-none mb-4">
              TRAINER &<br />
              ENVIRONMENT
            </h1>
            <p className="text-kp-on-surface-variant font-sans max-w-md">
              Precision model management for cinematic fitness synthesis. Upload
              base trainers and configure hyper-realistic environmental presets.
            </p>
          </div>
          <div className="flex gap-4 mb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-8 py-3 rounded-xl bg-kp-surface-container-highest text-kp-primary font-bold text-sm hover:bg-kp-surface-bright transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">cloud_upload</span>
              {uploading ? "UPLOADING..." : "UPLOAD TRAINER"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left: Trainer Gallery */}
          <section className="col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-xl font-bold tracking-tight text-kp-on-surface">
                TRAINER BASE PHOTOS
              </h2>
              <span className="text-[10px] font-sans text-kp-secondary tracking-widest bg-kp-secondary/10 px-3 py-1 rounded-sm">
                {trainers.length} SOURCES ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {/* Large Featured Card */}
              {featured && (
                <div className="col-span-2 row-span-2 relative group rounded-xl overflow-hidden bg-kp-surface-container-highest">
                  <img
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 aspect-[4/3]"
                    src={featured.baseImageUrl}
                    alt={featured.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kp-background via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-sans text-kp-primary-dim tracking-[0.2em] mb-1">
                        PRIMARY TRAINER
                      </div>
                      <div className="text-2xl font-headline font-black leading-none">
                        {featured.name}
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full kinetic-glass flex items-center justify-center text-kp-primary hover:bg-kp-primary hover:text-kp-on-primary transition-all">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Smaller Gallery Items */}
              {trainers.slice(1, 5).map((trainer) => (
                <div
                  key={trainer.id}
                  className="relative group rounded-xl overflow-hidden bg-kp-surface-container-highest aspect-square"
                >
                  <img
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    src={trainer.baseImageUrl}
                    alt={trainer.name}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-kp-secondary text-kp-on-secondary px-4 py-2 rounded-full font-headline text-xs font-bold uppercase tracking-widest">
                      Preview
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Placeholder */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-kp-outline-variant/30 rounded-xl flex flex-col items-center justify-center aspect-square hover:bg-kp-surface-container-low transition-colors group cursor-pointer"
              >
                <span className="material-symbols-outlined text-kp-on-surface-variant group-hover:text-kp-primary transition-colors text-3xl mb-2">
                  add_a_photo
                </span>
                <span className="text-[10px] font-headline uppercase tracking-[0.2em] text-kp-on-surface-variant">
                  Add Source
                </span>
              </button>
            </div>
          </section>

          {/* Right: Environment Presets */}
          <section className="col-span-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-xl font-bold tracking-tight text-kp-on-surface">
                ENVIRONMENTS
              </h2>
              <button className="material-symbols-outlined text-kp-primary">
                tune
              </button>
            </div>

            {environments.map((env, idx) => (
              <div
                key={env.id}
                className={`rounded-xl p-5 ${
                  idx === 0
                    ? "bg-kp-surface-container-highest border-l-4 border-kp-primary"
                    : "bg-kp-surface-container-low hover:bg-kp-surface-container-high transition-all group cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3
                      className={`font-headline font-bold uppercase tracking-wide ${
                        idx === 0
                          ? "text-kp-on-surface"
                          : "text-kp-on-surface-variant group-hover:text-kp-on-surface transition-colors"
                      }`}
                    >
                      {env.name}
                    </h3>
                    <p className="text-[10px] text-kp-on-surface-variant font-sans uppercase tracking-widest">
                      {env.description}
                    </p>
                  </div>
                  {idx === 0 && (
                    <span
                      className="material-symbols-outlined text-kp-primary text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>

                {env.previewUrl && (
                  <div className="relative rounded-lg overflow-hidden h-24 mb-4">
                    <img
                      className={`w-full h-full object-cover ${
                        idx === 0
                          ? "opacity-50"
                          : "opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-500"
                      }`}
                      src={env.previewUrl}
                      alt={env.name}
                    />
                  </div>
                )}

                {idx === 0 && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-sans text-kp-on-surface-variant uppercase tracking-widest px-1">
                      AI PROMPT CONFIG
                    </label>
                    <div className="bg-kp-surface-container-low rounded-lg p-3 text-xs font-sans text-kp-on-surface leading-relaxed">
                      <span className="text-kp-primary">/env</span>{" "}
                      {env.prompt}
                    </div>
                  </div>
                )}

                {idx !== 0 && (
                  <button className="w-full py-2 text-[10px] font-headline font-bold uppercase tracking-widest text-kp-on-surface-variant hover:text-kp-primary rounded-full transition-colors mt-2">
                    Configure Preset
                  </button>
                )}
              </div>
            ))}

            {/* New Preset */}
            <button className="w-full py-6 rounded-xl border-2 border-dashed border-kp-outline-variant/30 flex flex-col items-center gap-2 hover:bg-kp-surface-container-high transition-all">
              <span className="material-symbols-outlined text-kp-primary">
                add_location_alt
              </span>
              <span className="text-xs font-headline font-bold uppercase tracking-widest text-kp-on-surface-variant">
                Create New Environment
              </span>
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
