import Navbar from "./Navbar";
import Footer from "./Footer";
import "./LegalPages.css";

export default function DataSecurity() {
  return (
    <>
      <Navbar />

      <main className="legal-page">
        <div className="legal-container">
          <h1>Data Security & Storage</h1>

          <p className="legal-meta">
            Last Updated: January 2026<br />
            Effective Date: January 2026
          </p>

          <p>
            At SpendSwitch, protecting your financial data is fundamental to how
            we design and operate our platform. We intentionally limit what data
            we collect, how long it exists, and who can access it.
          </p>

          <h2>1. How We Handle Financial Data</h2>

          <h3>1.1 Temporary Processing Model</h3>
          <p>
            SpendSwitch follows a strict temporary processing approach:
          </p>
          <ul>
            <li>Uploaded files are processed in memory only</li>
            <li>Transactions are analyzed to generate insights</li>
            <li>Raw financial data is deleted immediately after processing</li>
          </ul>

          <p>
            We do not store raw bank statements, transaction files, or original
            uploads once analysis is complete.
          </p>

          <h3>1.2 Data We Never Store</h3>
          <ul>
            <li>Original bank statement files</li>
            <li>Complete account numbers or credentials</li>
            <li>Online banking usernames or passwords</li>
            <li>Government-issued identifiers</li>
            <li>Payment authorization details</li>
          </ul>

          <h3>1.3 Data We Do Store</h3>
          <ul>
            <li>Basic account information (name, email)</li>
            <li>User preferences and settings</li>
            <li>Generated summaries and analytical results</li>
            <li>Anonymized, aggregated usage statistics</li>
          </ul>

          <h2>2. Encryption and Infrastructure Security</h2>

          <h3>2.1 Data in Transit</h3>
          <ul>
            <li>All connections use HTTPS encryption</li>
            <li>Secure TLS protocols managed by our hosting provider</li>
            <li>Encrypted API communication with external services</li>
          </ul>

          <h3>2.2 Data at Rest</h3>
          <ul>
            <li>No persistent storage of raw financial data</li>
            <li>Stored user data protected using encrypted databases</li>
            <li>Authentication data secured by our identity provider</li>
          </ul>

          <h3>2.3 Hosting and Platform Security</h3>
          <ul>
            <li>Enterprise-grade cloud infrastructure</li>
            <li>Automatic security headers and DDoS protection</li>
            <li>Continuous platform monitoring and updates</li>
          </ul>

          <h2>3. Third-Party Services</h2>

          <h3>3.1 Authentication</h3>
          <p>
            User authentication and account security are handled by a trusted
            third-party identity provider using modern security standards,
            including optional multi-factor authentication.
          </p>

          <h3>3.2 AI Processing</h3>
          <p>
            To provide automated categorization and insights, transaction data
            may be temporarily processed by external AI services. This processing:
          </p>
          <ul>
            <li>Occurs over encrypted connections</li>
            <li>Is limited to the data required for analysis</li>
            <li>Is not used for advertising or profiling</li>
            <li>Is not permanently stored by SpendSwitch</li>
          </ul>

          <h3>3.3 Hosting</h3>
          <p>
            SpendSwitch is hosted on a secure, enterprise cloud platform that
            provides automatic encryption, network security, and operational
            safeguards.
          </p>

          <h2>4. Compliance and Privacy Principles</h2>
          <ul>
            <li>Data minimization by design</li>
            <li>No sale or monetization of user data</li>
            <li>Alignment with major privacy regulations (GDPR, CCPA)</li>
            <li>Read-only analysis with no transaction capability</li>
          </ul>

          <h2>5. Access Controls</h2>
          <p>
            Access to data is strictly limited:
          </p>
          <ul>
            <li>You have full control over your account</li>
            <li>Automated systems access data only during analysis</li>
            <li>Support staff access data only with user permission</li>
            <li>No access for marketing or advertising purposes</li>
          </ul>

          <h2>6. Monitoring and Incident Handling</h2>
          <p>
            We rely on platform-level monitoring and established security
            practices to detect and respond to potential issues. Because raw
            financial data is not stored, potential exposure is significantly
            limited.
          </p>

          <h2>7. Your Role in Security</h2>
          <p>
            You can help keep your account secure by:
          </p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Enabling multi-factor authentication</li>
            <li>Keeping your devices and browsers updated</li>
            <li>Logging out from shared or public devices</li>
          </ul>

          <h2>8. Transparency and Questions</h2>
          <p>
            We believe security should be understandable, not hidden. If you
            have questions about our data handling or security practices, please
            contact us through our support channels.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
