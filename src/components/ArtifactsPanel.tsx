"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Download, Archive, Code2, Eye } from "lucide-react";
import JSZip from "jszip";
import { Artifact } from "@/types";

interface ArtifactsPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!artifact) return null;

  const currentFile =
    (artifact.files && artifact.files[activeFileIndex]) ||
    (artifact.files && artifact.files[0]) ||
    { filename: "artifact.txt", language: "text", content: "" };
  const canPreview = artifact.type === "web" || currentFile?.language === "html";

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!artifact.files.length) return;
    const zip = new JSZip();
    artifact.files.forEach((f) => {
      zip.file(f.filename, f.content);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const segment = (active: boolean) =>
    `flex items-center gap-1.5 min-h-[32px] px-3 rounded-md text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
      active ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
    }`;

  return (
    <aside
      className="fixed inset-0 z-40 md:static md:inset-auto md:z-auto w-full md:w-[min(560px,46vw)] lg:w-[min(640px,44vw)] h-full bg-app md:border-l border-line flex flex-col shrink-0 animate-message"
      aria-label="Artifact"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-ink truncate">{artifact.title}</h3>
            <span className="text-[11px] text-muted uppercase tracking-wider">
              {artifact.primaryLanguage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canPreview && (
            <div className="flex items-center bg-hover p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={segment(activeTab === "code")}
              >
                <Code2 className="w-4 h-4" strokeWidth={1.75} />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={segment(activeTab === "preview")}
              >
                <Eye className="w-4 h-4" strokeWidth={1.75} />
                <span>Preview</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close artifact"
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Multi-file tabs */}
      {artifact.files.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-line overflow-x-auto">
          {artifact.files.map((file, idx) => (
            <button
              key={file.filename}
              type="button"
              onClick={() => setActiveFileIndex(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors duration-150 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                activeFileIndex === idx
                  ? "bg-hover text-ink"
                  : "text-muted hover:text-ink hover:bg-hover/60"
              }`}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-panel">
        {activeTab === "preview" && canPreview ? (
          <iframe
            srcDoc={currentFile.content}
            title={artifact.title}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <pre className="p-4 text-[13px] font-mono text-ink overflow-auto h-full leading-relaxed select-text">
            <code>{currentFile.content}</code>
          </pre>
        )}
      </div>

      {/* Footer actions */}
      <div className="min-h-14 px-3 py-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150"
          >
            {copied ? <Check className="w-4 h-4 text-accent" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.75} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150 min-w-0"
          >
            <Download className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Download {currentFile.filename}</span>
          </button>
        </div>

        {artifact.files.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-sm font-medium bg-card text-ink shadow-sm hover:bg-hover transition-colors duration-150"
          >
            <Archive className="w-4 h-4 text-accent" strokeWidth={1.75} />
            <span>Download .zip</span>
          </button>
        )}
      </div>
    </aside>
  );
};
