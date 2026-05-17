import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full border-separate border-spacing-0">{children}</table>
);
export const TableHeader = ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>;
export const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;
export const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={cn("transition-colors duration-200 hover:bg-white/5", className)}>{children}</tr>
);
export const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={cn("text-left py-3 text-xs uppercase tracking-[0.18em] text-neutral-500", className)}>{children}</th>
);
export const TableCell = ({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) => (
  <td colSpan={colSpan} className={cn(className, "py-3 text-sm text-white")}>{children}</td>
);

export default Table;
