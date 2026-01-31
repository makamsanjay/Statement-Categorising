import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import "./Login.css";
import {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
} from "../api";


/* =========================
   CARD WALL (UNCHANGED)
========================= */
const cardImages = [
  "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg",
  "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/31/PayPal_Logo2014.svg",
  "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
  "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f2/Jbc-logo-2016.png",
  "https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/e/ed/Chase_logo_2007.svg",
  "https://upload.wikimedia.org/wikipedia/commons/d/d1/RuPay.svg",
  "https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg"
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const isValidEmail = (email) => {
  // generic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// OPTIONAL: if you want ONLY gmail
const isGmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
};

/* =========================
   LOGIN COMPONENT
========================= */
function Login() {
  const navigate = useNavigate();

  /* ===== LOGIN STATE ===== */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ===== FORGOT PASSWORD STATE ===== */
  const [mode, setMode] = useState("login"); // login | forgot | otp | reset
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  /* ===== LOGIN HANDLER (UNCHANGED) ===== */
 const handleLogin = async () => {
  if (!isValidEmail(email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    const res = await login(email, password);
    localStorage.setItem("token", res.token);
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  } catch (err) {
    alert(err.message || "Login failed");
  }
};

const handleSendOTP = async () => {
  if (!fpEmail) {
    setError("Please enter your email");
    return;
  }

  if (!isValidEmail(fpEmail)) {
    setError("Please enter a valid email address");
    return;
  }

  try {
    setError("");
    await sendForgotPasswordOTP(fpEmail);
    setMode("otp");
  } catch (err) {
    setError(err.message || "No account found with this email");
  }
};



const handleVerifyOTP = async () => {
  if (!otp || otp.length < 4) {
    setError("Invalid OTP");
    return;
  }

  try {
    setError("");
    await verifyForgotPasswordOTP(fpEmail, otp);
    setMode("reset");
  } catch (err) {
    setError(err.message);
  }
};



  const handleResetPassword = async () => {
  if (newPassword.length < 8) {
    setError("Password must be at least 8 characters");
    return;
  }

  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    setError("Password must contain 1 uppercase letter and 1 number");
    return;
  }

  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    setError("");
    await resetPassword(fpEmail, newPassword, confirmPassword);
    alert("Password reset successful. Please login.");
    setMode("login");
  } catch (err) {
    setError(err.message);
  }
};


  /* =========================
     CARD WALL (UNCHANGED)
  ========================= */
  const rows = useMemo(() => {
    return Array.from({ length: 9 }).map(() => {
      const shuffled = shuffle(cardImages);
      const sliceLength = 6 + Math.floor(Math.random() * 5);
      const offset = Math.floor(Math.random() * shuffled.length);

      const rowSet = [
        ...shuffled.slice(offset),
        ...shuffled.slice(0, offset)
      ].slice(0, sliceLength);

      return [...rowSet, ...shuffle(rowSet)];
    });
  }, []);

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="auth-transition auth-container">
      {/* LEFT SIDE */}
      <div className="card-wall">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`card-row ${i % 2 === 0 ? "left" : "right"}`}
            style={{ animationDuration: `${22 + i * 4}s` }}
          >
            {row.map((src, idx) => (
              <img key={idx} src={src} alt="card-logo" />
            ))}
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-form">
        {mode === "login" && (
          <>
            <h2>Welcome back</h2>

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>Login</button>

<p
  className="forgot-link center"
  onClick={() => {
    setMode("forgot");
    setFpEmail("");
    setError("");
  }}
>
  Forgot password?
</p>


            <p>
              Don’t have an account?{" "}
              <button type="button" onClick={() => navigate("/signup")}>
                Sign up
              </button>
            </p>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h2>Reset Password</h2>

            <input
              placeholder="Enter your email"
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
            />

            {error && <p className="auth-error">{error}</p>}

            <button onClick={handleSendOTP}>Send OTP</button>

            <p className="link-btn" onClick={() => setMode("login")}>
              Back to login
            </p>
          </>
        )}

       {mode === "otp" && (
  <>
    <h2>Verify OTP</h2>

    <input
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
    />

    {error && <p className="auth-error">{error}</p>}

    <button onClick={handleVerifyOTP}>Verify</button>

    {/* RESEND OTP */}
    <p
      className="link-text"
      onClick={async () => {
        try {
          setError("");
          await sendForgotPasswordOTP(fpEmail);
        } catch (err) {
          setError(err.message || "Failed to resend OTP");
        }
      }}
    >
      Resend OTP
    </p>

    {/* BACK TO LOGIN */}
    <p
      className="link-text muted"
      onClick={() => {
        setMode("login");
        setOtp("");
        setFpEmail("");
        setError("");
      }}
    >
      Back to login
    </p>
  </>
)}
        {mode === "reset" && (
          <>
            <h2>Set New Password</h2>

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <p className="password-hint">
              Min 8 chars, 1 uppercase, 1 number
            </p>

            {error && <p className="auth-error">{error}</p>}

            <button onClick={handleResetPassword}>
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
