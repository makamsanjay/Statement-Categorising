import { useEffect, useMemo, useState } from "react";
import {
  getCards,
  getTransactions,
  getCardSuggestions,
  getSavedCardSuggestions,
  deleteCardSuggestion
} from "../api";
import "./card-suggestions.css";

export default function CardSuggestionsPage({ isPro, onUpgrade }) {
  const [cards, setCards] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("all");
  const [cardId, setCardId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  /* ================= LOAD HISTORY ================= */

  useEffect(() => {
    if (!isPro) return;

    getSavedCardSuggestions()
      .then(data => {
        setHistory(data);
        if (data.length > 0) {
          setSelectedSuggestion(data[0]);
        }
      })
      .catch(() => {});
  }, [isPro]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!isPro) return;

    getCards().then(setCards);
    getTransactions().then(setAllTransactions);
  }, [isPro]);

  /* ================= HELPERS ================= */

  const getHistoryCardLabel = suggestion => {
    if (suggestion.scope !== "single" || !suggestion.cardId) {
      return "All cards";
    }

    const card = cards.find(
      c => String(c._id) === String(suggestion.cardId)
    );

    return card
      ? `${card.name}${card.last4 ? ` (${card.last4})` : ""}`
      : "Selected card";
  };

  const getSpendContextText = suggestion => {
  if (!suggestion || !suggestion.totalSpent || suggestion.totalSpent <= 0) {
    return null;
  }

  const amount = `${suggestion.currency} ${suggestion.totalSpent.toFixed(2)}`;
  const category = suggestion.category;

  // ✅ ALL CARDS
  if (suggestion.scope === "all") {
    return `You spent ${amount} on ${category} across all your cards.`;
  }

  // ✅ SINGLE CARD
  if (suggestion.scope === "single" && suggestion.cardId) {
    const card = cards.find(
      c => String(c._id) === String(suggestion.cardId)
    );

    const cardName = card
      ? `${card.name}${card.last4 ? ` (${card.last4})` : ""}`
      : "this card";

    return `You spent ${amount} on ${category} using ${cardName}.`;
  }

  return null;
};


  /* ================= DERIVED DATA ================= */

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

