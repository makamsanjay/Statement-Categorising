import { useState } from "react";
import "./HelpPage.css";

export default function HelpPage() {
  const userEmail = localStorage.getItem("userEmail") || "";

  const [form, setForm] = useState({
    name: "",
    email: userEmail,
    type: "demo",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const { name, email, type, message } = form;
  if (!name || !email || !type || !message) {
    alert("All fields are mandatory");
    return;
  }

  setLoading(true);
  setSuccess(false);

  try {
    const res = await fetch("http://localhost:5050/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(form)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }

    setSuccess(true);
    setForm({
      name: "",
      email: userEmail,
      type: "demo",
      message: ""
    });
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="help-page">
      <div className="help-card">
        <h2>Need Help?</h2>
        <p className="help-subtitle">
          Submit your request and we’ll get back to you shortly
        </p>

        {success && (
          <div className="help-success">
            Your request has been sent successfully
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="help-field">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="help-field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="help-field">
            <label>Query Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
            >
              <option value="demo">Need a demo</option>
              <option value="payment">Payment issue</option>
              <option value="bug">Bug / problem</option>
              <option value="feature">Feature request</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="help-field">
            <label>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Describe your issue or request..."
              rows={5}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
