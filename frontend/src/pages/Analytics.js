import { useEffect, useMemo, useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import { getCards, getTransactions } from "../api";
import "./Analytics.css";

const SORTS = {
  HIGH: "high",
  LOW: "low",
  LATEST: "latest"
};

const CHARTS = {
  PIE: "pie",
  BAR: "bar",
  LINE: "line"
};

export default function AnalyticsPage({ refreshKey }) {
  /* ---------------- DATA ---------------- */
  const [cards, setCards] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  const [globalChartType, setGlobalChartType] = useState(CHARTS.PIE);
  const [cardChartType, setCardChartType] = useState(CHARTS.PIE);

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  

  /* ---------------- FILTERS ---------------- */
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [globalSort, setGlobalSort] = useState(SORTS.HIGH);
  const [cardSort, setCardSort] = useState(SORTS.HIGH);

  const [globalCategory, setGlobalCategory] = useState(null);
  const [cardCategory, setCardCategory] = useState(null);

  /* ---------------- LOAD ---------------- */
 useEffect(() => {
  getCards().then(setCards).catch(() => setCards([]));
}, []);

useEffect(() => {
  getTransactions()
    .then(txns => setAllTransactions([...txns]))
    .catch(() => setAllTransactions([]));
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

  const buildLineData = (txns) => {
    const map = {};
    txns.forEach(t => {
      const day = new Date(t.date).toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(map).sort();
    return {
      labels,
      datasets: [
        {
          label: "Spending",
          data: labels.map(l => map[l]),
          tension: 0.35,
          borderWidth: 2
        }
      ]
    };
  };
const globalExpenseTxns = filteredTxns.filter(t => t.amount < 0);

  const globalLineData = useMemo(
  () => buildLineData(globalExpenseTxns),
  [globalExpenseTxns]
);

/* ================= CARD ================= */
const activeCard = cards[activeCardIndex];

const cardExpenseTxns = useMemo(() => {
  if (!activeCard) return [];
  return filteredTxns.filter(
    t => t.cardId === activeCard._id && t.amount < 0
  );
}, [filteredTxns, activeCard]);

const cardLineData = useMemo(
  () => buildLineData(cardExpenseTxns),
  [cardExpenseTxns]
);


  /* ================= GLOBAL ================= */

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

      <AnalyticsSection
        title="All Cards"
        chartData={globalCategory ? globalSubChartData : globalBaseChartData}
        lineData={globalLineData}
        chartType={globalChartType}
        setChartType={setGlobalChartType}
        onCategory={setGlobalCategory}
        selectedCategory={globalCategory}
        onClose={() => setGlobalCategory(null)}
        txns={globalTxnsPanel}
        sort={globalSort}
        setSort={setGlobalSort}
        cards={cards}
      />

      {activeCard && (
        <AnalyticsSection
          title={activeCard.name}
          chartData={cardChartData}
          lineData={cardLineData}
          chartType={cardChartType}
          setChartType={setCardChartType}
          onCategory={setCardCategory}
          selectedCategory={cardCategory}
          onClose={() => setCardCategory(null)}
          txns={cardTxnsPanel}
          sort={cardSort}
          setSort={setCardSort}
          cards={cards}
          arrows
          onPrev={() => {
  if (activeCardIndex === 0) return;
  setCardCategory(null);
  setActiveCardIndex(i => i - 1);
}}

onNext={() => {
  if (activeCardIndex === cards.length - 1) return;
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
  lineData,
  chartType,
  setChartType,
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
    
    {/* INFO ICON – TOP RIGHT OF CARD */}
    <div className="analytics-info-tooltip">
      <span className="analytics-info-icon">i</span>

      <div className="analytics-tooltip-content">
        <strong>Tips</strong>
        <ul>
          <li>
            Click on any <b>category in the chart</b> to see detailed spending.
          </li>
          <li>
            Click on any <b>category name or field above</b> to exclude it and
            explore deeper insights.
          </li>
        </ul>
      </div>
    </div>

    <div className="analytics-split">
      <div className="analytics-chart">
        <div className="chart-header">
          {arrows && (
            <button disabled={disablePrev} onClick={onPrev}>←</button>
          )}
          <h3>{title}</h3>
          {arrows && (
            <button disabled={disableNext} onClick={onNext}>→</button>
          )}
        </div>

        {/* rest unchanged */}


          <div className="chart-switch">
            {Object.values(CHARTS).map(c => (
              <button
                key={c}
                className={chartType === c ? "active" : ""}
                onClick={() => setChartType(c)}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {chartData && chartType === CHARTS.PIE && (
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

          {chartData && chartType === CHARTS.BAR && (
            <Bar
              data={chartData}
              options={{
                onClick: (_, el) => {
                  if (!el.length) return;
                  onCategory(chartData.labels[el[0].index]);
                }
              }}
            />
          )}

          {lineData && chartType === CHARTS.LINE && (
            <Line data={lineData} />
          )}
        </div>

        <div className="analytics-panel">
          <div className="analytics-txn-header">
            <h4
  className={selectedCategory ? "clickable" : ""}
  onClick={() => selectedCategory && onClose()}
>
  {selectedCategory || "Top Transactions"}
</h4>


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
    const currency = card?.displayCurrency || "";

    return (
      <div key={t._id} className="analytics-txn">
        <div>
          <div className="txn-desc">{t.description}</div>
          <div className="txn-meta">
            {t.date} • {card?.name || "Card"}
          </div>
        </div>
        <strong>
          {currency} {Math.abs(t.amount).toFixed(2)}
        </strong>
      </div>
    );
  })}
</div>
        </div>
      </div>
    </div>
  );
}
