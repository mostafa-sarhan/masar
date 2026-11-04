import { useCallback } from "react";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { getCourierOptions } from "@/lib/resources-api";

type Props = {
  value: string;
  onChange(id: string): void;
  // The chosen courier with its name (null when cleared), for pages that show it.
  onPick?(courier: { _id: string; name: string } | null): void;
  placeholder?: string;
  required?: boolean;
  placement?: "bottom" | "top";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const toOptions = (list: { _id: string; name: string }[]): ComboOption[] => list.map((c) => ({ value: c._id, label: c.name }));

// Courier picker, searched on the server.
export default function CourierSelect({ value, onChange, onPick, placeholder = "كل المناديب", required, ...rest }: Props) {
  const load = useCallback((q: string) => getCourierOptions({ q }).then(toOptions), []);
  const resolve = useCallback((ids: string[]) => getCourierOptions({ ids }).then(toOptions), []);
  return (
    <Combobox
      value={value}
      onChange={(id, option) => {
        onChange(id);
        onPick?.(option ? { _id: option.value, name: option.label } : null);
      }}
      loadOptions={load}
      resolveOptions={resolve}
      placeholder={placeholder}
      emptyText="لا يوجد مندوب بهذا الاسم"
      required={required}
      clearable={!required}
      {...rest}
    />
  );
}
