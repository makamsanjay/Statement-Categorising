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
            Pay less than a coffee per month and finally understand where your money goes - without spreadsheets.
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
             Explore SpendSwitch with no commitment.
            </p>

            <div className="price">
              ₹0 <span className="per">/ month</span>
            </div>
            <div className="billing">
              Unlimited access
            </div>

           <ul className="features">
  <li>✔ Add 1 card</li>
  <li>✔ Upload 1 bank statement per day</li>
  <li>✔ Supports multiple files per upload</li>
  <li>✔ Automatic expense categorization</li>
  <li>✔ Monthly spending summaries</li>
  <li className="muted">✖ Multiple cards</li>
  <li className="muted">✖ Card reward suggestions</li>
  <li className="muted">✖ Priority support</li>
</ul>

            <button
              className="secondary-btn"
              onClick={() => navigate("/login")}
            >
              Continue With free
            </button>
            <p className="plan-note">
  No payment required. Upgrade anytime when you need more.
</p>
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
  <li>✔ Add multiple cards</li>
  <li>✔ Unlimited statement uploads</li>
  <li>✔ Sub-category spending insights</li>
  <li>✔ Spending health score</li>
  <li>✔ Card reward suggestions based on spending</li>
  <li>✔ Priority support</li>
</ul>

            <button
              className="primary-btn"
              onClick={handleUpgradeClick}
            >
              Start Pro plan
            </button>

            <div className="trust-text">
              No long-term contracts. Cancel or downgrade at any time.
            </div>

           {/* <div className="social-proof">
              ⭐ Trusted by 1,000+ early users
            </div> */}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
