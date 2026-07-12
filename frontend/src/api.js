import axios from "axios";

// -----------------------------
// SEARCH API
// -----------------------------

export async function searchQuery(payload) {
  console.log("Search payload:", payload);

  const controller = new AbortController();
  const TIMEOUT_MS = 150000; // 15 seconds

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch("/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Search failed (${response.status}): ${errorText}`
      );
    }

    return await response.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Search request timed out after 15 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}


// -----------------------------
// CREATE REQUEST QUOTE API
// -----------------------------

export async function submitQuote(payload) {
  try {
    const response = await axios.post("/request_quote", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Quote submission failed!");
      console.error("Payload sent:", payload);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      console.error("Unexpected error during quote submission:", error);
      console.error("Payload sent:", payload);
    }

    throw error; // rethrow so your UI can handle it
  }
}


// -----------------------------
// GET QUOTE (for payment page)
// -----------------------------
export async function getQuoteByNumber(quoteNumber) {
  try {
    const response = await axios.get(
      `/request_quote_by_number/${quoteNumber}`
    );

    if (response.data.status !== "success") {
      throw new Error("Quote not found");
    }

    return response.data.quote;
  } catch (error) {
    console.error("Fetching quote failed:", error);
    throw error;
  }
}

// -----------------------------
// PAY QUOTE (PayFast sandbox)
// -----------------------------
export async function payQuote(quoteNumber) {
  try {
    const response = await axios.get(
      `/pay_quote/${quoteNumber}`, // ✅ FIXED
      { responseType: "text" }
    );

    // backend returns HTML form
    return response.data;
  } catch (error) {
    console.error("PayFast request failed:", error);
    throw error;
  }
}


// -----------------------------
// EARNINGS CALENDAR API
// -----------------------------
export async function getEarnings(limit = 100) {
  try {
    const response = await axios.get(
      `/earnings_calendar?limit=${limit}`
    );

    return response.data;
  } catch (error) {
    console.error("Fetching earnings failed:", error);
    throw error;
  }
}

// -----------------------------
// AUTH & PROFILE API
// -----------------------------
const AUTH_TOKEN_KEY = "quotemate_auth_token";

function getAuthHeader() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function registerUser(payload) {
  try {
    const response = await axios.post("/register", payload);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

export async function loginUser(payload) {
  try {
    const response = await axios.post("/login", payload);
    if (response.data?.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function googleLogin(code) {
  try {
    const response = await axios.post("/auth/google", { code });
    if (response.data?.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
}

export async function linkedinLogin(code) {
  try {
    const response = await axios.post("/auth/linkedin", { code });
    if (response.data?.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error("LinkedIn login failed:", error);
    throw error;
  }
}

export async function getUserProfile() {
  try {
    const response = await axios.get("/profile", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Fetching profile failed:", error);
    throw error;
  }
}

export async function updateUserProfile(payload) {
  try {
    const response = await axios.put("/profile", payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Updating profile failed:", error);
    throw error;
  }
}

// -----------------------------
// CONTACT FORM API
// -----------------------------
export async function submitContact(payload) {
  try {
    const response = await axios.post("/contact", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Contact submission failed:", error);
    throw error;
  }
}
