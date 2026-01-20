const BASE_URL = "http://localhost:5050";

/* ============================
   AUTH FETCH (FIXED)
   ============================ */
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");

  const isFormData = options.body instanceof FormData;

  return fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
};

/* ============================
   UPLOAD
   ============================ */
export const previewUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${BASE_URL}/upload/preview`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Preview failed");
  }

  return res.json();
};

export const saveConfirmedTransactions = async (transactions) => {
  const res = await authFetch(`${BASE_URL}/upload/confirm`, {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

  if (!res.ok) {
    throw new Error("Saving transactions failed");
  }

  return res.json();
};

/* ============================
   TRANSACTIONS
   ============================ */
export const getTransactions = async () => {
  const res = await authFetch(`${BASE_URL}/transactions`);
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
};

export const getTransactionsByCard = async (cardId) => {
  const res = await authFetch(`${BASE_URL}/transactions/card/${cardId}`);
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
};

export const updateCategory = async (id, category) => {
  const res = await authFetch(`${BASE_URL}/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ category }),
  });
  return res.json();
};

export const fetchSummary = async () => {
  const res = await authFetch(`${BASE_URL}/transactions/summary`);
  return res.json();
};

/* ============================
   BUDGETS / HEALTH
   ============================ */
export const setBudget = async (category, amount, month) => {
  return authFetch(`${BASE_URL}/budgets`, {
    method: "POST",
    body: JSON.stringify({ category, amount, month }),
  }).then((r) => r.json());
};

export const fetchBudgetSummary = async (month) => {
  return authFetch(`${BASE_URL}/budgets/summary?month=${month}`).then((r) =>
    r.json()
  );
};

export const fetchHealthScore = async () => {
  const res = await authFetch(`${BASE_URL}/health`);
  return res.json();
};

/* ============================
   CARDS
   ============================ */
export const getCards = async () => {
  const res = await authFetch(`${BASE_URL}/cards/summary`);
  return res.json();
};

export const createCard = async (card) => {
  const res = await authFetch(`${BASE_URL}/cards`, {
    method: "POST",
    body: JSON.stringify(card),
  });

  if (!res.ok) throw new Error("Failed to create card");
  return res.json();
};

export const deleteCard = async (id) => {
  const res = await authFetch(`${BASE_URL}/cards/delete/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

export const updateCardCurrency = async (cardId, displayCurrency) => {
  const res = await authFetch(`${BASE_URL}/cards/currency/${cardId}`, {
    method: "PUT",
    body: JSON.stringify({ displayCurrency }),
  });

  if (!res.ok) throw new Error("Failed to update card currency");
  return res.json();
};

/* ============================
   AUTH
   ============================ */
export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
};

export const signup = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
};

export const renameCard = async (cardId, name) => {
  const res = await authFetch(
    `http://localhost:5050/cards/${cardId}/rename`,
    {
      method: "PUT",
      body: JSON.stringify({ name })
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Rename failed");
  }

  return res.json();
};
