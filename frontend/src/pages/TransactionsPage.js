import { useEffect, useState, useMemo } from "react";
import {
  getCards,
  getTransactionsByCard,
  saveConfirmedTransactions,
  updateTransaction,
  createCard,
  renameCard,
  deleteCard
} from "../api";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./TransactionsPage.css";
import ExportModal from "../components/ExportModal";
import OriginalCardEditor from "../components/OriginalCardEditor";

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

const SYMBOL = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};

const setDraftAmount = (txn, absAmount, isExpense) => {
  const value = Math.abs(Number(absAmount) || 0);
  return isExpense ? -value : value;
};

const formatCardName = (card) =>
  card?.last4 ? `${card.name} (${card.last4})` : card?.name || "";

export default function TransactionsPage({ onRefresh }) {
const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
useEffect(() => {
  setCategories(DEFAULT_CATEGORIES);
}, []);

  const [cards, setCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  

  const [transactions, setTransactions] = useState([]);
  const [draftTxns, setDraftTxns] = useState([]);


  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [showExport, setShowExport] = useState(false);
const [pageError, setPageError] = useState("");
const [modal, setModal] = useState(null);
const [modalInput, setModalInput] = useState("");
const [toast, setToast] = useState(null);


  const [newTxn, setNewTxn] = useState({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    category: "Other",
    cardIndex: 0
  });

  const showToast = (message, duration = 8000) => {
  setToast(message);

  setTimeout(() => {
    setToast(null);
  }, duration);
};

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    getCards().then(setCards);
  }, []);

  useEffect(() => {
    if (!cards.length) return;

    getTransactionsByCard(cards[activeCardIndex]._id).then(data => {
      setTransactions(data);
      setDraftTxns(JSON.parse(JSON.stringify(data)));
    });
  }, [cards, activeCardIndex]);

  /* ---------------- HELPERS ---------------- */

  const toggleTxnSelection = (id) => {
    setSelectedTxns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    setSelectedTxns(checked ? draftTxns.map(t => t._id) : []);
  };

  const updateDraft = (id, field, value) => {
    setDraftTxns(prev =>
      prev.map(t =>
        t._id === id ? { ...t, [field]: value } : t
      )
    );
  };

const handleAddCategory = (setter, value) => {
  if (value !== "__add_new__") {
    setter(value);
    return;
  }

  setModal({
    type: "input",
    title: "Add New Category",
    placeholder: "Category name",
    onSubmit: (categoryName) => {
      if (!categoryName) return;

      setCategories(prev =>
        prev.includes(categoryName)
          ? prev
          : [...prev, categoryName]
      );

      setter(categoryName);
      setModal(null);
    }
  });
};

const calculateTotals = (transactions) => {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.amount > 0) income += t.amount;
    if (t.amount < 0) expense += Math.abs(t.amount);
  });

  return { income, expense };
};

const activeCard = cards[activeCardIndex];

const { income, expense } = useMemo(() => {
  return calculateTotals(transactions);
}, [transactions]);

  /* ---------------- ADD TRANSACTION ---------------- */

  const handleAddTransaction = async () => {
    setPageError("");
  const { date, description, amount, category } = newTxn;

  if (!date || !description || !amount || !category) {
  setPageError("Please fill all fields before saving the transaction.");
  return;
}


  if (Number(amount) <= 0) {
    setPageError("Amount must be greater than 0.");
    return;
  }

  const card = cards[newTxn.cardIndex];
  if (!card) {
    setPageError("Please select a card");
    return;
  }

  const finalAmount =
    newTxn.type === "income"
      ? Math.abs(Number(amount))
      : -Math.abs(Number(amount));

  await saveConfirmedTransactions([{
    date,
    description,
    amount: finalAmount,
    category,
    cardId: card._id,
    currency: card.displayCurrency
  }]);

const refreshed = await getTransactionsByCard(card._id);
setTransactions([...refreshed]);
setDraftTxns(JSON.parse(JSON.stringify(refreshed)));

onRefresh?.(); //


  setNewTxn({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    category: "Other",
    cardIndex: newTxn.cardIndex
  });
};


  /* ---------------- BULK UPDATE ---------------- */

