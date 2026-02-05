import { motion as _motion } from "framer-motion";

const motion = _motion as any;


const trustPoints = [
  {
    title: "Read-only access",
    description:
      "We never initiate transactions or move money. Your data is accessed in read-only mode.",
  },
  {
    title: "End-to-end encryption",
    description:
      "All sensitive information is encrypted in transit and at rest using modern standards.",
  },
  {
    title: "You stay in control",
    description:
      "Disconnect sources, delete data, or export insights at any time — no lock-in.",
  },
  {
    title: "Privacy-first by design",
    description:
      "Your data is never sold, shared, or used for advertising. Period.",
  },
];

export default function TrustSecurity() {
  return (
    <section className="relative py-24">
      {/* Subtle divider background */}
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
            Built with security in mind
          </h2>
          <p className="mt-4 text-foreground/70">
            Your financial data deserves careful handling — not shortcuts.
          </p>
        </motion.div>

        {/* Trust Points */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {trustPoints.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.06,
                duration: 0.45,
                ease: "easeOut",
              }}
              className="glass rounded-2xl p-6 border border-white/10 shadow-lg"
            >
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-3 text-foreground/70 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Reassurance Line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-16 text-center text-sm text-foreground/60"
        >
          We designed this product the same way we’d want our own finances
          handled.
        </motion.div>
      </div>
    </section>
  );
}
