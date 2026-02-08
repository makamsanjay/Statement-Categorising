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
    q: "Is my financial data safe with SpendSwitch?",
    a: "Yes. SpendSwitch is built with a privacy-first approach. We use read-only access and modern encryption standards to protect your data. We never move money, initiate transactions, or sell your information.",
  },
  {
    q: "Do you connect directly to my bank account?",
    a: "No. SpendSwitch does not require direct bank connections. You can upload bank statement PDFs or files manually. This gives you full control over what data you share.",
  },
  {
    q: "Can I upload bank statement PDFs and CSV files?",
    a: "Yes. SpendSwitch supports uploading bank statement PDFs, CSV files, and exported transaction files. Uploaded data is automatically extracted and categorized.",
  },
  {
    q: "How does expense categorization work?",
    a: "SpendSwitch automatically categorizes transactions into clear categories and sub-categories. This helps you understand where your money goes without manual tagging or spreadsheets.",
  },
  {
    q: "Does SpendSwitch support multiple cards?",
    a: "Yes. Our Pro plan allows you to add multiple credit or debit cards and view combined spending insights across all of them in one place.",
  },
  {
    q: "What are sub-category insights?",
    a: "Sub-category insights break down broad categories into more detailed views, helping you understand specific spending habits rather than just totals.",
  },
  {
    q: "Does SpendSwitch provide credit card suggestions?",
    a: "SpendSwitch analyzes your spending patterns and highlights opportunities where different cards may offer better rewards. We provide insights, not financial advice.",
  },
  {
    q: "What is the spending health score?",
    a: "The spending health score summarizes your spending behavior to help you quickly understand whether your habits are balanced or need attention.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes. SpendSwitch offers a free plan that includes core expense tracking features with limits. You can upgrade anytime if you need advanced insights.",
  },
  {
    q: "Can I cancel or downgrade my plan anytime?",
    a: "Yes. There are no long-term contracts. You can cancel or downgrade your plan at any time from your account.",
  },
  {
    q: "Does SpendSwitch work internationally?",
    a: "Yes. SpendSwitch supports multiple currencies, including INR, USD, EUR, and GBP, and works with international bank statements.",
  },
  {
    q: "Is my data shared with advertisers or third parties?",
    a: "No. SpendSwitch is not ad-driven. Your data is never sold, shared, or used for advertising or profiling.",
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
