"use client";

import { useMotionValue, useTransform, useSpring } from "framer-motion";
import { motion as _motion } from "framer-motion";

import { useEffect, useState } from "react";
import FloatingCard from "../ui/FloatingCard";
import CardStack from "../ui/CardStack";
import "./landing.module.css";

const motion = _motion as any;


export default function Hero() {
  const [systemActive, setSystemActive] = useState(false);

  // Mouse-based parallax (stable)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rawX = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const rawY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  const cardX = useSpring(rawX, {
    stiffness: 60,
    damping: 20,
    mass: 0.4,
  });

  const cardY = useSpring(rawY, {
    stiffness: 60,
    damping: 20,
    mass: 0.4,
  });

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center pt-40 pb-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* LEFT CONTENT */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight"
          >
            Understand your spending.
            <br />
            <span className="text-primary">Without spreadsheets or effort.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="mt-6 text-lg text-foreground/70 max-w-[42ch]"
          >
            Track expenses automatically, analyze your spending, and get clear financial insights - without spreadsheets, manual work, or confusion.
          </motion.p>

          <motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
  className="mt-8 flex gap-4"
>
  <button
    onClick={() => window.location.href = "/signup"}
    className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:scale-[1.03] transition-all duration-300 ease-out"
  >
    Get started for free
  </button>

  <button
    onClick={() =>
      document
        .getElementById("how-it-works")
        ?.scrollIntoView({ behavior: "smooth" })
    }
    className="px-6 py-3 rounded-xl border border-foreground/20 hover:bg-foreground/5 transition"
  >
    See how it works
  </button>
</motion.div>

        </div>

        {/* RIGHT VISUALS */}
        <div className="relative h-[400px] z-10">
          {/* Real Card Stack */}
          <div
            className="absolute inset-0 flex justify-center lg:justify-end"
            onMouseEnter={() => setSystemActive(true)}
            onMouseLeave={() => setSystemActive(false)}
          >
            <CardStack />
          </div>

          {/* Monthly Spend — clearly ABOVE & OUTSIDE */}
          <motion.div
            style={{ x: cardX, y: cardY }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 left-6"
          >
            <FloatingCard title="Monthly Spend" value="$4280" />
          </motion.div>

          {/* Insight — clearly BELOW */}
          <motion.div
            style={{ x: cardX, y: cardY }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-14 left-16"
          >
            <FloatingCard title="Top Category" value="Food & Dining" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
