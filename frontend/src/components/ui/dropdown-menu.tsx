import * as React from "react";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
}

type DropdownMenuProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  fullWidth?: boolean;
  className?: string;
};

export function DropdownMenu({ children, open, onOpenChange, fullWidth, className }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen, menuId }}>
      <div
        ref={containerRef}
        className={cn("relative", fullWidth ? "block w-full" : "inline-block", className)}
      >
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

type DropdownMenuTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen, menuId } = useDropdownMenuContext();

  const toggle = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: (event: React.MouseEvent) => void;
      "aria-expanded"?: boolean;
      "aria-haspopup"?: string;
      "aria-controls"?: string;
    }>;

    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        toggle();
      },
      "aria-expanded": open,
      "aria-haspopup": "menu",
      "aria-controls": menuId,
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-controls={menuId}
    >
      {children}
    </button>
  );
}

type DropdownMenuContentProps = {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
} & React.HTMLAttributes<HTMLDivElement>;

export function DropdownMenuContent({
  children,
  className = "",
  align = "start",
  ...rest
}: DropdownMenuContentProps) {
  const { open, menuId } = useDropdownMenuContext();

  if (!open) {
    return null;
  }

  return (
    <div
      id={menuId}
      role="menu"
      className={cn(
        "absolute top-[calc(100%+0.5rem)] z-50 min-w-[10rem] overflow-hidden rounded-2xl border border-black/10 bg-white p-1 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-neutral-950",
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type DropdownMenuItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  className = "",
  ...rest
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={
        disabled
          ? undefined
          : () => {
              onClick?.();
              setOpen(false);
            }
      }
      className={cn(
        "cursor-pointer rounded-xl px-3 py-2 text-sm text-neutral-800 outline-none transition hover:bg-black/5 focus:bg-black/5 dark:text-neutral-100 dark:hover:bg-white/10 dark:focus:bg-white/10",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </div>
  );
}

export default DropdownMenu;
