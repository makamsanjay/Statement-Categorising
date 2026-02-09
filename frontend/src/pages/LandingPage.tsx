import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import HowItWorks from "../components/sections/HowItWorks";
import TryNow from "../components/sections/TryNow";
import AIInsights from "../components/sections/AIInsights";
import TrustSecurity from "../components/sections/TrustSecurity";
import Footer from "../components/layout/Footer";
import WhyChooseUs from "../components/sections/WhyChooseUs";
import CookieConsent from "../components/CookieConsent";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <CookieConsent />
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <TryNow />
        <WhyChooseUs />
        <AIInsights />
        <TrustSecurity />
        <Footer />
      </main>
    </div>
  );
}
