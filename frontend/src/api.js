const BASE_URL = "http://localhost:5050";

/* ============================
   AUTH FETCH (COOKIE BASED)
============================ */
const safeJson = async (res) => {
  const contentType = res.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(text || "Unexpected server response");
};

const authFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  console.log("🌐 API:", url, "STATUS:", res.status);
if (res.status === 401) {
  // only redirect ONCE
  if (!window.__loggingOut) {
    window.__loggingOut = true;
    window.location.replace("/login");
  }
  return res;
}

if (res.status === 429) {
  // NEVER logout or throw for rate limits
  return res;
}


  return res;
};


/* ============================
   UPLOAD
   ============================ */
export const previewUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${BASE_URL}/upload/preview`, {
    method: "POST",
    body: formData
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Preview failed");

  return data;
};

export const saveConfirmedTransactions = async ({
  transactions,
  detectedCard
}) => {
  const res = await authFetch(`${BASE_URL}/upload/confirm`, {
    method: "POST",
    body: JSON.stringify({
      transactions,
      detectedCard
    })
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(
      data.message || "Upgrade to Pro to upload more statements"
    );
  }

  return data;
};

/* ============================
   UPDATE TRANSACTION (FIXED)
   ============================ */
export const updateTransaction = async (id, data) => {
  const res = await authFetch(`${BASE_URL}/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return safeJson(res);
};

/* ============================
   TRANSACTIONS
   ============================ */
export const getTransactions = async () => {
  const res = await authFetch(`${BASE_URL}/transactions`);
  if (!res.ok) throw new Error("Failed to load transactions");
  return safeJson(res);
};

export const getTransactionsByCard = async (cardId) => {
  const res = await authFetch(
    `${BASE_URL}/transactions/card/${cardId}`
  );
  if (!res.ok) throw new Error("Failed to load transactions");
  return safeJson(res);
};

export const updateCategory = async (id, category) => {
  const res = await authFetch(`${BASE_URL}/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ category })
  });

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data.error || "Failed to update category");
  }

  return res.json();
};

/* ============================
   HEALTH
   ============================ */
export const fetchHealthScore = async () => {
  const res = await authFetch(`${BASE_URL}/health`);

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || "Failed to fetch health score");
  }

  return safeJson(res);
};

/* ============================
   CARDS
   ============================ */
export const getCards = async () => {
  const res = await authFetch(`${BASE_URL}/cards/summary`);

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || "Failed to load cards");
  }

  return safeJson(res);
};

export const createCard = async (card) => {
  const res = await authFetch(`${BASE_URL}/cards`, {
    method: "POST",
    body: JSON.stringify(card)
  });

  const data = await safeJson(res);

  if (!res.ok) {
    if (res.status === 409) {
      throw new Error(data.error || "Card name already exists");
    }
    if (res.status === 403) {
      throw new Error(
        data.message || "Upgrade to Pro to add more cards"
      );
    }
    throw new Error(data.error || "Failed to create card");
  }

  return data;
};

export const deleteCard = async (id) => {
  const res = await authFetch(
    `${BASE_URL}/cards/delete/${id}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || "Failed to delete card");
  }

  return safeJson(res);
};

export const renameCard = async (cardId, name) => {
  const res = await authFetch(
    `${BASE_URL}/cards/${cardId}/rename`,
    {
      method: "PUT",
      body: JSON.stringify({ name })
    }
  );

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.error || "Rename failed");
  }

  return data;
};

export const updateCardCurrency = async (
  cardId,
  displayCurrency
) => {
  const res = await authFetch(
    `${BASE_URL}/cards/currency/${cardId}`,
    {
      method: "PUT",
      body: JSON.stringify({ displayCurrency })
    }
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to update card currency"
    );
  }

  return safeJson(res);
};

/* ============================
   BILLING
   ============================ */
export const getBillingStatus = async () => {
  const res = await authFetch(`${BASE_URL}/billing/status`);

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to fetch billing status"
    );
  }

  return safeJson(res);
};

export const getBillingPricing = async () => {
  const res = await authFetch(`${BASE_URL}/billing/pricing`);

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to fetch pricing"
    );
  }

  return safeJson(res);
};


/* ============================
   BUDGETS
   ============================ */
