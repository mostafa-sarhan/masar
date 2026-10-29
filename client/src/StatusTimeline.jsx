import { statusLabel } from "./utils/orderStatus";
import { displayTimezone } from "./utils/locale";

const when = (at) => new Date(at).toLocaleString("ar-EG", { timeZone: displayTimezone(), dateStyle: "medium", timeStyle: "short" });

// Vertical status timeline. `showWho` adds who made each change (staff only).
export default function StatusTimeline({ events = [], showWho = false }) {
  if (!events.length) return <p className="opacity-70">لا يوجد سجل حالات</p>;
  return (
    <ol className="border-s-2 border-orange-400 ps-4 space-y-3 text-start">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -start-[1.4rem] top-1 w-3 h-3 rounded-full bg-orange-400" />
          <p className="font-bold">{statusLabel(e.status)}</p>
          <p className="text-sm opacity-80">{when(e.at)}{showWho && e.by?.email ? ` · ${e.by.email}` : ""}</p>
          {e.reason && <p className="text-sm">السبب: {e.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
