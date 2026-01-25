import { useEffect, useState } from "react";
import {
  previewUpload,
  getTransactions,
  updateCategory,
  saveConfirmedTransactions,
  getCards,
  createCard,
  deleteCard,
  getTransactionsByCard,
  renameCard,
  fetchHealthScore,
  updateCardCurrency,
  startCheckout,
  getBillingStatus,
  openBillingPortal
} from "./api";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import HealthPage from "./pages/HealthPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";




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
const [selectedUploadCardIndex, setSelectedUploadCardIndex] = useState(0);
const [activeView, setActiveView] = useState(() => {
  return localStorage.getItem("activeView") || "dashboard";
});

useEffect(() => {
  localStorage.setItem("activeView", activeView);
}, [activeView]);



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
       pdfPreview.push(
  ...data.map(t => ({ ...t, selected: true }))
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

const handleConfirm = async (e) => {
  e?.preventDefault();

  const selected = preview.filter(t => t.selected);
  if (!selected.length) {
    alert("Select at least one transaction");
    return;
  }

const card = cards?.[selectedUploadCardIndex];
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

setActiveCardIndex(selectedUploadCardIndex);
setActiveView("transactions");
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


useEffect(() => {
  if (cards.length > 0) {
    setSelectedUploadCardIndex(activeCardIndex);
  }
}, [cards, activeCardIndex]);



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

const incomeExpenseChartData = {
  labels: ["Income", "Expense"],
  datasets: [
    {
      data: [totalIncome, totalExpense],
      backgroundColor: ["#10b981", "#ef4444"],
      hoverBackgroundColor: ["#059669", "#dc2626"],
      borderRadius: 10
    }
  ]
};


const categoryTransactions = selectedCategory
  ? transactions.filter(
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
  <div className="dashboard-layout">
    {/* LEFT SIDEBAR */}
    <Sidebar onNavigate={setActiveView} />

    {/* RIGHT MAIN AREA */}
    <div className="dashboard-main">
      {/* TOP BAR */}
      <TopBar
        isPro={isPro}
        plan={billing?.plan}
        currency={cards[0]?.displayCurrency || "USD"}
        onChangeCurrency={async (newCurrency) => {
          await Promise.all(
            cards.map(card =>
              updateCardCurrency(card._id, newCurrency)
            )
          );
          const updated = await getCards();
          setCards(updated);
        }}
        onUpgrade={startCheckout}
        onManageBilling={async () => {
          const url = await openBillingPortal();
          window.location.href = url;
        }}
        onLogout={logout}
      />

      {/* CONTENT */}
      <div className="container dashboard-content">

        {/* ================= DASHBOARD ================= */}
        {activeView === "dashboard" && (
          <>
            {/* INCOME / EXPENSE */}
            <div className="summary-cards">
              <div className="summary-card income">
                <div className="summary-title">Total Income</div>
                <div className="summary-amount">
                  {SYMBOL[cards[0]?.displayCurrency || "USD"]}
                  {formatAmount(totalIncome)}
                </div>
              </div>

              <div className="summary-card expense">
                <div className="summary-title">Total Expense</div>
                <div className="summary-amount">
                  {SYMBOL[cards[0]?.displayCurrency || "USD"]}
                  {formatAmount(totalExpense)}
                </div>
              </div>
            </div>

            {/* CHARTS */}
            <div className="charts-row">
              <div className="chart-card chart-large">
                <h3>Where Your Money Went</h3>
                {chartData ? (
                  <Pie
                    data={chartData}
                    options={{
                      onClick: (_, elements) => {
                        if (!elements.length) return;
                        const index = elements[0].index;
                        setSelectedCategory(chartData.labels[index]);
                      },
                      plugins: { legend: { position: "bottom" } }
                    }}
                  />
                ) : (
                  <p>No expense data</p>
                )}
              </div>

              <div className="chart-card chart-small">
                {!selectedCategory ? (
                  <>
                    <h3>Income vs Expense</h3>
                    <Pie
                      data={incomeExpenseChartData}
                      options={{ plugins: { legend: { position: "bottom" } } }}
                    />
                  </>
                ) : (
                  <>
                    <div className="chart-header">
                      <h3>{selectedCategory} Details</h3>
                      <button onClick={() => setSelectedCategory(null)}>✕</button>
                    </div>
                    {categoryCardChartData && (
                      <Pie data={categoryCardChartData} />
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================= HEALTH ================= */}
        {activeView === "health" && (
          <HealthPage health={health} />
        )}

        {/* ================= UPLOAD ================= */}
        {activeView === "upload" && (
          <div>
            <h2>Upload & Preview</h2>

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
            {/* INCLUDE */}
            <td>
              <input
                type="checkbox"
                checked={t.selected}
                onChange={() =>
                  setPreview(prev =>
                    prev.map((txn, idx) =>
                      idx === i
                        ? { ...txn, selected: !txn.selected }
                        : txn
                    )
                  )
                }
              />
            </td>

            {/* DATE */}
            <td>{t.date}</td>

            {/* DESCRIPTION (EDITABLE) */}
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
                    copy[i].amount = fixAmountSign(copy[i].amount, "income");
                    setPreview(copy);
                  }}
                />{" "}
                Income
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
                />{" "}
                Expense
              </label>
            </td>

            {/* CATEGORY + ADD NEW */}
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
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__add_new__">➕ Add new category</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* CARD SELECTION */}
    {cards.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: "bold" }}>
          Post transactions to:
        </label>

        <select
          value={selectedUploadCardIndex}
          onChange={(e) =>
            setSelectedUploadCardIndex(Number(e.target.value))
          }
          style={{ marginLeft: 8 }}
        >
          {cards.map((card, idx) => (
            <option key={card._id} value={idx}>
              {card.name}
              {card.last4 ? ` (${card.last4})` : ""}
            </option>
          ))}
        </select>
      </div>
    )}

    <button onClick={handleConfirm} style={{ marginTop: 12 }}>
      Confirm & Save
    </button>
  </>
)}

          </div>
        )}

        {/* ================= TRANSACTIONS ================= */}
        {activeView === "transactions" && (
          <TransactionsPage />
        )}

        {/* ================= BUDGET ================= */}
        {activeView === "budget" && (
  <BudgetPage
    categories={categories}
    cards={cards}
    allTransactions={allTransactions}
  />
)}




      </div>
    </div>
  </div>
);
}

export default Dashboard;