export const getBudgetSummary = async (month) => {
  const res = await authFetch(
    `${BASE_URL}/budget/summary?month=${month}`
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to fetch budget summary"
    );
  }

  return safeJson(res);
};

export const saveBudget = async (data) => {
  const res = await authFetch(`${BASE_URL}/budget`, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(json?.error || "Failed to save budget");
  }

  return json;
};

export const deleteBudget = async (id) => {
  const res = await authFetch(
    `${BASE_URL}/budget/${id}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to delete budget"
    );
  }

  return safeJson(res);
};

/* ============================
   PROFILE
   ============================ */
export const getMyProfile = async () => {
  const res = await authFetch(`${BASE_URL}/users/me`);

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to load profile"
    );
  }

  return safeJson(res);
};

export const updateProfile = async (data) => {
  const res = await authFetch(`${BASE_URL}/users/me`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  const json = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      json?.error || "Failed to update profile"
    );
  }

  return json;
};

/* ============================
   SIGNUP / AUTH (PUBLIC)
   ============================ */
export const sendSignupOtp = async (email) => {
  const res = await fetch(
    `${BASE_URL}/auth/send-signup-otp`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      "OTP send failed"
    );
  }

  return data;
};

export const verifySignupOtp = async (email, otp) => {
  const res = await fetch(
    `${BASE_URL}/auth/verify-signup-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "OTP verification failed"
    );
  }

  return data;
};

export const signup = async ({ name, email, password }) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error || "Signup failed"
    );
  }

  return data;
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || "Login failed");

  window.dispatchEvent(new Event("auth-changed")); // 👈 ADD
  return data;
};

/* ============================
   PASSWORD RESET
   ============================ */
export async function sendForgotPasswordOTP(email) {
  const res = await fetch(
    `${BASE_URL}/auth/password/forgot`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to send OTP"
    );
  }

  return data;
}
/* ============================
   FORGOT PASSWORD
   ============================ */
export async function verifyForgotPasswordOTP(email, otp) {
  const res = await fetch(
    `${BASE_URL}/auth/password/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Invalid OTP"
    );
  }

  return data;
}

export async function resetPassword(email, password, confirmPassword) {
  const res = await fetch(
    `${BASE_URL}/auth/password/reset`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword })
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Password reset failed"
    );
  }

  return data;
}

/* ============================
   AI CARD SUGGESTIONS (PROTECTED)
   ============================ */
export async function getCardSuggestions(payload) {
  const res = await authFetch(
    `${BASE_URL}/ai/card-suggestions`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to get card suggestions"
    );
  }

  return data;
}

export async function getSavedCardSuggestions() {
  const res = await authFetch(
    `${BASE_URL}/ai/card-suggestions`
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to load suggestions"
    );
  }

  return safeJson(res);
}

export async function deleteCardSuggestion(id) {
  const res = await authFetch(
    `${BASE_URL}/ai/card-suggestions/${id}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to delete suggestion"
    );
  }

  return safeJson(res);
}

/* ============================
   CARD ORIGINAL NAME
   ============================ */
export async function updateOriginalCardName(cardId, payload) {
  const res = await authFetch(
    `${BASE_URL}/cards/${cardId}/original-card`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to save original card"
    );
  }

  return data;
}

export const deleteOriginalCardName = async (cardId) => {
  const res = await authFetch(
    `${BASE_URL}/cards/${cardId}/original-name`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to delete original card name"
    );
  }

  return res.json();
};

/* ============================
   BILLING
   ============================ */
export const createRazorpaySubscription = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/create-subscription`,
    { method: "POST" }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to start subscription"
    );
  }

  return data;
};
/* ============================
   BILLING
   ============================ */

export const cancelRazorpaySubscription = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/cancel`,
    { method: "POST" }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to cancel subscription"
    );
  }

  return data;
};

export const getManageBilling = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/manage`
  );

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(
      data?.error || "Failed to load billing"
    );
  }

  return safeJson(res);
};

export const resumeRazorpaySubscription = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/resume`,
    { method: "POST" }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Failed to resume subscription"
    );
  }

  return data;
};

export const startCheckout = async () => {
  const res = await authFetch(
    `${BASE_URL}/billing/create-subscription`,
    { method: "POST" }
  );

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || "Checkout failed"
    );
  }

  return data; // Razorpay subscription
};
