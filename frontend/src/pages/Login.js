import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

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


  return (
    <div className="auth-container">
      <h2>Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <p style={{ marginTop: 10 }}>
        Don’t have an account?{" "}
        <button type="button" onClick={() => navigate("/signup")}>
          Sign up
        </button>
      </p>
    </div>
  );
}

export default Login;
