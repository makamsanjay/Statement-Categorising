import "./HealthPage.css";

function HealthPage({ health }) {
  if (!health) {
    return <p className="health-loading">Loading health score...</p>;
  }

  const scoreColor =
    health.score >= 75
      ? "health-good"
      : health.score >= 50
      ? "health-warn"
      : "health-bad";

  return (
    <div className="health-page">
      <div className="health-card">
        {/* HEADER */}
        <div className="health-header">
          <h2>Expense Health Score</h2>

          <div className="health-info">
            ⓘ
            <div className="health-tooltip">
              This score is calculated based on your transaction
              patterns and insights generated from your data.
            </div>
          </div>
        </div>

        {/* SCORE */}
        <div className={`health-score ${scoreColor}`}>
          <span className="health-score-value">
            {health.score}
            <span className="health-score-max">/100</span>
          </span>
        </div>

        {/* INSIGHTS */}
        <div className="health-insights">
          <h4>Insights</h4>

          {health.insights?.length ? (
            <ul>
              {health.insights.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          ) : (
            <p className="health-muted">
              No insights available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HealthPage;
