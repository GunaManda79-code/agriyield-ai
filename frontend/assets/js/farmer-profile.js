
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("farmer-profile-form");
  const message = document.getElementById("profile-message");
  const reloadButton = document.getElementById("reload-profile");

  let user = null;

  try {
    user = JSON.parse(
      sessionStorage.getItem("agriYieldDemoUser") || "null"
    );
  } catch {
    user = null;
  }

  if (!user || !Number.isInteger(Number(user.id)) || Number(user.id) <= 0) {
    message.textContent = "Please log in to manage your farm profile.";
    form.querySelectorAll("input, select, button").forEach(control => {
      control.disabled = true;
    });
    return;
  }

  const userId = Number(user.id);
  const apiUrl = `/api/farmer-profile/${userId}`;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#ff9999" : "#86efac";
  }

  async function loadProfile() {
    showMessage("Loading your saved farm profile...");

    try {
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (response.status === 404) {
        form.reset();
        showMessage("No saved profile yet. Enter your details and save.");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.detail || "Could not load the profile.");
      }

      const profile = result.profile;

      for (const field of form.querySelectorAll("[name]")) {
        if (Object.hasOwn(profile, field.name)) {
          field.value = profile[field.name] ?? "";
        }
      }

      showMessage("Your saved farm profile has been loaded.");
    } catch (error) {
      showMessage(error.message || "Unable to load your profile.", true);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(form);
    const profile = Object.fromEntries(formData.entries());

    profile.user_id = userId;

    if (profile.farm_size === "") {
      profile.farm_size = null;
    } else if (profile.farm_size !== null) {
      profile.farm_size = Number(profile.farm_size);
    }

    showMessage("Saving your farm profile...");

    try {
      const response = await fetch("/api/farmer-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || "Could not save the profile.");
      }

      showMessage("Farm profile saved successfully!");
    } catch (error) {
      showMessage(error.message || "Unable to save your profile.", true);
    }
  });

  reloadButton.addEventListener("click", loadProfile);

  loadProfile();
});
