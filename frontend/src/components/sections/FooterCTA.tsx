import { motion as _motion } from "framer-motion";

const motion = _motion as any;

export default function FooterCTA() {
  return (
    <section className="relative">
      {/* FINAL CTA */}
      <div className="py-20 sm:py-28 lg:py-36 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl lg:text-4xl font-semibold tracking-tight"
          >
            Start understanding your money better
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            className="mt-4 text-foreground/70 max-w-xl mx-auto text-sm sm:text-base"
          >
            Upload your expenses and get clear insights — no spreadsheets, no
            setup, no guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={() => (window.location.href = "/signup")}
              className="px-8 py-4 rounded-xl bg-primary text-white font-medium transition hover:opacity-90"
            >
              Get started for free
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 rounded-xl border border-white/15 text-foreground/80 hover:bg-white/5 transition"
            >
              See sample insights
            </button>
          </motion.div>

          <p className="mt-6 text-sm text-foreground/50">
            No credit card required · Sample data included
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-sm text-foreground/70">
            © {new Date().getFullYear()}{" "}
            <span className="font-medium">
              Spend<span className="text-primary">Switch</span>
            </span>
            . All rights reserved.
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-foreground/60">
            <a href="#" className="hover:text-foreground transition">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition">
              Security
            </a>
            <a href="#" className="hover:text-foreground transition">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </section>
  );
}
