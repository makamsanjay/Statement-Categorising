import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./Dashboard";
import PaymentPage from "./pages/PaymentPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";

// ✅ ADD THIS
import ThemeProvider from "./components/providers/ThemeProvider";

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

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 🌐 Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />

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

          {/* ❓ Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
