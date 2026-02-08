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
import RequireAuth from "./components/RequireAuth";
import PrivacyPolicy from "./components/layout/PrivacyPolicy";
import ScrollToTop from "./components/layout/ScrollToTop";
import TermsOfService from "./components/layout/TermsOfService";
import DataSecurity from "./components/layout/DataSecurity";


// Providers
import ThemeProvider from "./components/providers/ThemeProvider";

// ✅ Navbar controller
import NavbarGate from "./components/layout/NavbarGate";

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
  const maybeLoadGA = () => {
    if (localStorage.getItem("cookieConsent") === "accepted") {
      loadGoogleAnalytics();
    }
  };

  maybeLoadGA();
  window.addEventListener("cookie-consent-updated", maybeLoadGA);

  return () =>
    window.removeEventListener("cookie-consent-updated", maybeLoadGA);
}, []);


  return (
    
    <ThemeProvider>
      <BrowserRouter>
        {/* ✅ NAVBAR ONLY WHERE ALLOWED */}
        <NavbarGate />
         <ScrollToTop />

        <Routes>
          {/* 🌐 Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          {/* future */}
          {/* <Route path="/help" element={<HelpPage />} /> */}

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

          <Route path="/help" element={<ContactPage />} />

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