const handleBulkUpdate = async () => {
  if (!selectedTxns.length) {
    showToast("Select at least one transaction to update.");
    return;
  }

  for (const id of selectedTxns) {
    const txn = draftTxns.find(t => t._id === id);
    if (!txn) continue;

    await updateTransaction(id, {
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      category: bulkCategory || txn.category
    });
  }

  const refreshed = await getTransactionsByCard(
    cards[activeCardIndex]._id
  );

  setTransactions([...refreshed]);   
  setDraftTxns(JSON.parse(JSON.stringify(refreshed)));
  onRefresh?.();

  setSelectedTxns([]);
  setBulkCategory("");
  setEditMode(false);
};



  /* ---------------- DELETE ---------------- */

  const handleBulkDelete = () => {
   if (!selectedTxns.length) {
    showToast("Select at least one transaction to delete.");
    return;
  }

  setModal({
    type: "confirm",
    title: "Delete Transactions",
    message: "Delete selected transactions permanently?",
    onConfirm: async () => {
      await fetch("http://localhost:5050/transactions/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ ids: selectedTxns })
      });

      const refreshed = await getTransactionsByCard(
        cards[activeCardIndex]._id
      );

      setTransactions(refreshed);
      setDraftTxns(JSON.parse(JSON.stringify(refreshed)));
      setSelectedTxns([]);
      setEditMode(false);
      onRefresh?.();
      setModal(null);
    }
  });
};

  /* ---------------- PIE CHART (REAL-TIME FIX) ---------------- */

const chartData = useMemo(() => {
  const source = editMode ? draftTxns : transactions;
  const map = {};

  source.forEach(t => {
    if (t.amount < 0) {
      map[t.category] =
        (map[t.category] || 0) + Math.abs(t.amount);
    }
  });

  if (!Object.keys(map).length) return null;

  return {
    labels: Object.keys(map),
    datasets: [{
      data: Object.values(map),
      backgroundColor: [
        "#ef4444",
        "#3b82f6",
        "#facc15",
        "#10b981",
        "#8b5cf6",
        "#fb923c"
      ]
    }]
  };
}, [transactions, draftTxns, editMode]);

