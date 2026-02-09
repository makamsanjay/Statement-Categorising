import { useEffect, useState } from "react";
import "./ProfilePage.css";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function ProfilePage() {
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const [deleteStep, setDeleteStep] = useState("idle");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setName(data.name || "");
      })
      .catch(() => setError("Unable to load profile"));
  }, [token]);

  /* ---------------- SAVE NAME ---------------- */
  const saveName = async () => {
    if (!name.trim() || saved) return;

    await fetch(`${BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    setSaved(true);
  };

  /* ---------------- DELETE ACCOUNT ---------------- */

  const sendDeleteOTP = async () => {
    setError("");
    const res = await fetch(`${BASE_URL}/users/delete/send-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed to send OTP");
      return;
    }

    setDeleteStep("otpSent");
  };

  const verifyDeleteOTP = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }

    const res = await fetch(`${BASE_URL}/users/delete/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ otp })
    });

    if (!res.ok) {
      setError("Invalid code");
      return;
    }

    setDeleteStep("verified");
  };

  const confirmDeleteAccount = async () => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      setError("Delete failed");
      return;
    }

    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (!profile) return <p className="muted">Loading profile…</p>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Personal Information</h2>

        <div className="profile-field">
          <label>Your Name</label>
          <input
            value={name}
            disabled={saved}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
          />
          {saved && <span className="profile-hint">Saved</span>}
        </div>

        <div className="profile-field">
          <label>Email</label>
          <div className="profile-readonly">{profile.email}</div>
        </div>
      </div>

      <div className="profile-card danger">
        <h3>Delete account</h3>
        <p className="muted">This action is permanent.</p>

        {error && <div className="error-box">{error}</div>}

        {deleteStep === "idle" && (
          <button className="danger-btn" onClick={sendDeleteOTP}>
            Send verification code
          </button>
        )}

        {deleteStep === "otpSent" && (
          <>
            <input
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
            <button className="primary" onClick={verifyDeleteOTP}>
              Verify code
            </button>
          </>
        )}

        {deleteStep === "verified" && (
          <button className="danger-btn" onClick={confirmDeleteAccount}>
            Permanently delete account
          </button>
        )}
      </div>
    </div>
  );
}
