import { useSearchParams } from "react-router-dom";
import Company from "./Company";
import Account from "./Account";
import MerchantReport from "./reports/MerchantReport";
import CourierReport from "./reports/CourierReport";

const TABS = {
  summary: { label: "الملخص", Component: Company },
  merchants: { label: "التجار", Component: MerchantReport },
  couriers: { label: "المناديب", Component: CourierReport },
  statement: { label: "كشف الحساب", Component: Account },
};

// One Reports page with tabs (the tab is kept in the URL: /reports?tab=couriers).
export default function Reports() {
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get("tab")] ? params.get("tab") : "summary";
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
