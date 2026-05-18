import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  triggerClassName?: string;
};

export function FilterSelect({
  value,
  options,
  onChange,
  ariaLabel,
  triggerClassName,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";
  }, [options, value]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} fullWidth>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-left text-sm text-neutral-950 outline-none transition",
            "hover:bg-white focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20",
            "dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.08]",
            triggerClassName,
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={cn("size-4 shrink-0 opacity-60 transition", open && "rotate-180")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="left-0 right-0 max-h-60 min-w-0 overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              option.value === value && "bg-[#2F80FF]/10 font-medium text-[#2F80FF] dark:bg-[#3BA3FF]/15 dark:text-[#3BA3FF]",
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
