import { useEffect, useState } from "react";
import { uploadCSV, getTransactions } from "./api";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpload = async () => {
  if (!file) {
    alert("Select a CSV file");
    return;
  }

  console.log("Uploading file:", file);

  try {
    const res = await uploadCSV(file);
    console.log("Upload response:", res);
    fetchTransactions();
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed. Check console.");
  }
};


  return (
    <div className="container">
      <h2>Statement Categorising</h2>

      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload CSV</button>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.amount}</td>
              <td>{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



export default App;
