
(() => {
  "use strict";

  const API_BASE = "http://127.0.0.1:8001/api";
  const CHAT_ENDPOINT = `${API_BASE}/chat`;
  const WEATHER_ENDPOINT = `${API_BASE}/weather`;
  const LANGUAGE_KEY = "agriYieldChatLanguage";

  const $ = id => document.getElementById(id);

  const form = $("chatForm");
  const input = $("messageInput");
  const messages = $("messages");
  const welcome = $("welcome");
  const historyList = $("historyList");
  const languageSelect = $("chatLanguage");
  const typing = $("typing");
  const sendButton = $("sendButton");

  let chats = [];
  let activeChatId = null;
  let busy = false;
  let toastTimer;
  let chatGeneration = 0;

  // Find the existing website login token.
  function getToken() {
    const keys = [
      "access_token",
      "accessToken",
      "token",
      "authToken",
      "agriYieldAccessToken",
      "agriYieldToken"
    ];

    for (const storage of [localStorage, sessionStorage]) {
      for (const key of keys) {
        const value = storage.getItem(key);
        if (value && value !== "undefined" && value !== "null") {
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === "string") return parsed;
            if (parsed?.access_token) return parsed.access_token;
            if (parsed?.token) return parsed.token;
          } catch {
            return value;
          }
        }
      }
    }

    return null;
  }

  function authHeaders() {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Login token not found. Please sign in to the AgriYield AI website first."
      );
    }

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your login session is invalid or expired. Sign in again."
        );
      }

      throw new Error(
        data.detail || data.error || `Request failed (${response.status})`
      );
    }

    return data;
  }

  function language() {
    return languageSelect.value || "en";
  }

  function currentChat() {
    return chats.find(chat => chat.id === activeChatId);
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      const area = $("chatArea");
      if (area) area.scrollTop = area.scrollHeight;
    });
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 145) + "px";
  }

  function setBusy(value) {
    busy = value;
    typing.hidden = !value;
    sendButton.disabled = value;
    input.disabled = value;

    if (!value) {
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    } else {
      scrollBottom();
    }
  }

  // Display messages safely.
  function drawMessage(role, content) {
    welcome.hidden = true;

    const row = document.createElement("article");
    row.className = `message ${role === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");
    avatar.className = role === "user" ? "user-avatar" : "bot-avatar";
    avatar.textContent = role === "user" ? "You" : "🌱";

    const body = document.createElement("div");
    body.className = "message-body";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = role === "user" ? "You" : "AgriYield AI";

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = String(content);

    body.append(meta, text);

    if (role !== "user") {
      const actions = document.createElement("div");
      actions.className = "message-actions";

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy response";

      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(String(content));
          showToast("Response copied");
        } catch {
          showToast("Clipboard access is unavailable");
        }
      });

      actions.append(copy);
      body.append(actions);
    }

    row.append(avatar, body);
    messages.append(row);
    scrollBottom();
  }

  // Load conversations belonging to the logged-in user.
  async function loadHistory() {
    try {
      const data = await apiRequest(`${API_BASE}/chats`);
      chats = (data.chats || []).map(chat => ({
        id: chat.id,
        title: chat.title || "New conversation",
        updatedAt: chat.updated_at || chat.created_at
      }));

      renderHistory();
    } catch (error) {
      chats = [];
      renderHistory();
      showToast(error.message);
    }
  }

  function renderHistory() {
    historyList.replaceChildren();

    if (!chats.length) {
      const empty = document.createElement("div");
      empty.className = "empty-history";
      empty.textContent = "Your saved conversations will appear here.";
      historyList.append(empty);
      return;
    }

    chats.forEach(chat => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "history-item" + (chat.id === activeChatId ? " active" : "");

      const icon = document.createElement("span");
      icon.className = "history-symbol";
      icon.textContent = "◌";

      const title = document.createElement("span");
      title.className = "history-title";
      title.textContent = chat.title;

      button.append(icon, title);

      button.addEventListener("click", () => openChat(chat.id));
      historyList.append(button);
    });
  }

  // Open a conversation from the database.
  async function openChat(id) {
    if (busy) return;

    const generation = ++chatGeneration;
    activeChatId = id;
    messages.replaceChildren();
    welcome.hidden = true;
    renderHistory();

    try {
      const data = await apiRequest(`${API_BASE}/chats/${id}`);

      if (generation !== chatGeneration) return;

      (data.messages || []).forEach(message => {
        drawMessage(message.role, message.content);
      });

      closeSidebar();
      scrollBottom();
    } catch (error) {
      if (generation === chatGeneration) {
        showToast(error.message);
        startNewChat();
      }
    }
  }

  // Start a fresh blank conversation without deleting saved chats.
  function startNewChat() {
    chatGeneration++;
    activeChatId = null;
    messages.replaceChildren();
    welcome.hidden = false;
    input.value = "";
    resizeInput();
    renderHistory();
    closeSidebar();

    if (!busy) input.focus();
  }

  // Send a message and save it through the backend.
  async function postChat(message) {
    const data = await apiRequest(CHAT_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        message,
        language: language(),
        chat_id: activeChatId
      })
    });

    if (data.chat_id == null) {
      throw new Error("The server did not return a conversation ID.");
    }

    return {
      reply: data.reply ?? data.response ?? data.answer,
      chatId: data.chat_id
    };
  }

  async function sendMessage(raw) {
    const message = String(raw || "").trim();
    if (!message || busy) return;

    const generation = chatGeneration;
    drawMessage("user", message);

    input.value = "";
    resizeInput();
    setBusy(true);

    try {
      const result = await postChat(message);

      if (generation !== chatGeneration) return;

      activeChatId = result.chatId;
      drawMessage("assistant", result.reply ?? "No response received.");
      await loadHistory();

      // Keep the current conversation selected.
      renderHistory();
    } catch (error) {
      if (generation === chatGeneration) {
        drawMessage("assistant", `Unable to send your message.\n\n${error.message}`);
      }
    } finally {
      setBusy(false);
    }
  }

  // Request real-time weather from the existing weather endpoint.
  async function askWeather() {
    if (busy) return;

    const city = window.prompt("Enter your town or city:", "Kakinada");
    if (!city?.trim()) return;

    const cleanCity = city.trim();
    const generation = chatGeneration;

    setBusy(true);

    try {
      const response = await fetch(WEATHER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: cleanCity,
          language: language()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Weather information is unavailable.");
      }

      if (generation !== chatGeneration) return;

      const answer = [
        `Weather for ${data.location || cleanCity}`,
        data.temperature_c != null ? `Temperature: ${data.temperature_c} °C` : null,
        data.feels_like_c != null ? `Feels like: ${data.feels_like_c} °C` : null,
        data.humidity_percent != null ? `Humidity: ${data.humidity_percent}%` : null,
        data.precipitation_mm != null ? `Precipitation: ${data.precipitation_mm} mm` : null,
        data.wind_speed_kmh != null ? `Wind speed: ${data.wind_speed_kmh} km/h` : null,
        data.rain_probability_percent != null
          ? `Rain probability: ${data.rain_probability_percent}%`
          : null,
        data.time ? `Updated: ${data.time}` : null,
        "Source: Open-Meteo"
      ].filter(Boolean).join("\n");

      // Keep weather display separate from saved AI conversations.
      drawMessage("assistant", answer);
    } catch (error) {
      if (generation === chatGeneration) {
        showToast(error.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function openSidebar() {
    $("sidebar").classList.add("open");
    $("overlay").classList.add("show");
  }

  function closeSidebar() {
    $("sidebar").classList.remove("open");
    $("overlay").classList.remove("show");
  }

  // Form submission.
  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("input", resizeInput);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  $("newChat").addEventListener("click", startNewChat);

  // Delete only the selected user's saved conversations.
  $("clearHistory").addEventListener("click", async () => {
    if (busy) {
      showToast("Please wait for the current response.");
      return;
    }

    if (!chats.length) {
      showToast("There are no saved conversations.");
      return;
    }

    if (!window.confirm("Delete all your saved conversations?")) return;

    try {
      for (const chat of [...chats]) {
        await apiRequest(`${API_BASE}/chats/${chat.id}`, {
          method: "DELETE"
        });
      }

      chats = [];
      startNewChat();
      renderHistory();
      showToast("Your chat history was cleared.");
    } catch (error) {
      showToast(error.message);
      await loadHistory();
    }
  });

  $("weatherButton").addEventListener("click", askWeather);
  $("openSidebar").addEventListener("click", openSidebar);
  $("overlay").addEventListener("click", closeSidebar);

  try {
    languageSelect.value = localStorage.getItem(LANGUAGE_KEY) || "en";
  } catch {
    languageSelect.value = "en";
  }

  languageSelect.addEventListener("change", () => {
    try {
      localStorage.setItem(LANGUAGE_KEY, languageSelect.value);
    } catch {}
    showToast("Language preference updated");
  });

  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });

  // Open with a blank chat while keeping saved chats in the sidebar.
  startNewChat();
  loadHistory();
})();
