function HealthPage({ health }) {
  if (!health) {
    return <p>Loading health score...</p>;
  }

  return (
    <div className="health-page">
      <h2>Expense Health Score</h2>

      <div
        style={{
          fontSize: "56px",
          fontWeight: "bold",
          color:
            health.score >= 75
              ? "green"
              : health.score >= 50
              ? "orange"
              : "red"
        }}
      >
        {health.score} / 100
      </div>

      <h4>Insights</h4>
      <ul>
        {health.insights?.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default HealthPage;
