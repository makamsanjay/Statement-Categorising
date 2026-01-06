import { useEffect, useState } from "react";
import {
  previewUpload,
  getTransactions,
  fetchSummary,
  updateCategory,
  saveConfirmedTransactions
} from "./api";

import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Education",
  "Income",
  "Taxes",
  "Transfers",
  "Subscriptions",
  "Other"
];

function App() {
  const [chartType, setChartType] = useState("pie");
  const [range, setRange] = useState("30d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

const resolveDateRange = () => {
  if (range === "custom") {
    if (!fromDate || !toDate) return null;

    return {
      from: new Date(fromDate).toISOString(),
      to: new Date(toDate).toISOString()
    };
  }

  const now = new Date();
  let from;

  if (range === "30d") {
    from = new Date();
    from.setDate(from.getDate() - 30);
  } else if (range === "ytd") {
    from = new Date(new Date().getFullYear(), 0, 1);
  } else if (range === "1y") {
    from = new Date();
    from.setFullYear(from.getFullYear() - 1);
  }

  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
};


  const loadSummary = async () => {
  const rangeData = resolveDateRange();

  if (!rangeData) {
    return;
  }

  const { from, to } = rangeData;
  const data = await fetchSummary(from, to);
  setSummary(data);
};


  useEffect(() => {
    fetchTransactions();
    loadSummary();
  }, []);

  useEffect(() => {
    loadSummary();
  }, [range, fromDate, toDate, chartType]);


  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    try {
      const data = await previewUpload(file);
      setPreview(data.map((t) => ({ ...t, selected: true })));
      setShowPreview(true);
    } catch (err) {
      alert(err.message || "Preview failed");
    }
  };

  const handleConfirm = async () => {
    const selected = preview.filter((t) => t.selected);
    if (!selected.length) return alert("No transactions selected");

    await saveConfirmedTransactions(selected);
    setPreview([]);
    setShowPreview(false);
    setFile(null);

    fetchTransactions();
    loadSummary();
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

  const Chart =
    chartType === "pie" ? Pie :
    chartType === "bar" ? Bar :
    Line;

  return (
    <div className="container">
      <h2>Statement Categorising</h2>

      <input
        type="file"
        accept=".csv,.xls,.xlsx,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>
      {showPreview && (
        <>
          <h3>Preview Transactions</h3>

          <table>
            <thead>
              <tr>
                <th>Include</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((t, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={() => {
                        const copy = [...preview];
                        copy[i].selected = !copy[i].selected;
                        setPreview(copy);
                      }}
                    />
                  </td>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.amount}</td>
                  <td>
                    <select
                      value={t.category}
                      onChange={(e) => {
                        const copy = [...preview];
                        copy[i].category = e.target.value;
                        setPreview(copy);
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleConfirm}>Confirm & Save</button>
        </>
      )}

      <h3>Visualization</h3>

      <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
        <option value="pie">Pie</option>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
      </select>

      <select value={range} onChange={(e) => setRange(e.target.value)}>
        <option value="30d">Last 30 Days</option>
        <option value="ytd">Year to Date</option>
        <option value="1y">Last Year</option>
        <option value="custom">Custom</option>
      </select>

      {range === "custom" && (
        <>
          <input type="date" onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" onChange={(e) => setToDate(e.target.value)} />
        </>
      )}

      {summary && chartData && (
        <>
          <p><b>Total Income:</b> ${summary.income}</p>
          <p><b>Total Expense:</b> ${summary.expense}</p>

          <div style={{ width: "450px", height: "450px" }}>
            <Chart data={chartData} options={{ responsive: true }} />
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
          {transactions.map((t) => (
            <tr key={t._id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.amount}</td>
              <td>
                <select
                  value={t.category}
                  onChange={async (e) => {
                    await updateCategory(t._id, e.target.value);
                    fetchTransactions();
                    loadSummary();
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
