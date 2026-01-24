import "./Sidebar.css";

function Sidebar() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        💰 FinTrack
      </div>

      <nav className="sidebar-nav">
        <button onClick={() => scrollTo("upload-section")}>
          Upload / Preview
        </button>

        <button onClick={() => scrollTo("transactions-section")}>
          Transactions
        </button>

        <button onClick={() => scrollTo("analytics-section")}>
          Analytics
        </button>

        <button onClick={() => scrollTo("budgets-section")}>
          Monthly Budgets
        </button>

        <button onClick={() => scrollTo("health-section")}>
          Health Score
        </button>

        <button onClick={() => scrollTo("help-section")}>
          Help
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
