import { useEffect, useState, useMemo } from "react";
import {
  previewUpload,
  getTransactions,
  updateCategory,
  saveConfirmedTransactions,
  getCards,
  getTransactionsByCard,
  fetchHealthScore,
  updateCardCurrency,
  getBillingStatus,
  getBillingPricing,
  createCard,
  getManageBilling
} from "./api";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import HealthPage from "./pages/HealthPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";
import {useRef } from "react";
import "./pages/UploadPage.css";
import AnalyticsPage from "./pages/Analytics";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";
import CardSuggestions from "./pages/CardSuggestions";
import {
   createRazorpaySubscription,
  cancelRazorpaySubscription
 } from "./api";
import ManageBilling from "./pages/ManageBilling";

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

const [error, setError] = useState("");
const [scanning, setScanning] = useState(false);
const [scanStatus, setScanStatus] = useState({});
const [scanStarted, setScanStarted] = useState(false);
const [infoMessage, setInfoMessage] = useState("");


const [showBilling, setShowBilling] = useState(false);
const [billingDetails, setBillingDetails] = useState(null);
const [billingState, setBillingState] = useState("idle");

useEffect(() => {
  if (billing?.subscriptionStatus === "active") {
    setBillingState("active");
  } else if (billing?.subscriptionStatus === "pending") {
    setBillingState("processing");
  } else {
    setBillingState("idle");
  }
}, [billing]);

useEffect(() => {
  if (billingState !== "processing") return;

  const interval = setInterval(async () => {
    const updated = await getBillingStatus();
    setBilling(updated);

    if (updated.subscriptionStatus === "active") {
      setBillingState("active");
      clearInterval(interval);
    }
  }, 3000);

  return () => clearInterval(interval);
}, [billingState]);



const openManageBilling = async () => {
  const data = await getManageBilling();
  setBillingDetails(data);
  setShowBilling(true);
};


useEffect(() => {
  getBillingStatus()
    .then(setBilling)
    .catch(() => {});
}, []);

useEffect(() => {
  const intent = sessionStorage.getItem("pricingIntent");

  // Only auto-trigger once, and only if user is eligible
  if (
    intent === "pro" &&
    billing &&
    billing.subscriptionStatus === "none" &&
    billingState === "idle"
  ) {
    console.log("🚀 Pricing intent detected → starting checkout");

    startRazorpayCheckout();

    // 🔥 clear intent immediately (one-shot)
    sessionStorage.removeItem("pricingIntent");
  }
}, [billing, billingState]);


const [selectedUploadCardIndex, setSelectedUploadCardIndex] = useState(0);

const [selectedCategory, setSelectedCategory] = useState(null);

const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
const [creatingCard, setCreatingCard] = useState(false);

const [showAddTxn, setShowAddTxn] = useState(false);
const [activeView, setActiveView] = useState(() => {
  return localStorage.getItem("activeView") || "dashboard";
});

useEffect(() => {
  localStorage.setItem("activeView", activeView);
}, [activeView]);


const [cards, setCards] = useState([]);
const [activeCardIndex, setActiveCardIndex] = useState(0);

const [pricing, setPricing] = useState(null);

useEffect(() => {
  getBillingPricing().then(setPricing).catch(() => {});
}, []);



  const refreshDashboardData = async (cardIndex = activeCardIndex) => {
  const all = await getTransactions();
  setAllTransactions([...all]); 

  if (cards[cardIndex]) {
    const cardId = cards[cardIndex]._id;
    const cardTxns = await getTransactionsByCard(cardId);
    setTransactions([...cardTxns]);
  }
};

useEffect(() => {
  if (cards.length) {
    refreshDashboardData();
  }
}, [cards]);


const [newTxn, setNewTxn] = useState({
  date: "",
  description: "",
  amount: "",
  type: "expense",
  category: "Other"
});

const isPro =
  billing?.plan === "monthly" || billing?.plan === "yearly";





