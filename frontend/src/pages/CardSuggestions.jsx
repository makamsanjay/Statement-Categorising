import { useEffect, useMemo, useState } from "react";
import { getCards, getTransactions, getCardSuggestions } from "../api";
import "./card-suggestions.css";

export default function CardSuggestionsPage({ isPro, onUpgrade }) {
  const [cards, setCards] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("all");
  const [cardId, setCardId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    if (!isPro) return;

    getCards().then(setCards);
    getTransactions().then(setAllTransactions);
  }, [isPro]);

  /* ---------------- DERIVED DATA ---------------- */

  const categories = useMemo(() => {
    const set = new Set();
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

  /* ---------------- ACTION ---------------- */

const handleGetSuggestions = async () => {
  setLoading(true);
  setError(null);

  try {
    const data = await getCardSuggestions({
      category,
      scope,
      cardId: scope === "single" ? cardId : null,
      totalSpent,
      currency
    });

    console.log("🔥 RAW AI RESPONSE:", data); // ← ADD THIS
    setResult(data);
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};


  /* ---------------- FREE GATE ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <div className="card-suggestions-page">
      <h2>Card Suggestions</h2>

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

      {/* ---------------- RESULTS ---------------- */}

      {result && (
        <div className="suggestion-results">
          <h3>Results</h3>

          <p className="summary">
            {totalSpent > 0
              ? result.summary
              : `You haven’t spent anything on ${category} yet.
                 Use these cards next time for maximum cashback.`}
          </p>

          <CardGroup cards={result.cards} />
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */
function CardGroup({ title, cards }) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return (
      <>
        <h4>{title}</h4>
        <div className="empty-state">
          No card recommendations available.
        </div>
      </>
    );
  }

  return (
    <>
      <h4>{title}</h4>
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

      {c.rotation && (
        <div className="rotation-note">
          🔄 {c.rotation.quarter} • Valid until {c.rotation.validUntil}
        </div>
      )}

      <p>{c.reason}</p>
    </div>
  ))}
</div>
    </>
  );
}


/* ---------- LOCKED FAKE LAYOUT ---------- */

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
