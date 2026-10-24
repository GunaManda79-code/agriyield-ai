
document.addEventListener("DOMContentLoaded", () => {
  const accountName = document.getElementById("account-name");
  const logoutButton = document.getElementById("logout-button");

  let user = null;

  try {
    user = JSON.parse(
      sessionStorage.getItem("agriYieldDemoUser") || "null"
    );
  } catch {
    sessionStorage.removeItem("agriYieldDemoUser");
  }

  if (user && user.full_name) {
    accountName.textContent = `Hi, ${user.full_name}`;
  } else {
    accountName.textContent = "Guest";
  }

  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("agriYieldDemoUser");
    window.location.href = "login.html";
  });
});
