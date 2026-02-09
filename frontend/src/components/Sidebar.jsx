import "./Sidebar.css";

function Sidebar({ activeView, onNavigate }) {
  // helper to navigate + close sidebar on mobile
  const handleNavigate = (view) => {
    onNavigate(view);
    document.body.classList.remove("sidebar-open");
  };

  return (
    <>
      {/* BACKDROP (mobile only via CSS) */}
      <div
        className="sidebar-backdrop"
        onClick={() => document.body.classList.remove("sidebar-open")}
      />

      <aside className="sidebar">
        {/* BRAND */}
        <div className="sidebar-logo">
          <span className="brand-spend">Spend</span>
          <span className="brand-switch">Switch</span>
        </div>

        {/* PRIMARY ACTION */}
        <button
          className="upload-cta"
          onClick={() => handleNavigate("upload")}
        >
          Upload +
        </button>

        {/* NAV */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavigate("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={`sidebar-item ${activeView === "transactions" ? "active" : ""}`}
            onClick={() => handleNavigate("transactions")}
          >
            Transactions
          </button>

          <button
            className={`sidebar-item ${activeView === "budget" ? "active" : ""}`}
            onClick={() => handleNavigate("budget")}
          >
            Monthly Budgets
          </button>

          <button
            className={`sidebar-item ${activeView === "health" ? "active" : ""}`}
            onClick={() => handleNavigate("health")}
          >
            Health Score
          </button>

          <button
            className={`sidebar-item ${activeView === "analytics" ? "active" : ""}`}
            onClick={() => handleNavigate("analytics")}
          >
            Analytics
          </button>

          <button
            className={`sidebar-item ${activeView === "card-suggestions" ? "active" : ""}`}
            onClick={() => handleNavigate("card-suggestions")}
          >
            Card Suggestions
          </button>

          <div className="sidebar-divider" />

          <button
            className={`sidebar-item ${activeView === "help" ? "active" : ""}`}
            onClick={() => handleNavigate("help")}
          >
            Help
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
