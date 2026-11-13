"use client";

import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { Project } from "@/types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          customInstructions: instructions.trim(),
        }),
      });

      const data = await res.json();
      if (data.project) {
        onCreated(data.project);
        setName("");
        setInstructions("");
        onClose();
      }
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px] animate-message"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="relative w-full max-w-md bg-card text-ink border border-line rounded-2xl shadow-menu p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <FolderPlus className="w-5 h-5 text-accent" />
          <h3 id="create-project-title" className="font-display text-xl text-ink">
            Create new project
          </h3>
        </div>
        <p className="text-sm text-muted mb-6">
          Group related chats and give them dedicated custom instructions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-ink mb-1.5">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website redesign"
              className="w-full bg-app text-sm text-ink placeholder:text-muted/70 px-3.5 py-2.5 rounded-xl border border-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus:border-accent/60 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="project-instructions" className="block text-sm font-medium text-ink mb-1.5">
              Project instructions <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="project-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Specific instructions for chats within this project..."
              className="w-full bg-app text-sm text-ink placeholder:text-muted/70 p-3.5 rounded-xl border border-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus:border-accent/60 resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-muted hover:text-ink hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
