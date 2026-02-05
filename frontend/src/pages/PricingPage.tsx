import { useState } from "react";
import { useNavigate } from "react-router-dom";

const COUNTRIES = {
  IN: {
    label: "India",
    flag: "🇮🇳",
    price: 99,
    original: 399,
    approx: null,
  },
  US: {
    label: "United States",
    flag: "🇺🇸",
    price: 349,
    original: 799,
    approx: "~ $3.9 USD",
  },
  EU: {
    label: "Europe",
    flag: "🇪🇺",
    price: 349,
    original: 799,
    approx: "~ €3.3 EUR",
  },
  GB: {
    label: "United Kingdom",
    flag: "🇬🇧",
    price: 349,
    original: 799,
    approx: "~ £2.9 GBP",
  },
  OTHER: {
    label: "Other countries",
    flag: "🌍",
    price: 99,
    original: 499,
    approx: null,
  },
};

function discountPercent(original, price) {
  if (original === price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [country, setCountry] = useState("IN");

  const plan = COUNTRIES[country];
  const discount = discountPercent(plan.original, plan.price);

  return (
    <div className="min-h-screen pt-32 pb-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
            Pricing that makes sense
          </h1>
          <p className="mt-4 text-foreground/70">
            Built for students, professionals, and anyone who wants clarity
            over their money — without overpaying.
          </p>
        </div>

        {/* COUNTRY SELECT */}
        <div className="mt-10 flex justify-center">
          <div className="glass rounded-xl px-5 py-3 border border-white/10 shadow-lg">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium cursor-pointer"
            >
              {Object.entries(COUNTRIES).map(([key, c]) => (
                <option key={key} value={key}>
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PRICING GRID */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* FREE PLAN */}
          <div className="glass rounded-3xl p-8 border border-white/10 shadow-lg">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Try the basics. No card required.
            </p>

            <div className="mt-6">
              <p className="text-4xl font-semibold">₹0</p>
              <p className="text-sm text-foreground/60 mt-1">
                Unlimited time
              </p>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-foreground/70">
              <li>✔ Upload expenses</li>
              <li>✔ Automatic categorization</li>
              <li>✔ Monthly summaries</li>
              <li className="opacity-40">✖ AI insights</li>
              <li className="opacity-40">✖ Smart recommendations</li>
            </ul>

            <button
              onClick={() => navigate("/login")}
              className="mt-10 w-full px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition"
            >
              Continue free
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="relative glass rounded-3xl p-8 border border-primary/40 shadow-glass">
            {/* TOP BADGES */}
            <div className="absolute -top-5 left-6 bg-primary text-white text-xs px-4 py-1 rounded-full">
              Most chosen
            </div>

            {discount > 0 && (
              <div className="absolute -top-5 right-6 bg-emerald-500 text-white text-xs px-4 py-1 rounded-full">
                {discount}% OFF · Limited time
              </div>
            )}

            <h3 className="text-xl font-semibold">Pro</h3>
            <p className="mt-2 text-sm text-foreground/70">
              For people who want real control over their spending.
            </p>

            <div className="mt-6">
              <div className="flex items-end gap-3">
                <p className="text-4xl font-semibold">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-foreground/60">
                    {" "}
                    / month
                  </span>
                </p>

                {discount > 0 && (
                  <p className="text-sm line-through text-foreground/50">
                    ₹{plan.original}
                  </p>
                )}
              </div>

              {plan.approx && (
                <p className="text-sm text-foreground/60 mt-1">
                  {plan.approx}
                </p>
              )}
            </div>

            <ul className="mt-8 space-y-3 text-sm text-foreground/70">
              <li>✔ Everything in Free</li>
              <li>✔ AI-powered insights</li>
              <li>✔ Spending trends & patterns</li>
              <li>✔ Smart saving suggestions</li>
              <li>✔ Priority support</li>
            </ul>

            {/* URGENCY LINE */}
            {discount > 0 && (
              <p className="mt-6 text-sm text-emerald-400">
                🔥 Offer valid for early users only
              </p>
            )}

            <button
              onClick={() => navigate("/payment")}
              className="mt-8 w-full px-6 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* SOCIAL PROOF / FOOTNOTE */}
        <p className="mt-14 text-center text-sm text-foreground/60">
          Thousands of users track their spending smarter with ExpenseAI.
          Cancel anytime.
        </p>
      </div>
    </div>
  );
}
