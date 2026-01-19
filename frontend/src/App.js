import { useEffect, useState } from "react";
import {
  previewUpload,
  getTransactions,
  fetchSummary,
  updateCategory,
  saveConfirmedTransactions,
  getCards,
  createCard,
  deleteCard,
  getTransactionsByCard
} from "./api";

import { fetchHealthScore } from "./api";
import { updateCardCurrency } from "./api";


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

const SYMBOL = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};


function App() {
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
    setTransactions([]);
    return;
  }

  const cardId = cards[activeCardIndex]?._id;
  if (!cardId) return;

  setTransactions([]);

  getTransactionsByCard(cardId).then(setTransactions);
}, [cards, activeCardIndex]);



const [health, setHealth] = useState(null);

useEffect(() => {
  fetchHealthScore().then(setHealth);
}, []);

useEffect(() => {
  fetchHealthScore().then(setHealth);
}, [transactions]);


  const fetchTransactions = async () => {
  const data = await getTransactions();
  setAllTransactions(data);
};


  useEffect(() => {
    fetchTransactions();
  }, []);

const totalIncome = allTransactions
  .filter(t => t.amount > 0)
  .reduce((sum, t) => sum + t.amount, 0);

const totalExpense = allTransactions
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
  };

  const handleConfirm = async () => {
  const selected = preview.filter(t => t.selected);
  if (!selected.length) return;

  const card = cards[activeCardIndex];

  console.log("USING CARD:", card);

  const payload = selected.map(t => ({
    date: t.date,
    description: t.description,
    amount: Number(t.amount),
    category: t.category || "Other",
    cardId: card._id,
    currency: card.displayCurrency
  }));

  console.log("FINAL CONFIRM PAYLOAD", payload);

  await saveConfirmedTransactions(payload);

  setPreview([]);
  setShowPreview(false);
  fetchTransactions();
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedTxns })
    });

    setSelectedTxns([]);
    setEditMode(false);
    fetchTransactions();
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

      {cards.length > 0 && (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontWeight: "bold" }}>Account Currency:</label>{" "}
    <select
      value={cards[0].displayCurrency}
      onChange={async (e) => {
        await updateCardCurrency(cards[0]._id, e.target.value);
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


<h3>Monthly Budgets</h3>

<div style={{ marginBottom: 10 }}>
  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  >
    <option value="">Select category</option>
    {CATEGORIES.map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
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



<button
  type="button"
  onClick={async () => {
    const name = prompt("Card name");
    if (!name) return;

    const last4 = prompt("Last 4 digits (optional)");
    const accountCurrency = cards[0]?.displayCurrency || "USD";

await createCard({
  name,
  last4,
  baseCurrency: accountCurrency,
  displayCurrency: accountCurrency
});



    const updated = await getCards();
    setCards(updated);
  }}
>
  + add card
</button>

<button
  onClick={async () => {
    const card = cards[activeCardIndex];

    const ok = window.confirm(
      `Delete card "${card.name}"?\nAll associated transactions will be permanently deleted.`
    );

    if (!ok) return;

    await deleteCard(card._id);
    const updated = await getCards();
    setCards(updated);
    setActiveCardIndex(0);
  }}
>
  delete card
</button>



     <>
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
      <Pie data={chartData} />
    </div>
  )}
</>


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

     
<h3>Card-wise Expense Summary</h3>


{cards.map(card => {
  if (card._id !== cards[activeCardIndex]._id) {
    return null;
  }

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
        {card.last4 && ` (${card.last4})`}
        {" "}— {card.displayCurrency}
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
  );
}

export default App;