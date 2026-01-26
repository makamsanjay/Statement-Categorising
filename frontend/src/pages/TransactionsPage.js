import { useEffect, useState, useMemo } from "react";
import {
  getCards,
  getTransactionsByCard,
  saveConfirmedTransactions,
  updateTransaction
} from "../api";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./TransactionsPage.css";

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
  /* ---------------- STATE ---------------- */
const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [cards, setCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [draftTxns, setDraftTxns] = useState([]);


  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");

  const [newTxn, setNewTxn] = useState({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    category: "Other",
    cardIndex: 0
  });

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

  const name = prompt("Enter new category");
  if (!name) return;

  setCategories(prev => {
    if (prev.includes(name)) return prev;
    return [...prev, name];
  });

  // IMPORTANT: delay setter until categories update
  setTimeout(() => {
    setter(name);
  }, 0);
};


  /* ---------------- ADD TRANSACTION ---------------- */

  const handleAddTransaction = async () => {
  const { date, description, amount, category } = newTxn;

  if (!date || !description || !amount || !category) {
    alert("Please fill all fields before saving the transaction");
    return;
  }

  if (Number(amount) <= 0) {
    alert("Amount must be greater than 0");
    return;
  }

  const card = cards[newTxn.cardIndex];
  if (!card) {
    alert("Please select a card");
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
  if (!selectedTxns.length) return;

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

  setTransactions([...refreshed]);        // 🔥 important
  setDraftTxns(JSON.parse(JSON.stringify(refreshed)));

  setSelectedTxns([]);
  setBulkCategory("");
  setEditMode(false);
};



  /* ---------------- DELETE ---------------- */

  const handleBulkDelete = async () => {
    if (!selectedTxns.length) return;
    if (!window.confirm("Delete selected transactions permanently?")) return;

    await fetch("http://localhost:5050/transactions/bulk-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ ids: selectedTxns })
    });

    const refreshed = await getTransactionsByCard(cards[activeCardIndex]._id);
    setTransactions([...refreshed]);
    setDraftTxns(JSON.parse(JSON.stringify(refreshed)));
    setSelectedTxns([]);
    setEditMode(false);
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
      <h2>Transactions</h2>

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
  <h4> Card-wise Spending Breakdown</h4>
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
</tbody>

      </table>
    </div>
  );
}
