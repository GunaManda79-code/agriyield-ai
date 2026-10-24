
(() => {
  const form = document.getElementById("profit-form");

  if (!form) return;

  const getNumber = name =>
    Number(form.elements.namedItem(name).value);

  const money = value =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);

form.addEventListener("submit", async event => {    event.preventDefault();

    const crop = form.elements.namedItem("crop").value.trim();
    const area = getNumber("area");
    const unit = getNumber("area") >= 0
      ? form.elements.namedItem("unit").value
      : "acres";
    const yieldPerHectare = getNumber("yield");
    const pricePerQuintal = getNumber("price");

    const costNames = [
      "seeds",
      "fertilizer",
      "labour",
      "irrigation",
      "pesticides",
      "other"
    ];

    const costs = costNames.map(getNumber);

    if (
      !crop ||
      !Number.isFinite(area) || area <= 0 ||
      !Number.isFinite(yieldPerHectare) || yieldPerHectare <= 0 ||
      !Number.isFinite(pricePerQuintal) || pricePerQuintal < 0 ||
      costs.some(cost => !Number.isFinite(cost) || cost < 0)
    ) {
      document.getElementById("profit-message").textContent =
        "Please enter valid positive area and yield values, and non-negative prices and expenses.";
      return;
    }

    const hectares = unit === "acres"
      ? area * 0.4046856422
      : area;

    const acres = hectares / 0.4046856422;
    const productionTonnes = hectares * yieldPerHectare;
    const productionQuintals = productionTonnes * 10;

    const revenue = productionQuintals * pricePerQuintal;
    const expenses = costs.reduce((sum, cost) => sum + cost, 0);
    const netProfit = revenue - expenses;

    const profitPerAcre = netProfit / acres;
    const profitPerHectare = netProfit / hectares;

    document.getElementById("result-hectares").textContent =
      `${hectares.toFixed(3)} ha`;

    document.getElementById("result-production").textContent =
      `${productionTonnes.toFixed(2)} tonnes (${productionQuintals.toFixed(2)} quintals)`;

    document.getElementById("result-revenue").textContent =
      money(revenue);

    document.getElementById("result-expenses").textContent =
      money(expenses);

    document.getElementById("result-profit").textContent =
      money(netProfit);

    document.getElementById("result-per-acre").textContent =
      money(profitPerAcre);

    document.getElementById("result-per-hectare").textContent =
      money(profitPerHectare);

    
document.getElementById("profit-message").textContent =
  `${crop}: estimated ${netProfit >= 0 ? "profit" : "loss"} based on the values you entered.`;

const saveButton = form.querySelector('[type="submit"]');
if (saveButton) saveButton.disabled = true;

try {
  const response = await fetch("http://127.0.0.1:8000/api/profit/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crop,
      land_area: Number(hectares.toFixed(2)),
      area_unit: "hectares",
      expected_yield: Number(yieldPerHectare.toFixed(2)),
      expected_price: Number(pricePerQuintal.toFixed(2)),
      total_cost: Number(expenses.toFixed(2)),
      estimated_revenue: Number(revenue.toFixed(2)),
      estimated_profit: Number(netProfit.toFixed(2))
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to save the record.");
  }

  document.getElementById("profit-message").textContent +=
    " Saved to the database.";
} catch (error) {
  document.getElementById("profit-message").textContent +=
    " Database save failed; your calculation is still displayed.";
  console.error("Farm profit save error:", error);
} finally {
  if (saveButton) saveButton.disabled = false;
}

    });

    
  const savedProfitMessage = document.getElementById("saved-profit-message");
  const savedProfitBody = document.getElementById("saved-profit-body");
  const refreshProfitButton = document.getElementById("refresh-profit-records");

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  async function loadSavedProfitRecords() {
    savedProfitMessage.textContent = "Loading saved records...";
    savedProfitBody.innerHTML = "";

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/profit/records?limit=50"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load records.");
      }

      const records = data.records || [];

      if (records.length === 0) {
        savedProfitBody.innerHTML =
          '<tr><td colspan="6" style="padding:10px;">No saved records yet.</td></tr>';
      } else {
        savedProfitBody.innerHTML = records.map(record => `
          <tr>
            <td style="padding:10px;">${escapeHTML(record.crop)}</td>
            <td style="padding:10px;">${Number(record.land_area).toFixed(2)}</td>
            <td style="padding:10px;">${money(Number(record.estimated_revenue))}</td>
            <td style="padding:10px;">${money(Number(record.total_cost))}</td>
            <td style="padding:10px;">${money(Number(record.estimated_profit))}</td>
            <td style="padding:10px;">${escapeHTML(
              record.created_at
                ? new Date(record.created_at).toLocaleString("en-IN")
                : "—"
            )}</td>
          </tr>
        `).join("");
      }

      savedProfitMessage.textContent =
        `${records.length} saved record(s) loaded from MySQL.`;
    } catch (error) {
      savedProfitMessage.textContent =
        `Could not load saved records: ${error.message}`;
    }
  }

  refreshProfitButton.addEventListener("click", loadSavedProfitRecords);
  loadSavedProfitRecords();

})();
