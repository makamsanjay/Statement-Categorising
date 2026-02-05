import { motion as _motion } from "framer-motion";

const motion = _motion as any;


/* ---------- Donut Chart (Pure SVG, Premium & Lightweight) ---------- */
function DonutChart() {
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full">
        {/* Background ring */}
        <path
          d="M18 2
             a 16 16 0 0 1 0 32
             a 16 16 0 0 1 0 -32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-foreground/10"
        />

        {/* Food */}
        <motion.path
          d="M18 2
             a 16 16 0 0 1 0 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="38 62"
          initial={{ strokeDashoffset: 100 }}
          whileInView={{ strokeDashoffset: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-primary"
        />

        {/* Shopping */}
        <motion.path
          d="M18 2
             a 16 16 0 0 1 0 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="22 78"
          initial={{ strokeDashoffset: 100 }}
          whileInView={{ strokeDashoffset: -38 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-secondary"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-sm text-foreground/60">Monthly spend</p>
        <p className="text-xl font-semibold">₹39,120</p>
      </div>
    </div>
  );
}

/* ---------- Minimal Trend Strip ---------- */
function TrendStrip() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="origin-left h-1.5 rounded-full bg-gradient-to-r from-primary/50 to-primary"
    />
  );
}

export default function AIInsights() {
  return (
    <section className="relative py-24">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-foreground/5 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-xl mx-auto"
        >
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Insights that feel human
          </h2>
          <p className="mt-4 text-foreground/70">
            AI highlights what matters — without charts you have to interpret.
          </p>
        </motion.div>

        {/* Content */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — Visual Understanding */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="glass rounded-3xl p-10 border border-white/10 shadow-lg"
          >
            <h3 className="text-lg font-medium text-center mb-6">
              Spending composition
            </h3>

            <DonutChart />

            {/* Legend */}
            <div className="mt-8 space-y-2 text-sm text-foreground/70">
              <div className="flex justify-between">
                <span>Food & Dining</span>
                <span>38%</span>
              </div>
              <div className="flex justify-between">
                <span>Shopping</span>
                <span>22%</span>
              </div>
              <div className="flex justify-between">
                <span>Other categories</span>
                <span>40%</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Intelligence */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="flex flex-col gap-6"
          >
            {/* Main Insight */}
            <div className="glass rounded-3xl p-8 border border-white/10 shadow-lg">
              <p className="text-xs uppercase tracking-wide text-primary font-medium">
                AI Insight
              </p>
              <p className="mt-3 text-lg leading-relaxed">
                Food and shopping account for a majority of your discretionary
                spending, with higher activity during weekends and late
                evenings.
              </p>
            </div>

            {/* Trend */}
            <div className="glass rounded-3xl p-8 border border-white/10 shadow-lg">
              <p className="text-sm text-foreground/60 mb-3">
                Spending trend (last 4 months)
              </p>
              <TrendStrip />
              <p className="mt-4 text-sm text-foreground/70">
                Your overall spending has stabilized, with fewer sharp spikes
                compared to previous months.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