const categories = useMemo(() => {
  const set = new Set(DEFAULT_CATEGORIES);
  allTransactions.forEach(t => t.category && set.add(t.category));
  return Array.from(set);
}, [allTransactions]);


  const filteredTxns = useMemo(() => {
    if (!category) return [];

    return allTransactions.filter(t => {
      if (t.category !== category) return false;
      if (t.amount >= 0) return false;

      if (scope === "single" && cardId) {
        return t.cardId === cardId;
      }
      return true;
    });
  }, [allTransactions, category, scope, cardId]);

  const totalSpent = useMemo(() => {
    return filteredTxns.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
  }, [filteredTxns]);

  const currency =
    cards.find(c => c._id === cardId)?.displayCurrency ||
    cards[0]?.displayCurrency ||
    "USD";

  /* ================= ACTION ================= */

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCardSuggestions({
        category,
        scope,
        cardId: scope === "single" ? cardId : null,
        totalSpent,
        currency
      });

      setSelectedSuggestion(data);

      setHistory(prev => {
        const filtered = prev.filter(
          h =>
            !(
              h.category === data.category &&
              h.scope === data.scope &&
              String(h.cardId) === String(data.cardId)
            )
        );
        return [data, ...filtered];
      });

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FREE GATE ================= */

  if (!isPro) {
    return (
      <div className="card-suggestions-page">
        <h2>Card Suggestions</h2>

        <div className="card-suggestions-locked">
          <div className="locked-overlay">
            <h3>Upgrade to Pro</h3>
            <p>Unlock AI-powered cashback optimization.</p>
            <button className="upgrade-btn" onClick={onUpgrade}>
              Upgrade to Pro
            </button>
          </div>
          <FakeLayout />
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="card-suggestions-page">
      <h2>Card Suggestions</h2>

      {/* -------- INPUT BOX -------- */}
      <div className="card-suggestion-box">
        <div className="row">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Analyze</label>
          <select
            value={scope}
            onChange={e => {
              setScope(e.target.value);
              setCardId("");
            }}
          >
            <option value="all">All cards</option>
            <option value="single">Single card</option>
          </select>
        </div>

        {scope === "single" && (
          <div className="row">
            <label>Select card</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)}>
              <option value="">Choose card</option>
              {cards.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}{c.last4 ? ` (${c.last4})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="hint">
          Detected currency: <strong>{currency}</strong>
        </div>

        <button
          className="primary"
          disabled={!category || loading || (scope === "single" && !cardId)}
          onClick={handleGetSuggestions}
        >
          {loading ? "Analyzing…" : "Get Best Cashback"}
        </button>

        {error && <div className="error-box">{error}</div>}
      </div>

      {/* -------- RESULTS -------- */}
      {selectedSuggestion && (
        <div className="suggestion-results">
          <div className="results-header">
            <h3>Results</h3>
            <button
              className="close-btn"
              onClick={() => setSelectedSuggestion(null)}
            >
              ✕
            </button>
          </div>

          {getSpendContextText(selectedSuggestion) && (
  <p className="summary">
    {getSpendContextText(selectedSuggestion)}
  </p>
)}

{selectedSuggestion.summary && (
  <p className="summary muted">
    {selectedSuggestion.summary}
  </p>
)}


          {typeof selectedSuggestion.summary === "string" &&
            selectedSuggestion.summary.toLowerCase().includes("already") && (
              <div>
                
              </div>
            )}

          <CardGroup cards={selectedSuggestion.cards || []} />
        </div>
      )}

      {/* -------- HISTORY -------- */}
      <div className="suggestion-history">
        <h4>History</h4>

        {history.length === 0 && (
          <div className="muted">No saved suggestions yet</div>
        )}

        {history.map(item => (
          <div
            key={item._id}
            className={`history-item ${
              selectedSuggestion?._id === item._id ? "active" : ""
            }`}
            onClick={() => setSelectedSuggestion(item)}
          >
            <div>
              <strong>{item.category}</strong>
              <div className="muted small">
                {getHistoryCardLabel(item)}
              </div>
              <div className="muted small">
                {item.totalSpent > 0
                  ? `${item.currency} ${item.totalSpent.toFixed(2)} spent`
                  : "No spend yet"}
              </div>
            </div>

            <button
              className="delete-btn"
              onClick={async e => {
                e.stopPropagation();
                await deleteCardSuggestion(item._id);
                setHistory(h => h.filter(x => x._id !== item._id));
                if (selectedSuggestion?._id === item._id) {
                  setSelectedSuggestion(null);
                }
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function CardGroup({ cards }) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  return (
    <div className="card-grid">
      {cards.map((c, i) => (
        <div key={i} className="suggestion-card">
          <h5>{c.name}</h5>

          <div className="card-meta">
            {c.cardType === "paid"
              ? `Annual Fee: USD ${c.annualFee}`
              : "No Annual Fee"}
          </div>

          <div className="rate">
            Cashback: {c.cashbackRate}
          </div>

          <div className="savings">
            Estimated savings: <strong>{c.estimatedSavings}</strong>
          </div>

          {c.rotation &&
            c.rotation.active &&
            c.rotation.validUntil && (
              <div className="rotation-note">
                {c.rotation.note} • until {c.rotation.validUntil}
              </div>
            )}

          <p>{c.reason}</p>
        </div>
      ))}
    </div>
  );
}

/* ================= LOCKED UI ================= */

function FakeLayout() {
  return (
    <div className="card-suggestion-box blurred">
      <div className="row">
        <label>Category</label>
        <select disabled>
          <option>Shopping</option>
        </select>
      </div>
      <button disabled>Get Best Cashback</button>
    </div>
  );
}
