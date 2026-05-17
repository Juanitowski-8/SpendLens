import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2F80FF] text-white shadow-lg shadow-blue-500/20 hover:bg-[#3BA3FF]",
  secondary:
    "bg-white text-black hover:bg-white/90",
  ghost:
    "text-white/70 hover:bg-white/[0.06] hover:text-white",
  outline:
    "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80FF]/60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}