const derivedCategories = useMemo(() => {
  const set = new Set(categories);

  transactions.forEach(t => t.category && set.add(t.category));
  draftTxns.forEach(t => t.category && set.add(t.category));

  return Array.from(set);
}, [categories, transactions, draftTxns]);

  /* ---------------- JSX ---------------- */

  return (

    <div className="tx-page">
  <div className="tx-header">
  <h2>Transactions</h2>
  {pageError && <div className="page-error">{pageError}</div>}

  <div className="tx-header-right">
   <button
  className="export-btn"
  onClick={() => setShowExport(true)}
>
  Export
</button>


    {activeCard && (
      <div className="txn-summary-card">
        <div className="txn-summary-item income">
          <span className="label">Total Income</span>
          <span className="value">
            {activeCard.displayCurrency} {income.toFixed(2)}
          </span>
        </div>

        <div className="divider" />

        <div className="txn-summary-item expense">
          <span className="label">Total Expense</span>
          <span className="value">
            {activeCard.displayCurrency} {expense.toFixed(2)}
          </span>
        </div>
      </div>
    )}
  </div>
</div>




      {/* CARD SWITCHER */}
      {cards.length > 0 && (
        <div className="card-carousel">
          <button
            disabled={activeCardIndex === 0}
            onClick={() => setActiveCardIndex(i => i - 1)}
          >←</button>

          <strong>{formatCardName(cards[activeCardIndex])}</strong>

          <button
            disabled={activeCardIndex === cards.length - 1}
            onClick={() => setActiveCardIndex(i => i + 1)}
          >→</button>
        </div>
      )}

      {/* ================= CARD HEADER ================= */}
<div className="card-header-bar">
<div className="card-title">
  {cards[activeCardIndex] && (
    <OriginalCardEditor
      card={cards[activeCardIndex]}
      onSaved={(updatedCard) => {
        setCards(prev =>
          prev.map(c =>
            c._id === updatedCard._id ? updatedCard : c
          )
        )
      }}
    />
  )}
</div>

  <div className="card-actions">
    <button
      className="card-btn"
     onClick={() => {
  setPageError("");
  setModalInput(cards[activeCardIndex]?.name || ""); // preload current name

  setModal({
    type: "input",
    title: "Rename Card",
    placeholder: "New card name",
    onSubmit: async (cardName) => {
      const currentName = cards[activeCardIndex]?.name;

      if (!cardName) {
        showToast("Card name cannot be empty.");
        return;
      }

      if (cardName.trim() === currentName?.trim()) {
        showToast("New card name must be different from the current name.");
        // ❗ DO NOT close modal
        // ❗ DO NOT clear modalInput
        return;
      }

     try {
  await renameCard(cards[activeCardIndex]._id, cardName.trim());
  setCards(await getCards());

  setModal(null);
  setModalInput("");
  setPageError("");
} catch (err) {
  showToast("Failed to rename card. Please try again.");
}
    }
  });
}}

    >
      Rename Card
    </button>

    <button
      className="card-btn danger"
      onClick={() => {
        setModal({
  type: "confirm",
  title: "Delete Card",
  message: "Delete this card and all its transactions?",
  onConfirm: async () => {
    await deleteCard(cards[activeCardIndex]._id);
    setActiveCardIndex(0);
    setCards(await getCards());
    setModal(null);
  }
});

      }}
    >
      Delete Card
    </button>

 <button
  className="card-btn primary add-card-btn add-card-force"
onClick={() => {
  setPageError("");
  setModalInput(""); // always start clean

  setModal({
    type: "input",
    title: "Add Card",
    placeholder: "Card name",
    onSubmit: (cardName) => {
      const trimmedName = cardName?.trim();

      // ❌ empty name
      if (!trimmedName) {
        showToast("Card name cannot be empty.");
        return; // stay on name field
      }

      // ❌ duplicate card name
      const alreadyExists = cards.some(
        c => c.name?.toLowerCase() === trimmedName.toLowerCase()
      );

      if (alreadyExists) {
        showToast("A card with this name already exists.");
        return; // stay on name field
      }

      // ✅ valid → move to last4
      setPageError("");
      setModalInput(""); // IMPORTANT: clear before next modal

      setModal({
        type: "input",
        title: "Last 4 digits (optional)",
        placeholder: "1234",
        onSubmit: async (last4Digits) => {
  const digits = last4Digits?.trim();

  // ❌ validation: must be exactly 4 digits if provided
  if (digits && !/^\d{4}$/.test(digits)) {
    showToast("Last 4 digits must be exactly 4 numbers");
    return; // stay on number field
  }

  try {
    await createCard({
      name: trimmedName,
      last4: digits || undefined,
      baseCurrency: "USD",
      displayCurrency: "USD"
    });

    setCards(await getCards());
    setModal(null);
    setModalInput("");
  } catch (err) {
    // 🔥 backend/runtime safety net
    showToast("Failed to create card. Please try again.");
  }
}
      });
    }
  });
}}


>
  + Add Card
</button>

  </div>
</div>

      {/* ADD TXN + PIE SIDE BY SIDE */}
      <div className="txn-top-row">
        <div className="add-txn">
          <h3>Add Transaction</h3>

          <select
            value={newTxn.cardIndex}
            onChange={e =>
              setNewTxn({ ...newTxn, cardIndex: Number(e.target.value) })
            }
          >
            {cards.map((c, i) => (
              <option key={c._id} value={i}>
                {formatCardName(c)}
              </option>
            ))}
          </select>

          <div className="txn-type">
            <label>
              <input
                type="radio"
                checked={newTxn.type === "expense"}
                onChange={() => setNewTxn({ ...newTxn, type: "expense" })}
              /> Expense
            </label>
            <label>
              <input
                type="radio"
                checked={newTxn.type === "income"}
                onChange={() => setNewTxn({ ...newTxn, type: "income" })}
              /> Income
            </label>
          </div>

          <input type="date" value={newTxn.date}
            onChange={e => setNewTxn({ ...newTxn, date: e.target.value })} />

          <input placeholder="Description" value={newTxn.description}
            onChange={e => setNewTxn({ ...newTxn, description: e.target.value })} />

          <input type="number" placeholder="Amount" value={newTxn.amount}
            onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} />

<select
  value={newTxn.category}
  onChange={e =>
    handleAddCategory(
      (v) =>
        setNewTxn(prev => ({
          ...prev,
          category: v
        })),
      e.target.value
    )
  }
>
  {derivedCategories.map(c => (
    <option key={c} value={c}>{c}</option>
  ))}
  <option value="__add_new__">➕ Add new category</option>
