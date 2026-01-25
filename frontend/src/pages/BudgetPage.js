import { useEffect, useState } from "react";
import {
  getBudgetSummary,
  saveBudget,
  deleteBudget
} from "../api";

export default function BudgetPage({
  categories = [],
  cards = [],
  allTransactions = []
}) {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("ALL");
  const [budgetAmount, setBudgetAmount] = useState("");

  const MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM

  /* =========================
     LOAD BUDGETS
     ========================= */
  useEffect(() => {
    getBudgetSummary(MONTH)
      .then(data => setBudgets(Array.isArray(data) ? data : []))
      .catch(() => setBudgets([]));
  }, [MONTH]);

  /* =========================
     CALCULATE SPENT
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

  /* =========================
     CREATE / UPDATE BUDGET
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

  const cardName = (b) =>
    b.cardId === null
      ? "All Cards"
      : cards.find(c => c._id === b.cardId)?.name || "Unknown Card";

  /* =========================
     UI
     ========================= */
  return (
    <div>
      <h2>Monthly Budgets</h2>

      {/* ADD BUDGET */}
      <div style={{ marginBottom: 16 }}>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          style={{ marginLeft: 8 }}
        >
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
          style={{ marginLeft: 8 }}
        />

        <button onClick={handleSetBudget} style={{ marginLeft: 8 }}>
          Set Budget
        </button>
      </div>

      {/* BUDGET LIST */}
      {budgets.map(b => {
        const spent = spentFor(b);
        const over = spent > b.budget;

        return (
          <div
            key={b._id}
            style={{
              padding: 12,
              marginBottom: 8,
              border: "1px solid #ddd",
              borderRadius: 6,
              background: over ? "#fee2e2" : "#ecfeff",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <div>
              <b>{b.category}</b> — {cardName(b)} <br />
              ${spent.toFixed(2)} / ${b.budget}
              {over && <span style={{ color: "red" }}> (Over budget)</span>}
            </div>

            <button
              onClick={() => handleDelete(b._id)}
              style={{
                background: "none",
                border: "none",
                color: "red",
                fontSize: 18,
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
