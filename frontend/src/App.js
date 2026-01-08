import { useEffect, useState } from "react";
import {
  previewUpload,
  getTransactions,
  fetchSummary,
  updateCategory,
  saveConfirmedTransactions
} from "./api";

import { Pie } from "react-chartjs-2";
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

const fixAmountSign = (amount, type) => {
  const abs = Math.abs(amount);
  return type === "income" ? abs : -abs;
};

function App() {
  const [files, setFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");

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
    if (!files.length) {
      alert("Select file(s)");
      return;
    }

    let pdfPreview = [];
    let skippedMessages = [];

    for (const file of files) {
      try {
        if (file.type === "application/pdf") {
          const data = await previewUpload(file);
          pdfPreview.push(...data.map(t => ({ ...t, selected: true })));
        } else {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("http://localhost:5050/upload", {
            method: "POST",
            body: formData
          });

          const data = await res.json();

          if (!res.ok) {
            skippedMessages.push(`${file.name}: ${data.error || "Upload failed"}`);
          }

          if (data.skippedFiles?.length) {
            data.skippedFiles.forEach(f =>
              skippedMessages.push(`${f.file}: ${f.reason}`)
            );
          }
        }
      } catch (err) {
        skippedMessages.push(`${file.name}: ${err.message}`);
      }
    }

    if (pdfPreview.length) {
      setPreview(pdfPreview);
      setShowPreview(true);
    }

    if (skippedMessages.length) {
      alert(
        "Some files were skipped:\n\n" +
        skippedMessages.map(m => `• ${m}`).join("\n")
      );
    }

    setFiles([]);
    fetchTransactions();
    loadSummary();
  };

  const handleConfirm = async () => {
    const selected = preview.filter(t => t.selected);
    if (!selected.length) {
      alert("No transactions selected");
      return;
    }

    await saveConfirmedTransactions(selected);

    setPreview([]);
    setShowPreview(false);

    fetchTransactions();
    loadSummary();
  };

  const toggleTxnSelection = (id) => {
    setSelectedTxns(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    setSelectedTxns(
      checked ? transactions.map(t => t._id) : []
    );
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory || !selectedTxns.length) {
      alert("Select category and transactions");
      return;
    }

    for (const id of selectedTxns) {
      await updateCategory(id, bulkCategory);
    }

    setSelectedTxns([]);
    setBulkCategory("");
    setEditMode(false);
    fetchTransactions();
    loadSummary();
  };

  const handleBulkDelete = async () => {
    if (!selectedTxns.length) return;

    if (!window.confirm("Delete selected transactions permanently?")) return;

    await fetch("http://localhost:5050/transactions/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedTxns })
    });

    setSelectedTxns([]);
    setEditMode(false);
    fetchTransactions();
    loadSummary();
  };

  const chartData =
    summary?.categories
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
                "#FF9F40"
              ]
            }
          ]
        }
      : null;

  return (
    <div className="container">
      <h2>Statement Categorizing</h2>

      <input
        type="file"
        multiple
        accept=".csv,.xls,.xlsx,.pdf"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button onClick={handleUpload}>
        Upload / Preview
      </button>

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
                <th>Type</th>
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
                  <td>
                    <input
                      value={t.description}
                      onChange={(e) => {
                        const copy = [...preview];
                        copy[i].description = e.target.value;
                        setPreview(copy);
                      }}
                    />
                  </td>
                  <td>{t.amount}</td>
                  <td>
                    <label>
                      <input
                        type="radio"
                        name={`amt-${i}`}
                        checked={t.amount > 0}
                        onChange={() => {
                          const copy = [...preview];
                          copy[i].amount = fixAmountSign(copy[i].amount, "income");
                          setPreview(copy);
                        }}
                      /> Income
                    </label>
                    <label style={{ marginLeft: 10 }}>
                      <input
                        type="radio"
                        name={`amt-${i}`}
                        checked={t.amount < 0}
                        onChange={() => {
                          const copy = [...preview];
                          copy[i].amount = fixAmountSign(copy[i].amount, "expense");
                          setPreview(copy);
                        }}
                      /> Expense
                    </label>
                  </td>
                  <td>
                    <select
                      value={t.category}
                      onChange={(e) => {
                        const copy = [...preview];
                        copy[i].category = e.target.value;
                        setPreview(copy);
                      }}
                    >
                      {CATEGORIES.map(c => (
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

      {summary && (
        <>
          <h3>Financial Summary</h3>
          <p><b>Total Income:</b> ${summary.income}</p>
          <p><b>Total Expense:</b> ${summary.expense}</p>

          {chartData && (
            <div style={{ width: 450, height: 450 }}>
              <Pie data={chartData} />
            </div>
          )}
        </>
      )}

      <h3>Transactions</h3>

      <button onClick={() => {
        setEditMode(!editMode);
        setSelectedTxns([]);
      }}>
        {editMode ? "Cancel" : "Update / Delete"}
      </button>

      {editMode && (
        <>
          <div>
            <input
              type="checkbox"
              checked={selectedTxns.length === transactions.length}
              onChange={(e) => toggleSelectAll(e.target.checked)}
            /> Select All
          </div>

          <select
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button onClick={handleBulkUpdate}>Update Selected</button>
          <button onClick={handleBulkDelete}>Delete Selected</button>
        </>
      )}

      <table>
        <thead>
          <tr>
            {editMode && <th>Select</th>}
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id}>
              {editMode && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTxns.includes(t._id)}
                    onChange={() => toggleTxnSelection(t._id)}
                  />
                </td>
              )}
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
