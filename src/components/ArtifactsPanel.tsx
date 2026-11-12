"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, Archive, Play, Code2, Eye } from "lucide-react";
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

  return (
    <aside className="w-[520px] lg:w-[620px] h-full bg-[#18181b] border-l border-[#2e2d2b] flex flex-col z-30 shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#2e2d2b] flex items-center justify-between bg-[#141413]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#262624] border border-[#383734] flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-medium text-[#f3f3ee] truncate">
              {artifact.title}
            </h3>
            <span className="text-[11px] text-[#9b9a97] uppercase tracking-wider">
              {artifact.primaryLanguage}
            </span>
          </div>
        </div>

        {/* Tab & Close */}
        <div className="flex items-center gap-2">
          {canPreview && (
            <div className="flex items-center bg-[#20201f] p-0.5 rounded-lg border border-[#333230]">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "code"
                    ? "bg-[#2b2a28] text-[#f3f3ee] shadow-sm"
                    : "text-[#9b9a97] hover:text-[#f3f3ee]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-[#2b2a28] text-[#f3f3ee] shadow-sm"
                    : "text-[#9b9a97] hover:text-[#f3f3ee]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#262624] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multi-file Tabs (if multiple files exist) */}
      {artifact.files.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2e2d2b] bg-[#1a1918] overflow-x-auto">
          {artifact.files.map((file, idx) => (
            <button
              key={file.filename}
              type="button"
              onClick={() => setActiveFileIndex(idx)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors shrink-0 ${
                activeFileIndex === idx
                  ? "bg-[#282725] text-[#f3f3ee] font-semibold border border-[#383734]"
                  : "text-[#9b9a97] hover:text-[#f3f3ee]"
              }`}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 overflow-hidden relative bg-[#121212]">
        {activeTab === "preview" && canPreview ? (
          <div className="w-full h-full bg-white">
            <iframe
              srcDoc={currentFile.content}
              title={artifact.title}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <pre className="p-4 text-xs font-mono text-[#e4e4e7] overflow-auto h-full leading-relaxed select-text">
            <code>{currentFile.content}</code>
          </pre>
        )}
      </div>

      {/* Footer Actions */}
      <div className="h-12 px-4 border-t border-[#2e2d2b] flex items-center justify-between bg-[#141413]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#262624] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#262624] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {currentFile.filename}</span>
          </button>
        </div>

        {artifact.files.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262624] hover:bg-[#30302d] text-[#f3f3ee] border border-[#3b3a37] transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Download .ZIP</span>
          </button>
        )}
      </div>
    </aside>
  );
};
