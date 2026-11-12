"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, chatId }) => {
  const [copied, setCopied] = useState(false);

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
          <Share2 className="w-5 h-5 text-[#d97706]" />
          <h3 className="text-lg font-semibold text-[#f3f3ee]">Share Conversation</h3>
        </div>
        <p className="text-xs text-[#9b9a97] mb-5">
          Anyone with this link can view this conversation and its artifacts.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#20201f] text-xs text-[#f3f3ee] px-3.5 py-2.5 rounded-xl border border-[#333230] select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f3f3ee] hover:bg-white text-[#141413] text-xs font-semibold transition-colors shrink-0 shadow"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#2e2d2b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#9b9a97] hover:text-[#f3f3ee]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
