const BASE_URL = "http://localhost:5050";

/* ============================
   AUTH FETCH (SINGLE SOURCE)
   ============================ */
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Not authenticated. Please login again.");
  }

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

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Preview failed");

  return data;
};

export const saveConfirmedTransactions = async (transactions) => {
  const res = await authFetch(`${BASE_URL}/upload/confirm`, {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Upgrade to Pro to upload more statements");
  }

  return data;
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

/* ============================
   HEALTH
   ============================ */
export const fetchHealthScore = async () => {
  const res = await authFetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error("Failed to fetch health score");
  return res.json();
};

/* ============================
   CARDS
   ============================ */
export const getCards = async () => {
  const res = await authFetch(`${BASE_URL}/cards/summary`);
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
};

export const createCard = async (card) => {
  const res = await authFetch(`${BASE_URL}/cards`, {
    method: "POST",
    body: JSON.stringify(card),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 409) {
      throw new Error(data.error || "Card name already exists");
    }
    if (res.status === 403) {
      throw new Error(data.message || "Upgrade to Pro to add more cards");
    }
    throw new Error(data.error || "Failed to create card");
  }

  return data;
};

export const deleteCard = async (id) => {
  const res = await authFetch(`${BASE_URL}/cards/delete/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

export const renameCard = async (cardId, name) => {
  const res = await authFetch(`${BASE_URL}/cards/${cardId}/rename`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Rename failed");

  return data;
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

/* ============================
   BILLING (STRIPE)
   ============================ */
export const startCheckout = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/create-checkout-session`,
    { method: "POST" }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");

  window.location.href = data.url;
};

export const getBillingStatus = async () => {
  const res = await authFetch(`${BASE_URL}/billing/status`);
  if (!res.ok) throw new Error("Failed to fetch billing status");
  return res.json();
};

export const openBillingPortal = async () => {
  const res = await authFetch(`${BASE_URL}/billing/portal`, {
    method: "POST",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to open billing portal");

  return data.url;
};
