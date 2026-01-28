import { useState, useRef } from "react";
import { previewUpload, saveConfirmedTransactions } from "../api";
import "./UploadPage.css";

const DEFAULT_CATEGORIES = [
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
  const abs = Math.abs(Number(amount));
  return type === "income" ? abs : -abs;
};

function UploadPage({ cards, activeCardIndex, refreshData }) {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const fileInputRef = useRef(null);

  /* =========================
     HANDLE UPLOAD / PREVIEW
     ========================= */
  const handleUpload = async () => {
    if (!files.length) {
      alert("Select file(s)");
      return;
    }

    let pdfPreview = [];
    let skippedMessages = [];

    for (const file of files) {
      if (file.type === "application/pdf") {
        try {
          const data = await previewUpload(file);

          const rows = data.transactions || [];

          pdfPreview.push(
            ...rows.map(t => ({
              ...t,
              selected: true
            }))
          );
        } catch (err) {
          skippedMessages.push(`${file.name}: ${err.message}`);
        }
      } else {
        skippedMessages.push(
          `${file.name}: Only PDF uploads are supported for preview`
        );
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
  };

  /* =========================
     CONFIRM & SAVE
     ========================= */
  const handleConfirm = async () => {
    const selected = preview.filter(t => t.selected);
    if (!selected.length) {
      alert("Select at least one transaction");
      return;
    }

    const card = cards?.[activeCardIndex];
    if (!card || !card._id) {
      alert("Please select a card before confirming upload");
      return;
    }

    const payload = selected.map(t => ({
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      category: t.category || "Other",
      cardId: card._id,
      currency: card.displayCurrency
    }));

    try {
      await saveConfirmedTransactions(payload);
    } catch (err) {
      alert(err.message || "Upload failed");
      return;
    }

    await refreshData();

    setPreview([]);
    setShowPreview(false);
  };

  /* =========================
     JSX
     ========================= */
  return (
    <div className="upload-page">
      <h2>Upload & Preview</h2>

      {/* ================= DROP ZONE ================= */}
      <div className="upload-zone">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xls,.xlsx,.pdf"
          onChange={(e) => setFiles([...e.target.files])}
        />

        <div
          className="upload-drop"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFiles([...e.dataTransfer.files]);
          }}
        >
          <div className="upload-icon">☁️</div>
          <h3>Drag & drop files here</h3>
          <p>
            or <span>click to upload</span>
          </p>
          <p className="upload-hint">PDF files supported</p>
        </div>

        <button
          type="button"
          className="upload-btn"
          onClick={handleUpload}
        >
          Upload & Preview
        </button>
      </div>

      {/* ================= PREVIEW ================= */}
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
                  {/* INCLUDE */}
                  <td>
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={() => {
                        setPreview(prev =>
                          prev.map((txn, idx) =>
                            idx === i
                              ? { ...txn, selected: !txn.selected }
                              : txn
                          )
                        );
                      }}
                    />
                  </td>

                  {/* DATE */}
                  <td>{t.date}</td>

                  {/* DESCRIPTION */}
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

                  {/* AMOUNT */}
                  <td>{t.amount}</td>

                  {/* TYPE */}
                  <td>
                    <label>
                      <input
                        type="radio"
                        name={`amt-${i}`}
                        checked={t.amount > 0}
                        onChange={() => {
                          const copy = [...preview];
                          copy[i].amount = fixAmountSign(
                            copy[i].amount,
                            "income"
                          );
                          setPreview(copy);
                        }}
                      />
                      Income
                    </label>

                    <label style={{ marginLeft: 10 }}>
                      <input
                        type="radio"
                        name={`amt-${i}`}
                        checked={t.amount < 0}
                        onChange={() => {
                          const copy = [...preview];
                          copy[i].amount = fixAmountSign(
                            copy[i].amount,
                            "expense"
                          );
                          setPreview(copy);
                        }}
                      />
                      Expense
                    </label>
                  </td>

                  {/* CATEGORY */}
                  <td>
                    <select
                      value={t.category || "Other"}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "__add_new__") {
                          const newCat = prompt("Enter new category name");
                          if (!newCat) return;

                          if (!categories.includes(newCat)) {
                            setCategories(prev => [...prev, newCat]);
                          }

                          const copy = [...preview];
                          copy[i].category = newCat;
                          setPreview(copy);
                          return;
                        }

                        const copy = [...preview];
                        copy[i].category = value;
                        setPreview(copy);
                      }}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__add_new__">➕ Add new category</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            className="upload-confirm-btn"
            onClick={handleConfirm}
          >
            Confirm & Save
          </button>
        </>
      )}
    </div>
  );
}

export default UploadPage;
