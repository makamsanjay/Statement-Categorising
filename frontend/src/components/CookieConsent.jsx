import { useEffect, useState } from "react";
import "./CookieConsent.css";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setVisible(true);

      // ⏱ auto-hide after 1 minute
      const timer = setTimeout(() => {
        setVisible(false);
      }, 60000);

      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);

    // 🔔 tell app consent changed
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  const decline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-text">
        We use cookies only to understand how our website is used.
        No ads. No tracking by default.
      </div>

      <div className="cookie-actions">
        <button className="accept" onClick={accept}>
          Accept
        </button>
        <button className="decline" onClick={decline}>
          Decline
        </button>
      </div>
    </div>
  );
}
