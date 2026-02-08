import Navbar from "./Navbar";
import Footer from "./Footer";
import "./LegalPages.css";

export default function TermsOfService() {
  return (
    <>
      <Navbar />

      <main className="legal-page">
        <div className="legal-container">
          <h1>Terms of Service</h1>

          <p className="legal-meta">
            Last Updated: January 2026<br />
            Effective Date: January 2026
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using SpendSwitch ("we", "our", or "us"), you agree to
            be bound by these Terms of Service. If you do not agree to these
            terms, you must not use the SpendSwitch website or services.
          </p>

          <h2>2. Description of the Service</h2>
          <p>
            SpendSwitch is a financial analysis platform designed to help users
            understand spending behavior by analyzing uploaded transaction data
            such as bank statements and expense files.
          </p>

          <h3>What SpendSwitch Provides</h3>
          <ul>
            <li>Expense extraction from uploaded files (PDF, CSV, XLS, XLSX)</li>
            <li>Automatic categorization and sub-categorization of transactions</li>
            <li>Spending summaries, insights, and analytics</li>
            <li>Multi-card spending analysis (plan-dependent)</li>
            <li>Card reward and optimization suggestions (plan-dependent)</li>
          </ul>

          <h3>What SpendSwitch Does Not Provide</h3>
          <ul>
            <li>Personalized financial, investment, tax, or legal advice</li>
            <li>Credit counseling or debt management services</li>
            <li>Banking services or transaction execution</li>
            <li>Guarantees of savings, rewards, or financial outcomes</li>
          </ul>

          <h2>3. Financial Disclaimer</h2>
          <p>
            SpendSwitch provides informational tools only. Any insights,
            calculations, scores, or suggestions are based on the data you
            provide and general analytical methods.
          </p>

          <p>
            You acknowledge that all financial decisions remain your sole
            responsibility. You should consult qualified financial
            professionals before making significant financial decisions.
          </p>

          <h2>4. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate and lawful information</li>
            <li>Use the service only for personal or authorized purposes</li>
            <li>Not misuse, reverse engineer, or interfere with the platform</li>
            <li>Not upload malicious, misleading, or unlawful content</li>
          </ul>

          <h2>5. Data Processing and Privacy</h2>
          <p>
            SpendSwitch processes uploaded financial data solely to generate
            requested insights. We do not access bank accounts, initiate
            transactions, or move funds.
          </p>

          <p>
            Data handling, retention, and security practices are detailed in our
            <strong> Privacy Policy</strong>, which forms part of these Terms.
          </p>

          <h2>6. Third-Party Services</h2>
          <p>
            SpendSwitch may rely on third-party services for hosting,
            authentication, analytics, and automated categorization. These
            providers process data only as necessary to operate the service.
          </p>

          <p>
            We are not responsible for the availability, performance, or actions
            of third-party services.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            All software, designs, branding, content, and analytics systems used
            by SpendSwitch are owned by us or our licensors and protected by
            intellectual property laws.
          </p>

          <p>
            You retain ownership of your uploaded data. By using the service,
            you grant SpendSwitch a limited, non-exclusive license to process
            this data solely to provide the service.
          </p>

          <h2>8. Account Access and Termination</h2>
          <p>
            You may stop using SpendSwitch at any time. We reserve the right to
            suspend or terminate access if these Terms are violated or if the
            service is misused.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, SpendSwitch shall not be
            liable for:
          </p>
          <ul>
            <li>Financial losses or missed opportunities</li>
            <li>Decisions made based on insights or analytics</li>
            <li>Data inaccuracies caused by incomplete or incorrect uploads</li>
            <li>Temporary service interruptions or technical issues</li>
          </ul>

          <p>
            Our total liability, if any, shall not exceed the amount paid by you
            for the service during the twelve months prior to the claim.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless SpendSwitch from any claims,
            damages, or losses arising from your use of the service or violation
            of these Terms.
          </p>

          <h2>11. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the
            service after changes become effective constitutes acceptance of
            the updated Terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by applicable laws of the jurisdiction in
            which SpendSwitch operates, without regard to conflict-of-law rules.
          </p>

          <h2>13. Contact</h2>
          <p>
            For questions regarding these Terms, please contact us through the
            support options available on our website.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
