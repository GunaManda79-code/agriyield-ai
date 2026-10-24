
(() => {
  "use strict";

  const API_BASE = "http://127.0.0.1:8001/api";
  const CHAT_ENDPOINT = `${API_BASE}/chat`;
  const WEATHER_ENDPOINT = `${API_BASE}/weather`;
  const HISTORY_KEY = "agriYieldChatHistory";
  const LANGUAGE_KEY = "agriYieldChatLanguage";
  const MAX_CHATS = 30;

  const $ = id => document.getElementById(id);

  const form = $("chatForm");
  const input = $("messageInput");
  const messages = $("messages");
  const welcome = $("welcome");
  const historyList = $("historyList");
  const languageSelect = $("chatLanguage");
  const typing = $("typing");
  const sendButton = $("sendButton");

  let chats = readHistory();
  let activeChatId = null;
  let busy = false;
  let toastTimer;
  let chatGeneration = 0;

  // Read saved conversations from this browser.
  function readHistory() {
    try {
      const data = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // Save recent conversations locally.
  function saveHistory() {
    chats = chats.slice(0, MAX_CHATS);

    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.warn("Could not save chat history:", error);
    }
  }

  function language() {
    return languageSelect.value || "en";
  }

  function newId() {
    return (
      "chat-" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function currentChat() {
    return chats.find(chat => chat.id === activeChatId);
  }

  function getOrCreateChat(firstMessage) {
    let chat = currentChat();

    if (!chat) {
      chat = {
        id: newId(),
        title: firstMessage.slice(0, 48),
        updatedAt: Date.now(),
        messages: []
      };

      chats.unshift(chat);
      activeChatId = chat.id;
    }

    return chat;
  }

  // Display the recent-chat list.
  function renderHistory() {
    historyList.replaceChildren();

    if (!chats.length) {
      const empty = document.createElement("div");
      empty.className = "empty-history";
      empty.textContent = "Your chats will appear here.";
      historyList.append(empty);
      return;
    }

    chats.forEach(chat => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "history-item" +
        (chat.id === activeChatId ? " active" : "");

      const icon = document.createElement("span");
      icon.className = "history-symbol";
      icon.textContent = "◌";

      const title = document.createElement("span");
      title.className = "history-title";
      title.textContent = chat.title || "New chat";

      button.append(icon, title);

      button.addEventListener("click", () => {
        if (busy) {
          showToast("Please wait for the current response.");
          return;
        }

        openChat(chat.id);
      });

      historyList.append(button);
    });
  }

  // Open a saved conversation.
  function openChat(id) {
    if (busy) return;

    const chat = chats.find(item => item.id === id);
    if (!chat) return;

    // Invalidate any older pending response.
    chatGeneration++;

    activeChatId = id;
    messages.replaceChildren();
    welcome.hidden = true;

    chat.messages.forEach(item => {
      drawMessage(item.role, item.content, false);
    });

    renderHistory();
    scrollBottom();
    closeSidebar();
  }

  // Start a blank conversation without deleting recent chats.
  function startNewChat() {
    // Ignore late responses from the previous conversation.
    chatGeneration++;

    activeChatId = null;
    messages.replaceChildren();
    welcome.hidden = false;

    input.value = "";
    resizeInput();

    renderHistory();
    scrollBottom();
    closeSidebar();

    if (!busy) {
      input.focus();
    }
  }

  // Render a user or assistant message.
  function drawMessage(role, content, save = true) {
    welcome.hidden = true;

    const row = document.createElement("article");
    row.className =
      `message ${role === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");
    avatar.className =
      role === "user" ? "user-avatar" : "bot-avatar";
    avatar.textContent = role === "user" ? "You" : "🌱";

    const body = document.createElement("div");
    body.className = "message-body";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent =
      role === "user" ? "You" : "AgriYield AI";

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

    if (save && activeChatId) {
      const chat = currentChat();

      if (chat) {
        chat.messages.push({
          role,
          content: String(content)
        });

        chat.updatedAt = Date.now();

        if (role === "user" && chat.messages.length === 1) {
          chat.title = String(content).slice(0, 48);
        }

        chats.sort((a, b) => b.updatedAt - a.updatedAt);
        saveHistory();
        renderHistory();
      }
    }

    scrollBottom();
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      const area = $("chatArea");

      if (area) {
        area.scrollTop = area.scrollHeight;
      }
    });
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2300);
  }

  function setBusy(value) {
    busy = value;
    typing.hidden = !value;
    sendButton.disabled = value;
    input.disabled = value;

    if (value) {
      scrollBottom();
    } else {
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height =
      Math.min(input.scrollHeight, 145) + "px";
  }

  // Send a message to the existing FastAPI chatbot.
  async function postChat(message) {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        language: language()
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        `Chat request failed (${response.status})`
      );
    }

    const answer =
      data.response ??
      data.reply ??
      data.answer ??
      data.message;

    if (answer === undefined || answer === null) {
      throw new Error(
        "The API returned no answer. Check the response field in main.py."
      );
    }

    return typeof answer === "string"
      ? answer
      : JSON.stringify(answer, null, 2);
  }

  // Send a regular chatbot message.
  async function sendMessage(raw) {
    const message = String(raw || "").trim();

    if (!message || busy) return;

    getOrCreateChat(message);
    drawMessage("user", message, true);

    const requestGeneration = chatGeneration;

    input.value = "";
    resizeInput();
    setBusy(true);

    try {
      const answer = await postChat(message);

      // Never show an old reply in a newly created conversation.
      if (requestGeneration !== chatGeneration) return;

      drawMessage("assistant", answer, true);
    } catch (error) {
      if (requestGeneration !== chatGeneration) return;

      drawMessage(
        "assistant",
        `I couldn't connect to the chatbot service.

${error.message}

Check that FastAPI is running at ${API_BASE} and that the /api/chat request format matches this page.`,
        true
      );
    } finally {
      setBusy(false);
    }
  }

  // Fetch weather using the existing weather endpoint.
  async function askWeather() {
    if (busy) return;

    const city = window.prompt(
      "Enter your town or city:",
      "Kakinada"
    );

    if (!city || !city.trim()) return;

    const cleanCity = city.trim();
    const message = `Check the weather forecast for ${cleanCity}`;

    getOrCreateChat(message);
    drawMessage("user", message, true);

    const requestGeneration = chatGeneration;

    setBusy(true);

    try {
      let answer;

      try {
        const response = await fetch(
          `${WEATHER_ENDPOINT}?city=${encodeURIComponent(cleanCity)}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "Weather endpoint unavailable"
          );
        }

        const value =
          data.response ??
          data.reply ??
          data.answer ??
          data.message ??
          data.forecast ??
          data.summary;

        if (value === undefined || value === null) {
          throw new Error("Unexpected weather response format");
        }

        answer = typeof value === "string"
          ? value
          : JSON.stringify(value, null, 2);
      } catch {
        // Fallback to the existing AI chat API.
        answer = await postChat(message);
      }

      if (requestGeneration !== chatGeneration) return;

      drawMessage("assistant", answer, true);
    } catch (error) {
      if (requestGeneration !== chatGeneration) return;

      drawMessage(
        "assistant",
        `I couldn't retrieve weather for ${cleanCity}.

${error.message}`,
        true
      );
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

  // Submit the chat form.
  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });

  // Automatically resize the input.
  input.addEventListener("input", resizeInput);

  // Enter sends; Shift+Enter inserts a new line.
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  // New Chat: blank conversation, preserve other saved chats.
  $("newChat").addEventListener("click", startNewChat);

  // Clear: delete all saved recent chats after confirmation.
  $("clearHistory").addEventListener("click", () => {
    if (busy) {
      showToast("Please wait for the current response.");
      return;
    }

    if (!chats.length) {
      showToast("There are no saved chats to clear");
      return;
    }

    if (
      window.confirm(
        "Delete all saved conversations from this browser?"
      )
    ) {
      chats = [];
      activeChatId = null;

      saveHistory();
      startNewChat();

      showToast("Chat history cleared");
    }
  });

  // Weather and mobile sidebar controls.
  $("weatherButton").addEventListener("click", askWeather);
  $("openSidebar").addEventListener("click", openSidebar);
  $("overlay").addEventListener("click", closeSidebar);

  // Restore the saved language preference.
  try {
    languageSelect.value =
      localStorage.getItem(LANGUAGE_KEY) || "en";
  } catch {
    languageSelect.value = "en";
  }

  languageSelect.addEventListener("change", () => {
    try {
      localStorage.setItem(LANGUAGE_KEY, languageSelect.value);
    } catch {
      // Language selection still works for this page session.
    }

    showToast("Language preference updated");
  });

  // Welcome-screen prompt suggestions.
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });

  // Show saved chats in the sidebar without reopening one.
  renderHistory();

  // Start with a blank chat whenever the page loads.
  // Previously saved chats remain available in Recent Chats.
  startNewChat();
})();
