import { motion as _motion } from "framer-motion";

import { Upload, Brain, LineChart } from "lucide-react";

const motion = _motion as any;

const steps = [
  {
    icon: Upload,
    title: "Upload your expenses",
    description:
      "Upload bank statements, expense files, or transaction data in seconds - no manual entry required.",
  },
  {
    icon: Brain,
    title: "Automatically categorize transactions",
    description:
      "SpendSwitch extracts, categorizes, and analyzes your expenses to identify spending patterns automatically.",
  },
  {
    icon: LineChart,
    title: "Get clear spending insights",
    description:
      "View visual spending breakdowns, summaries, and insights that help you understand where your money goes.",
  },
];

export default function HowItWorks() {
  return (
    <section className="glass bg-card rounded-3xl p-8 border border-white/5 text-center">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-semibold">
            How SpendSwitch works
          </h2>
          <p className="mt-4 text-lg text-foreground/60">
           Upload expenses, analyze spending, and get clear financial insights automatically.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              className="glass bg-card rounded-3xl p-8 border border-white/10 text-center"
            >
              <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                <step.icon size={26} />
              </div>

              <h3 className="text-xl font-semibold mb-2">
                {step.title}
              </h3>
              <p className="text-foreground/60">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
