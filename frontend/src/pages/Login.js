import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import "./Login.css";

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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      window.dispatchEvent(new Event("storage"));
      navigate("/");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  // Pre-generate rows ONCE (important)
  const rows = useMemo(() => {
    return Array.from({ length: 9 }).map(() => {
      const shuffled = shuffle(cardImages);

      // Random slice length (6–10 logos)
      const sliceLength = 6 + Math.floor(Math.random() * 5);

      // Random offset
      const offset = Math.floor(Math.random() * shuffled.length);

      const rowSet = [
        ...shuffled.slice(offset),
        ...shuffled.slice(0, offset)
      ].slice(0, sliceLength);

      // Duplicate differently per row
      return [...rowSet, ...shuffle(rowSet)];
    });
  }, []);

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
              <img
                key={idx}
                src={src}
                alt="card-logo"
                style={{
                  height: `${38 + (idx % 3) * 3}px`
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-form">
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

        <p>
          Don’t have an account?{" "}
          <button type="button" onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
