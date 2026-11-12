"use client";

import React, { useState } from "react";
import { X, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { UserProfile } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  isGuestLimitReached?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isGuestLimitReached,
}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#18181b] border border-[#2e2d2b] rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#9b9a97] hover:text-[#f3f3ee] hover:bg-[#252422] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="text-center pt-2">
          <div className="flex justify-center mb-4">
            <div className="text-4xl select-none">👋</div>
          </div>

          <h2 className="text-2xl font-semibold text-[#f3f3ee] tracking-tight mb-2">
            Sign in to RoleFlow
          </h2>

          <p className="text-sm text-[#9b9a97] mb-6 leading-relaxed">
            {isGuestLimitReached
              ? "You've reached your free guest message limit. Sign in to continue chatting, save history, and manage projects."
              : "Enter your email to receive a secure sign-in link and 6-digit verification code."}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendEmail} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-[#c4c3be] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#858480] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#20201f] text-sm text-[#f3f3ee] placeholder-[#858480] pl-10 pr-4 py-2.5 rounded-xl border border-[#333230] focus:outline-none focus:border-[#d97706]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#f3f3ee] hover:bg-white text-[#141413] text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-[#73726e] mt-4">
                We'll email you a secure link and code from{" "}
                <span className="text-[#a8a7a2]">noreply@roleflow.site</span>.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#c4c3be]">
                    Enter 6-digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-xs text-[#d97706] hover:underline"
                  >
                    Change email
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center text-2xl font-mono tracking-widest bg-[#20201f] text-[#f3f3ee] py-3 rounded-xl border border-[#333230] focus:outline-none focus:border-[#d97706]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#f3f3ee] hover:bg-white text-[#141413] text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Sign in</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
