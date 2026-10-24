
const API_BASE = "http://127.0.0.1:8000/api/auth";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const messageBox = document.getElementById("message");

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

function switchTab(tab) {
    clearMessage();

    const isLogin = tab === "login";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;

    loginTab.classList.toggle("active", isLogin);
    registerTab.classList.toggle("active", !isLogin);
}

loginTab.addEventListener("click", () => switchTab("login"));
registerTab.addEventListener("click", () => switchTab("register"));

async function apiRequest(path, data) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.detail || "Request failed. Please try again."
        );
    }

    return result;
}

function saveSession(result) {
    if (!result.access_token || !result.user) {
        throw new Error("The server did not return a login token.");
    }

    sessionStorage.setItem(
        "agriYieldAccessToken",
        result.access_token
    );

    sessionStorage.setItem(
        "agriYieldDemoUser",
        JSON.stringify(result.user)
    );

    window.location.href = "index.html";
}

// Login using email and password.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = document.getElementById("loginEmail")
        .value.trim().toLowerCase();

    const password = document.getElementById("loginPassword").value;

    try {
        const result = await apiRequest("/login", {
            email,
            password
        });

        saveSession(result);
    } catch (error) {
        showMessage(error.message, "error");
    }
});

// Register using name, email, phone, and password.
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const fullName = document.getElementById("fullName")
        .value.trim();

    const email = document.getElementById("registerEmail")
        .value.trim().toLowerCase();

    const phoneNumber = document.getElementById("phoneNumber")
        .value.trim();

    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    try {
        const result = await apiRequest("/register", {
            full_name: fullName,
            email,
            phone_number: phoneNumber,
            password
        });

        showMessage(
            result.message || "Registration successful. Please log in."
        );

        registerForm.reset();
        switchTab("login");
        document.getElementById("loginEmail").value = email;
    } catch (error) {
        showMessage(error.message, "error");
    }
});
