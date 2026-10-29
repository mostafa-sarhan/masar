import { formatMoney } from "./utils/locale";

export default function Money({ value }) {
  return <span dir="ltr">{formatMoney(value)}</span>;
}
