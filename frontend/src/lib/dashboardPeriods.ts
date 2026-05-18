export type DashboardPeriod = {
  year: number;
  month: number;
  label: string;
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function formatPeriodLabel(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? String(month);
  return `${name} ${year}`;
}

/** Últimos N meses calendario (el primero es el mes actual). */
export function buildRecentPeriodOptions(count = 12): DashboardPeriod[] {
  const now = new Date();
  const options: DashboardPeriod[] = [];

  for (let offset = 0; offset < count; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    options.push({
      year,
      month,
      label: formatPeriodLabel(year, month),
    });
  }

  return options;
}

export function periodStorageKey(period: DashboardPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function findPeriodOption(
  options: DashboardPeriod[],
  year: number,
  month: number,
): DashboardPeriod | undefined {
  return options.find((option) => option.year === year && option.month === month);
}
