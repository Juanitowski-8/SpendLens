import * as React from "react";

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  void asChild;
  return <>{children}</>;
};
export const DropdownMenuContent = ({ children, className = "", align, ...rest }: { children: React.ReactNode; className?: string; align?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...rest} data-align={align}>
    {children}
  </div>
);
export const DropdownMenuItem = ({ children, onClick, disabled, className = "", ...rest }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div role="button" onClick={disabled ? undefined : onClick} className={className || "px-3 py-2 text-sm"} aria-disabled={disabled} {...rest}>
    {children}
  </div>
);

export default DropdownMenu;
