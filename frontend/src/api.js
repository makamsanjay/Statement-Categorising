const BASE_URL = "http://localhost:5050";

export const previewUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload/preview`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let message = "Preview failed";
    try {
      const err = await res.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
};

export const saveConfirmedTransactions = async (transactions) => {
  const res = await fetch(`${BASE_URL}/upload/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions }),
  });

  if (!res.ok) {
    throw new Error("Saving transactions failed");
  }

  return res.json();
};

export const getTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  return res.json();
};

export const updateCategory = async (id, category) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });

  return res.json();
};

export const fetchSummary = async () => {
  const res = await fetch(`${BASE_URL}/transactions/summary`);
  return res.json();
};

export const setBudget = async (category, amount, month) => {
  return fetch("http://localhost:5050/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, amount, month })
  }).then(r => r.json());
};

export const fetchBudgetSummary = async (month) => {
  return fetch(`http://localhost:5050/budgets/summary?month=${month}`)
    .then(r => r.json());
};

export const fetchHealthScore = async () => {
  const res = await fetch("http://localhost:5050/health");
  return res.json();
};

export const getCards = async () => {
  const res = await fetch("http://localhost:5050/cards/summary");
  return res.json();
};


export const createCard = async (card) => {
  const res = await fetch("http://localhost:5050/cards/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create card");
  }

  return res.json();
};


export const deleteCard = async (id) => {
  const res = await fetch(`http://localhost:5050/cards/delete/${id}`, {
    method: "DELETE"
  });
  return res.json();
};


export const getTransactionsByCard = async (cardId) => {
  const res = await fetch(`http://localhost:5050/transactions/card/${cardId}`);
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
};
