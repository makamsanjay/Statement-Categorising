import { useState } from "react";
import {
  ChevronDown,
  Mail,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import Footer from "../components/layout/Footer";
import "./ContactPage.css";

const faqs = [
  {
    q: "Is my financial data safe?",
    a: "Yes. We use read-only access and industry-standard encryption. We never move money or initiate transactions.",
  },
  {
    q: "Do you connect directly to my bank?",
    a: "No. You can upload statements manually. Bank connections are optional and read-only.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts or lock-ins.",
  },
  {
    q: "Do you support international currencies?",
    a: "Yes. We support INR, USD, EUR, GBP and more.",
  },
];

export default function ContactPage() {
  const userEmail = localStorage.getItem("userEmail") || "";

  const [form, setForm] = useState({
    name: "",
    email: userEmail,
    type: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.type || !form.message) {
  setFormError("All fields are mandatory");
  return;
}


    setLoading(true);
    setFormError("");
    setSuccess(false);

    try {
      await fetch("http://localhost:5050/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      setSuccess(true);
      setForm({
        name: "",
        email: userEmail,
        type: "",
        message: "",
      });
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="help-wrapper">
      <div className="help-container">
        {/* TOP LEFT TITLE */}
        <div className="help-title">
          <HelpCircle className="help-icon" />
          <h1>Help & Support</h1>
        </div>


        <p className="help-subtitle">
          Answers to common questions and direct support when you need it.
        </p>

        <div className="help-grid">
          {/* FAQ */}
          <div>
            <h2 className="section-heading">Frequently asked questions</h2>

            <div className="faq-list">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="faq-card">
                    <button
                      className="faq-button"
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`faq-chevron ${open ? "open" : ""}`}
                      />
                    </button>

                    {open && (
                      <div className="faq-answer">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORM */}
          <div className="help-form-card">
            <div className="form-heading">
              <Mail className="help-icon" />
              <h2>Contact support</h2>
            </div>

            {success && (
              <div className="success-banner">
                <ShieldCheck size={18} />
                Request sent successfully
              </div>
            )}

            <form onSubmit={handleSubmit} className="help-form">
              <input
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                className="help-input"
              />

              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="help-input"
              />

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="help-input"
              >
                <option value="" disabled>
                  Select your concern
                </option>
                <option value="demo">Need a demo</option>
                <option value="payment">Payment issue</option>
                <option value="bug">Bug / problem</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>

              <textarea
                name="message"
                rows={5}
                placeholder="Describe your issue or request…"
                value={form.message}
                onChange={handleChange}
                className="help-input"
              />

              <button
                type="submit"
                disabled={loading}
                className="help-submit-btn"
              >
                {loading ? "Sending…" : "Submit request"}
              </button>
                    {formError && (
  <div className="form-toast-error">
    {formError}
  </div>
)}
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
