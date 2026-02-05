import { useState } from "react";
import {
  ShieldCheck,
  CreditCard,
  Globe,
  Lock,
  Sparkles,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Privacy-first by design",
    description:
      "Your data is never sold, shared, or used for advertising. Everything stays yours.",
  },
  {
    icon: CreditCard,
    title: "Works with any card or statement",
    description:
      "Upload PDFs, CSVs, exports — no forced bank connections or lock-in.",
  },
  {
    icon: Globe,
    title: "Built for global users",
    description:
      "Optimized for INR, USD, EUR, GBP and international spending patterns.",
  },
  {
    icon: BarChart3,
    title: "Insights, not dashboards",
    description:
      "We surface conclusions directly so you don’t interpret confusing charts.",
  },
  {
    icon: Lock,
    title: "Read-only access",
    description:
      "We never move money or initiate transactions — analysis only.",
  },
  {
    icon: Sparkles,
    title: "Designed like a product",
    description:
      "You’ll actually enjoy using it. Clean, fast, and thoughtfully crafted.",
  },
];

export default function WhyChooseUs() {
  const [index, setIndex] = useState(0);
  const visibleCards = 3;

  const next = () => {
    setIndex((prev) => (prev + 1) % reasons.length);
  };

  const prev = () => {
    setIndex((prev) =>
      prev === 0 ? reasons.length - 1 : prev - 1
    );
  };

  const visible = Array.from({ length: visibleCards }, (_, i) =>
    reasons[(index + i) % reasons.length]
  );

  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Why choose ExpenseAI
          </h2>
          <p className="mt-4 text-foreground/70">
            Built for trust, clarity, and real-world finance.
          </p>
        </div>

        {/* Carousel */}
        <div className="mt-20 relative flex items-center">

          {/* Left Arrow */}
          <button
            onClick={prev}
            className="hidden md:flex absolute -left-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-card border border-white/15 hover:bg-white/10 transition"
          >
            <ChevronLeft />
          </button>

          {/* Cards */}
          <div className="flex gap-8 mx-auto">
            {visible.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="glass bg-card w-[300px] h-[380px] rounded-3xl p-8 border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Icon size={28} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={next}
            className="hidden md:flex absolute -right-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-card border border-white/15 hover:bg-white/10 transition"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
