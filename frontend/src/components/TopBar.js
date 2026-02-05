import { useState, useRef, useEffect } from "react";
import "./TopBar.css";

function TopBar({
  isPro,
  plan = "free",
  currency,
  pricing,
  onChangeCurrency,
  onUpgrade,
  onManageBilling,
  onLogout,
  onNavigate,
  billingState
})  {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-spacer" />

      <div className="topbar-actions" ref={menuRef}>
        {/* PLAN LABEL */}
        <div className="topbar-plan">
          {isPro ? (
            <span className="plan-badge pro">
              Plan: {String(plan).toUpperCase()}
            </span>
          ) : (
            <span className="plan-badge free">
              You are on FREE plan
            </span>
          )}
        </div>

        {/* UPGRADE BUTTON — ONLY FOR FREE USERS */}
        {!isPro && (
  <button
    className="topbar-upgrade"
    onClick={onUpgrade}
    disabled={billingState === "processing"}
  >
    {billingState === "processing"
      ? "Activating…"
      : pricing?.display
        ? `Upgrade to Pro — ${pricing.display}`
        : "Upgrade to Pro"}
  </button>
)}



        {/* USER ICON */}
        <button
          className="topbar-profile"
          title="Account"
          onClick={() => setOpen(v => !v)}
        >
          <svg
            className="profile-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </button>

        {/* DROPDOWN */}
        {open && (
          <div
            className="profile-dropdown"
            onClick={(e) => e.stopPropagation()} // prevent accidental close
          >
            <button
              className="dropdown-item"
              onClick={() => onNavigate("profile")}
            >
              Personal Info
            </button>

            {/* ACCOUNT CURRENCY */}
            <div className="dropdown-section">
              <label className="dropdown-label">
                Account Currency
              </label>

              <select
                className="dropdown-select"
                value={currency}
                onChange={(e) => onChangeCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* MANAGE BILLING — ONLY FOR PRO USERS */}
            {isPro && (
              <button
                className="dropdown-item"
                onClick={async () => {
                  setOpen(false);
                  await onManageBilling();
                }}
              >
                Manage Billing
              </button>
            )}

            <div className="dropdown-divider" />

            <button
              className="dropdown-item danger"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopBar;
