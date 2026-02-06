import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./Dashboard";
import PaymentPage from "./pages/PaymentPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import ContactPage from "./pages/ContactPage";
import { loadGoogleAnalytics } from "./utils/analytics";

// Providers
import ThemeProvider from "./components/providers/ThemeProvider";
import NavbarGate from "./components/layout/NavbarGate";

const BASE_URL = "http://localhost:5050";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authVersion, setAuthVersion] = useState(0); // 👈 ADD

  /* ============================
     🔐 CHECK AUTH VIA COOKIE
     ============================ */
useEffect(() => {
  const checkAuth = async () => {
    setAuthChecked(false);

    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        credentials: "include"
      });

      const data = await res.json();

      // 🔥 accept backend truth
      if (data.authenticated === true) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  checkAuth();
}, [authVersion]);


useEffect(() => {
  const handler = () => setAuthVersion(v => v + 1);
  window.addEventListener("auth-changed", handler);
  return () => window.removeEventListener("auth-changed", handler);
}, []);

  /* ============================
     📊 GOOGLE ANALYTICS
     ============================ */
  useEffect(() => {
    if (localStorage.getItem("cookieConsent") === "accepted") {
      loadGoogleAnalytics();
    }
  }, []);

  if (!authChecked) {
    return null; // or loading spinner
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavbarGate />

        <Routes>
          {/* 🌐 Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/help" element={<ContactPage />} />

          {/* 🔐 Auth */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Signup />
              )
            }
          />

          {/* 💳 Payment */}
          <Route path="/payment" element={<PaymentPage />} />

          {/* 📊 App */}
          <Route
            path="/dashboard/*"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ❓ Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
