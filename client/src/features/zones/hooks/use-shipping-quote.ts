import { useEffect, useState } from "react";
import type { ShippingQuote } from "@/lib/types";

type Quote = Pick<ShippingQuote, "zoneName" | "shippingFee">;

// Live shipping price for a destination. `fetchQuote` is the staff or the merchant-portal endpoint.
export function useShippingQuote(fetchQuote: (governorate: string, city: string) => Promise<Quote>, governorate: string, city: string, merchant = "") {
  const key = `${governorate}|${city}|${merchant}`;
  const [answer, setAnswer] = useState<{ key: string; quote: Quote | null } | null>(null);

  useEffect(() => {
    if (!governorate) return;
    let cancelled = false;
    fetchQuote(governorate, city)
      .then((quote) => !cancelled && setAnswer({ key, quote }))
      .catch(() => !cancelled && setAnswer({ key, quote: null }));
    return () => {
      cancelled = true;
    };
    // fetchQuote is stable per caller; the key covers its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!governorate) return { quote: null, loading: false };
  return { quote: answer?.key === key ? answer.quote : null, loading: answer?.key !== key };
}
