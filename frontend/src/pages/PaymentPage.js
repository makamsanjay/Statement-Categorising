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

      // 1️⃣ Ask backend to prepare Razorpay checkout
      const res = await startCheckout({
        email,
        password,
        currency,
        plan: "pro"
      });

      /*
        Expected backend response (example):
        {
          key: "rzp_test_xxx",
          subscription_id: "sub_xxx"
        }
      */

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: res.key,
        subscription_id: res.subscription_id,
        name: "SpendSwitch",
        description: "Pro Subscription",
        prefill: {
          email
        },
        theme: {
          color: "#4f46e5"
        },
        handler: function (response) {
          // Payment success → go wherever you already handle it
          navigate("/dashboard", { replace: true });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      // ✅ IMPORTANT FIX:
      // Delay opening Razorpay so desktop viewport is detected
      setTimeout(() => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }, 300);

    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to start payment"
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
          {loading ? "Opening secure checkout…" : "Pay & Create Account"}
        </button>

        <span className="secure-text">
          🔒 Secured by Razorpay
        </span>
      </div>
    </div>
  );
}
