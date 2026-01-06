import { useEffect, useState } from "react";
import { uploadCSV, getTransactions, fetchSummary } from "./api";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const loadSummary = async () => {
    const data = await fetchSummary();
    setSummary(data);
  };

  useEffect(() => {
    fetchTransactions();
    loadSummary();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert("Select a CSV file");
      return;
    }

    try {
      await uploadCSV(file);
      fetchTransactions();
      loadSummary();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console.");
    }
  };

  const chartData = summary
    ? {
        labels: Object.keys(summary.categories),
        datasets: [
          {
            data: Object.values(summary.categories),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#8AFFC1",
              "#9966FF",
              "#FF9F40",
            ],
          },
        ],
      }
    : null;

  return (
    <div className="container">
      <h2>Statement Categorising</h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload CSV</button>

      {summary && (
        <>
          <h3>Financial Summary</h3>
          <p><b>Total Income:</b> ${summary.income}</p>
          <p><b>Total Expense:</b> ${summary.expense}</p>

          <div style={{ width: "400px", height: "400px" }}>
            <Pie
              data={chartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </>
      )}

      <h3>Transactions</h3>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.amount}</td>
              <td>{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
