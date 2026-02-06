import { useEffect, useState } from "react";
import { loadGoogleAnalytics } from "../utils/analytics";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");

    if (!consent) {
      setVisible(true);

      // ⏱ auto-hide after 60 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 60000);

      return () => clearTimeout(timer);
    }

    if (consent === "accepted") {
      loadGoogleAnalytics();
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    loadGoogleAnalytics();
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookieConsent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.container}>
      <p style={styles.text}>
        We use cookies to analyze traffic and improve your experience.
      </p>
      <div style={styles.actions}>
        <button onClick={acceptCookies} style={styles.accept}>
          Accept
        </button>
        <button onClick={declineCookies} style={styles.decline}>
          Decline
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "12px",
    maxWidth: "95%",
    width: "420px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    zIndex: 9999
  },
  text: {
    fontSize: "14px",
    marginBottom: "10px"
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end"
  },
  accept: {
    background: "#38bdf8",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  decline: {
    background: "transparent",
    border: "1px solid #64748b",
    color: "#cbd5f5",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer"
  }
};
