import { useState, useRef, useEffect } from "react";
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
  "Credit Card Payment",
  "Other"
];

const fixAmountSign = (amount, type) => {
  const abs = Math.abs(Number(amount));
  return type === "income" ? abs : -abs;
};

function UploadPage({ cards, activeCardIndex, refreshData }) {
const [preview, setPreview] = useState([]);
const [showPreview, setShowPreview] = useState(false);
const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
const [modal, setModal] = useState(null);
const [modalInput, setModalInput] = useState("");
const [toast, setToast] = useState(null);



useEffect(() => {
  setCategories(DEFAULT_CATEGORIES);
}, []);

const toastTimer = useRef(null);

const showToast = (message, duration = 8000) => {
  setToast(message);
  clearTimeout(toastTimer.current);
  toastTimer.current = setTimeout(() => setToast(null), duration);
};

  const fileInputRef = useRef(null);

  /* =========================
     HARD RESET FILE INPUT
     ========================= */
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFiles([]);
  };

  /* =========================
     HANDLE UPLOAD / PREVIEW
     ========================= */
  const handleUpload = async () => {
    const inputFiles = fileInputRef.current?.files
      ? Array.from(fileInputRef.current.files)
      : [];

    if (!inputFiles.length) {
      showToast("Select file(s)");
      return;
    }

    let pdfPreview = [];
    let skippedMessages = [];

    for (const file of inputFiles) {
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
      showToast(
        "Some files were skipped:\n\n" +
          skippedMessages.map(m => `• ${m}`).join("\n")
      );
    }

    // ✅ FULL RESET AFTER PREVIEW
    resetFileInput();
  };

  /* =========================
     CONFIRM & SAVE
     ========================= */
  const handleConfirm = async () => {
    const selected = preview.filter(t => t.selected);
    if (!selected.length) {
      showToast("Select at least one transaction");
      return;
    }

    const card = cards?.[activeCardIndex];
    if (!card || !card._id) {
      showToast("Please select a card before confirming upload");
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
      showToast(err.message || "Upload failed");
      return;
    }

    await refreshData();

    // ✅ FULL RESET AFTER SAVE
    setPreview([]);
    setShowPreview(false);
    resetFileInput();
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
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            setFiles(selectedFiles);
          }}
        />

        <div
          className="upload-drop"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFiles = Array.from(e.dataTransfer.files || []);
            setFiles(droppedFiles);
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

          {cards?.[activeCardIndex] && (
            <OriginalCardEditor
              card={cards[activeCardIndex]}
              onSaved={() => {}}
            />
          )}

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

                  <td>
                    <select
                      value={t.category || "Other"}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "__add_new__") {
  setModal({
    type: "input",
    title: "Add New Category",
    placeholder: "Category name",
    onSubmit: (name) => {
      const trimmed = name?.trim();
      if (!trimmed) {
        showToast("Category name cannot be empty.");
        return;
      }

      if (!categories.includes(trimmed)) {
        setCategories(prev => [...prev, trimmed]);
      }

      const copy = [...preview];
      copy[i].category = trimmed;
      setPreview(copy);

      setModal(null);
      setModalInput("");
    }
  });
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
                      <option value="__add_new__"> Add new category</option>
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

      {modal && (
  <div className="modal-backdrop">
    <div className="modal">
      <h3>{modal.title}</h3>

      {modal.type === "input" && (
        <input
          autoFocus
          placeholder={modal.placeholder}
          value={modalInput}
          onChange={(e) => setModalInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              modal.onSubmit(modalInput);
            }
          }}
        />
      )}

      <div className="modal-actions">
        <button onClick={() => setModal(null)}>Cancel</button>
        <button
          className="primary"
          onClick={() => modal.onSubmit(modalInput)}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

{toast && <div className="toast">{toast}</div>}

    </div>
  );
}

export default UploadPage;