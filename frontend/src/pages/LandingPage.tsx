import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import HowItWorks from "../components/sections/HowItWorks";
import TryNow from "../components/sections/TryNow";
import AIInsights from "../components/sections/AIInsights";
import TrustSecurity from "../components/sections/TrustSecurity";
import Footer from "../components/layout/Footer";
import WhyChooseUs from "../components/sections/WhyChooseUs";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <TryNow />
        <AIInsights />
        <WhyChooseUs />
        <TrustSecurity />
         <Footer />
      </main>
    </>
  );
}
