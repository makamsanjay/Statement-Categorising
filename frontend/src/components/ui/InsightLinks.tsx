import { motion as _motion } from "framer-motion";

const motion = _motion as any;


export default function InsightLinks({ visible }: { visible: boolean }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 500"
      preserveAspectRatio="none"
    >
      {/* Card → Monthly Spend */}
      <motion.path
        d="M420 260 C 500 210, 560 190, 600 170"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 6"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.4 : 0 }}
        transition={{ delay: 0.08, duration: 0.25, ease: "easeOut" }}
      />

      {/* Card → Insight */}
      <motion.path
        d="M420 260 C 500 310, 560 350, 600 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="3 7"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.3 : 0 }}
        transition={{ delay: 0.12, duration: 0.25, ease: "easeOut" }}
      />
    </svg>
  );
}
