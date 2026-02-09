import { motion as _motion } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const motion = _motion as any;

export default function Navbar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.remove("dark");
      setTheme("light");
    } else {
      root.classList.add("dark");
      setTheme("dark");
    }
  };

  return (
    <>
      {/* ===== DESKTOP NAV ===== */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:block fixed top-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div
          className={`
            flex items-center gap-5 px-6 py-3 rounded-2xl shadow-lg
            transition-all duration-300
            bg-card border border-white/10 backdrop-blur-xl
            ${scrolled ? "opacity-20 dark:opacity-25" : "opacity-100"}
          `}
        >
          <button
            onClick={() => navigate("/")}
            className="font-semibold text-lg hover:opacity-90 transition"
          >
            <span className="text-foreground">Spend</span>
            <span className="text-primary">Switch</span>
          </button>

          <div className="w-px h-5 bg-foreground/10" />

          <button onClick={() => navigate("/pricing")} className="text-sm hover:text-primary transition">
            Pricing
          </button>
          <button onClick={() => navigate("/help")} className="text-sm hover:text-primary transition">
            Help
          </button>
          <button onClick={() => navigate("/login")} className="text-sm hover:text-primary transition">
            Login
          </button>
          <button onClick={() => navigate("/signup")} className="text-sm hover:text-primary transition">
            Sign up
          </button>

          <div className="w-px h-5 bg-foreground/10" />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-foreground/10 transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* ===== MOBILE / TABLET NAV ===== */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-white/10 backdrop-blur-xl shadow-lg">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="font-semibold text-lg"
          >
            <span className="text-foreground">Spend</span>
            <span className="text-primary">Switch</span>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-foreground/10 transition"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-lg hover:bg-foreground/10 transition"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="mt-3 rounded-2xl bg-card border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
            {[
              ["Pricing", "/pricing"],
              ["Help", "/help"],
              ["Login", "/login"],
              ["Sign up", "/signup"],
            ].map(([label, path]) => (
              <button
                key={label}
                onClick={() => {
                  navigate(path);
                  setMobileOpen(false);
                }}
                className="block w-full text-left px-5 py-3 text-sm hover:bg-foreground/5 transition"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
