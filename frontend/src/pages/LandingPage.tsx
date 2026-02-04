import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import HowItWorks from "../components/sections/HowItWorks";
import TryNow from "../components/sections/TryNow";
import AIInsights from "../components/sections/AIInsights";
import TrustSecurity from "../components/sections/TrustSecurity";
import FooterCTA from "../components/sections/FooterCTA";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <TryNow />
        <AIInsights />
        <TrustSecurity />
        <FooterCTA />
      </main>
    </>
  );
}
