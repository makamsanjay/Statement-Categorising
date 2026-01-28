import { useEffect, useState } from "react";
import "./ProfilePage.css";

export default function ProfilePage() {
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    fetch("http://localhost:5050/users/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setName(data.name || "");
      });
  }, [token]);

  /* ---------------- SAVE NAME (ONE TIME) ---------------- */
  const saveName = async () => {
    if (!name.trim() || saved) return;

    await fetch("http://localhost:5050/users/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    setSaved(true);
  };

  if (!profile) {
    return <p className="muted">Loading profile…</p>;
  }

  /* ---------------- JSX ---------------- */
  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Personal Information</h2>
        <p className="profile-subtitle">
          This information helps personalize your experience
        </p>

        {/* NAME */}
        <div className="profile-field">
          <label>Your Name</label>
          <input
            className="profile-input"
            value={name}
            disabled={saved}
            placeholder="Enter your name"
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === "Enter" && saveName()}
          />
          {saved && (
            <span className="profile-hint">
              Name saved successfully
            </span>
          )}
        </div>

        {/* EMAIL */}
        <div className="profile-field">
          <label>Email Address</label>
          <div className="profile-readonly">
            {profile.email}
          </div>
        </div>
      </div>
    </div>
  );
}
