import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./Dashboard";
import PaymentPage from "./pages/PaymentPage";
import PricingPage from "./pages/PricingPage";

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
    <BrowserRouter>
      <Routes>
        {/* 🌐 Public routes */}
        <Route path="/" element={<PricingPage />} />
        <Route path="/payment" element={<PaymentPage />} />

        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* 🔐 Protected routes */}
        <Route
          path="/dashboard/*"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* ❓ Unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
