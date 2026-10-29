import { createContext, useContext } from "react";

export type ToastTone = "ok" | "danger" | "info";
export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
}

export interface FeedbackApi {
  toast(message: string, tone?: ToastTone): void;
  confirm(options: ConfirmOptions): Promise<boolean>;
}

export const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}
