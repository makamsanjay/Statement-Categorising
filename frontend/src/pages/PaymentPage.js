import React, { useState } from "react";
import "./PaymentPage.css";
import { startCheckout } from "../api";
import { useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
  if (!email || !password) {
    setError("Email and password are required");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await startCheckout({
      email,
      password,
      currency,
      plan: "pro"
    });

    window.location.href = res.url;
  } catch (err) {
    setError(
      err?.response?.data?.message || "Failed to start payment"
    );
    setLoading(false);
  }
};


  return (
    <div className="payment-container">
      <h1>Complete your Pro subscription</h1>
      <p>Secure payment. Cancel anytime.</p>

      <div className="payment-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD – United States</option>
          <option value="INR">INR – India</option>
          <option value="EUR">EUR – Europe</option>
          <option value="GBP">GBP – United Kingdom</option>
        </select>

        {error && <div className="error">{error}</div>}

        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Redirecting..." : "Pay & Create Account"}
        </button>

        <span className="secure-text">
          🔒 Secured by Stripe
        </span>
      </div>
    </div>
  );
}
