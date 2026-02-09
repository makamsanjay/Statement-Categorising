import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signup, sendSignupOtp, verifySignupOtp } from "../api";
import "./Signup.css";

const tips = [
  {
    title: "Upload bank statement PDFs",
    desc: "Upload bank statement PDFs and automatically extract transactions in seconds - no manual entry required.",
  },
  {
    title: "Support for common file formats",
    desc: "Works with PDF, CSV, XLS, and XLSX files, so you can upload statements from almost any bank or platform.",
  },
  {
    title: "Automatic expense categorization",
    desc: "Transactions are automatically categorized into clear categories and sub-categories for easy understanding.",
  },
  {
    title: "Multi-card expense tracking",
    desc: "Add and manage multiple credit or debit cards and view combined spending insights across all cards.",
  },
  {
    title: "Spending health overview",
    desc: "Get a simple spending health view that highlights unusual patterns and areas that may need attention.",
  },
  {
    title: "Clear spending analytics",
    desc: "Understand your spending with clean charts, summaries, and breakdowns instead of complex spreadsheets.",
  },
  {
    title: "Privacy-first and secure",
    desc: "Your data is protected with read-only access and modern encryption. We never sell or advertise using your data.",
  },
  {
    title: "Start free, upgrade anytime",
    desc: "Begin with the free plan and upgrade only when you need advanced insights - no long-term commitment.",
  },
];

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [activeTip, setActiveTip] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  if (!email) {
    setError("Please enter your email first");
    return;
  }

  try {
    setLoading(true);
    setError("");
    await sendSignupOtp(email);
    setShowOtpInput(true);
  } catch (err) {
    setError(err.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};

const verifyOtp = async () => {
  if (!otp) {
    setError("Please enter the OTP");
    return;
  }

  try {
    setLoading(true);
    setError("");
    await verifySignupOtp(email, otp);
    setEmailVerified(true);
    setShowOtpInput(false);
  } catch (err) {
    setError(err.message || "Invalid OTP");
  } finally {
    setLoading(false);
  }
};


  /* Signup */
 const handleSignup = async () => {
  if (!emailVerified) {
    setError("Please verify your email before creating an account");
    return;
  }

  if (!isPasswordValid) {
    setError("Password requirements not met");
    return;
  }

  if (!name.trim()) {
    setError("Please enter your name");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await signup({ name, email, password });

    localStorage.setItem("token", res.token);
    window.dispatchEvent(new Event("storage"));


    navigate("/dashboard", { replace: true });
  } catch (err) {
    setError(
      err.message ||
      "An account with this email already exists"
    );
  } finally {
    setLoading(false);
  }
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
     <div className="auth-form-wrapper">
  {/* BRAND */}
  <div className="auth-brand">
    <span className="brand-spend">Spend</span>
    <span className="brand-switch">Switch</span>
  </div>

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
  onChange={e => {
    setEmail(e.target.value);
    setError("");
  }}
  disabled={emailVerified}
/>



          {/* Verify appears ONLY on focus */}
          {email && !emailVerified && !showOtpInput && (
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

      <button
  className="primary-btn simple"
  onClick={handleSignup}
  disabled={loading}
>
  {loading ? "Creating account..." : "Create Account"}
</button>

{error && (
  <div className="form-error">
    {error}
  </div>
)}


        <p>
          Already have an account?{" "}
          <button className="link-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </p>
      </div>
      </div>
      </div>
  );
}

export default Signup;
