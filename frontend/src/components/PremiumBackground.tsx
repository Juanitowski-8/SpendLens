type PremiumBackgroundProps = {
  children: React.ReactNode;
};

export function PremiumBackground({ children }: PremiumBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8ff] text-neutral-950 transition-colors duration-500 dark:bg-[#02040a] dark:text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* Base background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(47,128,255,0.14),transparent_32%),radial-gradient(circle_at_80%_12%,rgba(139,92,246,0.10),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eaf2ff_100%)] dark:bg-[radial-gradient(circle_at_22%_20%,rgba(35,105,190,0.32),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(40,80,150,0.20),transparent_32%),radial-gradient(circle_at_52%_100%,rgba(14,165,233,0.10),transparent_36%),linear-gradient(180deg,#02040a_0%,#050912_48%,#02040a_100%)]" />

        {/* Deep center vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_46%,rgba(0,0,0,0.18)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.10)_0%,rgba(2,4,10,0.52)_54%,rgba(0,0,0,0.92)_100%)]" />

        {/* Luxury blue glow */}
        <div className="absolute left-[-12%] top-[10%] h-[34rem] w-[34rem] rounded-full bg-[#1d4ed8]/18 blur-[130px] dark:bg-[#2F80FF]/22" />
        <div className="absolute right-[-10%] top-[14%] h-[30rem] w-[30rem] rounded-full bg-[#2563eb]/12 blur-[140px] dark:bg-[#3BA3FF]/12" />
        <div className="absolute bottom-[-18%] left-[34%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-[150px] dark:bg-cyan-400/8" />

        {/* Premium grain / grid */}
        <div className="absolute inset-0 opacity-[0.16] dark:opacity-[0.10] bg-[linear-gradient(rgba(59,163,255,0.20)_1px,transparent_1px),linear-gradient(90deg,rgba(59,163,255,0.20)_1px,transparent_1px)] bg-[size:76px_76px]" />

        {/* Dark overlay for true luxury mode */}
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.34)_55%,rgba(0,0,0,0.58)_100%)]" />

        {/* Small star-like particles */}
        <div className="absolute left-[22%] top-[28%] hidden h-1 w-1 rounded-full bg-[#3BA3FF]/60 shadow-[0_0_18px_rgba(59,163,255,0.75)] dark:block" />
        <div className="absolute left-[78%] top-[30%] hidden h-1 w-1 rounded-full bg-[#3BA3FF]/50 shadow-[0_0_18px_rgba(59,163,255,0.65)] dark:block" />
        <div className="absolute left-[18%] top-[70%] hidden h-1 w-1 rounded-full bg-[#3BA3FF]/45 shadow-[0_0_18px_rgba(59,163,255,0.60)] dark:block" />
        <div className="absolute left-[86%] top-[78%] hidden h-1 w-1 rounded-full bg-[#3BA3FF]/45 shadow-[0_0_18px_rgba(59,163,255,0.60)] dark:block" />
      </div>

      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}