import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

import { useTheme } from "@/context/ThemeContext";
import { dailySpend, spendByStore } from "@/mockData";

function formatAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function DailySpendChart({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const height = compact ? 200 : 260;

  const axisTick = useMemo(() => ({ fill: "#737373", fontSize: 11 }), []);
  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const barFill = isDark ? "#3BA3FF" : "#2F80FF";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const tooltipStyles = useMemo(
    () =>
      isDark
        ? {
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 12,
            color: "#F5F5F5",
            backgroundColor: "#0F0F0F",
          }
        : {
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 12,
            color: "#0A0A0A",
            backgroundColor: "#FFFFFF",
          },
    [isDark],
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailySpend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatAxis} tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={{ fill: cursorFill }}
            contentStyle={tooltipStyles}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              return [
                new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n),
                "Gasto",
              ];
            }}
          />
          <Bar dataKey="total" fill={barFill} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StoreSpendChart({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const height = compact ? 200 : 260;

  const axisTick = useMemo(() => ({ fill: "#737373", fontSize: 11 }), []);
  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const barFill = isDark ? "#3BA3FF" : "#2F80FF";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const tooltipStyles = useMemo(
    () =>
      isDark
        ? {
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 12,
            color: "#F5F5F5",
            backgroundColor: "#0F0F0F",
          }
        : {
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 12,
            color: "#0A0A0A",
            backgroundColor: "#FFFFFF",
          },
    [isDark],
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={spendByStore} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatAxis} />
          <YAxis type="category" dataKey="name" width={72} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: cursorFill }}
            contentStyle={tooltipStyles}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              return [
                new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n),
                "Monto",
              ];
            }}
          />
          <Bar dataKey="value" fill={barFill} radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
