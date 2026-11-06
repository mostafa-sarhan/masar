import { useEffect, useState } from "react";
import { getDemoInfo, type DemoInfo } from "../api/demo-api";

// Asked once per page load and shared by every component that needs it.
let pending: Promise<DemoInfo> | null = null;
const load = () => (pending ??= getDemoInfo().catch(() => ({ enabled: false }) as const));

export function useDemoInfo() {
  const [info, setInfo] = useState<DemoInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    load().then((i) => !cancelled && setInfo(i));
    return () => {
      cancelled = true;
    };
  }, []);
  return info;
}
