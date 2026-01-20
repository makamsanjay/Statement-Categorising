import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
  try {
    const res = await signup(email, password);
    localStorage.setItem("token", res.token);
    window.location.href = "/";
  } catch (err) {
    alert(err.message);
  }
};


  return (
    <div className="auth-container">
      <h2>Create Account</h2>

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

      <button onClick={handleSignup}>Sign Up</button>

      <p style={{ marginTop: 10 }}>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")}>
          Login
        </button>
      </p>
    </div>
  );
}

export default Signup;
