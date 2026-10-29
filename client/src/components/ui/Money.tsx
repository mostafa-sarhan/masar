import { formatMoney } from "@/lib/locale";

export default function Money({ value }: { value: number | string | null | undefined }) {
  return <span dir="ltr">{formatMoney(value)}</span>;
}
