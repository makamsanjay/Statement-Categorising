/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        card: "var(--card)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        foreground: "var(--fg)",
      },
    },
  },
  plugins: [],
};
