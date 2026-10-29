import { useEffect, useState } from "react";
import { getSummaryReport } from "@/lib/resources-api";
import type { Params } from "@/lib/api-client";
import type { Summary, ReportMeta } from "@/lib/types";

// Server-side summary ({ total, byStatus, money }) for the given filters + fee overrides.
export function useSummaryReport(params: Params) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<{ key: string | null; report: Summary | null; fees: ReportMeta["fees"] | null }>({ key: null, report: null, fees: null });

  useEffect(() => {
    let cancelled = false;
    getSummaryReport(JSON.parse(key))
      .then(({ data, meta }) => !cancelled && setState({ key, report: data, fees: meta?.fees ?? null }))
      .catch((err) => {
        console.error(err);
        if (!cancelled) setState({ key, report: null, fees: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { report: state.report, fees: state.fees, loading: state.key !== key };
}
