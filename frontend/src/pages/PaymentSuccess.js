import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { finalizeSubscription } from "../api";

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const finalize = async () => {
      try {
        // Razorpay success handler should send us here with state
        const subscriptionId =
          location.state?.subscriptionId ||
          location.state?.razorpay_subscription_id;

        if (!subscriptionId) {
          // Safety fallback
          navigate("/pricing", { replace: true });
          return;
        }

        // Tell backend: payment succeeded, activate user + issue token
        const res = await finalizeSubscription(subscriptionId);

        // Auto-login user
        localStorage.setItem("token", res.token);
        window.dispatchEvent(new Event("storage"));

        // Go to app
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Payment finalization failed:", err);
        navigate("/pricing", { replace: true });
      }
    };

    finalize();
  }, [location, navigate]);

  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h2>Finalizing your subscription…</h2>
      <p>Please don’t close this tab.</p>
    </div>
  );
}

export default PaymentSuccess;
