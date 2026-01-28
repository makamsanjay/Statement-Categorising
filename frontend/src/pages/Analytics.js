import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { getCards, getTransactions } from "../api";
import "./Analytics.css";

const SORTS = {
  HIGH: "high",
  LOW: "low",
  LATEST: "latest"
};

export default function AnalyticsPage({ refreshKey }) {
  /* ---------------- DATA ---------------- */
  const [cards, setCards] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  /* ---------------- FILTERS ---------------- */
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [globalSort, setGlobalSort] = useState(SORTS.HIGH);
  const [cardSort, setCardSort] = useState(SORTS.HIGH);

  const [globalCategory, setGlobalCategory] = useState(null);
  const [cardCategory, setCardCategory] = useState(null);

  /* ---------------- LOAD / REFRESH ---------------- */
  useEffect(() => {
    getCards().then(setCards);
  }, []);

  useEffect(() => {
    getTransactions().then(txns => {
      setAllTransactions([...txns]); // 🔥 force rerender
    });
  }, [refreshKey]);

  /* ---------------- DATE FILTER ---------------- */
  const filteredTxns = useMemo(() => {
    const now = new Date();

    return allTransactions.filter(t => {
      const d = new Date(t.date);

      if (range === "custom") {
        if (!customFrom || !customTo) return false;
        return d >= new Date(customFrom) && d <= new Date(customTo);
      }

      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - Number(range));
      return d >= cutoff;
    });
  }, [allTransactions, range, customFrom, customTo]);

  /* ---------------- HELPERS ---------------- */
  const sortTxns = (txns, sort) => {
    const list = [...txns];
    if (sort === SORTS.LATEST)
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === SORTS.HIGH)
      list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    else
      list.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    return list;
  };

  /* ================= GLOBAL ================= */
  const globalExpenseTxns = filteredTxns.filter(t => t.amount < 0);

  const globalBaseChartData = useMemo(() => {
    const map = {};
    globalExpenseTxns.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    if (!Object.keys(map).length) return null;
    return { labels: Object.keys(map), datasets: [{ data: Object.values(map) }] };
  }, [globalExpenseTxns]);

  const globalSubChartData = useMemo(() => {
    if (!globalCategory) return null;

    const map = {};
    globalExpenseTxns
      .filter(t => t.category === globalCategory)
      .forEach(t => {
        const card = cards.find(c => c._id === t.cardId);
        if (!card) return;
        map[card.name] = (map[card.name] || 0) + Math.abs(t.amount);
      });

    if (!Object.keys(map).length) return null;
    return { labels: Object.keys(map), datasets: [{ data: Object.values(map) }] };
  }, [globalExpenseTxns, globalCategory, cards]);

  const globalTxnsPanel = useMemo(() => {
    const base = globalCategory
      ? globalExpenseTxns.filter(t => t.category === globalCategory)
      : globalExpenseTxns;

    const sorted = sortTxns(base, globalSort);
    return globalCategory ? sorted : sorted.slice(0, 5);
  }, [globalExpenseTxns, globalCategory, globalSort]);

  /* ================= CARD ================= */
  const activeCard = cards[activeCardIndex];

  const cardExpenseTxns = useMemo(() => {
    if (!activeCard) return [];
    return filteredTxns.filter(
      t => t.cardId === activeCard._id && t.amount < 0
    );
  }, [filteredTxns, activeCard]);

  const cardChartData = useMemo(() => {
    const map = {};
    cardExpenseTxns.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    if (!Object.keys(map).length) return null;
    return { labels: Object.keys(map), datasets: [{ data: Object.values(map) }] };
  }, [cardExpenseTxns]);

  const cardTxnsPanel = useMemo(() => {
    const base = cardCategory
      ? cardExpenseTxns.filter(t => t.category === cardCategory)
      : cardExpenseTxns;

    const sorted = sortTxns(base, cardSort);
    return cardCategory ? sorted : sorted.slice(0, 5);
  }, [cardExpenseTxns, cardCategory, cardSort]);

  /* ================= JSX ================= */
  return (
    <div className="analytics-page">
      <h2>Analytics</h2>

      {/* DATE FILTER */}
      <div className="analytics-filters">
        <select value={range} onChange={e => setRange(e.target.value)}>
          <option value="30">Last 30 days</option>
          <option value="180">Last 6 months</option>
          <option value="365">Last year</option>
          <option value="custom">Custom</option>
        </select>

        {range === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </>
        )}
      </div>

      {/* GLOBAL */}
      <AnalyticsSection
        title="All Cards"
        chartData={globalCategory ? globalSubChartData : globalBaseChartData}
        onCategory={setGlobalCategory}
        selectedCategory={globalCategory}
        onClose={() => setGlobalCategory(null)}
        txns={globalTxnsPanel}
        sort={globalSort}
        setSort={setGlobalSort}
        cards={cards}
      />

      {/* CARD */}
      {activeCard && (
        <AnalyticsSection
          title={activeCard.name}
          chartData={cardChartData}
          onCategory={setCardCategory}
          selectedCategory={cardCategory}
          onClose={() => setCardCategory(null)}
          txns={cardTxnsPanel}
          sort={cardSort}
          setSort={setCardSort}
          cards={cards}
          arrows
          onPrev={() => {
            setCardCategory(null);
            setActiveCardIndex(i => i - 1);
          }}
          onNext={() => {
            setCardCategory(null);
            setActiveCardIndex(i => i + 1);
          }}
          disablePrev={activeCardIndex === 0}
          disableNext={activeCardIndex === cards.length - 1}
        />
      )}
    </div>
  );
}

/* ================= SECTION ================= */
function AnalyticsSection({
  title,
  chartData,
  onCategory,
  selectedCategory,
  onClose,
  txns,
  sort,
  setSort,
  cards,
  arrows,
  onPrev,
  onNext,
  disablePrev,
  disableNext
}) {
  return (
    <div className={`analytics-card ${selectedCategory ? "split" : ""}`}>
      <div className="analytics-split">

        <div className="analytics-chart">
          <div className="chart-header">
            {arrows && <button disabled={disablePrev} onClick={onPrev}>←</button>}
            <h3>{title}</h3>
            {arrows && <button disabled={disableNext} onClick={onNext}>→</button>}
          </div>

          {chartData && (
            <Pie
              data={chartData}
              options={{
                onClick: (_, el) => {
                  if (!el.length) return;
                  onCategory(chartData.labels[el[0].index]);
                }
              }}
            />
          )}
        </div>

        <div className="analytics-panel">
          <div className="analytics-txn-header">
            <h4>{selectedCategory || "Top Transactions"}</h4>

            <div className="analytics-actions">
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value={SORTS.HIGH}>Highest spend</option>
                <option value={SORTS.LOW}>Lowest spend</option>
                <option value={SORTS.LATEST}>Latest</option>
              </select>

              {selectedCategory && (
                <button className="analytics-close" onClick={onClose}>✕</button>
              )}
            </div>
          </div>

          <div className="analytics-txns scroll">
            {txns.map(t => {
              const card = cards.find(c => c._id === t.cardId);
              return (
                <div key={t._id} className="analytics-txn">
                  <div>
                    <div className="txn-desc">{t.description}</div>
                    <div className="txn-meta">
                      {t.date} • {card?.name || "Card"}
                    </div>
                  </div>
                  <strong>{Math.abs(t.amount).toFixed(2)}</strong>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
