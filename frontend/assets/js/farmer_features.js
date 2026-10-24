(() => {
  const API = "http://127.0.0.1:8000/api/features";
  const $ = (id) => document.getElementById(id);
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  async function request(url, options={}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
    return data;
  }
  
function table(headers, rows) {
  if (!rows || rows.length === 0) {
    return '<p class="fy-panel">No records yet.</p>';
  }

  return `
    <div style="overflow-x: auto;">
      <table class="fy-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${safe(h.label)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${headers.map(h => {
                const value = row[h.key];
                return `<td>${safe(value ?? "-")}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

  async function initWeather() {
    const form=$("weather-form"), status=$("weather-status");
    form.addEventListener("submit", async e=>{
      e.preventDefault(); status.textContent="Loading weather…"; $("weather-current").innerHTML=""; $("weather-daily").innerHTML="";
      try {
        const city=new FormData(form).get("city");
        const data=await request(`${API}/weather?city=${encodeURIComponent(city)}`);
        const c=data.current||{}, u=data.units||{};
        status.textContent=`${data.location.name}${data.location.admin1?`, ${data.location.admin1}`:""}${data.location.country?`, ${data.location.country}`:""} · Source: ${data.source}`;
        const metrics=[
          ["Temperature",c.temperature_2m, u.temperature],["Feels like",c.apparent_temperature,u.temperature],
          ["Humidity",c.relative_humidity_2m,"%"],["Wind speed",c.wind_speed_10m,u.wind_speed],
          ["Current precipitation",c.precipitation,u.precipitation]
        ];
        $("weather-current").innerHTML=metrics.map(([label,val,unit])=>`<article class="fy-metric"><span>${safe(label)}</span><strong>${val==null?"—":safe(val)}${val==null?"":` ${safe(unit||"")}`}</strong></article>`).join("");
        const d=data.daily||{}, days=d.time||[];
        $("weather-daily").innerHTML=days.map((day,i)=>`<article class="fy-metric"><span>${safe(day)}</span><strong>${safe(d.temperature_2m_max?.[i]??"—")}° / ${safe(d.temperature_2m_min?.[i]??"—")}°</strong><small>Rain chance: ${safe(d.precipitation_probability_max?.[i]??"—")}%</small><br><small>Rain total: ${safe(d.precipitation_sum?.[i]??"—")} mm</small></article>`).join("");
        status.textContent += " · " + data.note;
      } catch(err) { status.textContent=`Weather could not be loaded: ${err.message}. Check internet connection and API server.`; }
    });
    form.requestSubmit();
  }
  
async function initWeatherHistory() {
    const form = $("weather-form");
    const historyBtn = $("weather-history-btn");
    const savedBtn = $("saved-weather-btn");

    if (!form || !historyBtn || !savedBtn) return;

    historyBtn.addEventListener("click", async () => {
        const city = new FormData(form).get("city").trim();
        const status = $("weather-history-status");
        const results = $("weather-history-results");

        status.textContent = "Loading previous five days...";
        results.innerHTML = "";

        try {
           const data = await request(
    `${API}/weather/saved?city=${encodeURIComponent(city)}`
);
            results.innerHTML = (data.history || []).map(item => `
                <article class="fy-metric">
                    <span>${safe(item.weather_date)}</span>
                    <strong>${safe(item.temperature ?? "—")} °C</strong>
                    <small>Humidity: ${safe(item.humidity ?? "—")}%</small>
                    <small>Rainfall: ${safe(item.rainfall ?? "—")} mm</small>
                </article>
            `).join("");

            status.textContent =
                `${data.records_saved_or_updated} historical records saved or updated for ${data.location}.`;
        } catch (err) {
            status.textContent =
                `Historical weather could not be loaded: ${err.message}`;
        }
    });

    savedBtn.addEventListener("click", async () => {
        const city = new FormData(form).get("city").trim();
        const status = $("saved-weather-status");
        const results = $("saved-weather-results");

        status.textContent = "Loading saved weather history...";
        results.innerHTML = "";

        try {
            const data = await request(
                `${API}/weather/history?city=${encodeURIComponent(city)}&days=5`
            );

            results.innerHTML = (data.history || []).map(item => `
                <article class="fy-metric">
                    <span>${safe(item.weather_date)}</span>
                    <strong>${safe(item.temperature ?? "—")} °C</strong>
                    <small>Humidity: ${safe(item.humidity ?? "—")}%</small>
                    <small>Rainfall: ${safe(item.rainfall ?? "—")} mm</small>
                </article>
            `).join("");

            status.textContent =
                `Showing saved history for ${data.location}.`;
        } catch (err) {
            status.textContent =
                `Saved weather history could not be loaded: ${err.message}`;
        }
    });
}

  async function loadSoil() {
    const data=await request(`${API}/soil-records`);
    $("soil-records").innerHTML=table([
      {key:"created_at",label:"Saved"},{key:"farmer_name",label:"Farmer"},{key:"location",label:"Location"},{key:"crop",label:"Crop"},
      {key:"soil_ph",label:"pH"},{key:"nitrogen",label:"N"},{key:"phosphorus",label:"P"},{key:"potassium",label:"K"},{key:"soil_moisture",label:"Moisture %"}
    ],data.records||[]);
  }
  async function initSoil() {
    const form=$("soil-form"), status=$("soil-status");
    try{await loadSoil();}catch(err){status.textContent=err.message;}
    form.addEventListener("submit",async e=>{
      e.preventDefault(); status.textContent="Saving record…";
      const raw=Object.fromEntries(new FormData(form).entries());
      for(const k of ["soil_ph","nitrogen","phosphorus","potassium","soil_moisture"]) raw[k]=raw[k]===""?null:Number(raw[k]);
      try{await request(`${API}/soil-records`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(raw)});status.textContent="Soil record saved.";form.reset();form.elements.farmer_name.value="Farmer";await loadSoil();}
      catch(err){status.textContent=`Could not save record: ${err.message}`;}
    });
  }
 
async function initIrrigation() {
  const form = $("irrigation-form");
  const result = $("irrigation-result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    result.textContent = "Checking inputs…";

    const f = new FormData(form);
    const params = new URLSearchParams();

    params.set("rainfall_mm", f.get("rainfall_mm"));

    if (f.get("soil_moisture_percent") !== "") {
      params.set(
        "soil_moisture_percent",
        f.get("soil_moisture_percent")
      );
    }

    if (f.get("forecast_rain_probability") !== "") {
      params.set(
        "forecast_rain_probability",
        f.get("forecast_rain_probability")
      );
    }

    try {
      const d = await request(
        `${API}/irrigation-advice?${params}`,
        { method: "POST" }
      );

    
const level = String(d.guidance_level || "").toLowerCase();

let title = "Check your field before watering";
let action = "Check the soil near the crop roots. Water only if the soil is dry.";
let icon = "🌱";

if (
  level.includes("wait") ||
  level.includes("low") ||
  level.includes("consider_waiting")
) {
  title = "You can wait before watering";
  action = "Recent rain or expected rain may reduce the need for watering. Check your soil again before irrigating.";
  icon = "🌧️";
} else if (
  level.includes("high") ||
  level.includes("irrigate") ||
  level.includes("water_now")
) {
  title = "Check if your crop needs water";
  action = "Check soil moisture near the roots. If the soil is dry, consider watering according to your crop's needs.";
  icon = "💧";
}

result.innerHTML = `
  <div class="fy-panel irrigation-recommendation-card">
    <p class="fy-eyebrow">YOUR IRRIGATION PLAN</p>
    <h2>${icon} ${title}</h2>
    <p>${safe(action)}</p>
    <h3>Why?</h3>
    <p>${safe(d.message || "Use local field conditions to guide your decision.")}</p>
    <p class="fy-note">${safe(d.note || "Check your crop and soil conditions before watering.")}</p>
  </div>`;
      
result.scrollIntoView({
  behavior: "smooth",
  block: "start"
});

    } catch (err) {
      result.textContent = err.message;
    }
  });
}

  
async function loadMarket(crop = "") {
  const status = $("market-status");
  const results = $("market-results");

  status.textContent = "Loading market prices...";
  results.innerHTML = "";

  try {
    const d = await request(
      `${API}/market-prices${crop ? `?crop=${encodeURIComponent(crop)}` : ""}`
    );

    const prices = (d.prices || [])
      .map(item => ({
        ...item,
        price_per_kg:
          Number(item.price_per_quintal) / 100
      }))
      .sort(
        (a, b) =>
          Number(b.price_per_quintal) -
          Number(a.price_per_quintal)
      );

    results.innerHTML = table([
      { key: "crop", label: "Crop" },
      { key: "market", label: "Market" },
      {
        key: "price_per_quintal",
        label: "Price / quintal (₹)"
      },
      {
        key: "price_per_kg",
        label: "Price / kg (₹)"
      },
     { key: "price_date", label: "Price date" },
{
  key: "source_note",
  label: "Price source",
  format: "source"
}
    ], prices);

    status.textContent =
      `${prices.length} market record(s) found. ${d.warning || ""}`;
  } catch (err) {
    status.textContent = err.message;
  }
}

  function initMarket() {
    $("market-form").addEventListener("submit",e=>{e.preventDefault();loadMarket(new FormData(e.currentTarget).get("crop").trim());});
    $("market-all").addEventListener("click",()=>{$("market-crop").value="";loadMarket();});
    loadMarket();
  }
 



async function initHistory() {
  const status = $("history-status");
  status.textContent = "Loading history…";

  const user = JSON.parse(
    sessionStorage.getItem("agriYieldDemoUser") || "null"
  );

  if (!user || !user.id) {
    status.textContent = "Please log in to view your prediction history.";
    return;
  }

  try {
    const d = await request(
      `http://127.0.0.1:8000/api/features/history?user_id=${encodeURIComponent(user.id)}`
    );

    const records = d.history || [];

    // Format the dates for the history table
    const formattedRecords = records.map(record => {
      let formattedDate = "—";

      if (record.created_at) {
        const date = new Date(record.created_at);

        if (!Number.isNaN(date.getTime())) {
          formattedDate = date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        }
      }

      return { ...record, created_at: formattedDate };
    });

    // Update summary cards
    const total = records.length;

    const differentCrops = new Set(
      records.map(record => record.crop).filter(Boolean)
    ).size;

    const yields = records
      .map(record => Number(record.predicted_yield))
      .filter(value => Number.isFinite(value));

    const averageYield = yields.length
      ? yields.reduce((sum, value) => sum + value, 0) / yields.length
      : null;

    $("history-total").textContent = total;
    $("history-crops").textContent = differentCrops;

    $("history-latest").textContent = records.length
  ? records[0].crop || "—"
  : "—";

    $("history-average").textContent = averageYield !== null
      ? averageYield.toFixed(2)
      : "—";

    // Display the existing history table
    $("history-results").innerHTML = table(
      [
        { key: "created_at", label: "Date & time" },
        { key: "crop", label: "Crop" },
        { key: "predicted_yield", label: "Predicted yield" },
        { key: "unit", label: "Unit" }
      ],
      formattedRecords
    );

    status.textContent = total
      ? "History loaded."
      : "No history records for this account yet.";

  } catch (err) {
    console.error("History loading error:", err);

    const message =
      typeof err === "string"
        ? err
        : err?.message || err?.detail || JSON.stringify(err);

    status.textContent = `Could not load history: ${message}`;
  }
}



async function initIrrigationWeatherAutoFill() {
  const button = document.getElementById("irrigationAutoFillBtn");
const status = document.getElementById("irrigationWeatherStatus");
const form = document.getElementById("irrigation-form");

  if (!button || !status || !form) return;

  button.addEventListener("click", () => {
    if (!navigator.geolocation) {
      status.textContent = "Location is not supported by this browser.";
      return;
    }

    status.textContent = "Getting your location...";
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const params = new URLSearchParams({
            latitude,
            longitude,
            daily: "precipitation_sum,precipitation_probability_max",
hourly: "soil_moisture_0_to_10cm",
            past_days: "30",
            forecast_days: "1",
            timezone: "auto"
          });

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params}`
          );

          if (!response.ok) {
            throw new Error("Weather service is unavailable.");
          }

          const data = await response.json();
          const soilMoistureValues = data.hourly?.soil_moisture_0_to_10cm || [];
const validSoilMoisture = soilMoistureValues.filter(value => value != null);

const soilMoistureEstimate = document.getElementById("soilMoistureEstimate");

if (validSoilMoisture.length > 0 && soilMoistureEstimate) {
    const latestMoisture = validSoilMoisture[validSoilMoisture.length - 1];

    soilMoistureEstimate.textContent =
        `Model-estimated soil moisture (0–10 cm): ${(latestMoisture * 100).toFixed(1)}% by volume. This is a weather-model estimate, not a field sensor reading.`;
} else if (soilMoistureEstimate) {
    soilMoistureEstimate.textContent =
        "Soil moisture estimate is unavailable for this location.";
}
          const rainfallDays = data.daily?.precipitation_sum;
          const probability =
            data.daily?.precipitation_probability_max?.[0];

          if (!Array.isArray(rainfallDays)) {
            throw new Error("Rainfall data is unavailable.");
          }

          const recentRainfall = rainfallDays
            .slice(0, 30)
            .filter(value => value != null)
            .reduce((sum, value) => sum + value, 0);

          form.elements.namedItem("rainfall_mm").value =
            recentRainfall.toFixed(1);

          const probabilityInput =
            form.elements.namedItem("forecast_rain_probability");

          if (probability != null) {
            if (probabilityInput && probability != null) {
    probabilityInput.value = probability;
}
          }

          status.textContent =
            `Recent 30-day rainfall: ${recentRainfall.toFixed(1)} mm. ` +
            (probability != null
              ? `Forecast maximum rain probability for the coming day: ${probability}%.`
              : "Forecast rain probability is unavailable.") +
            " Recent rainfall is not the full crop-season total.";

        } catch (error) {
          console.error(error);
          status.textContent =
            "Could not retrieve weather data. Please try again.";
        } finally {
          button.disabled = false;
        }
      },
      (error) => {
        status.textContent =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow location access and try again."
            : "Unable to obtain your location. Please try again.";

        button.disabled = false;
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  });
}

initIrrigationWeatherAutoFill();


window.AgriFeatures = {
    initWeather,
    initWeatherHistory,
    initIrrigation,
    initMarket,
    initHistory
};


})();