import { useSearchParams } from "react-router-dom";
import Company from "@/features/reports/components/SummaryReport";
import Account from "@/features/reports/components/StatementReport";
import MerchantReport from "@/features/reports/components/MerchantReport";
import CourierReport from "@/features/reports/components/CourierReport";

const TABS = {
  summary: { label: "الملخص", Component: Company },
  merchants: { label: "التجار", Component: MerchantReport },
  couriers: { label: "المناديب", Component: CourierReport },
  statement: { label: "كشف الحساب", Component: Account },
};

// One Reports page with tabs (the tab is kept in the URL: /reports?tab=couriers).
export default function Reports() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as keyof typeof TABS | null;
  const tab: keyof typeof TABS = requested && requested in TABS ? requested : "summary";
  const { Component } = TABS[tab];

  return (
    <div className="p-4 space-y-4">
      <nav className="flex gap-2 flex-wrap">
        {Object.entries(TABS).map(([key, { label }]) => (
          <button key={key} onClick={() => setParams({ tab: key })} className={`px-4 py-2 rounded ${tab === key ? "bg-orange" : "bg-edit"}`}>
            {label}
          </button>
        ))}
      </nav>
      <Component />
    </div>
  );
}
