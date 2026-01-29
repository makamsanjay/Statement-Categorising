import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signup, sendSignupOtp, verifySignupOtp } from "../api";
import "./Signup.css";

const tips = [
  {
    title: "Extract Transactions from PDFs",
    desc: "Automatically extract transactions from bank statement PDFs in seconds."
  },
  {
    title: "Multiple File Formats Supported",
    desc: "Upload PDF, CSV, XLS, and XLSX files without any manual conversion."
  },
  {
    title: "AI-Powered Categorization",
    desc: "Transactions are auto-categorized using AI for better insights."
  },
  {
    title: "Smart Multi-Card Management",
    desc: "Manage multiple cards separately with individual summaries and reports."
  },
  {
    title: "Monthly Budget Tracking",
    desc: "Set monthly budgets and track overspending before it happens."
  },
  {
    title: "Clear & Actionable Analytics",
    desc: "Visualize your spending patterns with clean charts and summaries."
  },
  {
    title: "Secure by Design",
    desc: "Your data is protected with encrypted storage and email verification."
  },
  {
    title: "Simple & Affordable Pricing",
    desc: "Powerful features at a price designed for everyday users."
  }
];


function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [activeTip, setActiveTip] = useState(0);

  /* Rotate tips */
  useEffect(() => {
    const id = setInterval(
      () => setActiveTip(i => (i + 1) % tips.length),
      6000
    );
    return () => clearInterval(id);
  }, []);

  /* Password rules */
  const passwordRules = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }), [password]);

  const passwordsEntered = password.length > 0 || confirmPassword.length > 0;
  const passwordsMatch =
    passwordsEntered && password === confirmPassword && password.length > 0;

  const isPasswordValid =
    Object.values(passwordRules).every(Boolean) && passwordsMatch;

  /* OTP */
  const sendOtp = async () => {
    await sendSignupOtp(email);
    setShowOtpInput(true);
  };

  const verifyOtp = async () => {
    await verifySignupOtp(email, otp);
    setEmailVerified(true);
    setShowOtpInput(false);
  };

  /* Signup */
  const handleSignup = async () => {
    if (!emailVerified || !isPasswordValid) return;
    const res = await signup({ name, email, password });
    localStorage.setItem("token", res.token);
    window.location.href = "/";
  };

  return (
    <div className="auth-container auth-transition">
     {/* LEFT SIDE */}
<div className="signup-left">
  {/* Ambient background layers */}
  <div className="bg-orb orb-1" />
  <div className="bg-orb orb-2" />
  <div className="bg-orb orb-3" />

  {/* Tip card */}
  <div key={activeTip} className="tip-card glass">
    <h3>{tips[activeTip].title}</h3>
    <p>{tips[activeTip].desc}</p>
  </div>
</div>


      {/* RIGHT */}
      <div className="auth-form">
        <h2>Create account</h2>

        <input
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {/* Email */}
        <div className="email-block">
          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => {
              if (!emailVerified && !showOtpInput) {
                setEmailFocused(false);
              }
            }}
            disabled={emailVerified}
          />

          {/* Verify appears ONLY on focus */}
          {emailFocused && !emailVerified && (
            <button
              type="button"
              className="verify-below"
              onClick={sendOtp}
            >
              Verify email
            </button>
          )}

          {emailVerified && (
            <div className="email-verified">Verified ✓</div>
          )}
        </div>

        {/* OTP */}
        {showOtpInput && !emailVerified && (
          <div className="otp-section">
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            <div className="otp-actions">
              <span onClick={verifyOtp}>Verify OTP</span>
              <span onClick={sendOtp}>Resend</span>
            </div>
          </div>
        )}

        {/* Passwords */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onFocus={() => setShowPasswordRules(true)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        {showPasswordRules && (
          <ul className="password-rules compact">
            <li className={passwordRules.length ? "ok" : "bad"}>8+ characters</li>
            <li className={passwordRules.uppercase ? "ok" : "bad"}> 1 Uppercase</li>
            <li className={passwordRules.number ? "ok" : "bad"}> 1 Number</li>
            <li className={passwordRules.special ? "ok" : "bad"}> 1 Special character</li>
            <li className={passwordsMatch ? "ok" : "bad"}>Passwords Match</li>
          </ul>
        )}

        <button className="primary-btn simple" onClick={handleSignup}>
          Create Account
        </button>

        <p>
          Already have an account?{" "}
          <button className="link-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
