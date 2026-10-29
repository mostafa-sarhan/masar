import { useEffect, useState } from "react";
import { getSummaryReport } from "../services/resourcesApi";

// Server-side summary ({ total, byStatus, money }) for the given filters + fee overrides.
export function useSummaryReport(params) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ key: null, report: null, fees: null });

  useEffect(() => {
    let cancelled = false;
    getSummaryReport(JSON.parse(key))
      .then(({ data, meta }) => !cancelled && setState({ key, report: data, fees: meta.fees }))
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
