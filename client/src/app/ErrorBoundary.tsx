import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { captureError } from "@/lib/monitoring";

// Last line of defence: a broken page shows a way out instead of a blank screen.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(error);
    captureError(error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm">
          <p className="stamp mb-5 text-sm text-stamp">خطأ</p>
          <h1 className="text-xl font-semibold text-ink">تعذّر عرض هذه الصفحة</h1>
          <p className="mt-2 text-sm text-ink-2">حدث خطأ غير متوقع. أعد تحميل الصفحة، وإذا تكرر الخطأ تواصل مع الدعم.</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            إعادة تحميل الصفحة
          </Button>
        </div>
      </div>
    );
  }
}
