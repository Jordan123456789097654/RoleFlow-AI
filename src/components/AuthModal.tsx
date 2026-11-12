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

const inputClass =
  "w-full rounded-lg border border-line bg-app px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const primaryButtonClass =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-app/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-menu sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mb-5 flex justify-center">
            <Logo size={40} showText={false} />
          </div>

          <h2 id="auth-modal-title" className="mb-2 font-display text-2xl font-medium tracking-tight text-ink">
            {step === "email" ? "Sign in to RoleFlow" : "Check your email"}
          </h2>

          <p className="mb-6 text-sm leading-relaxed text-muted">
            {step === "code"
              ? `We sent a sign-in link and a 6-digit code to ${email.trim()}.`
              : isGuestLimitReached
                ? "You've reached your free guest message limit. Sign in to keep chatting, save your history, and manage projects."
                : "Enter your email to receive a secure sign-in link and 6-digit verification code."}
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-left text-sm text-danger"
            >
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendEmail} className="space-y-4 text-left">
              <div>
                <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-ink">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputClass} h-11 pl-10`}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !email.trim()} className={primaryButtonClass}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue with email</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="pt-1 text-center text-xs text-muted">
                We&apos;ll email you from <span className="text-ink">noreply@roleflow.site</span>. No password needed.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="auth-code" className="text-sm font-medium text-ink">
                    6-digit code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="inline-flex min-h-10 items-center text-sm text-accent transition-colors hover:text-accent-hover"
                  >
                    Change email
                  </button>
                </div>
                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className={`${inputClass} h-12 text-center font-mono text-2xl tracking-[0.4em]`}
                />
              </div>

              <button type="submit" disabled={loading || code.length < 6} className={primaryButtonClass}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify and sign in</span>
                    <CheckCircle2 className="h-4 w-4" />
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
