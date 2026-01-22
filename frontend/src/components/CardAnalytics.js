import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function CardAnalytics({ card, data }) {
  const chartData = Object.entries(data || {}).map(([k, v]) => ({
    category: k,
    total: v
  }));

  return (
    <div>
      <h3>{card.name}</h3>
      <p>Budget: {card.monthly_budget}</p>
      <p>Spent: {card.spent}</p>
      <p>Health Score: {card.healthScore}</p>

      <BarChart width={400} height={200} data={chartData}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>
    </div>
  );
}
