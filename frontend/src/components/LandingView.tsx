import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  Gauge,
  Mail,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LandingViewProps = {
  onDemo?: () => void;
  onConnectGmail?: () => void;
  onExploreDashboard?: () => void;
  onGetStarted?: () => void;
  connectHint?: string | null;
};

const metrics = [
  { label: "Gasto mensual", value: "$1.245.800", detail: "+12 recibos detectados" },
  { label: "Transacciones", value: "38", detail: "desde Gmail y manuales" },
  { label: "Tienda principal", value: "Rappi", detail: "27% del gasto mensual" },
  { label: "Correos analizados", value: "124", detail: "últimos 90 días" },
];

const activity = [
  { merchant: "Rappi", amount: "$82.400", status: "Detectada", variant: "green" as const },
  { merchant: "Uber", amount: "$31.200", status: "Revisar", variant: "yellow" as const },
  { merchant: "Netflix", amount: "$29.900", status: "IA", variant: "blue" as const },
];

const features = [
  {
    icon: Mail,
    title: "Gmail OAuth",
    description: "Conecta Gmail con permisos de solo lectura para detectar recibos y facturas.",
  },
  {
    icon: Bot,
    title: "LLM Extraction",
    description: "Extrae comercio, monto, moneda, fecha y categoría desde correos no estructurados.",
  },
  {
    icon: Gauge,
    title: "Dashboard financiero",
    description: "Visualiza gasto mensual, categorías, tiendas frecuentes y tendencias.",
  },
  {
    icon: ReceiptText,
    title: "Categorías inteligentes",
    description: "Agrupa compras automáticamente en comida, transporte, tecnología y más.",
  },
  {
    icon: Database,
    title: "PostgreSQL Ready",
    description: "Diseñado para persistencia real con backend Spring Boot y base de datos.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidad primero",
    description: "Solo lectura, control del usuario y revisión manual de resultados sensibles.",
  },
];

const transactions = [
  {
    date: "May 17",
    merchant: "Rappi",
    category: "Comida",
    amount: "$82.400",
    source: "Gmail",
    status: "Detectada",
    variant: "green" as const,
  },
  {
    date: "May 16",
    merchant: "Uber",
    category: "Transporte",
    amount: "$31.200",
    source: "Gmail",
    status: "Revisar",
    variant: "yellow" as const,
  },
  {
    date: "May 15",
    merchant: "Netflix",
    category: "Suscripciones",
    amount: "$29.900",
    source: "IA",
    status: "Procesada",
    variant: "blue" as const,
  },
  {
    date: "May 14",
    merchant: "Éxito",
    category: "Compras",
    amount: "$214.300",
    source: "Manual",
    status: "Manual",
    variant: "neutral" as const,
  },
];

