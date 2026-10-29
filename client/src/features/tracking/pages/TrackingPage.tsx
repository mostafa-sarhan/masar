import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackShipment } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import StatusTimeline from "@/features/orders/components/StatusTimeline";
import { statusLabel } from "@/lib/order-status";
import type { TrackingResult } from "@/lib/types";
import { ApiError } from "@/lib/api-client";

// Public page for customers: /track/:trackingId. Status timeline only.
export default function TrackingPage() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(trackingId || "");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trackingId) return;
    let cancelled = false;
    trackShipment(trackingId)
      .then((data) => !cancelled && (setResult(data), setError("")))
      .catch((err) => !cancelled && (setResult(null), setError(err instanceof ApiError && err.code === "NOT_FOUND" ? "رقم التتبع غير صحيح" : errorMessage(err))));
    return () => {
      cancelled = true;
    };
  }, [trackingId]);

  return (
    <div className="min-h-screen bg-main text-white flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">تتبع شحنتك</h1>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) navigate(`/track/${input.trim().toUpperCase()}`);
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="رقم التتبع" dir="ltr" className="rounded p-2 text-black bg-white w-72" />
        <button className="bg-orange px-4 rounded">تتبع</button>
      </form>

      {error && <p className="text-red-400">{error}</p>}
      {result && (
        <div className="bg-edit rounded-lg p-6 w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            {result.company.logoUrl && <img src={result.company.logoUrl} alt="" className="h-10" />}
            <span className="font-bold">{result.company.name}</span>
          </div>
          <p className="text-xl">الحالة الحالية: <strong>{statusLabel(result.status)}</strong></p>
          <StatusTimeline events={result.timeline} />
        </div>
      )}
    </div>
  );
}
