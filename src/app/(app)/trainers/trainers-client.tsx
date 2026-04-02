"use client";

import { useState, useRef } from "react";

interface Trainer {
  id: string;
  name: string;
  imageUrl: string;
}

export function TrainersClient({ trainers: initial }: { trainers: Trainer[] }) {
  const [trainers, setTrainers] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", name.trim());
      const res = await fetch("/api/trainers", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      setName("");
      if (fileRef.current) fileRef.current.value = "";
      window.location.reload();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trainer?")) return;
    const res = await fetch(`/api/trainers/${id}`, { method: "DELETE" });
    if (res.ok) setTrainers((t) => t.filter((x) => x.id !== id));
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    const form = new FormData();
    form.append("name", editName.trim());
    const res = await fetch(`/api/trainers/${id}`, { method: "PUT", body: form });
    if (res.ok) {
      setTrainers((t) => t.map((x) => (x.id === id ? { ...x, name: editName.trim() } : x)));
      setEditingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      <h1 className="font-headline font-black text-5xl text-kp-on-surface tracking-tighter mb-2">
        TRAINERS
      </h1>
      <p className="text-kp-on-surface-variant text-sm mb-10">
        Upload and manage trainer photos for AI image generation.
      </p>

      {/* Upload */}
      <div className="bg-kp-surface-container-lowest rounded-xl p-6 mb-10">
        <h3 className="font-headline font-bold text-sm uppercase tracking-widest mb-4">
          Upload New Trainer
        </h3>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trainer name..."
              className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="w-full bg-kp-surface-container-highest rounded-lg p-2.5 text-sm text-kp-on-surface border-none file:bg-kp-primary file:text-kp-on-primary file:border-none file:rounded-md file:px-3 file:py-1 file:text-xs file:font-bold file:mr-3"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30 shrink-0"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Grid */}
      {trainers.length === 0 ? (
        <div className="text-center py-20 text-kp-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">person_add</span>
          <p className="text-sm">No trainers uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {trainers.map((t) => (
            <div key={t.id} className="bg-kp-surface-container-highest rounded-xl overflow-hidden group relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                {editingId === t.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-kp-surface-container-low rounded px-2 py-1 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(t.id); if (e.key === "Escape") setEditingId(null); }}
                    />
                    <button onClick={() => handleEdit(t.id)} className="text-kp-primary">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                  </div>
                ) : (
                  <h3 className="font-headline font-bold text-sm uppercase tracking-tight">{t.name}</h3>
                )}
              </div>
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingId(t.id); setEditName(t.name); }}
                  className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-error transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
