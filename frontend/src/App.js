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

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");

  /* ===========================
     LOAD DATA
  ============================ */
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

  /* ===========================
     UPLOAD
  ============================ */
  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    const isPDF = file.type === "application/pdf";

    try {
      if (isPDF) {
        const data = await previewUpload(file);
        setPreview(data.map(t => ({ ...t, selected: true })));
        setShowPreview(true);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      await fetch("http://localhost:5050/upload", {
        method: "POST",
        body: formData
      });

      setFile(null);
      fetchTransactions();
      loadSummary();
      alert("File uploaded successfully");

    } catch (err) {
      alert(err.message || "Upload failed");
    }
  };

  /* ===========================
     PREVIEW CONFIRM
  ============================ */
  const handleConfirm = async () => {
    const selected = preview.filter(t => t.selected);
    if (!selected.length) return alert("No transactions selected");

    await saveConfirmedTransactions(selected);

    setPreview([]);
    setShowPreview(false);
    setFile(null);

    fetchTransactions();
    loadSummary();
  };

  /* ===========================
     EDIT MODE SELECTION
  ============================ */
  const toggleTxnSelection = (id) => {
    setSelectedTxns(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedTxns(transactions.map(t => t._id));
    } else {
      setSelectedTxns([]);
    }
  };

  /* ===========================
     BULK UPDATE
  ============================ */
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

  /* ===========================
     BULK DELETE
  ============================ */
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

  /* ===========================
     CHART
  ============================ */
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

      {/* Upload */}
      <input
        type="file"
        accept=".csv,.xls,.xlsx,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>
        {file?.type === "application/pdf" ? "Preview PDF" : "Upload File"}
      </button>

      {/* Preview */}
      {showPreview && (
        <>
          <h3>Preview Transactions (Editable)</h3>
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

      {/* Summary */}
      {summary && (
        <>
          <h3>Financial Summary</h3>
          <p><b>Total Income:</b> ${summary.income}</p>
          <p><b>Total Expense:</b> ${summary.expense}</p>

          {chartData && (
            <div style={{ width: "450px", height: "450px" }}>
              <Pie data={chartData} />
            </div>
          )}
        </>
      )}

      {/* Edit Mode */}
      <h3>Transactions</h3>

      <button
        onClick={() => {
          setEditMode(!editMode);
          setSelectedTxns([]);
        }}
      >
        {editMode ? "Cancel" : "Update / Delete"}
      </button>

      {editMode && (
        <>
          <div style={{ margin: "10px 0" }}>
            <input
              type="checkbox"
              checked={selectedTxns.length === transactions.length && transactions.length > 0}
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
