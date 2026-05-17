export const MONTHLY_SPEND_COP = 1_245_800;
export const TRANSACTIONS_COUNT = 38;
export const TOP_STORE = "Rappi";
export const EMAILS_SYNCED = 124;

export const previewTransactions = [
  { store: "Rappi", amount: "$42.500", category: "Comida", date: "2026-05-12" },
  { store: "Éxito", amount: "$186.900", category: "Mercado", date: "2026-05-10" },
  { store: "Uber", amount: "$18.200", category: "Transporte", date: "2026-05-09" },
  { store: "Spotify", amount: "$18.900", category: "Suscripción", date: "2026-05-08" },
  { store: "Amazon", amount: "$95.000", category: "Compras", date: "2026-05-06" },
] as const;

export const tableRows = [
  {
    date: "2026-05-12",
    store: "Rappi",
    category: "Comida",
    amount: "$42.500",
    source: "Gmail",
    status: "Detectada" as const,
  },
  {
    date: "2026-05-10",
    store: "Éxito",
    category: "Mercado",
    amount: "$186.900",
    source: "Gmail",
    status: "Detectada" as const,
  },
  {
    date: "2026-05-09",
    store: "Uber",
    category: "Transporte",
    amount: "$18.200",
    source: "Gmail",
    status: "Detectada" as const,
  },
  {
    date: "2026-05-08",
    store: "Spotify",
    category: "Suscripción",
    amount: "$18.900",
    source: "Gmail",
    status: "Detectada" as const,
  },
  {
    date: "2026-05-06",
    store: "Amazon",
    category: "Compras",
    amount: "$95.000",
    source: "Gmail",
    status: "Revisar" as const,
  },
];

export const dailySpend = [
  { day: "06", total: 120_000 },
  { day: "07", total: 45_000 },
  { day: "08", total: 62_000 },
  { day: "09", total: 38_000 },
  { day: "10", total: 210_000 },
  { day: "11", total: 55_000 },
  { day: "12", total: 88_000 },
];

export const spendByStore = [
  { name: "Éxito", value: 186_900 },
  { name: "Amazon", value: 95_000 },
  { name: "Rappi", value: 42_500 },
  { name: "Uber", value: 18_200 },
  { name: "Spotify", value: 18_900 },
];

export const detectedEmails = [
  { subject: "Tu recibo de Rappi está listo", from: "no-reply@rappi.com", date: "2026-05-12" },
  { subject: "Comprobante de pago — Éxito", from: "facturacion@exito.com", date: "2026-05-10" },
  { subject: "Resumen del viaje", from: "receipts@uber.com", date: "2026-05-09" },
];

export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

