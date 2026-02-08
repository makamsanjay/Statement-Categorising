import { motion as _motion } from "framer-motion";

import { useState } from "react";
import CardStack from "../ui/CardStack";

const motion = _motion as any;

function InsightCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass rounded-xl px-6 py-4 border border-white/10 shadow-lg">
      <p className="text-sm text-foreground/60">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function TryNow() {
  const [preview, setPreview] = useState(false);

return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Why use SpendSwitch for tracking?
          </h2>
          <p className="mt-4 text-foreground/70">
            Go beyond basic expense tracking with smart sub-categories, a spending health score,
            and personalized card suggestions - all built from how you actually spend.
          </p>
        </div>

        {/* STAGE */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* LEFT COLUMN */}
          <div className="relative min-h-[340px]">
            {/* EXPLANATION */}
            <motion.div
              animate={{
                opacity: preview ? 0 : 1,
                x: preview ? -40 : 0,
              }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <h3 className="text-xl font-medium">
                A smarter way to track and understand spending
              </h3>

              <p className="mt-4 text-foreground/70 leading-relaxed">
                SpendSwitch automatically transforms raw transaction data into clear spending insights. 
                Instead of managing spreadsheets, you get categorized expenses, spending breakdowns, 
                and summaries that make it easy to understand where your money goes.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-foreground/70">
                <li>• Automatic expense categorization</li>
                <li>• Clear spending breakdowns by category</li>
                <li>• Detects behavioral spending patterns</li>
                <li>• Easy-to-understand summaries of your expenses</li>
              </ul>
            </motion.div>

            {/* CARD (moves into left on preview) */}
            <motion.div
              animate={{
                opacity: preview ? 1 : 0,
                x: preview ? 0 : 40,
              }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex justify-center lg:justify-start"
            >
              <div className="w-[420px]">
                <CardStack />
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="relative min-h-[340px]">
            {/* CARD (default position on load) */}
            <motion.div
              animate={{
                opacity: preview ? 0 : 1,
                x: preview ? 40 : 0,
              }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex justify-center lg:justify-end"
            >
              <div className="w-[420px]">
                <CardStack />
              </div>
            </motion.div>

            {/* INSIGHTS */}
            <motion.div
              animate={{
                opacity: preview ? 1 : 0,
                x: preview ? 0 : 40,
              }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 space-y-4 max-w-[420px] ml-auto"
            >
              <InsightCard title="Spending Health Score" value="Unusual Spending Detected" />
              <InsightCard title="Top category" value="Food & Dining" />
              <InsightCard title="Largest expense" value="Rent" />

              <div className="pt-4 text-center">
                <button
                  onClick={() => setPreview(false)}
                  className="text-sm text-foreground/60 hover:text-foreground transition"
                >
                  Reset preview
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* PREVIEW BUTTON */}
        {!preview && (
          <div className="mt-24 w-full flex justify-center">
            <div className="flex flex-col items-center text-center max-w-md">
              <p className="mb-3 text-sm text-foreground/60">
                See how SpendSwitch turns expenses into clear spending insights
              </p>

              <button
                onClick={() => setPreview(true)}
                className="px-7 py-3 rounded-xl bg-primary text-white font-medium transition hover:opacity-90"
              >
                Preview insights
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}