import { useState } from "react";
import {
  ChevronDown,
  Mail,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import Footer from "../components/layout/Footer";

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
    a: "Yes. ExpenseAI is optimized for INR, USD, EUR, GBP and more.",
  },
  {
    q: "Is this suitable for personal use?",
    a: "Yes — ExpenseAI is designed for individuals who want clarity without spreadsheets.",
  },
];

export default function ContactPage() {
  const userEmail = localStorage.getItem("userEmail") || "";

  const [form, setForm] = useState({
    name: "",
    email: userEmail,
    type: "demo",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
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
        message: "",
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-40 pb-32">
      <div className="max-w-6xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">
            How can we help?
          </h1>
          <p className="mt-4 text-foreground/70">
            Answers to common questions and direct support when you need it.
          </p>
        </div>

        {/* FAQ + FORM */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* FAQ SECTION */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="text-primary" />
              <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    className="glass bg-card rounded-2xl border border-white/10"
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="font-medium">{faq.q}</span>
                      <ChevronDown
                        className={`transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {open && (
                      <div className="px-5 pb-5 text-sm text-foreground/70 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUPPORT FORM */}
          <div className="glass bg-card rounded-3xl p-8 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-primary" />
              <h2 className="text-2xl font-semibold">Contact support</h2>
            </div>

            <p className="text-sm text-foreground/70 mb-6">
              Submit your request and we’ll get back to you shortly.
            </p>

            {success && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-500/10 text-green-400 px-4 py-3 text-sm">
                <ShieldCheck size={18} />
                Your request has been sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full rounded-xl bg-transparent border border-white/15 px-4 py-3 focus:outline-none focus:border-primary"
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-transparent border border-white/15 px-4 py-3 focus:outline-none focus:border-primary"
              />

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl bg-transparent border border-white/15 px-4 py-3 focus:outline-none focus:border-primary"
              >
                <option value="demo">Need a demo</option>
                <option value="payment">Payment issue</option>
                <option value="bug">Bug / problem</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your issue or request..."
                className="w-full rounded-xl bg-transparent border border-white/15 px-4 py-3 focus:outline-none focus:border-primary"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 rounded-xl bg-primary text-white py-3 font-medium transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Submit request"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
