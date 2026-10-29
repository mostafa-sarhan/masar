import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-carbon text-carbon-ink hover:brightness-110 shadow-1",
  secondary: "bg-sheet text-ink border border-rule hover:bg-sheet-2",
  quiet: "text-ink-2 hover:text-ink hover:bg-sheet-2",
  danger: "bg-stamp text-white dark:text-paper hover:brightness-110",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, loading, disabled, className, children, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-[filter,background-color,color] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        VARIANTS[variant],
        SIZES[size],
        !children && (size === "sm" ? "w-8 px-0" : size === "md" ? "w-10 px-0" : "w-12 px-0"),
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});
