"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, X, FileText, ChevronDown, FolderKanban, Check } from "lucide-react";
import { Attachment, EffortLevel, ModelId, Project } from "@/types";
import { EffortDropdown } from "./EffortDropdown";
import { ModelSelector } from "./ModelSelector";
import { IMAGE_UPLOADS_ENABLED, IMAGE_UPLOADS_PAUSED_MESSAGE, isImageMimeType } from "@/lib/features";

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
  guest?: boolean;
  onRequireAccount?: () => void;
  /** Free-limit line shown under the composer, e.g. "4 of 25 messages left today". */
  usageNote?: string | null;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_BYTES = 512 * 1024;
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const TEXT_FILE_PATTERN =
  /\.(txt|md|csv|tsv|json|ya?ml|xml|html?|css|scss|js|jsx|ts|tsx|py|java|c|cpp|h|rs|go|rb|php|sh|sql|log|env|toml|ini)$/i;
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?|ico)$/i;

/** Picker filter. Images are left out while image uploads are paused. */
const PICKER_ACCEPT = IMAGE_UPLOADS_ENABLED
  ? ".pdf,.txt,.json,.md,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,image/*"
  : ".pdf,.txt,.json,.md,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css";

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
  guest,
  onRequireAccount,
  usageNote,
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  // Grow the textarea with its content, up to a cap.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [content]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsProjectMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !isLoading;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends. Shift+Enter inserts a newline. Ignore Enter while an IME is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** Shared by the file picker and drag-and-drop, so both follow the same rules. */
  const addFiles = (files: File[]) => {
    let imageBlocked = false;

    files.forEach((file) => {
      const looksLikeImage = isImageMimeType(file.type) || IMAGE_FILE_PATTERN.test(file.name);
      if (looksLikeImage && !IMAGE_UPLOADS_ENABLED) {
        imageBlocked = true;
        return;
      }

      const isImage = looksLikeImage;
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const isText =
        !isImage &&
        (file.type.startsWith("text/") ||
          file.type === "application/json" ||
          TEXT_FILE_PATTERN.test(file.name));

      if (!isImage && !isText && !isPdf) {
        window.alert(
          `"${file.name}" can't be read yet. ${
            IMAGE_UPLOADS_ENABLED
              ? "Attach images (PNG, JPG, WEBP, GIF), PDFs, or text and code files."
              : "Attach PDFs or text and code files."
          }`
        );
        return;
      }
      if (isPdf && file.size > MAX_PDF_BYTES) {
        window.alert(`"${file.name}" is larger than 4 MB. Please attach a smaller PDF.`);
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
            type: isPdf ? "application/pdf" : isImage ? file.type : file.type || "text/plain",
            size: file.size,
            content: fileContent,
          },
        ]);
      };
      if (isImage || isPdf) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (imageBlocked) {
      window.alert(IMAGE_UPLOADS_PAUSED_MESSAGE);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag-and-drop. A depth counter keeps the highlight steady while the pointer crosses child elements.
  const dragCarriesFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragCarriesFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragCarriesFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragCarriesFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragCarriesFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div
      className="w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`bg-card rounded-2xl border shadow-[0_4px_24px_rgb(0_0_0/0.04)] focus-within:border-accent/40 transition-colors duration-200 ${
          isDragging ? "border-accent ring-2 ring-accent/30" : "border-line"
        }`}
      >
        {/* Attached files */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3.5 pt-3">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-app border border-line text-xs text-ink max-w-full"
              >
                <FileText className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.75} />
                <span className="truncate max-w-[160px] font-mono">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  aria-label={`Remove ${att.name}`}
                  className="p-1 rounded text-muted hover:text-ink hover:bg-hover transition-colors duration-150"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text input */}
        <div className="px-4 pt-3.5 pb-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            aria-label="Message RoleFlow"
            rows={1}
            className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted outline-none resize-none leading-relaxed min-h-[44px] max-h-[220px]"
          />
        </div>

        {/* Bottom row */}
        <div className="px-2.5 pb-2.5 pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={PICKER_ACCEPT}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 shrink-0"
              title="Attach files or code"
              aria-label="Attach files or code"
            >
              <Plus className="w-5 h-5" strokeWidth={1.75} />
            </button>

            {/* Project picker */}
            <div className="relative min-w-0" ref={projectMenuRef}>
              <button
                type="button"
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                aria-haspopup="listbox"
                aria-expanded={isProjectMenuOpen}
                className="flex items-center gap-1.5 min-h-[36px] px-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 min-w-0"
              >
                <FolderKanban className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="hidden sm:inline truncate max-w-[140px]">
                  {activeProject ? activeProject.name : "Project"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              </button>

              {isProjectMenuOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 bottom-full mb-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl bg-card shadow-menu p-1.5 z-50 animate-message"
                >
                  <div className="text-xs font-medium text-muted px-2.5 py-1.5">Workspaces</div>
                  <button
                    type="button"
                    role="option"
                    aria-selected={!selectedProjectId}
                    onClick={() => {
                      onProjectChange(undefined);
                      setIsProjectMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left text-ink hover:bg-hover transition-colors duration-150"
                  >
                    <span>No project (general)</span>
                    {!selectedProjectId && <Check className="w-4 h-4 text-accent" strokeWidth={2} />}
                  </button>

                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      role="option"
                      aria-selected={selectedProjectId === proj.id}
                      onClick={() => {
                        onProjectChange(proj.id);
                        setIsProjectMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left text-ink hover:bg-hover transition-colors duration-150"
                    >
                      <span className="truncate">{proj.name}</span>
                      {selectedProjectId === proj.id && <Check className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />}
                    </button>
                  ))}

                  {onCreateProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        onCreateProject();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 pt-2 border-t border-line rounded-lg text-sm text-accent hover:bg-hover transition-colors duration-150"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.75} />
                      <span>Create new project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Model, effort, send */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <ModelSelector
              currentModel={model}
              onSelect={onModelChange}
              placement="up"
              guest={guest}
              onRequireAccount={onRequireAccount}
            />
            <EffortDropdown effort={effort} onChange={onEffortChange} placement="up" />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              className={`ml-1 w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                canSend
                  ? "bg-accent hover:bg-accent-hover text-white"
                  : "bg-hover text-muted cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {usageNote && (
        <p className="text-xs text-muted text-center mt-2 px-2" aria-live="polite">
          {usageNote}
        </p>
      )}
    </div>
  );
};