useEffect(() => {
  const loadCards = async () => {
    try {
      const data = await getCards();
      console.log("CARDS LOADED:", data);
      setCards(data);
    } catch (e) {
      console.error("FAILED TO LOAD CARDS", e); 
    }
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

const { totalIncome, totalExpense } = useMemo(() => {
  let income = 0;
  let expense = 0;

  allTransactions.forEach(t => {
    if (t.amount > 0) income += t.amount;
    if (t.amount < 0) expense += Math.abs(t.amount);
  });

  return { totalIncome: income, totalExpense: expense };
}, [allTransactions]);

 
const handleUpload = async () => {
  setScanStarted(true);
  setScanStatus({});
  setError("");
  setInfoMessage("");
  setPreview([]);
  setShowPreview(false);

  if (!files.length) {
    setError("Please select at least one file to upload.");
    setScanStarted(false);
    return;
  }

  setScanning(true);

  const pdfPreview = [];
  const statusMap = {};

  for (const file of files) {
    statusMap[file.name] = { status: "scanning" };
    setScanStatus({ ...statusMap });

    const isPDF = file.type === "application/pdf";
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    const isExcel =
      file.name.toLowerCase().endsWith(".xls") ||
      file.name.toLowerCase().endsWith(".xlsx");

    if (!isPDF && !isCSV && !isExcel) {
      statusMap[file.name] = {
        status: "failed",
        message: "Unsupported file type"
      };
      setScanStatus({ ...statusMap });
      continue;
    }

    try {
      const data = await previewUpload(file);
      console.log("🌐 PREVIEW API RESPONSE:", data);


      // ✅ PDFs → previewable
      if (isPDF) {
        const txns = data?.transactions || [];

        if (!Array.isArray(txns) || txns.length === 0) {
          statusMap[file.name] = {
            status: "failed",
            message: "No transactions found in this PDF"
          };
          setScanStatus({ ...statusMap });
          continue;
        }

        pdfPreview.push(
          ...txns.map(t => ({
            ...t,
            selected: true
          }))
        );


        statusMap[file.name] = { status: "success" };
      } 
      // ✅ CSV / Excel → accepted, no preview
      else {
        statusMap[file.name] = {
          status: "success",
          message: "File verified — will be processed on save"
        };
      }

      setScanStatus({ ...statusMap });
    } catch (err) {
      statusMap[file.name] = {
        status: "failed",
        message: err.message || "File could not be processed"
      };
      setScanStatus({ ...statusMap });
    }
  }

  setScanning(false);

  const uploadedAnyPDF = files.some(
    f => f.type === "application/pdf"
  );

  if (uploadedAnyPDF && pdfPreview.length === 0) {
    setInfoMessage(
      "No previewable transactions were found in the uploaded PDF(s). " +
      "PDFs can be previewed before saving, while CSV and Excel files " +
      "will be securely processed when you confirm the upload."
    );
    return;
  }

  if (pdfPreview.length > 0) {
    setPreview(pdfPreview);
    setSelectedUploadCardIndex(activeCardIndex);
    setShowPreview(true);
  }

  setFiles([]);
};
const startRazorpayCheckout = async () => {
  if (billingState !== "idle") return; // 🔒 hard lock

  setBillingState("processing");

  let subscription;
  try {
    subscription = await createRazorpaySubscription();
  } catch (err) {
    setBillingState("idle");
    alert(err.message || "Unable to start subscription");
    return;
  }

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    subscription_id: subscription.id,
    name: "SpendSwitch",
    description: "Pro Subscription",

    prefill: {
      email: billing?.email || ""
    },

    handler: () => {
      // Payment received — webhook will confirm
      setBillingState("processing");
    },

   modal: {
  ondismiss: () => {
   setBillingState("idle");
   // Do nothing — backend status is source of truth
  }
},

    theme: {
      color: "#0f172a"
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};





const handleConfirm = async (e) => {
  e?.preventDefault();

  const selectedTxns = preview.filter(t => t.selected);
  if (!selectedTxns.length) {
    alert("Select at least one transaction");
    return;
  }

  const card = cards[selectedUploadCardIndex];
  if (!card || !card._id) {
    alert("Please select a card before confirming upload");
    return;
  }

  const payload = selectedTxns.map(t => ({
    date: t.date,
    description: t.description,
    amount: Number(t.amount),
    category: t.category || "Other",
    cardId: card._id,
    currency: card.displayCurrency
  }));



await saveConfirmedTransactions({
  transactions: payload
});


 // 🔄 refresh transactions for the selected card
await refreshDashboardData(selectedUploadCardIndex);

// 🧹 reset upload state
setPreview([]);
setFiles([]);
setShowPreview(false);

if (fileInputRef.current) {
  fileInputRef.current.value = "";
}

// 🚀 navigate ONLY after everything is synced
setActiveView("transactions");
};


const fileInputRef = useRef(null);

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

await saveConfirmedTransactions(payload);

await refreshDashboardData();


const cardId = cards[activeCardIndex]._id;
setTransactions(await getTransactionsByCard(cardId));

setNewTxn({
  date: "",
  description: "",
  amount: "",
  type: "expense",
  category: "Other"
});

setShowAddTxn(false);

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

await refreshDashboardData();


const cardId = cards[activeCardIndex]._id;
setTransactions(await getTransactionsByCard(cardId));

  };





const handleBulkDelete = async () => {
  if (!selectedTxns.length) return;

  if (!window.confirm("Delete selected transactions permanently?")) return;

  const cardId = cards[activeCardIndex]?._id;
  if (!cardId) return;

  await fetch("http://localhost:5050/transactions/bulk-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ ids: selectedTxns })
  });

  // 🔄 Refresh everything cleanly (single source of truth)
  await refreshDashboardData(activeCardIndex);

  // 🧹 Reset UI state
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

const chartData = useMemo(() => {
  if (!allTransactions.length) return null;

  const map = {};

  allTransactions.forEach(t => {
    if (t.amount < 0) {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    }
  });

  if (!Object.keys(map).length) return null;

  return {
    labels: Object.keys(map),
    datasets: [
      {
        data: Object.values(map),
        backgroundColor: [
          "#ef4444",
          "#3b82f6",
          "#facc15",
          "#10b981",
          "#8b5cf6",
          "#fb923c"
        ]
      }
    ]
  };
}, [allTransactions]);


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
  ? allTransactions.filter(
      t => t.category === selectedCategory && t.amount < 0
    )
  : [];


const card = cards[Number(selectedUploadCardIndex)];

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

const handleAddCard = async () => {
  const name = prompt("Enter card name");
  if (!name) return;

  const last4 = prompt("Last 4 digits (optional)");
  if (last4 && !/^\d{0,4}$/.test(last4)) {
    alert("Last 4 digits must be up to 4 numbers");
    return;
  }

  try {
    const newCard = await createCard({
      name,
      last4: last4 || undefined,
      baseCurrency: "USD",
      displayCurrency: "USD"
    });

    
    const updatedCards = await getCards();
    setCards(updatedCards);

    const index = updatedCards.findIndex(
      c => c._id === newCard._id
    );

    setSelectedUploadCardIndex(index);
    setActiveCardIndex(index);
  } catch (err) {
    alert(err.message);
  }
};

const latestTxns = transactions
  .slice(0, 5);

const refreshActiveCardTransactions = async () => {
  if (!cards[activeCardIndex]) return;

  const cardId = cards[activeCardIndex]._id;
  const updated = await getTransactionsByCard(cardId);
  setTransactions(updated);

  const all = await getTransactions();
  setAllTransactions(all);
};

const handleAddPreviewTxn = () => {
  const today = new Date().toISOString().slice(0, 10);

  setPreview(prev => [
    {
      id: crypto.randomUUID?.() || Date.now(),
      selected: true,
      date: today,
      description: "",
      amount: -0,          // default expense
      category: "Other",
      confidence: 1,
      source: "manual"
    },
    ...prev
  ]);
};



return (
  <div className="dashboard-layout">
    {/* LEFT SIDEBAR */}
    <Sidebar onNavigate={setActiveView}
    activeView={activeView} />

    {/* RIGHT MAIN AREA */}
    <div className="dashboard-main">
      {/* TOP BAR */}
      <TopBar
  isPro={isPro}
  billingState={billingState}
  pricing={pricing}
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
  onUpgrade={startRazorpayCheckout}
  onManageBilling={() => setActiveView("billing")}
  onLogout={logout}
  onNavigate={setActiveView}
/>

{activeView === "billing" && <ManageBilling />}


      {/* CONTENT */}
      <div className="container dashboard-content">

{activeView === "profile" && (
  <ProfilePage onNavigate={setActiveView} />
)}


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
  <div className="chart-title-row">
    <h3>Where Your Money Went</h3>

    <div className="info-tooltip">
      <span className="info-icon">i</span>
      <div className="tooltip-content">
        <strong>Tips</strong>
        <ul>
          <li>
            Click on any <b>category in the chart</b> to see detailed spending.
          </li>
          <li>
            Click on any <b>category name or field below</b> to exclude it and
            explore deeper insights.
          </li>
        </ul>
      </div>
    </div>
  </div>

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
            {categoryCardChartData && <Pie data={categoryCardChartData} />}
          </>
        )}
      </div>
    </div>

    {selectedCategory && (
  <div className="subcat-txns">
    <div className="subcat-txns-header">
      <h4>{selectedCategory} Transactions</h4>
      <span>{categoryTransactions.length} items</span>
    </div>

    {categoryTransactions.length === 0 ? (
      <div className="subcat-empty">No transactions found</div>
    ) : (
      <div className="subcat-txns-list">
        {categoryTransactions.map(txn => (
          <div key={txn._id} className="subcat-txn">
            <div className="subcat-txn-left">
              <div className="subcat-txn-desc">
                {txn.description}
              </div>
              <div className="subcat-txn-meta">
                {txn.date} •{" "}
                {cards.find(c => c._id === txn.cardId)?.name || "Card"}
              </div>
            </div>

            <div className="subcat-txn-amount expense">
              {SYMBOL[txn.currency]}
              {Math.abs(txn.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


    {/* ================= ACTIVE CARD OVERVIEW ================= */}
    {cards[activeCardIndex] && (
      <div className="active-card-overview">
        <div className="active-card-header">
          <button
            className="card-nav-btn"
            disabled={activeCardIndex === 0}
            onClick={() => setActiveCardIndex(i => i - 1)}
          >
            ←
          </button>

          <div className="active-card-center">
           <h3 className="active-card-name">
  {cards[activeCardIndex].name}
  {cards[activeCardIndex].last4 && (
    <span> • {cards[activeCardIndex].last4}</span>
  )}
</h3>


            <p className="active-card-subtitle">
              Latest 5 transactions
            </p>
          </div>

          <button
            className="card-nav-btn"
            disabled={activeCardIndex === cards.length - 1}
            onClick={() => setActiveCardIndex(i => i + 1)}
          >
            →
          </button>
        </div>

        {latestTxns.length === 0 ? (
          <p className="muted">No transactions yet</p>
        ) : (
          <div className="active-card-txns">
            {latestTxns.map(txn => (
              <div key={txn._id} className="txn-row">
                <div className="txn-left">
                  <div className="txn-desc">{txn.description}</div>
                  <div className="txn-date">{txn.date}</div>
                </div>

                <div
                  className={
                    txn.amount < 0
                      ? "txn-amount expense"
                      : "txn-amount income"
                  }
                >
                  {SYMBOL[txn.currency]}
                  {Math.abs(txn.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </>
)}


        {/* ================= HEALTH ================= */}
        {activeView === "health" && (
          <HealthPage health={health} />
        )}

        {/* ================= UPLOAD ================= */}
      {activeView === "upload" && (
  <div className="upload-page">

    <h2>Upload & Preview</h2>

    {/* ================= UPLOAD ZONE ================= */}
 <div className="upload-zone">

  {/* REAL DROP TARGET */}
 <div
  className="upload-drop"
  onClick={() => fileInputRef.current?.click()}
  onDragOver={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles(Array.from(e.dataTransfer.files));
    setScanStatus({});
    setError("");
  setScanStarted(false);
  }}
>
  {files.length === 0 ? (
    /* EMPTY STATE */
    <>
      <div className="upload-icon">☁️</div>
      <h3>Drag & drop files here</h3>
      <p>
        or <span>click to browse</span>
      </p>
      <div className="upload-hint">
        Supports PDF, CSV, XLS, XLSX
      </div>
    </>
  ) : (
    /* FILES SELECTED STATE */
    <div className="upload-success">
      <div className="upload-check">✓</div>
      <h3>{files.length} file{files.length > 1 ? "s" : ""} selected</h3>

     <ul className="upload-file-list">
  {files.map((file, idx) => (
    <li key={idx} className="upload-file-item">
      <span className="upload-file-name">{file.name}</span>

      <button
        type="button"
        className="upload-file-remove"
        onClick={(e) => {
          e.stopPropagation(); // 🔥 important (don’t reopen file picker)
          setFiles(prev => prev.filter((_, i) => i !== idx));
        }}
        aria-label="Remove file"
      >
        ×
      </button>
    </li>
  ))}
</ul>

{scanStarted && Object.keys(scanStatus).length > 0 && (
  <ul className="upload-scan-status">
    {Object.entries(scanStatus).map(([name, info]) => (
      <li key={name} className={info.status}>
        <strong>{name}</strong>
        {info.status === "scanning" && " — scanning…"}
        {info.status === "success" && " — safe ✓"}
        {info.status === "failed" && ` — ${info.message}`}
      </li>
    ))}
  </ul>
)}


      <p className="upload-replace">
        Click or drop again to replace files
      </p>
    </div>
  )}
</div>


  {/* HIDDEN INPUT (CLICK ONLY) */}
  <input 
    ref={fileInputRef}
    type="file"
    multiple
    accept=".csv,.xls,.xlsx,.pdf"
    style={{ display: "none" }}
    onChange={(e) => {
  setFiles(Array.from(e.target.files));
  setScanStatus({});
  setError("");
  setScanStarted(false);
}}

  />

  <button
  className="upload-btn"
  onClick={handleUpload}
  disabled={scanning}
>
  {scanning ? "Scanning…" : "Upload / Preview"}
</button>
</div>

{/* 🔍 Scanning indicator */}
  {scanning && (
    <div className="upload-scanning">
      🔍 Scanning files for viruses…
    </div>
  )}

{infoMessage && (
  <div className="upload-info">
    ℹ️ {infoMessage}
  </div>
)}

  {/* 🔐 Security error */}
  {error && (
    <div className="upload-error security">
      🛑 {error}
    </div>
  )}


    {/* ================= PREVIEW ================= */}
{/* ================= PREVIEW ================= */}
{showPreview && (
  <>
    <h3>Preview Transactions</h3>

    <div className="preview-notice">
  <div className="preview-notice-icon">ℹ️</div>

  <div className="preview-notice-content">
    <strong>Please review transactions before confirming</strong>
    <p>
      Some bank statements (especially Chase ledger type) may format transactions in a way
      that can cause small extraction mistakes — most commonly in
      <span className="highlight"> income / credit transactions</span>.
      We recommend skimming once before confirming.
    </p>
    <p className="muted">
      You can edit or correct any transaction later after saving.
    </p>
  </div>
</div>


    <div className="upload-card-select">
      <strong>Post transactions to:</strong>

      <select
        value={selectedUploadCardIndex}
        onChange={(e) =>
          setSelectedUploadCardIndex(Number(e.target.value))
        }
      >
        {cards.map((card, idx) => (
          <option key={card._id} value={idx}>
            {card.name}
            {card.last4 ? ` (${card.last4})` : ""}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="upload-add-card"
        onClick={handleAddCard}
      >
        ➕ Add Card
      </button>

      <button
    type="button"
    className="upload-add-txn"
    onClick={handleAddPreviewTxn}
  >
    ➕ Add Transaction
  </button>

    </div>

    <table className="preview-table">
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
            <td>
              <input
                type="date"
                className="preview-input"
                value={t.date}
                onChange={(e) => {
                  const copy = [...preview];
                  copy[i].date = e.target.value;
                  setPreview(copy);
                }}
              />
            </td>

            {/* DESCRIPTION */}
            <td>
              <input
                className="preview-input"
                value={t.description}
                onChange={(e) => {
                  const copy = [...preview];
                  copy[i].description = e.target.value;
                  setPreview(copy);
                }}
              />
            </td>

            {/* AMOUNT */}
            <td>
              <input
                type="number"
                className="preview-input"
                value={Math.abs(t.amount)}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0;
                  const copy = [...preview];
                  copy[i].amount =
                    t.amount < 0 ? -value : value;
                  setPreview(copy);
                }}
              />
            </td>

            {/* TYPE */}
            <td>
              <div className="preview-type">
                <label>
                  <input
                    type="radio"
                    name={`amt-${i}`}
                    checked={t.amount > 0}
                    onChange={() => {
                      const copy = [...preview];
                      copy[i].amount = Math.abs(copy[i].amount);
                      setPreview(copy);
                    }}
                  />
                  Income
                </label>

                <label>
                  <input
                    type="radio"
                    name={`amt-${i}`}
                    checked={t.amount < 0}
                    onChange={() => {
                      const copy = [...preview];
                      copy[i].amount = -Math.abs(copy[i].amount);
                      setPreview(copy);
                    }}
                  />
                  Expense
                </label>
              </div>
            </td>

            {/* CATEGORY */}
            <td>
              <select
                className="preview-select"
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
                <option value="__add_new__">➕ Add new</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <button className="upload-confirm-btn" onClick={handleConfirm}>
      Confirm & Save
    </button>
  </>
)}
  </div>
)}  

        {/* ================= TRANSACTIONS ================= */}
        {activeView === "transactions" && (
  <TransactionsPage
    cards={cards}
    activeCardIndex={activeCardIndex}
    onRefresh={refreshActiveCardTransactions}
  />
)}

{activeView === "card-suggestions" && (
 <CardSuggestions
  isPro={isPro}
  pricing={pricing}
  billingState={billingState}
  onUpgrade={startRazorpayCheckout}
/>
)}




        {/* ================= BUDGET ================= */}
        {activeView === "budget" && (
  <BudgetPage
    categories={categories}
    cards={cards}
    allTransactions={allTransactions}
  />
)}

{/* ================= ANALYTICS ================= */}
{activeView === "analytics" && (
  <AnalyticsPage />
)}


{/* ================= HELP ================= */}
{activeView === "help" && (
  <HelpPage />
)}


      </div>
    </div>
  </div>
);
}

export default Dashboard;