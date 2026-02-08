import { motion as _motion } from "framer-motion";

const motion = _motion as any;


export default function CardStack() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover="hover"
      className="relative w-[360px] h-[240px]"
    >
      {/* Card 3 (back) */}
      <motion.div
        variants={{
          hover: { y: -6, x: 6 },
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="
          absolute inset-0
          translate-x-6 -translate-y-6
          rounded-2xl
          bg-gradient-to-br from-foreground/10 to-foreground/5
          border border-white/10
          backdrop-blur-md
          shadow-lg
        "
      />

      {/* Card 2 (middle) */}
      <motion.div
        variants={{
          hover: { y: -10, x: 3 },
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="
          absolute inset-0
          translate-x-3 -translate-y-3
          rounded-2xl
          bg-gradient-to-br from-secondary/20 to-secondary/5
          border border-white/10
          backdrop-blur-md
          shadow-xl
        "
      />

      {/* Card 1 (front) */}
      <motion.div
        variants={{
          hover: { y: -14 },
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="
          absolute inset-0
          rounded-2xl
          bg-gradient-to-br from-primary/30 to-primary/10
          border border-white/20
          backdrop-blur-lg
          shadow-2xl
          p-6
          flex flex-col justify-between
        "
      >
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-8 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-500/80" />
          <span className="text-sm text-foreground/70">Card</span>
        </div>

        {/* Card number */}
        <div className="mt-6">
          <p className="text-lg tracking-widest font-medium">
            •••• •••• •••• 4832
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-foreground/60">Card Holder</p>
            <p className="text-sm font-medium">Spend Switch</p>
          </div>
          <p className="text-sm font-semibold">VISA</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
