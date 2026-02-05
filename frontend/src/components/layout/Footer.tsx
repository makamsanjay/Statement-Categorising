import { Mail, Youtube, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="mt-32 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* BRAND */}
        <div>
          <h3 className="text-lg font-semibold">
            Expense<span className="text-primary">AI</span>
          </h3>
          <p className="mt-3 text-sm text-foreground/60 max-w-sm">
            Understand your spending.  
            Make smarter decisions without effort.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <h4 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
            Pages
          </h4>

          <ul className="mt-4 space-y-3 text-sm text-foreground/60">
            <li>
              <button
                onClick={() => navigate("/pricing")}
                className="hover:text-primary transition"
              >
                Pricing
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate("/help")}
                className="hover:text-primary transition"
              >
                Help
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate("/contact")}
                className="hover:text-primary transition"
              >
                Contact us
              </button>
            </li>
          </ul>
        </div>

        {/* CONNECT */}
        <div>
          <h4 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
            Connect
          </h4>

          <ul className="mt-4 space-y-4 text-sm text-foreground/60">
            <li className="flex items-center gap-3">
              <Mail size={16} />
              <a
                href="mailto:support@expenseai.com"
                className="hover:text-primary transition"
              >
                support@expenseai.com
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Youtube size={16} />
              <a
                href="#"
                className="hover:text-primary transition"
              >
                YouTube
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Instagram size={16} />
              <a
                href="#"
                className="hover:text-primary transition"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10 py-6 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} Expense AI. All rights reserved.
      </div>
    </footer>
  );
}
