import { useEffect, useState } from "react";
import {
  getBudgetSummary,
  saveBudget,
  deleteBudget
} from "../api";
import "./BudgetPage.css";

const SYMBOL = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};

const normalize = (str = "") =>
  str.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "").trim();

export default function BudgetPage({
  categories = [],
  cards = [],
  allTransactions = []
}) {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("ALL");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [pinned, setPinned] = useState({}); // ⭐ local pin state

  const MONTH = new Date().toISOString().slice(0, 7);

  /* =========================
     CATEGORY DISPLAY SYNC
     (DISPLAY ONLY)
     ========================= */
  const displayCategory = (budgetCategory) => {
    const match = categories.find(
      c => normalize(c) === normalize(budgetCategory)
    );
    return match || budgetCategory;
  };

  /* =========================
     LOAD BUDGETS
     ========================= */
  const reloadBudgets = async () => {
  try {
    const data = await getBudgetSummary(MONTH);
    setBudgets(Array.isArray(data) ? data : []);
  } catch {
    setBudgets([]);
  }
};

useEffect(() => {
  reloadBudgets();
}, [MONTH, categories, allTransactions, cards]);


  /* =========================
     CALCULATE SPENT (LIVE)
     ========================= */
  const spentFor = (b) => {
    const relevant =
      b.cardId === null
        ? allTransactions
        : allTransactions.filter(t => t.cardId === b.cardId);

    return relevant
      .filter(t => t.amount < 0 && t.category === b.category)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const cardFor = (b) =>
    b.cardId
      ? cards.find(c => c._id === b.cardId)
      : cards[0];

  /* =========================
     SAVE BUDGET
     ========================= */
  const handleSetBudget = async () => {
    if (!category || !budgetAmount) {
      alert("Select category and amount");
      return;
    }

    await saveBudget({
      category,
      amount: Number(budgetAmount),
      month: MONTH,
      scope,
      cardId: scope === "ALL" ? null : scope
    });

    const updated = await getBudgetSummary(MONTH);
    setBudgets(Array.isArray(updated) ? updated : []);

    setCategory("");
    setBudgetAmount("");
    setScope("ALL");
  };

  const handleDelete = async (id) => {
    await deleteBudget(id);
    setBudgets(prev => prev.filter(b => b._id !== id));
  };

  const togglePin = (id) => {
    setPinned(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /* =========================
     SORT PINNED FIRST
     ========================= */
  const sortedBudgets = [...budgets].sort(
    (a, b) => (pinned[b._id] ? 1 : 0) - (pinned[a._id] ? 1 : 0)
  );

  /* =========================
     UI
     ========================= */
  return (
    <div className="budget-page">
      <h2 className="budget-title">Monthly Budgets</h2>

      {/* ADD BUDGET */}
      <div className="budget-form">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={scope} onChange={e => setScope(e.target.value)}>
          <option value="ALL">All Cards</option>
          {cards.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Budget amount"
          value={budgetAmount}
          onChange={e => setBudgetAmount(e.target.value)}
        />

        <button onClick={handleSetBudget}>Set Budget</button>
      </div>

      {/* BUDGET LIST */}
      <div className="budget-list">
        {sortedBudgets.map(b => {
          const spent = spentFor(b);
          const percent = Math.min((spent / b.budget) * 100, 100);
          const over = spent > b.budget;

          const card = cardFor(b);
          const currency = SYMBOL[card?.displayCurrency || "USD"];

          return (
            <div
              key={b._id}
              className={`budget-card ${over ? "over" : ""}`}
            >
              <div className="budget-left">
                <div className="budget-name">
                  {displayCategory(b.category)}
                  {pinned[b._id] && <span className="pin">📌</span>}
                </div>

                <div className="budget-sub">
                  {b.cardId ? card?.name : "All Cards"}
                </div>

                <div className="budget-amount">
                  {currency}{spent.toFixed(2)} / {currency}{b.budget}
                  {over && <span className="over-text"> Over</span>}
                </div>
              </div>

              <div className="budget-right">
                <div className="budget-actions">
                  <button
                    className="icon-btn"
                    onClick={() => togglePin(b._id)}
                    title="Pin budget"
                  >
                    📌
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() => handleDelete(b._id)}
                    title="Delete budget"
                  >
                    ✕
                  </button>
                </div>

                {/* PROGRESS BAR (UNCHANGED) */}
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${percent}%`,
                      background:
                        percent < 60
                          ? "#22c55e"
                          : percent < 90
                          ? "#facc15"
                          : "#ef4444"
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
