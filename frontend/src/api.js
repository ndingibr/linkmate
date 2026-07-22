import axios from "axios";

// -----------------------------
// AUTH & PROFILE API
// -----------------------------
const AUTH_TOKEN_KEY = "linkmate_auth_token";

function getAuthHeader() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem("linkmate_inbox");
  sessionStorage.removeItem("linkmate_sent");
}

export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function signUpUser(payload) {
  try {
    const response = await axios.post("/signup", payload);
    return response.data;
  } catch (error) {
    console.error("Sign up failed:", error);
    throw error;
  }
}

export async function activateUser(email, otp_code) {
  try {
    const response = await axios.post("/activate", { email, otp_code });
    return response.data;
  } catch (error) {
    console.error("Activation failed:", error);
    throw error;
  }
}

export async function signInUser(payload) {
  try {
    const response = await axios.post("/signin", payload);
    if (response.data?.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error("Sign in failed:", error);
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

export async function forgotPassword(email) {
  try {
    const response = await axios.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error("Forgot password request failed:", error);
    throw error;
  }
}

export async function resetPassword(payload) {
  try {
    const response = await axios.post("/reset-password", payload);
    return response.data;
  } catch (error) {
    console.error("Reset password failed:", error);
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
  const cleanPayload = { ...payload };
  
  if (cleanPayload.budget_min === "" || cleanPayload.budget_min === undefined) {
    cleanPayload.budget_min = null;
  } else if (cleanPayload.budget_min !== null) {
    cleanPayload.budget_min = parseFloat(cleanPayload.budget_min);
  }
  
  if (cleanPayload.budget_max === "" || cleanPayload.budget_max === undefined) {
    cleanPayload.budget_max = null;
  } else if (cleanPayload.budget_max !== null) {
    cleanPayload.budget_max = parseFloat(cleanPayload.budget_max);
  }

  try {
    const response = await axios.put("/profile", cleanPayload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Updating profile failed:", error);
    throw error;
  }
}

// -----------------------------
// USER INTENTIONS API
// -----------------------------
export async function getUserIntents() {
  try {
    const response = await axios.get("/users/intents", {
      headers: getAuthHeader(),
    });
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    // Fallback: check profile intents
    const profile = await getUserProfile();
    if (profile && Array.isArray(profile.intents) && profile.intents.length > 0) {
      return profile.intents;
    }
    return response.data || [];
  } catch (error) {
    console.error("Fetching intentions failed, trying profile fallback:", error);
    try {
      const profile = await getUserProfile();
      if (profile && Array.isArray(profile.intents)) {
        return profile.intents;
      }
    } catch (e) {}
    throw error;
  }
}

export async function createUserIntent(payload) {
  try {
    const response = await axios.post("/users/intents", payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Creating intention failed:", error);
    throw error;
  }
}

export async function updateUserIntent(id, payload) {
  try {
    const response = await axios.put(`/users/intents/${id}`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Updating intention failed:", error);
    throw error;
  }
}

export async function deleteUserIntent(id) {
  try {
    const response = await axios.delete(`/users/intents/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Deleting intention failed:", error);
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

export async function analyzeIntent(query) {
  try {
    const response = await axios.post("/users/analyze-intent", { query });
    return response.data;
  } catch (error) {
    console.error("Intent analysis failed:", error);
    throw error;
  }
}

export async function getOtherUserProfile(userId) {
  try {
    const response = await axios.get(`/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Fetching user profile for ${userId} failed:`, error);
    throw error;
  }
}

export async function getInboxMessages() {
  try {
    const response = await axios.get("/messages/inbox", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Fetching inbox messages failed:", error);
    throw error;
  }
}

export async function getSentMessages() {
  try {
    const response = await axios.get("/messages/sent", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Fetching sent messages failed:", error);
    throw error;
  }
}

export async function sendMessage(payload) {
  try {
    const response = await axios.post("/messages", payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Sending message failed:", error);
    throw error;
  }
}

export async function markMessageRead(messageId) {
  try {
    const response = await axios.put(`/messages/${messageId}/read`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Marking message ${messageId} as read failed:`, error);
    throw error;
  }
}

export async function getMatches() {
  try {
    const response = await axios.get("/users/matches", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Fetching matches failed:", error);
    throw error;
  }
}

export async function updateMatchStatus(matchId, action) {
  try {
    const response = await axios.put(`/users/matches/${matchId}/action`, { action }, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error(`Updating match ${matchId} failed:`, error);
    throw error;
  }
}

export async function getSeoLandingCopy(keyword) {
  try {
    const response = await axios.get("/seo/landing", { params: { keyword } });
    return response.data;
  } catch (error) {
    console.error("Fetching SEO landing copy failed:", error);
    throw error;
  }
}
