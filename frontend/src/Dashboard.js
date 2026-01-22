import { useEffect, useState } from "react";
import {
  previewUpload,
  getTransactions,
  updateCategory,
  saveConfirmedTransactions,
  getCards,
  createCard,
  deleteCard,
  getTransactionsByCard
} from "./api";
import { renameCard } from "./api";
import { fetchHealthScore } from "./api";
import { updateCardCurrency } from "./api";
import {
  startCheckout,
  getBillingStatus,
  openBillingPortal
} from "./api";



import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

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
  const abs = Math.abs(amount);
  return type === "income" ? abs : -abs;
};

const SYMBOL = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};


function Dashboard() {

  
  const [files, setFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [budgets, setBudgets] = useState({});

const [category, setCategory] = useState("");
const [budgetAmount, setBudgetAmount] = useState("");
const formatAmount = (num) => Number(num).toFixed(2);

const [allTransactions, setAllTransactions] = useState([]);
const [billing, setBilling] = useState(null);

useEffect(() => {
  getBillingStatus()
    .then(setBilling)
    .catch(() => {});
}, []);

const [showUpgrade, setShowUpgrade] = useState(false);

const [selectedCategory, setSelectedCategory] = useState(null);

const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
const [creatingCard, setCreatingCard] = useState(false);

const [showAddTxn, setShowAddTxn] = useState(false);

const [newTxn, setNewTxn] = useState({
  date: "",
  description: "",
  amount: "",
  type: "expense",
  category: "Other"
});

const isPro =
  billing?.plan === "monthly" || billing?.plan === "yearly";



const [cards, setCards] = useState([]);
const [activeCardIndex, setActiveCardIndex] = useState(0);

useEffect(() => {
  const loadCards = async () => {
    const data = await getCards();
    setCards(data);
  };
  loadCards();
}, []);

useEffect(() => {
  if (!cards.length) {
    return;
  }

  

  const cardId = cards[activeCardIndex]?._id;
  if (!cardId) return;


  getTransactionsByCard(cardId).then(setTransactions);
}, [cards, activeCardIndex]);


useEffect(() => {
  const saved = localStorage.getItem("activeCardIndex");
  if (saved !== null) {
    setActiveCardIndex(Number(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem("activeCardIndex", activeCardIndex);
}, [activeCardIndex]);

useEffect(() => {
  if (cards.length === 0) {
    setTransactions([]);
    setAllTransactions([]);
  }
}, [cards]);


const [health, setHealth] = useState(null);

useEffect(() => {
  fetchHealthScore().then(setHealth);
}, [transactions]);

const totalIncome = transactions
  .filter(t => t.amount > 0)
  .reduce((sum, t) => sum + t.amount, 0);

const totalExpense = transactions
  .filter(t => t.amount < 0)
  .reduce((sum, t) => sum + Math.abs(t.amount), 0);


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
        pdfPreview.push(...data.map(t => ({ ...t, selected: true })));
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

const handleConfirm = async (e) => {
  e?.preventDefault();

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
    // ✅ FRIENDLY MESSAGE (NO CRASH)
    alert(err.message || "Upload failed");
    return;
  }

  // ✅ REFRESH UI STATE
  const updatedCards = await getCards();
  setCards(updatedCards);

  const newIndex = updatedCards.findIndex(c => c._id === card._id);
  setActiveCardIndex(newIndex === -1 ? 0 : newIndex);

  const txns = await getTransactionsByCard(card._id);
  setTransactions(txns);

  setAllTransactions(await getTransactions());

  setPreview([]);
  setShowPreview(false);
};

const handleAddTransaction = async () => {
  const { date, description, amount, type, category } = newTxn;

  if (!date || !description || !amount || !category) {
    alert("Please fill all fields");
    return;
  }

  const card = cards[activeCardIndex];
  if (!card) {
    alert("No card selected");
    return;
  }

  const finalAmount =
    type === "income" ? Math.abs(Number(amount)) : -Math.abs(Number(amount));

  const payload = [{
    date,
    description,
    amount: finalAmount,
    category,
    cardId: card._id,
    currency: card.displayCurrency
  }];

  await saveConfirmedTransactions(payload
);

const cardId = cards[activeCardIndex]._id;
const updatedTxns = await getTransactionsByCard(cardId);
setTransactions(updatedTxns);

const all = await getTransactions();
setAllTransactions(all);


  // reset
  setNewTxn({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    category: "Other"
  });

  setShowAddTxn(false);
};

  const toggleTxnSelection = (id) => {
    setSelectedTxns(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };
useEffect(() => {
  getTransactions().then(setAllTransactions);
}, []);

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
    const cardId = cards[activeCardIndex]._id;
setTransactions(await getTransactionsByCard(cardId));
setAllTransactions(await getTransactions());

  };


  const budgetSummary = Object.entries(budgets).map(([cat, budget]) => {
  const spent = transactions
    .filter(t => t.category === cat && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    category: cat,
    spent,
    budget,
    over: spent > budget
  };
});

const handleSetBudget = () => {
  if (!category || !budgetAmount) {
    alert("Select category and budget");
    return;
  }

  setBudgets(prev => ({
    ...prev,
    [category]: Number(budgetAmount)
  }));

  setCategory("");
  setBudgetAmount("");
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
  const updatedTxns = await getTransactionsByCard(cardId);
  setTransactions(updatedTxns);

  const all = await getTransactions();
  setAllTransactions(all);

  setSelectedTxns([]);
  setEditMode(false);
};


  const buildCardChartData = (cardTxns) => {
  if (!cardTxns || cardTxns.length === 0) return null;

  const categories = {};

  cardTxns.forEach(t => {
    if (t.amount < 0) {
      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(t.amount);
    }
  });

  if (Object.keys(categories).length === 0) return null;

  return {
    labels: Object.keys(categories),
    datasets: [
      {
        data: Object.values(categories),
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
  };
};

const mainCategories = {};

allTransactions.forEach(t => {
  if (t.amount < 0) {
    mainCategories[t.category] =
      (mainCategories[t.category] || 0) + Math.abs(t.amount);
  }
});


const chartData =
  Object.keys(mainCategories).length === 0
    ? null
    : {
        labels: Object.keys(mainCategories),
        datasets: [
          {
            data: Object.values(mainCategories),
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
      };


const categoryTransactions = selectedCategory
  ? allTransactions.filter(
      t => t.category === selectedCategory && t.amount < 0
    )
  : [];



const categoryCardSplit = {};

categoryTransactions.forEach(t => {
  const card = cards.find(c => c._id === t.cardId);
  if (!card) return;

  categoryCardSplit[card.name] =
    (categoryCardSplit[card.name] || 0) + Math.abs(t.amount);
});

const categoryCardChartData =
  Object.keys(categoryCardSplit).length === 0
    ? null
    : {
        labels: Object.keys(categoryCardSplit),
        datasets: [
          {
            data: Object.values(categoryCardSplit),
            backgroundColor: [
              "#36A2EB",
              "#FF6384",
              "#FFCE56",
              "#8AFFC1",
              "#9966FF"
            ]
          }
        ]
      };

      
const logout = () => {
  localStorage.clear();
  window.location.replace("/login");
};

  return (

    <div className="container">
      <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20
}}>

{billing && (
  <div
    style={{
      padding: "6px 12px",
      borderRadius: 6,
      background: isPro ? "#d1fae5" : "#fee2e2",
      color: isPro ? "#065f46" : "#991b1b",
      fontWeight: "bold"
    }}
  >
    Plan: {billing.plan.toUpperCase()}
  </div>
)}

{!isPro && (
  <button onClick={startCheckout}>
    Upgrade to Pro
  </button>
)}

{isPro && (
  <button onClick={async () => {
    const url = await openBillingPortal();
    window.location.href = url;
  }}>
    Manage Billing
  </button>
)}

  <h2>Statement Categorizing</h2>

  <button
    onClick={logout}
    style={{
      background: "#ff4d4d",
      color: "white",
      border: "none",
      padding: "8px 14px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold"
    }}
  >
    Logout
  </button>
</div>


      <input
        type="file"
        multiple
        accept=".csv,.xls,.xlsx,.pdf"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button type="button" onClick={handleUpload}>
  Upload/Preview
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
  setPreview(prev =>
    prev.map((txn, idx) =>
      idx === i ? { ...txn, selected: !txn.selected } : txn
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
  const value = e.target.value;

  if (value === "__add_new__") {
    const newCat = prompt("Enter new category name");
    if (!newCat) return;

    if (!categories.includes(newCat)) {
      setCategories(prev => [...prev, newCat]);
    }

    setCategory(newCat);
    return;
  }

  setCategory(value);
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
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__add_new__"> Add new category</option>

                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" onClick={handleConfirm}>
  Confirm & Save
</button>

        </>
      )}

      {cards.length > 0 && (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontWeight: "bold" }}>Account Currency:</label>{" "}
    <select
  value={cards[0].displayCurrency}
  onChange={async (e) => {
    const newCurrency = e.target.value;
    await Promise.all(
      cards.map(card =>
        updateCardCurrency(card._id, newCurrency)
      )
    );

    const updated = await getCards();
    setCards(updated);
  }}
>

      <option value="USD">USD ($)</option>
      <option value="INR">INR (₹)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
    </select>
  </div>
)}

{selectedCategory && (
  <div style={{ marginTop: 30, padding: 16, border: "1px solid #ddd" }}>
    <h3>{selectedCategory} — Card-wise Split</h3>

    {categoryCardChartData && (
      <div style={{ width: 400 }}>
        <Pie data={categoryCardChartData} />
      </div>
    )}

    <h4>Transactions</h4>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Card</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {categoryTransactions.map(t => {
          const card = cards.find(c => c._id === t.cardId);
          return (
            <tr key={t._id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{card?.name}</td>
              <td>
                {SYMBOL[t.currency]}
                {formatAmount(Math.abs(t.amount))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <button onClick={() => setSelectedCategory(null)}>
      Close
    </button>
  </div>
)}

<h3>Monthly Budgets</h3>

<div style={{ marginBottom: 10 }}>
  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  >
    <option value="">Select category</option>
{categories.map(c => (

      <option key={c} value={c}>{c}</option>
    ))}
    <option value="__add_new__"> Add new category</option>
  </select>

  <input
    type="number"
    placeholder="Budget amount"
    value={budgetAmount}
    onChange={(e) => setBudgetAmount(e.target.value)}
    style={{ marginLeft: 8 }}
  />

  <button onClick={handleSetBudget} style={{ marginLeft: 8 }}>
    Set Budget
  </button>
</div>

{budgetSummary.map(b => (
  <div key={b.category} style={{ marginBottom: 6 }}>
    <b>{b.category}</b> — ${b.spent} / ${b.budget}
    {b.over && <span style={{ color: "red" }}> This is Over budget</span>}
  </div>
))}


{health && (
  <div className="health-score-header">
  <h3>expense health score</h3>

  <div className="info-tooltip">
    <span className="info-icon">i</span>

    <div className="tooltip-box">
      <strong>calculation</strong>
      <ul>
        <li><b>savings rate (40%)</b> = (income − expenses) / income</li>
        <li><b>category balance (25%)</b> = spending distribution</li>
        <li><b>expense volatility (20%)</b> = monthly stability</li>
        <li><b>unusual spending (15%)</b> = anomaly penalty</li>
      </ul>
    </div>
  </div>


    <div style={{
      fontSize: "48px",
      fontWeight: "bold",
      color:
        health.score >= 75 ? "green" :
        health.score >= 50 ? "orange" : "red"
    }}>
      {health.score} / 100

    </div>

    <ul>
  {health.insights?.map(i => (
    <li key={i}>{i}</li>
  ))}
</ul>

  </div>
)}


{cards.length > 0 && (
  <div className="card-carousel">
    <button
      disabled={activeCardIndex === 0}
      onClick={() => setActiveCardIndex(i => i - 1)}
    >
      ←
    </button>

    <strong>
      {cards[activeCardIndex].name}
      {cards[activeCardIndex].last4 && ` (${cards[activeCardIndex].last4})`}
    </strong>

    <button
      disabled={activeCardIndex === cards.length - 1}
      onClick={() => setActiveCardIndex(i => i + 1)}
    >
      →
    </button>
  </div>
)}

{cards.length > 0 && (
  <div style={{ marginTop: 12 }}>
    <button onClick={() => setShowAddTxn(v => !v)}>
      {showAddTxn ? "Cancel" : " Add Transaction"}
    </button>

    {showAddTxn && (
      <div style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 6,
        maxWidth: 400
      }}>
        <h4>Add transaction to {cards[activeCardIndex].name}</h4>

        <input
          type="date"
          value={newTxn.date}
          onChange={e => setNewTxn({ ...newTxn, date: e.target.value })}
        />

        <input
          type="text"
          placeholder="Description"
          value={newTxn.description}
          onChange={e => setNewTxn({ ...newTxn, description: e.target.value })}
        />

        <input
          type="number"
          placeholder="Amount"
          value={newTxn.amount}
          onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })}
        />

        <div>
          <label>
            <input
              type="radio"
              checked={newTxn.type === "expense"}
              onChange={() => setNewTxn({ ...newTxn, type: "expense" })}
            /> Expense
          </label>

          <label style={{ marginLeft: 10 }}>
            <input
              type="radio"
              checked={newTxn.type === "income"}
              onChange={() => setNewTxn({ ...newTxn, type: "income" })}
            /> Income
          </label>
        </div>

        <select
          value={newTxn.category}
          onChange={e => {
            const value = e.target.value;

            if (value === "__add_new__") {
              const newCat = prompt("Enter new category name");
              if (!newCat) return;

              if (!categories.includes(newCat)) {
                setCategories(prev => [...prev, newCat]);
              }

              setNewTxn({ ...newTxn, category: newCat });
              return;
            }

            setNewTxn({ ...newTxn, category: value });
          }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="__add_new__">➕ Add new category</option>
        </select>

        <button onClick={handleAddTransaction} style={{ marginTop: 10 }}>
          Save Transaction
        </button>
      </div>
    )}
  </div>
)}


<button
  type="button"
  disabled={creatingCard}
  onClick={async () => {
    if (creatingCard) return;

    setCreatingCard(true);
    try {
      let name = prompt("Card name");
      if (!name) return;

      let last4 = "";

      while (true) {
        last4 = prompt("Last 4 digits (optional, exactly 4 numbers)");
        if (last4 === null || last4 === "") break;
        if (/^\d{4}$/.test(last4)) break;
        alert("Please enter EXACTLY 4 digits");
      }

      const accountCurrency = cards[0]?.displayCurrency || "USD";

      await createCard({
        name,
        last4: last4 || undefined,
        baseCurrency: accountCurrency,
        displayCurrency: accountCurrency
      });

      const updated = await getCards();
      setCards(updated);
      setActiveCardIndex(updated.length - 1);
    } catch (err) {
      alert(err.message || "Failed to create card");
    } finally {
      setCreatingCard(false);
    }
  }}
>
  {creatingCard ? "Creating..." : "+ add card"}
</button>


<button
  onClick={async () => {
    const card = cards[activeCardIndex];
    if (!card) return;

    const ok = window.confirm(
      `Delete card "${card.name}"?\nAll associated transactions will be permanently deleted.`
    );

    if (!ok) return;

    await deleteCard(card._id);

    const updatedCards = await getCards();
    setCards(updatedCards);

    if (updatedCards.length === 0) {
      setActiveCardIndex(0);
      setTransactions([]);
      setAllTransactions([]);
    } else {
      const newIndex = Math.max(0, activeCardIndex - 1);
      setActiveCardIndex(newIndex);

      const cardId = updatedCards[newIndex]._id;
      const txns = await getTransactionsByCard(cardId);
      setTransactions(txns);
    }
  }}
>
  delete card
</button>



<button
  onClick={async () => {
    const newName = prompt("New card name");
    if (!newName) return;

    await renameCard(cards[activeCardIndex]._id, newName);

    const updated = await getCards();
    setCards(updated);
  }}
>
  Rename card
</button>

   <div>
  <h3>Financial Summary</h3>

  <p>
    <b>Total Income:</b>{" "}
    {SYMBOL[cards[0]?.displayCurrency || "USD"]}
    {formatAmount(totalIncome)}
  </p>

  <p>
    <b>Total Expense:</b>{" "}
    {SYMBOL[cards[0]?.displayCurrency || "USD"]}
    {formatAmount(totalExpense)}
  </p>

  {chartData && (
    <div style={{ width: 450, height: 450 }}>
      <Pie
        data={chartData}
        options={{
          onClick: (_, elements) => {
            if (!elements.length) return;
            const index = elements[0].index;
            const category = chartData.labels[index];
            setSelectedCategory(category);
          }
        }}
      />
    </div>
  )}

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
      <div>
        <input
          type="checkbox"
          checked={selectedTxns.length === transactions.length}
          onChange={(e) => toggleSelectAll(e.target.checked)}
        />{" "}
        Select All
      </div>

      <select
  value={bulkCategory}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "__add_new__") {
      const newCat = prompt("Enter new category name");
      if (!newCat) return;

      if (!categories.includes(newCat)) {
        setCategories(prev => [...prev, newCat]);
      }

      setBulkCategory(newCat);
      return;
    }

    setBulkCategory(value);
  }}
>

        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="__add_new__"> Add new category</option>
      </select>

      <button onClick={handleBulkUpdate}>Update Selected</button>
      <button onClick={handleBulkDelete}>Delete Selected</button>
    </>
  )}

  <h3>Card-wise Expense Summary</h3>

{Array.isArray(cards) && cards.length > 0 && cards.map(card => {
  if (card._id !== cards[activeCardIndex]._id) return null;

  const cardTxns = transactions.filter(t => t.cardId === card._id);

  const cardIncome = cardTxns
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const cardExpense = cardTxns
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const cardChartData = buildCardChartData(cardTxns);


  return (
    <div key={card._id} style={{ marginTop: 30 }}>
      <h4>
        {card.name}
        {card.last4 && ` (${card.last4})`} — {card.displayCurrency}
      </h4>

      <p>
        <b>Income:</b>{" "}
        {SYMBOL[card.displayCurrency]}
        {formatAmount(cardIncome)}
      </p>
<p>
        <b>Expense:</b>{" "}
        {SYMBOL[card.displayCurrency]}
        {formatAmount(cardExpense)}
      </p>

      {!cardChartData ? (
        <p style={{ color: "#888" }}>
          Add transactions to see summary graph
        </p>
      ) : (
        <div style={{ width: 400, height: 400 }}>
          <Pie data={cardChartData} />
        </div>
      )}
    </div>
  );
})}



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
        <td>
          {SYMBOL[t.currency]}
          {formatAmount(t.amount)}
        </td>
        <td>{t.category}</td>
      </tr>
    ))}
  </tbody>
</table>
</div>
{showUpgrade && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999
  }}>
    <div style={{
      background: "#fff",
      padding: 24,
      borderRadius: 8,
      width: 300,
      textAlign: "center"
    }}>
      <h3>Upgrade to Pro</h3>
      {billing?.plan === "free" && (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      startCheckout();
    }}
  >
    Upgrade to Pro
  </button>
)}

      <p>This feature requires a Pro plan.</p>

      <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    startCheckout();
  }}
>
  Upgrade to Pro
</button>


      <br /><br />

      <button onClick={() => setShowUpgrade(false)}>
        Cancel
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default Dashboard;