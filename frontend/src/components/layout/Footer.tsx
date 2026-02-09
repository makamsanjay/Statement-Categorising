import { Mail, Youtube, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="mt-32 border-t border-foreground/10">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* BRAND */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold">
            Spend<span className="text-primary">Switch</span>
          </h3>
          <p className="mt-3 text-sm text-foreground/60 max-w-sm leading-relaxed">
            Understand your spending.  
            Make smarter financial decisions without effort.
          </p>
        </div>

        {/* PRODUCT */}
        <div>
          <h4 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
            Product
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
                Help & Support
              </button>
            </li>
             <li>
              <button
                onClick={() => navigate("/help")}
                className="hover:text-primary transition"
              >
                FAQ
              </button>
            </li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
            Legal
          </h4>

          <ul className="mt-4 space-y-3 text-sm text-foreground/60">
            <li>
              <button
                onClick={() => navigate("/privacy-policy")}
                className="hover:text-primary transition"
              >
                Privacy Policy
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate("/terms")}
                className="hover:text-primary transition"
              >
                Terms of Service
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate("/data-security")}
                className="hover:text-primary transition"
              >
                Data Security
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
                href="mailto:makam.sc9885@gmail.com"
                className="hover:text-primary transition"
              >
                makam.sc9885@gmail.com
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Youtube size={16} />
              <a
                href="https://www.youtube.com/@sanjaymakam"
                className="hover:text-primary transition"
              >
                YouTube
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Instagram size={16} />
              <a
                href="https://www.instagram.com/sanjaymakam.20/"
                className="hover:text-primary transition"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-foreground/10 py-6 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} SpendSwitch. All rights reserved.
      </div>
    </footer>
  );
}
