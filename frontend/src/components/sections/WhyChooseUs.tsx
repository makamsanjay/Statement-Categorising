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
    title: "Privacy-first and secure by design",
    description:
      "Your financial data is never sold or shared. Sensitive information is protected using hashing and secure processing, with no unnecessary data stored.",
  },
  {
    icon: CreditCard,
    title: "Support for multiple cards",
    description:
      "Add multiple credit or debit cards and view unified spending insights across all cards in one place.",
  },
  {
    icon: BarChart3,
    title: "Automatic expense categorization",
    description:
      "Transactions are automatically categorized into categories and sub-categories, helping you understand exactly where your money goes.",
  },
  {
    icon: Sparkles,
    title: "Smart sub-category insights",
    description:
      "Go beyond basic categories with sub-category analysis that reveals detailed spending behavior, not just totals.",
  },
  {
    icon: Globe,
    title: "Upload statements from anywhere",
    description:
      "Upload bank statement PDFs, CSVs, or exports from any bank or country - no forced bank connections required.",
  },
  {
    icon: BarChart3,
    title: "Deeper spending analytics",
    description:
      "Explore your expenses using bar charts, pie charts, and trend lines for clearer and more meaningful financial analysis.",
  },
  {
    icon: CreditCard,
    title: "Smarter card reward suggestions",
    description:
      "SpendSwitch compares your spending patterns with card reward structures to highlight cards that may earn you more cashback or rewards.",
  },
  {
    icon: ShieldCheck,
    title: "Read-only analysis only",
    description:
      "We never move money or initiate transactions. SpendSwitch is strictly read-only and used only for analysis.",
  },
  {
    icon: BarChart3,
    title: "Spending health score",
    description:
      "Get a clear spending health score based on your habits to quickly understand whether your spending patterns are balanced or risky.",
  },
  {
    icon: Lock,
    title: "Export your transactions anytime",
    description:
      "Download categorized transactions and insights whenever you need them for budgeting, taxes, or personal records.",
  },
  {
    icon: Sparkles,
    title: "Custom category exploration",
    description:
      "Click any category or sub-category to view expanded analytics and drill down into the transactions you care about most.",
  },
  {
    icon: ShieldCheck,
    title: "Cancel anytime with priority support",
    description:
      "No lock-ins or hidden commitments. Cancel anytime and get access to fast, priority support when you need help.",
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
            Why choose SpendSwitch
          </h2>
          <p className="mt-4 text-foreground/70">
            A modern expense tracking platform built for clarity, security, and smarter financial decisions.
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
