import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/layout/Footer";
import "./PricingPage.css";

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
    sessionStorage.setItem("pricingIntent", "pro");
    sessionStorage.setItem("pricingCountry", country);
    navigate("/signup");
  };

  return (
    <div className="pricing-container">
      <div className="pricing-inner">
        {/* HEADER */}
        <div className="pricing-header">
          <h1 className="pricing-title">
            Simple, transparent pricing
          </h1>
          <p className="pricing-subtitle">
            Pay less than a coffee per month and finally understand where your
            money goes.
          </p>
        </div>

        {/* COUNTRY SELECT */}
        <div className="currency-switcher">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as any)}
          >
            {Object.entries(COUNTRIES).map(([key, c]) => (
              <option key={key} value={key}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* PRICING CARDS */}
        <div className="pricing-cards">
          {/* FREE PLAN */}
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="plan-desc">
              Start here. No commitment.
            </p>

            <div className="price">
              ₹0 <span className="per">/ month</span>
            </div>
            <div className="billing">
              Unlimited access
            </div>

            <ul className="features">
              <li>✔ Upload expenses</li>
              <li>✔ Auto categorization</li>
              <li>✔ Monthly summaries</li>
              <li className="muted">✖ AI insights</li>
              <li className="muted">✖ Smart suggestions</li>
            </ul>

            <button
              className="secondary-btn"
              onClick={() => navigate("/login")}
            >
              Continue free
            </button>
          </div>

          {/* PRO PLAN */}
          <div className="pricing-card highlight">
            <div className="urgency-badge">
              🔥 Limited-time offer
            </div>

            <h3>Pro</h3>

            <div className="price">
              ₹{plan.price}
              <span className="per">/ month</span>
            </div>

            {discount > 0 && (
              <div className="discount-row">
                <span className="old-price">
                  ₹{plan.original}
                </span>
                <span className="discount-badge">
                  {discount}% OFF
                </span>
              </div>
            )}

            {plan.approx && (
              <div className="billing">
                {plan.approx}
              </div>
            )}

            <ul className="features">
              <li>✔ Everything in Free</li>
              <li>✔ AI-powered insights</li>
              <li>✔ Spending pattern analysis</li>
              <li>✔ Smart saving advice</li>
              <li>✔ Priority support</li>
            </ul>

            <button
              className="primary-btn"
              onClick={handleUpgradeClick}
            >
              Upgrade to Pro
            </button>

            <div className="trust-text">
              🔒 Secure payment · Cancel anytime
            </div>

            <div className="social-proof">
              ⭐ Trusted by 1,000+ early users
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