</select>


          <button onClick={handleAddTransaction}>Save</button>
        </div>

       {chartData && (
  <div className="txn-chart-card">
    <div id="card-wise-header">
      <h4>Card-wise Spending Breakdown</h4>

      <div id="card-wise-tooltip">
        <span id="card-wise-info-icon">i</span>

        <div id="card-wise-tooltip-content">
          <strong>Tip</strong>
          <ul>
            <li>
              Click on any <b>category name or field below</b> to exclude it and
            explore deeper insights.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="chart-wrapper">
      <Pie
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }}
      />
    </div>
  </div>

        )}
      </div>

      {/* EDIT / BULK ACTIONS */}
      <button
        className={`edit-toggle ${editMode ? "cancel" : ""}`}
        onClick={() => {
          if (editMode) {
            setDraftTxns(JSON.parse(JSON.stringify(transactions)));
          }
          setEditMode(!editMode);
          setSelectedTxns([]);
        }}
      >
        {editMode ? "Cancel" : "Update / Delete"}
      </button>

      {editMode && (
        <div className="bulk-actions">
          <div className="bulk-info-icon">
  <span className="info-dot">i</span>

  <div className="bulk-info-tooltip">
    Select one or more transactions using the checkbox, then edit any
    field directly in the table. Use <b>Update Selected</b> to save or
    <b>Delete Selected</b> to remove them.
  </div>
</div>

          <label>
            <input
              type="checkbox"
              checked={selectedTxns.length === draftTxns.length}
              onChange={(e) => toggleSelectAll(e.target.checked)}
            /> Select All
          </label>

          <select
            value={bulkCategory}
            onChange={e =>
              handleAddCategory(setBulkCategory, e.target.value)
            }
          >
            <option value="">Keep category</option>
            {derivedCategories.map(c => (
  <option key={c}>{c}</option>
))}

            <option value="__add_new__">➕ Add new category</option>
          </select>

          <button onClick={handleBulkUpdate}>Update Selected</button>
          <button className="danger" onClick={handleBulkDelete}>
            Delete Selected
          </button>
        </div>
      )}

      {/* TABLE (unchanged editing logic) */}
      <table className="tx-table">
        <thead>
          <tr>
            {editMode && <th>Select</th>}
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
  {draftTxns.map(t => (
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

      {/* DATE */}
      <td>
        {editMode ? (
          <input
            type="date"
            value={t.date}
            onChange={e =>
              updateDraft(t._id, "date", e.target.value)
            }
          />
        ) : (
          t.date
        )}
      </td>

      {/* DESCRIPTION */}
      <td>
        {editMode ? (
          <input
            value={t.description}
            onChange={e =>
              updateDraft(t._id, "description", e.target.value)
            }
          />
        ) : (
          t.description
        )}
      </td>

      {/* AMOUNT (ABS VALUE) */}
      <td className={t.amount < 0 ? "amt-expense" : "amt-income"}>
        {editMode ? (
          <input
            type="number"
            value={Math.abs(t.amount)}
            onChange={e => {
              const val = Number(e.target.value) || 0;
              updateDraft(
                t._id,
                "amount",
                t.amount < 0 ? -val : val
              );
            }}
          />
        ) : (
          <>
            {t.amount < 0 ? "−" : "+"}
            {SYMBOL[t.currency]}
            {Math.abs(t.amount).toFixed(2)}
          </>
        )}
      </td>

      {/* TYPE (INCOME / EXPENSE TOGGLE) */}
      <td>
        {editMode ? (
         <div className="txn-type-inline">
  <label className={t.amount < 0 ? "active" : ""}>
    <input
      type="radio"
      checked={t.amount < 0}
      name={`type-${t._id}`}
      onChange={() =>
        updateDraft(
          t._id,
          "amount",
          -Math.abs(t.amount)
        )
      }
    />
    − Expense
  </label>

  <label className={t.amount > 0 ? "active" : ""}>
    <input
      type="radio"
      name={`type-${t._id}`}
      checked={t.amount > 0}
      onChange={() =>
        updateDraft(
          t._id,
          "amount",
          Math.abs(t.amount)
        )
      }
    />
    + Income
  </label>
</div>


        ) : (
          t.amount < 0 ? "Expense" : "Income"
        )}
      </td>

      {/* CATEGORY + ADD NEW */}
      <td>
        {editMode ? (
          <select
  value={t.category}
  onChange={e =>
    handleAddCategory(
      v => updateDraft(t._id, "category", v),
      e.target.value
    )
  }
>
  {derivedCategories.map(c => (
    <option key={c}>{c}</option>
  ))}
  <option value="__add_new__">➕ Add new</option>
</select>


        ) : (
          t.category
        )}
      </td>
    </tr>
  ))}

 {showExport && (
  <ExportModal
    transactions={draftTxns}
    onClose={() => setShowExport(false)}
  />
)}


</tbody>

      </table>
     {modal && (
  <div className="modal-backdrop">
    <div className="modal">
      <h3>{modal.title}</h3>
      {modal.message && <p>{modal.message}</p>}

      {modal.type === "input" && (
        <input
          autoFocus
          value={modalInput}
          placeholder={modal.placeholder}
          onChange={(e) => setModalInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              modal.onSubmit(modalInput);
              setModalInput(""); // 🔥 clear after submit
            }
          }}
        />
      )}

      <div className="modal-actions">
        <button
          onClick={() => {
            setModal(null);
            setModalInput("");
          }}
        >
          Cancel
        </button>

        <button
          className="primary"
          onClick={() => {
            modal.onSubmit(modalInput);
            setModalInput(""); // 🔥 clear after confirm
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

{toast && (
  <div className="toast">
    {toast}
  </div>
)}

    </div>
  );
}