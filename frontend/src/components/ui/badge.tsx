import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "green" | "yellow" | "neutral" | "outline" | "default" | "secondary";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  yellow: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
  neutral: "border-white/10 bg-white/[0.05] text-white/70",
  outline: "border-white/10 bg-transparent text-white/70",
  default: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  secondary: "border-white/10 bg-white/[0.05] text-white/70",
};

export function Badge({ className, variant = "blue", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}