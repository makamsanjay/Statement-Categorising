const BASE_URL = "http://localhost:5050";

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
};

export const getTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  return res.json();
};
