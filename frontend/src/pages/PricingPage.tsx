import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/layout/Footer";

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
    price: 799,
    original: 799,
    approx: null,
  },
};

function discountPercent(original: number, price: number) {
  if (original === price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [country, setCountry] = useState<keyof typeof COUNTRIES>("IN");

  const plan = COUNTRIES[country];
  const discount = discountPercent(plan.original, plan.price);

  const handleUpgradeClick = () => {
    // ✅ store intent only (frontend hint, NOT trusted by backend)
    sessionStorage.setItem("pricingIntent", "pro");
    sessionStorage.setItem("pricingCountry", country);

    // ✅ go to signup (or login if you prefer)
    navigate("/signup");
  };

  return (
    <div className="min-h-screen pt-32 pb-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-foreground/70">
            Pay less than a coffee per month and finally understand where your
            money goes.
          </p>
        </div>

        {/* COUNTRY SELECT */}
        <div className="mt-10 flex justify-center">
          <div className="glass rounded-xl px-5 py-3 border border-white/10 shadow-lg">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as any)}
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
              Start here. No commitment.
            </p>

            <div className="mt-6">
              <p className="text-4xl font-semibold">₹0</p>
              <p className="text-sm text-foreground/60 mt-1">
                Unlimited access
              </p>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-foreground/70">
              <li>✔ Upload expenses</li>
              <li>✔ Auto categorization</li>
              <li>✔ Monthly summaries</li>
              <li className="opacity-40">✖ AI insights</li>
              <li className="opacity-40">✖ Smart suggestions</li>
            </ul>

            <button
              onClick={() => navigate("/login")}
              className="mt-10 w-full px-6 py-3 rounded-xl border border-white/20"
            >
              Continue free
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="rounded-3xl p-8 border border-primary/40 shadow-xl">
            <h3 className="text-xl font-semibold">Pro</h3>

            <div className="mt-6">
              <p className="text-4xl font-semibold text-primary">
                ₹{plan.price} / month
              </p>
              {discount > 0 && (
                <p className="text-sm text-emerald-400">
                  {discount}% OFF · Limited time
                </p>
              )}
            </div>

            <ul className="mt-8 space-y-3 text-sm text-foreground/70">
              <li>✔ Everything in Free</li>
              <li>✔ AI-powered insights</li>
              <li>✔ Spending patterns</li>
              <li>✔ Smart saving advice</li>
              <li>✔ Priority support</li>
            </ul>

            <button
              onClick={handleUpgradeClick}
              className="mt-8 w-full px-6 py-3 rounded-xl bg-primary text-white"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
