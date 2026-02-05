import { motion as _motion } from "framer-motion";

const motion = _motion as any;


interface FloatingCardProps {
  title: string;
  value: string;
  delay?: number;
}

export default function FloatingCard({
  title,
  value,
  delay = 0,
}: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="glass bg-card rounded-2xl px-5 py-4 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <p className="text-sm text-foreground/60">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </motion.div>
  );
}
