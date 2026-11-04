import { useCallback } from "react";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { getMerchantOptions } from "@/lib/resources-api";

type Props = {
  value: string;
  onChange(id: string): void;
  placeholder?: string;
  required?: boolean;
  placement?: "bottom" | "top";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const toOptions = (list: { _id: string; name: string }[]): ComboOption[] => list.map((m) => ({ value: m._id, label: m.name }));

// Merchant picker, searched on the server (a company can have thousands of merchants).
export default function MerchantSelect({ value, onChange, placeholder = "كل التجار", required, ...rest }: Props) {
  const load = useCallback((q: string) => getMerchantOptions({ q }).then(toOptions), []);
  const resolve = useCallback((ids: string[]) => getMerchantOptions({ ids }).then(toOptions), []);
  return (
    <Combobox
      value={value}
      onChange={onChange}
      loadOptions={load}
      resolveOptions={resolve}
      placeholder={required ? "اختر التاجر" : placeholder}
      emptyText="لا يوجد تاجر بهذا الاسم"
      required={required}
      clearable={!required}
      {...rest}
    />
  );
}
