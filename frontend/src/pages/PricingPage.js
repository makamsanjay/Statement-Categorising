import React, { useState } from "react";
import "./PricingPage.css";
import { useNavigate } from "react-router-dom";

const PRICES = {
  USD: { symbol: "$", free: 0, pro: 4 },
  INR: { symbol: "₹", free: 0, pro: 299 },
  EUR: { symbol: "€", free: 0, pro: 5 },
  GBP: { symbol: "£", free: 0, pro: 3.5 }
};

export default function PricingPage() {
  const [currency, setCurrency] = useState("USD");
  const navigate = useNavigate();

  const price = PRICES[currency];

  return (
    <div className="pricing-container">
      <h1 className="pricing-title">Simple, Transparent Pricing</h1>
      <p className="pricing-subtitle">
        Start free. Upgrade when you’re ready.
      </p>

      <div className="currency-switcher">
        <label>Currency:</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD – United States</option>
          <option value="INR">INR – India</option>
          <option value="EUR">EUR – Europe</option>
          <option value="GBP">GBP – United Kingdom</option>
        </select>
      </div>

      <div className="pricing-cards">
        {/* FREE PLAN */}
        <div className="pricing-card">
          <h2>Free</h2>
          <p className="price">
            {price.symbol}
            {price.free}
          </p>
          <span className="billing">Forever free</span>

          <ul className="features">
            <li> Basic dashboard</li>
            <li> Upload limited transactions</li>
            <li> Advanced analytics</li>
            <li> AI insights</li>
            <li> Priority support</li>
          </ul>

          <button
            className="primary-btn"
            onClick={() => navigate("/login")}
          >
            Continue Free
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="pricing-card highlight">
          <h2>Pro</h2>

          <div className="discount-row">
            <span className="old-price">
              {price.symbol}15 / month
            </span>
            <span className="discount-badge">73% OFF</span>
          </div>

          <p className="price">
            {price.symbol}
            {price.pro}
            <span className="per">/month</span>
          </p>

          <ul className="features">
            <li> Full dashboard access</li>
            <li> Unlimited transactions</li>
            <li> Advanced analytics</li>
            <li> AI-powered insights</li>
            <li> Priority email support</li>
          </ul>

          <button
            className="primary-btn"
            onClick={() => navigate("/payment")}
          >
            Continue with Pro
          </button>
        </div>
      </div>
    </div>
  );
}
