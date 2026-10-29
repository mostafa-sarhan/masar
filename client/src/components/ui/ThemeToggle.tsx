import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { applyTheme, getThemeMode, type ThemeMode } from "@/app/theme";
import { cn } from "@/lib/cn";

const MODES: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "فاتح", Icon: Sun },
  { mode: "dark", label: "داكن", Icon: Moon },
  { mode: "system", label: "حسب الجهاز", Icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);
  return (
    <div role="radiogroup" aria-label="المظهر" className={cn("inline-flex rounded-md border border-current/20 p-0.5", className)}>
      {MODES.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          role="radio"
          aria-checked={mode === m}
          title={label}
          aria-label={label}
          onClick={() => {
            setMode(m);
            applyTheme(m);
          }}
          className={cn("grid size-7 place-items-center rounded-[5px] cursor-pointer transition-colors", mode === m ? "bg-current/15" : "opacity-70 hover:opacity-100")}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
