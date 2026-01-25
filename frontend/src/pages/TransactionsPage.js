import { useEffect, useState } from "react";
import {
  getCards,
  createCard,
  deleteCard,
  renameCard,
  getTransactionsByCard,
  saveConfirmedTransactions,
  updateCategory
} from "../api";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

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

const formatCardName = (card) => {
  if (!card) return "";
  return card.last4
    ? `${card.name} (${card.last4})`
    : card.name;
};

export default function TransactionsPage() {
  /* ---------------- STATE ---------------- */

  const [cards, setCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");

  const [newTxn, setNewTxn] = useState({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    category: "Other"
  });

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    getCards().then(setCards);
  }, []);

  useEffect(() => {
    if (!cards.length) return;
    getTransactionsByCard(cards[activeCardIndex]._id).then(setTransactions);
  }, [cards, activeCardIndex]);

  /* ---------------- HELPERS ---------------- */

  const formatAmount = (n) => Math.abs(n).toFixed(2);

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

  /* ---------------- BULK ACTIONS ---------------- */

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

    const cardId = cards[activeCardIndex]._id;
    setTransactions(await getTransactionsByCard(cardId));
  };

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

    const cardId = cards[activeCardIndex]._id;
    setTransactions(await getTransactionsByCard(cardId));

    setSelectedTxns([]);
    setEditMode(false);
  };

  /* ---------------- ADD TRANSACTION ---------------- */

  const handleAddTransaction = async () => {
    const card = cards[activeCardIndex];
    if (!card) return;

    const finalAmount =
      newTxn.type === "income"
        ? Math.abs(newTxn.amount)
        : -Math.abs(newTxn.amount);

    await saveConfirmedTransactions([{
      ...newTxn,
      amount: finalAmount,
      cardId: card._id,
      currency: card.displayCurrency
    }]);

    setTransactions(await getTransactionsByCard(card._id));
    setNewTxn({
      date: "",
      description: "",
      amount: "",
      type: "expense",
      category: "Other"
    });
  };

  /* ---------------- CHART ---------------- */

  const chartData = (() => {
    const map = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
      }
    });
    if (!Object.keys(map).length) return null;

    return {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8AFFC1", "#9966FF"]
      }]
    };
  })();

  /* ---------------- JSX ---------------- */

  return (
    <div>
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

      {/* CARD ACTIONS */}
   <button
  onClick={async () => {
    let created = false;

    while (!created) {
      const name = prompt("Card name");
      if (!name) return;

      const last4 = prompt("Last 4 digits of card (optional)");

      if (last4) {
        if (!/^\d+$/.test(last4)) {
          alert("Card digits must be numbers only");
          continue;
        }

        if (last4.length > 4) {
          alert("Last 4 digits cannot be more than 4 digits");
          continue;
        }
      }

      try {
        await createCard({
          name,
          last4: last4 || undefined,
          baseCurrency: cards[0]?.baseCurrency || "USD",
          displayCurrency: cards[0]?.displayCurrency || "USD"
        });

        created = true;
        setCards(await getCards());
      } catch (err) {
        if (
          err.message &&
          err.message.toLowerCase().includes("already")
        ) {
          alert("Card name already exists. Please choose a different name.");
          // loop continues → user gets another chance
        } else {
          alert(err.message || "Failed to create card");
          return;
        }
      }
    }
  }}
>
  + Add Card
</button>

     <button
  onClick={async () => {
    const card = cards[activeCardIndex];
    if (!card) return;

    const displayName = card.last4
      ? `${card.name} (${card.last4})`
      : card.name;

    const ok = window.confirm(
      `"${displayName}" Card and all associated transactions will be permanently deleted from your account.\n\nThis action cannot be undone.\n\nDo you want to continue?`
    );

    if (!ok) return;

    await deleteCard(card._id);
    setCards(await getCards());
    setActiveCardIndex(0);
  }}
>
  Delete Card
</button>

     <button
  onClick={async () => {
    const currentCard = cards[activeCardIndex];
    if (!currentCard) return;

    while (true) {
      const newName = prompt("New card name", currentCard.name);
      if (!newName) return;

      // 🔒 Frontend duplicate check
      const exists = cards.some(
        c =>
          c._id !== currentCard._id &&
          c.name.trim().toLowerCase() === newName.trim().toLowerCase()
      );

      if (exists) {
        alert("A card with this name already exists. Choose a different name.");
        continue;
      }

      try {
        await renameCard(currentCard._id, newName);
        setCards(await getCards());
        return;
      } catch (err) {
        alert(err.message || "Failed to rename card");
        return;
      }
    }
  }}
>
  Rename Card
</button>


      {/* ADD TRANSACTION */}
      <h3>Add Transaction</h3>
      <input type="date" value={newTxn.date}
        onChange={e => setNewTxn({ ...newTxn, date: e.target.value })} />

      <input placeholder="Description" value={newTxn.description}
        onChange={e => setNewTxn({ ...newTxn, description: e.target.value })} />

      <input type="number" placeholder="Amount" value={newTxn.amount}
        onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} />

      <select
        value={newTxn.category}
        onChange={e => {
          const value = e.target.value;
          if (value === "__add_new__") {
            const c = prompt("New category");
            if (!c) return;
            setCategories(p => [...p, c]);
            setNewTxn({ ...newTxn, category: c });
          } else {
            setNewTxn({ ...newTxn, category: value });
          }
        }}
      >
        {categories.map(c => <option key={c}>{c}</option>)}
        <option value="__add_new__">➕ Add new</option>
      </select>

      <button onClick={handleAddTransaction}>Save</button>

      {/* CHART */}
      {chartData && <Pie data={chartData} />}

      {/* BULK ACTIONS */}
      <h3>Transactions</h3>

      <button onClick={() => {
        setEditMode(!editMode);
        setSelectedTxns([]);
      }}>
        {editMode ? "Cancel" : "Update / Delete"}
      </button>

      {editMode && (
        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={selectedTxns.length === transactions.length}
              onChange={(e) => toggleSelectAll(e.target.checked)}
            /> Select All
          </label>

          <select
            value={bulkCategory}
            onChange={e => {
              const value = e.target.value;
              if (value === "__add_new__") {
                const c = prompt("New category");
                if (!c) return;
                setCategories(p => [...p, c]);
                setBulkCategory(c);
              } else {
                setBulkCategory(value);
              }
            }}
            style={{ marginLeft: 10 }}
          >
            <option value="">Select category</option>
            {categories.map(c => <option key={c}>{c}</option>)}
            <option value="__add_new__">➕ Add new</option>
          </select>

          <button onClick={handleBulkUpdate} style={{ marginLeft: 10 }}>
            Update Selected
          </button>

          <button onClick={handleBulkDelete} style={{ marginLeft: 6, color: "red" }}>
            Delete Selected
          </button>
        </div>
      )}

      {/* TABLE */}
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
              <td>{SYMBOL[t.currency]}{formatAmount(t.amount)}</td>
              <td>{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
