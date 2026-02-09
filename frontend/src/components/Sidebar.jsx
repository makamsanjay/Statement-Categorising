import "./Sidebar.css";

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="sidebar-logo">
        <span className="brand-spend">Spend</span>
        <span className="brand-switch">Switch</span>
      </div>

      {/* PRIMARY ACTION */}
      <button
        className="upload-cta"
        onClick={() => onNavigate("upload")}
      >
        Upload +
      </button>

      {/* NAV */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${activeView === "dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={`sidebar-item ${activeView === "transactions" ? "active" : ""}`}
          onClick={() => onNavigate("transactions")}
        >
          Transactions
        </button>

        <button
          className={`sidebar-item ${activeView === "budget" ? "active" : ""}`}
          onClick={() => onNavigate("budget")}
        >
          Monthly Budgets
        </button>

        <button
          className={`sidebar-item ${activeView === "health" ? "active" : ""}`}
          onClick={() => onNavigate("health")}
        >
          Health Score
        </button>

        <button
          className={`sidebar-item ${activeView === "analytics" ? "active" : ""}`}
          onClick={() => onNavigate("analytics")}
        >
          Analytics
        </button>

        <button
          className={`sidebar-item ${activeView === "card-suggestions" ? "active" : ""}`}
          onClick={() => onNavigate("card-suggestions")}
        >
          Card Suggestions
        </button>

        <div className="sidebar-divider" />

        <button
          className={`sidebar-item ${activeView === "help" ? "active" : ""}`}
          onClick={() => onNavigate("help")}
        >
          Help
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
