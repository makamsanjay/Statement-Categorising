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
