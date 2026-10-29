const COLORS = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
};

interface StatCardProps {
  title: string;
  value: number;
  color: keyof typeof COLORS;
  full?: boolean;
}

export default function StatCard({ title, value, color, full }: StatCardProps) {
  return (
    <div className={`${COLORS[color]} ${full ? "w-full" : ""} rounded-xl p-4 shadow-sm border flex flex-col items-center justify-center`}>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-2xl font-bold mt-1">{value}</span>
      <span className="text-xs text-gray-500">شحنة</span>
    </div>
  );
}