export function LandingView({
  onDemo,
  onConnectGmail,
  onExploreDashboard,
  onGetStarted,
  connectHint,
}: LandingViewProps) {
  const openDemo = () => {
    if (onExploreDashboard) {
      onExploreDashboard();
      return;
    }

    if (onDemo) {
      onDemo();
      return;
    }

    if (onGetStarted) {
      onGetStarted();
    }
  };

  const connect = () => {
    if (onConnectGmail) {
      onConnectGmail();
      return;
    }

    openDemo();
  };

  return (
    <main id="top" className="relative min-h-screen overflow-hidden bg-[#030303] text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[34rem] w-[46rem] -translate-x-1/2 rounded-full bg-[#2F80FF]/20 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-72 h-[28rem] w-[28rem] rounded-full bg-[#3BA3FF]/10 blur-[120px]" />

      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 text-center">
        <Badge variant="blue" className="mx-auto uppercase tracking-[0.32em]">
          Gmail-powered expense intelligence
        </Badge>

        <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
          Convierte tus recibos de Gmail en claridad financiera.
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/65 md:text-xl">
          SpendLens conecta Gmail, detecta recibos y facturas, extrae transacciones con IA y
          convierte tu inbox en un dashboard financiero claro, seguro y accionable.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" onClick={connect}>
            Conectar Gmail
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={openDemo}>
            Explorar dashboard
          </Button>
        </div>

        {connectHint && (
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#3BA3FF]">{connectHint}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Badge variant="outline">Gmail OAuth</Badge>
          <Badge variant="outline">LLM Extraction</Badge>
          <Badge variant="outline">PostgreSQL Ready</Badge>
        </div>
      </section>

      <section id="product" className="relative mx-auto max-w-6xl px-6 pb-24">
        <Card className="rounded-[2rem] border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-blue-500/10 md:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#3BA3FF]">
                <Sparkles className="h-4 w-4" />
                Panel SpendLens
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Vista previa estática del dashboard
              </h2>
            </div>
            <Badge variant="green">Sincronización lista</Badge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-[#111]/80 p-5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  {metric.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-white/50">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0F0F0F]/90 p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Gasto por semana</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">$1.245.800</h3>
                </div>
                <Badge variant="blue">+18%</Badge>
              </div>

              <div className="mt-8 flex h-56 items-end gap-3">
                {[42, 68, 54, 88, 73, 96, 64, 80, 52, 90, 76, 100].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-xl bg-gradient-to-t from-[#2F80FF] to-[#3BA3FF]/80 opacity-90 shadow-lg shadow-blue-500/10"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0F0F0F]/90 p-5">
              <p className="text-sm font-medium text-white">Actividad reciente</p>
              <div className="mt-5 space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.merchant}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{item.merchant}</p>
                      <p className="text-sm text-white/45">{item.amount}</p>
                    </div>
                    <Badge variant={item.variant}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="blue">Cómo funciona</Badge>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            De correos desordenados a finanzas claras.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            El flujo principal está diseñado para demostrar una integración real con Gmail,
            backend y procesamiento inteligente.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <StepCard
            number="01"
            icon={Mail}
            title="Conecta Gmail"
            description="Autoriza lectura de correos para buscar recibos, facturas y confirmaciones de pago."
          />
          <StepCard
            number="02"
            icon={FileSearch}
            title="Detecta recibos"
            description="Filtra mensajes candidatos y estructura la información financiera relevante."
          />
          <StepCard
            number="03"
            icon={WalletCards}
            title="Visualiza gastos"
            description="Convierte la información en métricas, categorías, tendencias y tablas accionables."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="blue">Features</Badge>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Todo lo necesario para una demo empresarial.
            </h2>
          </div>
          <p className="max-w-xl text-white/60">
            Una base visual y técnica pensada para conectarse con Spring Boot, PostgreSQL,
            Gmail API y LLM.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section id="security" className="mx-auto max-w-6xl px-6 py-24">
        <Card className="relative overflow-hidden rounded-[2rem] bg-[#0F0F0F]/90 p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#2F80FF]/10 blur-3xl" />
          <div className="relative grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <Badge variant="blue">Seguridad</Badge>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Privacidad primero. Tus correos bajo control.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/60">
                SpendLens se diseña con permisos mínimos, lectura controlada y resultados
                revisables por el usuario.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Permiso de solo lectura en Gmail",
                "Sin modificar ni enviar correos",
                "Tokens protegidos desde backend",
                "Datos estructurados y revisables",
                "Control manual sobre transacciones",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#3BA3FF]" />
                  <span className="text-white/75">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section id="dashboard-preview" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="blue">Dashboard</Badge>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Transacciones limpias, métricas claras.
            </h2>
          </div>
          <Button variant="outline" onClick={openDemo}>
            Abrir demo funcional
          </Button>
        </div>

        <Card className="overflow-hidden rounded-[2rem] bg-white/[0.04] p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.22em] text-white/40">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Comercio</th>
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 text-right font-medium">Monto</th>
                  <th className="px-6 py-4 font-medium">Origen</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={`${transaction.date}-${transaction.merchant}`}
                    className="border-b border-white/10 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-5 text-white/50">{transaction.date}</td>
                    <td className="px-6 py-5 font-medium text-white">{transaction.merchant}</td>
                    <td className="px-6 py-5 text-white/60">{transaction.category}</td>
                    <td className="px-6 py-5 text-right font-semibold text-white">
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-5 text-white/60">{transaction.source}</td>
                    <td className="px-6 py-5">
                      <Badge variant={transaction.variant}>{transaction.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <footer id="docs" className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#3BA3FF]" />
            <span>SpendLens · Gmail-powered expense intelligence</span>
          </div>
          <span>React + Vite · Spring Boot ready · PostgreSQL ready</span>
        </div>
      </footer>
    </main>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="group p-6 transition duration-300 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/35">{number}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
          <Icon className="h-5 w-5 text-[#3BA3FF]" />
        </span>
      </div>
      <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-relaxed text-white/60">{description}</p>
    </Card>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 transition duration-300 hover:border-blue-400/30 hover:bg-[#141414]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Icon className="h-5 w-5 text-[#3BA3FF]" />
      </span>
      <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-relaxed text-white/60">{description}</p>
    </Card>
  );
}