"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, X, FileText, ChevronDown } from "lucide-react";
import { Attachment, EffortLevel, ModelId, Project } from "@/types";
import { EffortDropdown } from "./EffortDropdown";
import { ModelSelector } from "./ModelSelector";

interface PromptBoxProps {
  onSend: (content: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
  effort: EffortLevel;
  onEffortChange: (effort: EffortLevel) => void;
  projects: Project[];
  selectedProjectId?: string;
  onProjectChange: (projectId?: string) => void;
  onCreateProject?: () => void;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  onSend,
  isLoading,
  model,
  onModelChange,
  effort,
  onEffortChange,
  projects,
  selectedProjectId,
  onProjectChange,
  onCreateProject,
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [content]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(e.target as Node)
      ) {
        setIsProjectMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && attachments.length === 0) || isLoading) return;
    onSend(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
  const MAX_TEXT_BYTES = 512 * 1024;
  const TEXT_FILE_PATTERN =
    /\.(txt|md|csv|tsv|json|ya?ml|xml|html?|css|scss|js|jsx|ts|tsx|py|java|c|cpp|h|rs|go|rb|php|sh|sql|log|env|toml|ini)$/i;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isText =
        !isImage &&
        (file.type.startsWith("text/") ||
          file.type === "application/json" ||
          TEXT_FILE_PATTERN.test(file.name));

      if (!isImage && !isText) {
        window.alert(
          `"${file.name}" can't be read yet. Attach images (PNG, JPG, WEBP, GIF) or text and code files.`
        );
        return;
      }
      if (isImage && file.size > MAX_IMAGE_BYTES) {
        window.alert(`"${file.name}" is larger than 4 MB. Please use a smaller image.`);
        return;
      }
      if (isText && file.size > MAX_TEXT_BYTES) {
        window.alert(`"${file.name}" is larger than 512 KB. Please attach a smaller file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: isImage ? file.type : file.type || "text/plain",
            size: file.size,
            content: fileContent,
          },
        ]);
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="bg-[#1f1e1d] border border-[#33312e] hover:border-[#42403c] focus-within:border-[#d97706]/70 rounded-2xl shadow-2xl transition-all duration-200">
        {/* Attached files pills */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#282725] border border-[#3d3b37] text-xs text-[#e4e4e7] shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-[#d97706]" />
                <span className="truncate max-w-[140px] font-mono">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="p-0.5 text-[#8f8e8a] hover:text-[#f4f4f0]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Area */}
        <div className="p-3.5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={1}
            className="w-full bg-transparent text-[#f4f4f0] text-[15.5px] placeholder-[#807f7b] focus:outline-none resize-none leading-relaxed min-h-[46px] max-h-[220px]"
          />
        </div>

        {/* Bottom Actions Row */}
        <div className="px-3 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-xl text-[#8f8e8a] hover:text-[#f4f4f0] hover:bg-[#282725] transition-colors"
              title="Attach files or code"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Project Dropdown Selector */}
            <div className="relative" ref={projectMenuRef}>
              <button
                type="button"
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#8f8e8a] hover:text-[#f4f4f0] hover:bg-[#282725] transition-colors border border-transparent hover:border-[#383633]"
              >
                <span>{activeProject ? activeProject.name : "Project"}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isProjectMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-60 rounded-2xl bg-[#1f1e1d] border border-[#383633] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-[#807f7b] px-2.5 py-1 uppercase tracking-wider">
                    Workspaces
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onProjectChange(undefined);
                      setIsProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors ${
                      !selectedProjectId
                        ? "bg-[#2b2a28] text-[#f4f4f0] font-medium"
                        : "text-[#8f8e8a] hover:bg-[#262523]"
                    }`}
                  >
                    No Project (General)
                  </button>

                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        onProjectChange(proj.id);
                        setIsProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors truncate ${
                        selectedProjectId === proj.id
                          ? "bg-[#2b2a28] text-[#f4f4f0] font-medium"
                          : "text-[#8f8e8a] hover:bg-[#262523]"
                      }`}
                    >
                      {proj.name}
                    </button>
                  ))}

                  {onCreateProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onCreateProject();
                      }}
                      className="w-full text-left px-3 py-1.5 mt-1 pt-1.5 border-t border-[#2e2d2b] rounded-xl text-xs text-[#d97706] hover:bg-[#262523] transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Model, Effort & Send button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#181716] px-2.5 py-1 rounded-xl border border-[#2f2e2c] gap-1.5">
              <ModelSelector currentModel={model} onSelect={onModelChange} />
              <span className="text-[#3d3b37]">•</span>
              <EffortDropdown effort={effort} onChange={onEffortChange} />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!content.trim() && attachments.length === 0) || isLoading}
              className={`p-2 rounded-xl transition-all ${
                (!content.trim() && attachments.length === 0) || isLoading
                  ? "bg-[#2d2c2a] text-[#63625f] cursor-not-allowed"
                  : "bg-[#f4f4f0] hover:bg-white text-[#141413] shadow-lg hover:scale-105 active:scale-95"
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
