"use client";

import { useState } from "react";

interface Environment {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  previewUrl: string | null;
}

export function EnvironmentsClient({ environments: initial }: { environments: Environment[] }) {
  const [environments, setEnvironments] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), prompt: prompt.trim(), description: "" }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setPrompt("");
      setAdding(false);
      window.location.reload();
    } catch {
      alert("Failed to create environment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this environment?")) return;
    const res = await fetch(`/api/environments/${id}`, { method: "DELETE" });
    if (res.ok) setEnvironments((e) => e.filter((x) => x.id !== id));
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim() || !editPrompt.trim()) return;
    const res = await fetch(`/api/environments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), prompt: editPrompt.trim() }),
    });
    if (res.ok) {
      setEnvironments((e) =>
        e.map((x) => (x.id === id ? { ...x, name: editName.trim(), prompt: editPrompt.trim() } : x))
      );
      setEditingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-headline font-black text-5xl text-kp-on-surface tracking-tighter mb-2">
            ENVIRONMENTS
          </h1>
          <p className="text-kp-on-surface-variant text-sm">
            Manage scene environments for AI image generation.
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest shrink-0"
        >
          {adding ? "Cancel" : "Add Environment"}
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="bg-kp-surface-container-lowest rounded-xl p-6 mb-10">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Modern Gym"
                className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-kp-on-surface-variant block mb-2">Scene Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene..."
                rows={3}
                className="w-full bg-kp-surface-container-highest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40 resize-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !name.trim() || !prompt.trim()}
              className="bg-kp-primary text-kp-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm uppercase tracking-widest disabled:opacity-30"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {environments.length === 0 ? (
        <div className="text-center py-20 text-kp-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">landscape</span>
          <p className="text-sm">No environments yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {environments.map((env) => (
            <div key={env.id} className="bg-kp-surface-container-highest rounded-xl overflow-hidden group relative">
              <div className="aspect-video overflow-hidden">
                {env.previewUrl ? (
                  <img src={env.previewUrl} alt={env.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-kp-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-kp-on-surface-variant/20">landscape</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                {editingId === env.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-kp-surface-container-low rounded-lg px-3 py-2 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary"
                      autoFocus
                    />
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-kp-surface-container-low rounded-lg px-3 py-2 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(env.id)}
                        className="bg-kp-primary text-kp-on-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-kp-surface-container-low text-kp-on-surface-variant px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-headline font-bold text-lg uppercase tracking-tight mb-2">{env.name}</h3>
                    <p className="text-[11px] text-kp-on-surface-variant leading-relaxed line-clamp-3">{env.prompt}</p>
                  </>
                )}
              </div>
              {/* Actions */}
              {editingId !== env.id && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(env.id); setEditName(env.name); setEditPrompt(env.prompt); }}
                    className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(env.id)}
                    className="w-8 h-8 rounded-full bg-kp-background/70 backdrop-blur-md flex items-center justify-center text-kp-on-surface hover:text-kp-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
