// src/pages/ManageBilling.js
import { useEffect, useState } from "react";
import {
  getManageBilling,
  createRazorpaySubscription,
  cancelRazorpaySubscription
} from "../api";
import "./ManageBilling.css";

export default function ManageBilling() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);


  const load = async () => {
    try {
      setLoading(true);
      const data = await getManageBilling();
      setBilling(data);
    } catch {
      setError("Failed to load billing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="billing-loading">Loading…</div>;
  if (error) return <div className="billing-error">{error}</div>;
  if (!billing) return null;

  const isActive = billing.subscriptionStatus === "active";
  const isCanceled = billing.subscriptionStatus === "canceled";
const isFree = !billing.plan || billing.plan === "free";


const endDate = billing.planExpiresAt
  ? new Date(billing.planExpiresAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  : null;


  /* =========================
     ACTIONS
  ========================= */

  const startNewSubscription = async () => {
    try {
      const subscription = await createRazorpaySubscription();

const rzp = new window.Razorpay({
  key: import.meta.env.RAZORPAY_KEY_ID,
  subscription_id: subscription.id,
  name: "SpendSwitch Pro",
  description: "Monthly Subscription",
  handler: () => {
    setLoading(true);
    setTimeout(load, 3000);
  },
  modal: {
    ondismiss: () => setLoading(false)
  },
  theme: { color: "#4f46e5" }
});


      rzp.open();
    } catch {
      setError("Unable to start subscription");
    }
  };

const confirmCancelSubscription = async () => {
  if (canceling) return;
  try {
    setCanceling(true);
    await cancelRazorpaySubscription();
    setConfirmCancel(false);
    await load();
  } catch {
    setError("Failed to cancel subscription");
  } finally {
    setCanceling(false);
  }
};

const STATUS_LABELS = {
  active: "Active",
  canceled: "Canceled",
  pending: "Processing",
  none: "Inactive"
};

  /* =========================
     UI
  ========================= */

  return (
    <div className="billing-page">
      <h2 className="billing-title">Billing & Subscription</h2>

      <div className="billing-card">
        <div className="billing-row">
          <span>Plan</span>
          <strong>{isFree ? "Free" : "Pro (Monthly)"}</strong>
        </div>

        <div className="billing-row">
          <span>Status</span>
          <strong className={`status ${billing.subscriptionStatus}`}>
  {STATUS_LABELS[billing.subscriptionStatus] || "Unknown"}
</strong>
        </div>

        {billing.planExpiresAt && (
          <div className="billing-row">
            <span>
              {isCanceled ? "Access ends on" : "Next billing date"}
            </span>
            <strong>{endDate}</strong>
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}

      <div className="billing-actions">
        {/* ACTIVE → CANCEL */}
        {isActive && !confirmCancel && (
          <button
            className="billing-btn danger"
            onClick={() => setConfirmCancel(true)}
          >
            Cancel Subscription
          </button>
        )}

        {/* CONFIRM CANCEL */}
        {confirmCancel && (
          <div className="cancel-warning">
            <p>
              <strong>This action cannot be undone.</strong>
              <br />
              Your Pro access will continue until{" "}
              <strong>{endDate}</strong>.
              <br />
              <strong>
                You can renew your subscription again on {endDate} by clicking
                “Upgrade to Pro”.
              </strong>
            </p>

            <div className="cancel-actions">
              <button
                className="billing-btn danger"
                onClick={confirmCancelSubscription}
              >
                Yes, cancel subscription
              </button>
              <button
                className="billing-btn secondary"
                onClick={() => setConfirmCancel(false)}
              >
                Keep subscription
              </button>
            </div>
          </div>
        )}

        {/* CANCELED → INFO ONLY (NO BUTTON) */}
        {isCanceled && !confirmCancel && (
          <div className="billing-info">
            <p>
              <strong>Subscription canceled.</strong>
              <br />
              Your Pro access remains active until{" "}
              <strong>{endDate}</strong>.
              <br />
              <strong>
                You can renew your subscription again on {endDate} by clicking
                “Upgrade to Pro”.
              </strong>
            </p>
          </div>
        )}

        {/* FREE USERS ONLY */}
        {isFree && !confirmCancel && (
          <button
  className="billing-btn primary"
  onClick={startNewSubscription}
  disabled={loading}
>
  Upgrade to Pro
</button>
        )}
      </div>

      <p className="billing-note">
        Subscriptions renew automatically unless canceled before the billing
        date.
      </p>
    </div>
  );
}
