import { useState } from "react";
import "./ExportModal.css";

export default function ExportModal({ onClose, transactions }) {
  const [format, setFormat] = useState("csv");
  const [scope, setScope] = useState("filtered");
  const [includeCard, setIncludeCard] = useState(true);
  const [includeCategory, setIncludeCategory] = useState(true);

  const handleExport = async () => {
    if (format === "csv") exportCSV();
    if (format === "excel") exportExcel();
    if (format === "pdf") exportPDF();
  };

  const exportCSV = () => {
    const headers = ["Date", "Description", "Amount"];
    if (includeCategory) headers.push("Category");
    if (includeCard) headers.push("Card");

    const rows = transactions.map(t => {
      const row = [t.date, t.description, t.amount];
      if (includeCategory) row.push(t.category);
      if (includeCard) row.push(t.cardName || "");
      return row.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    download(blob, "transactions.csv");
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const data = transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Amount: t.amount,
      ...(includeCategory && { Category: t.category }),
      ...(includeCard && { Card: t.cardName })
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  const exportPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF();

    doc.text("Transactions", 14, 16);

    let y = 26;
    transactions.forEach(t => {
      doc.text(
        `${t.date} | ${t.description} | ${t.amount}`,
        14,
        y
      );
      y += 8;
    });

    doc.save("transactions.pdf");
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-overlay">
      <div className="export-card">
        <h3>Export Transactions</h3>

        {/* Format */}
        <div className="export-group">
          <label>Format</label>
          <div className="export-options">
            {["csv", "excel", "pdf"].map(f => (
              <button
                key={f}
                className={format === f ? "active" : ""}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="export-group">
          <label>Include</label>
          <label>
            <input
              type="checkbox"
              checked={includeCategory}
              onChange={e => setIncludeCategory(e.target.checked)}
            />
            Category
          </label>
         {/* <label>
            <input
              type="checkbox"
              checked={includeCard}
              onChange={e => setIncludeCard(e.target.checked)}
            />
            Card name
          </label> */}
        </div>

        {/* Actions */}
        <div className="export-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
