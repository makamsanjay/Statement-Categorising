const BASE_URL = "http://localhost:5050";

/* =========================
   Upload (direct save)
========================= */
export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
};

/* =========================
   Preview before save
========================= */
export const previewUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload/preview`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Preview failed");
  }

  return res.json();
};

/* =========================
   Confirm & Save preview
========================= */
export const saveConfirmedTransactions = async (transactions) => {
  const res = await fetch(`${BASE_URL}/upload/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Save failed");
  }

  return res.json();
};

/* =========================
   Transactions
========================= */
export const updateCategory = async (id, category) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });

  return res.json();
};

export const getTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  return res.json();
};

export const fetchSummary = async (from, to) => {
  let url = `${BASE_URL}/transactions/summary`;

  if (from && to) {
    url += `?from=${from}&to=${to}`;
  }

  const res = await fetch(url);
  return res.json();
};

