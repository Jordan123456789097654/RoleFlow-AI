/**
 * Fire-and-forget notifications. Call toast() from anywhere on the client. <Toaster /> renders them.
 */
export type ToastTone = "info" | "success" | "error";

export interface ToastDetail {
  id: string;
  message: string;
  tone: ToastTone;
}

export const TOAST_EVENT = "roleflow:toast";

export function toast(message: string, tone: ToastTone = "info"): void {
  if (typeof window === "undefined") return;
  const detail: ToastDetail = { id: Math.random().toString(36).slice(2), message, tone };
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }));
}
