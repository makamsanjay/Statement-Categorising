import { useEffect, useState } from "react";
import {
  getManageBilling,
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  resumeRazorpaySubscription
} from "../api";
import "./ManageBilling.css";

export default function ManageBilling() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await getManageBilling();
      setBilling(data);
    } catch {
      setError("Failed to load billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================
     DERIVED STATES
  ========================= */
  const isFree = billing?.plan === "free";
  const isActive = billing?.subscriptionStatus === "active";
  const isCanceled = billing?.subscriptionStatus === "canceled";

  const hasNotExpired =
    billing?.planExpiresAt &&
    new Date(billing.planExpiresAt) > new Date();

  /* =========================
     ACTIONS
  ========================= */

const renew = async () => {
  try {
    // canceled but still active → just resume (NO PAYMENT)
    if (isCanceled && hasNotExpired) {
      await resumeRazorpaySubscription();
      await load();
      alert(
        `Your subscription will renew automatically on ${new Date(
          billing.planExpiresAt
        ).toDateString()}`
      );
      return;
    }

    // free or expired → new checkout
    const subscription = await createRazorpaySubscription();

    const rzp = new window.Razorpay({
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      subscription_id: subscription.id,
      name: "Pro Subscription",
      description: "Monthly plan",
      handler: () => {},
      theme: { color: "#0f172a" }
    });

    rzp.open();
  } catch (err) {
    alert("Unable to update subscription");
  }
};


  const cancel = async () => {
    if (!window.confirm("Cancel subscription at end of billing cycle?")) return;
    await cancelRazorpaySubscription();
    await load();
  };

  /* =========================
     UI STATES
  ========================= */
  if (loading) return <div className="billing-loading">Loading…</div>;
  if (error) return <div className="billing-error">{error}</div>;

  return (
    <div className="billing-page">
      <h2>Billing & Subscription</h2>

      <div className="billing-card">
        <div className="billing-row">
          <span>Plan</span>
          <strong>{isFree ? "Free" : "Pro (Monthly)"}</strong>
        </div>

        <div className="billing-row">
          <span>Status</span>
          <strong className={`status ${billing.subscriptionStatus}`}>
            {billing.subscriptionStatus}
          </strong>
        </div>

        {billing.planExpiresAt && (
          <div className="billing-row">
            <span>
              {isCanceled ? "Subscription ends on" : "Next renewal"}
            </span>
            <strong>
              {new Date(billing.planExpiresAt).toDateString()}
            </strong>
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="billing-actions">
        {isActive && (
          <button className="danger" onClick={cancel}>
            Cancel Subscription
          </button>
        )}

        {(isFree || isCanceled) && (
          <button className="primary" onClick={renew}>
            {isFree
              ? "Upgrade to Pro"
              : hasNotExpired
              ? "Resume Subscription"
              : "Renew Subscription"}
          </button>
        )}
      </div>

      <p className="billing-note">
        Payments renew automatically unless canceled.
      </p>
    </div>
  );
}
