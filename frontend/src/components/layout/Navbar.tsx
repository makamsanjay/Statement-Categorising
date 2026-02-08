import { motion as _motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const motion = _motion as any;

export default function Navbar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [scrolled, setScrolled] = useState(false);

  // Initialize theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
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
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-40"
    >
      <div
        className={`
          flex items-center gap-5 px-6 py-3 rounded-2xl shadow-lg
          transition-all duration-300
          bg-card border border-white/10 backdrop-blur-xl
          ${scrolled ? "opacity-20 dark:opacity-25" : "opacity-100"}
        `}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="font-semibold text-lg hover:opacity-90 transition"
        >
          Spend<span className="text-primary">Switch</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-foreground/10" />

        {/* Nav links */}
        <button
          onClick={() => navigate("/pricing")}
          className="text-sm hover:text-primary transition"
        >
          Pricing
        </button>

        <button
          onClick={() => navigate("/help")}
          className="text-sm hover:text-primary transition"
        >
          Help
        </button>

        <button
          onClick={() => navigate("/login")}
          className="text-sm hover:text-primary transition"
        >
          Login
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="text-sm hover:text-primary transition"
        >
          Sign up
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-foreground/10" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-foreground/10 transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </motion.nav>
  );
}
