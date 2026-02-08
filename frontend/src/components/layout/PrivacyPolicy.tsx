import Footer from "./Footer";
import Navbar from "./Navbar";
import "./LegalPages.css"

export default function PrivacyPolicy() {
  return (
    <>
        <Navbar />
    <main className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>

        <p className="legal-meta">
          Last Updated: January 2026<br />
          Effective Date: January 2026
        </p>

        <h2>1. Introduction</h2>
        <p>
          SpendSwitch ("we", "our", or "us") is committed to protecting your
          privacy. This Privacy Policy explains how we collect, use, and
          safeguard information when you use the SpendSwitch website and
          services.
        </p>
    

    <h2>2. Information We Collect</h2>
    <h3>2.1 Information You Provide</h3>
    <ul>
      <li>Account information such as name and email address</li>
      <li>Bank statements or transaction files you upload</li>
      <li>Messages sent through support or contact forms</li>
    </ul>

    <h3>2.2 Information Collected Automatically</h3>
    <ul>
      <li>Usage data such as pages viewed and features used</li>
      <li>Device and browser information</li>
      <li>Cookies required for authentication and preferences</li>
    </ul>

    <h2>3. Financial Data Processing</h2>
    <p>
      SpendSwitch processes financial data only to provide expense analysis and
      spending insights. We do not access bank accounts, initiate transactions,
      or move money on your behalf.
    </p>

    <h2>4. Third-Party Services</h2>
    <p>
      Some transaction data may be processed by trusted third-party services to
      enable automated categorization and analysis. Data is processed only for
      providing requested insights and is not used for advertising.
    </p>

    <h2>5. How We Use Information</h2>
    <ul>
      <li>To analyze and categorize expenses</li>
      <li>To generate spending insights and summaries</li>
      <li>To improve service performance and accuracy</li>
      <li>To respond to support requests</li>
      <li>To comply with legal obligations</li>
    </ul>

    <h2>6. Data Retention</h2>
    <p>
      Financial data is processed temporarily and not retained longer than
      necessary. Account information is retained while your account is active or
      as required by law.
    </p>

    <h2>7. Data Sharing</h2>
    <p>
      We do not sell personal or financial data. Information may be shared only
      with service providers required to operate the platform or when legally
      required.
    </p>

    <h2>8. Security</h2>
    <p>
      We use reasonable technical and organizational safeguards, including
      encrypted connections and access controls, to protect your data.
    </p>

    <h2>9. Your Rights</h2>
    <p>
      Depending on your location, you may have rights to access, correct, or
      delete your personal data. Requests can be made through our support
      channels.
    </p>

    <h2>10. Cookies</h2>
    <p>
      Cookies are used for essential functionality and analytics. You can manage
      cookies through your browser settings.
    </p>

    <h2>11. Children’s Privacy</h2>
    <p>
      SpendSwitch is not intended for individuals under 18 years of age. We do
      not knowingly collect personal data from children.
    </p>

    <h2>12. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy periodically. Continued use of the
      service indicates acceptance of the updated policy.
    </p>

    <h2>13. Contact</h2>
    <p>
      For privacy-related questions, please contact us through the support
      options available on our website.
    </p>

  </div>

      <Footer />
    </main>
    </>
  );
}
