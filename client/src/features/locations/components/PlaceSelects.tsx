import { useMemo } from "react";
import { GOVERNORATES, getGovernorate } from "@masar/shared";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";

type Common = {
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const GOVERNORATE_OPTIONS: ComboOption[] = GOVERNORATES.map((g) => ({ value: g.code, label: g.ar, keywords: [g.en] }));

// One of Egypt's 27 governorates (searchable in Arabic and English).
export function GovernorateSelect({ value, onChange, placeholder = "كل المحافظات", required, ...rest }: Common & { value: string; onChange(code: string): void }) {
  return (
    <Combobox
      value={value}
      onChange={(code) => onChange(code)}
      options={GOVERNORATE_OPTIONS}
      placeholder={required ? "اختر المحافظة" : placeholder}
      emptyText="لا توجد محافظة بهذا الاسم"
      required={required}
      clearable={!required}
      {...rest}
    />
  );
}

// Cities of the chosen governorate (or of all governorates, with the governorate shown under each).
export function CitySelect({ governorate, value, onChange, placeholder = "اختر المدينة", required, disabled, ...rest }: Common & { governorate: string; value: string; onChange(code: string): void }) {
  const options = useMemo<ComboOption[]>(() => {
    const govs = governorate ? [getGovernorate(governorate)].filter((g) => !!g) : GOVERNORATES;
    return govs.flatMap((g) => g.cities.map((c) => ({ value: c.code, label: c.ar, hint: governorate ? undefined : g.ar, keywords: [c.en] })));
  }, [governorate]);
  return (
    <Combobox
      value={value}
      onChange={(code) => onChange(code)}
      options={options}
      placeholder={required && !governorate ? "اختر المحافظة أولًا" : placeholder}
      emptyText="لا توجد مدينة بهذا الاسم"
      required={required}
      clearable={!required}
      disabled={disabled || (required && !governorate)}
      {...rest}
    />
  );
}

// Several governorates or cities at once (zones).
export function PlacesMultiSelect({ kind, value, onChange, ...rest }: Common & { kind: "governorates" | "cities"; value: string[]; onChange(codes: string[]): void }) {
  const options = useMemo<ComboOption[]>(
    () =>
      kind === "governorates"
        ? GOVERNORATE_OPTIONS
        : GOVERNORATES.flatMap((g) => g.cities.map((c) => ({ value: c.code, label: c.ar, hint: g.ar, keywords: [c.en, g.en] }))),
    [kind]
  );
  return <Combobox multiple value={value} onChange={onChange} options={options} emptyText="لا توجد نتائج" {...rest} />;
}
