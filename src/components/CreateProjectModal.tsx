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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#18181b] border border-[#2e2d2b] rounded-2xl shadow-2xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#252422] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <FolderPlus className="w-5 h-5 text-[#d97706]" />
          <h3 className="text-lg font-semibold text-[#f3f3ee]">Create New Project</h3>
        </div>
        <p className="text-xs text-[#9b9a97] mb-5">
          Group related chats and give them dedicated custom instructions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c4c3be] mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. RoleFlow v2 Launch"
              className="w-full bg-[#20201f] text-sm text-[#f3f3ee] placeholder-[#858480] px-3.5 py-2.5 rounded-xl border border-[#333230] focus:outline-none focus:border-[#d97706]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c4c3be] mb-1.5">
              Project Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Specific instructions for chats within this project..."
              className="w-full bg-[#20201f] text-sm text-[#f3f3ee] placeholder-[#858480] p-3.5 rounded-xl border border-[#333230] focus:outline-none focus:border-[#d97706] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e2d2b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#9b9a97] hover:text-[#f3f3ee]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-[#f3f3ee] hover:bg-white text-[#141413] text-xs font-semibold shadow transition-colors"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
