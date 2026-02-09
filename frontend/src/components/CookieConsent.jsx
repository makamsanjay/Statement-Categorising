import { useEffect, useState } from "react";
import "./CookieConsent.css";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setVisible(true);

      // Auto-hide after 1 minute if no action
      const timer = setTimeout(() => {
        setVisible(false);
      }, 60000);

      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);

    // Notify app about consent change
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
        We use essential cookies to keep SpendSwitch running smoothly and
        optional cookies to understand how the site is used.
        We do not use cookies for advertising.
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
