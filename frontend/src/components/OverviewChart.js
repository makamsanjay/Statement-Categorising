import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function OverviewChart({ data }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <XAxis dataKey="category" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="total" />
    </BarChart>
  );
}
