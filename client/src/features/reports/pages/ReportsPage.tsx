import { useSearchParams } from "react-router-dom";
import SummaryReport from "../components/SummaryReport";
import MerchantReport from "../components/MerchantReport";
import CourierReport from "../components/CourierReport";
import StatementReport from "../components/StatementReport";
import { PageHeader } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";

const TABS = {
  summary: { label: "الملخص", Component: SummaryReport },
  merchants: { label: "التجار", Component: MerchantReport },
  couriers: { label: "المناديب", Component: CourierReport },
  statement: { label: "كشف الحساب", Component: StatementReport },
};
type Tab = keyof typeof TABS;

// One Reports page with tabs; the tab is kept in the URL (/reports?tab=couriers).
export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && requested in TABS ? requested : "summary";
  const { Component } = TABS[tab];

  return (
    <>
      <PageHeader title="التقارير" description="كل المبالغ محسوبة على الخادم من العمولات المحفوظة على كل شحنة مسلّمة." />
      <Tabs className="mb-5" value={tab} onChange={(t) => setParams({ tab: t })} tabs={(Object.keys(TABS) as Tab[]).map((t) => ({ value: t, label: TABS[t].label }))} />
      <Component />
    </>
  );
}
