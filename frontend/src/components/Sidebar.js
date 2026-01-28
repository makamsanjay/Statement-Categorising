import "./Sidebar.css";

function Sidebar({ onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
         FinTrack
      </div>

      <nav className="sidebar-nav">
        <button
          className="sidebar-item"
          onClick={() => onNavigate("dashboard")}
        >
          Dashboard
        </button>

        <button
          className="sidebar-item"
          onClick={() => onNavigate("transactions")}
        >
          Transactions
        </button>

        <button
          className="sidebar-item"
          onClick={() => onNavigate("budget")}
        >
          Monthly Budgets
        </button>

        <button
          className="sidebar-item"
          onClick={() => onNavigate("upload")}
        >
          Upload / Preview
        </button>

        <button
          className="sidebar-item"
          onClick={() => onNavigate("health")}
        >
          Health Score
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
