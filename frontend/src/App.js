import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./Dashboard";
import PaymentPage from "./pages/PaymentPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import ContactPage from "./pages/ContactPage";

import { enableAnalytics } from "./utils/analytics";

import PrivacyPolicy from "./components/layout/PrivacyPolicy";
import TermsOfService from "./components/layout/TermsOfService";
import DataSecurity from "./components/layout/DataSecurity";

import ScrollToTop from "./components/layout/ScrollToTop";
import TrackPageView from "./components/TrackPageView";

// Providers
import ThemeProvider from "./components/providers/ThemeProvider";

// Navbar controller
import NavbarGate from "./components/layout/NavbarGate";

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  // Sync auth across tabs
  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  // Enable Google Analytics only after consent
  useEffect(() => {
    const maybeEnableGA = () => {
      if (localStorage.getItem("cookieConsent") === "accepted") {
        enableAnalytics();
      }
    };

    // Check immediately
    maybeEnableGA();

    // Listen for consent changes
    window.addEventListener("cookie-consent-updated", maybeEnableGA);
    return () =>
      window.removeEventListener("cookie-consent-updated", maybeEnableGA);
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Global helpers */}
        <ScrollToTop />
        <TrackPageView />

        {/* Navbar */}
        <NavbarGate />

        <Routes>
          {/* 🌐 Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/help" element={<ContactPage />} />

          {/* 🔐 Auth */}
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/signup"
            element={token ? <Navigate to="/dashboard" /> : <Signup />}
          />

          {/* 💳 Payment */}
          <Route path="/payment" element={<PaymentPage />} />

          {/* 📊 App */}
          <Route
            path="/dashboard/*"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />

          {/* 📜 Legal */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/data-security" element={<DataSecurity />} />

          {/* ❓ Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
