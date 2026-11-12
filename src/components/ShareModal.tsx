"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Link as LinkIcon } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, chatId }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/${chatId}`
    : `https://roleflow.site/share/${chatId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        aria-labelledby="share-title"
        className="relative w-full max-w-md bg-card rounded-2xl shadow-menu p-6 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-2 rounded-lg text-muted hover:text-ink hover:bg-hover transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <LinkIcon className="w-5 h-5 text-accent" strokeWidth={1.75} />
          <h3 id="share-title" className="font-display text-xl text-ink">
            Share conversation
          </h3>
        </div>
        <p className="text-sm text-muted mb-5 leading-relaxed">
          Anyone with this link can view this conversation and its artifacts.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-app text-sm text-ink px-3.5 py-2.5 rounded-lg border border-line select-all outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2.5 rounded-lg bg-ink text-app text-sm font-medium hover:opacity-90 transition-opacity duration-150 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {copied ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.75} />}
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover transition-colors duration-150"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
