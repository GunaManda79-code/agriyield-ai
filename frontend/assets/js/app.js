
const API_BASE_URL = "http://127.0.0.1:8000/api";

// ========================================
// CROP YIELD PREDICTION
// ========================================
document.getElementById("predictionForm")?.addEventListener(
    "submit",
    async function (e) {
        e.preventDefault();

        const currentUser = JSON.parse(
            sessionStorage.getItem("agriYieldDemoUser") || "null"
        );

        if (!currentUser || !currentUser.id) {
            alert("Please log in before making a prediction.");
            window.location.href = "login.html";
            return;
        }

        const area = Number(document.getElementById("area").value);
        const areaUnit = document.getElementById("area_unit").value;

        if (!Number.isFinite(area) || area <= 0) {
            alert("Please enter a valid cultivated area greater than zero.");
            return;
        }

        const payload = {
            user_id: Number(currentUser.id),
            crop: document.getElementById("crop").value,
            rainfall: Number(document.getElementById("rainfall").value),
            temperature: Number(document.getElementById("temperature").value),
            humidity: Number(document.getElementById("humidity").value),
            soil_ph: Number(document.getElementById("soil_ph").value),
            nitrogen: Number(document.getElementById("nitrogen").value),
            phosphorus: Number(document.getElementById("phosphorus").value),
            potassium: Number(document.getElementById("potassium").value)
        };

        // Basic numeric validation
        const numericFields = [
            "rainfall",
            "temperature",
            "humidity",
            "soil_ph",
            "nitrogen",
            "phosphorus",
            "potassium"
        ];

        for (const field of numericFields) {
            if (!Number.isFinite(payload[field])) {
                alert(`Please enter a valid value for ${field.replace("_", " ")}.`);
                return;
            }
        }

        if (
            payload.rainfall < 0 ||
            payload.humidity < 0 ||
            payload.humidity > 100 ||
            payload.soil_ph < 0 ||
            payload.soil_ph > 14 ||
            payload.nitrogen < 0 ||
            payload.phosphorus < 0 ||
            payload.potassium < 0
        ) {
            alert("Please check your rainfall, humidity, soil pH, and nutrient values.");
            return;
        }

        document.getElementById("loading").classList.remove("d-none");
        document.getElementById("resultCard").classList.add("d-none");

        try {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.detail || "Prediction failed.");
            }

const yieldKgPerHectare = Number(data.predicted_yield);

if (
    !Number.isFinite(yieldKgPerHectare) ||
    yieldKgPerHectare < 0
) {
    throw new Error("The prediction service returned an invalid yield.");
}

// Convert cultivated area to hectares.
const areaHectares =
    areaUnit === "acres" ? area * 0.404686 : area;

// Dataset yield is kg/ha, so total production is in kg.
const totalKg = yieldKgPerHectare * areaHectares;
const totalTonnes = totalKg / 1000;
const numberOfBags = totalKg / 50;

document.getElementById("resCrop").textContent = data.crop;

// Display yield in kg/ha.
document.getElementById("resYield").textContent =
    yieldKgPerHectare.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });

document.getElementById("resUnit").textContent = "kg/ha";

const areaLabel = areaUnit === "acres" ? "acres" : "hectares";
const resArea = document.getElementById("resArea");

if (resArea) {
    resArea.textContent =
        `${area.toLocaleString("en-IN")} ${areaLabel}`;
}

// Total estimated production in kg.
document.getElementById("resWeight").textContent =
    totalKg.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });

document.getElementById("resBags").textContent =
    numberOfBags.toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });

document.getElementById("resultCard").classList.remove("d-none");

document.getElementById("resultCard").scrollIntoView({
    behavior: "smooth",
    block: "start"
});

        } catch (error) {
            console.error("Prediction error:", error);
            alert(error.message || "Unable to generate a prediction. Please try again.");
        } finally {
            document.getElementById("loading").classList.add("d-none");
        }
    }
);


// ========================================
// WEATHER AUTO-FILL
// ========================================
document.getElementById("autoFillWeatherBtn")?.addEventListener(
    "click",
    function () {
        const status = document.getElementById("autoFillWeatherStatus");

        if (!navigator.geolocation) {
            status.textContent =
                "Location is not supported by this browser.";
            return;
        }

        status.textContent =
            "Getting your location... Please allow location access.";

        navigator.geolocation.getCurrentPosition(
            async function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                status.textContent =
                    "Fetching local weather and recent rainfall...";

                try {
                    const params = new URLSearchParams({
                        latitude: latitude,
                        longitude: longitude,
                        current: "temperature_2m,relative_humidity_2m",
                        daily: "precipitation_sum",
                        past_days: "30",
                        forecast_days: "1",
                        timezone: "auto"
                    });

                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?${params}`
                    );

                    if (!response.ok) {
                        throw new Error("Weather service unavailable.");
                    }

                    const data = await response.json();

                    const temperature = data.current?.temperature_2m;
                    const humidity = data.current?.relative_humidity_2m;
                    const rainfallDays = data.daily?.precipitation_sum;

                    if (
                        temperature == null ||
                        humidity == null ||
                        !Array.isArray(rainfallDays)
                    ) {
                        throw new Error("Weather data is incomplete.");
                    }

                    // Fill current weather values.
                    document.getElementById("temperature").value =
                        temperature;

                    document.getElementById("humidity").value =
                        humidity;

                    // Sum available daily rainfall values.
                    const recentRainfall = rainfallDays
                        .slice(0, 30)
                        .filter(value => value != null)
                        .reduce((sum, value) => sum + value, 0);

                    const rainfallInfo =
                        document.getElementById("recentRainfallInfo");

                    const useRainfallBtn =
                        document.getElementById("useRecentRainfallBtn");

                    rainfallInfo.textContent =
                        `Recent 30-day rainfall: ${recentRainfall.toFixed(1)} mm`;

                    useRainfallBtn.disabled = false;
                    useRainfallBtn.dataset.rainfall = recentRainfall;

                    status.textContent =
                        `Weather filled successfully: ${temperature} °C, ` +
                        `${humidity}% humidity. Previous 30-day rainfall: ` +
                        `${recentRainfall.toFixed(1)} mm. This is not the ` +
                        `full crop-season rainfall. Enter the appropriate ` +
                        `growing-period rainfall manually.`;

                } catch (error) {
                    console.error("Weather auto-fill error:", error);

                    status.textContent =
                        "Could not fetch weather data. Please check your internet and try again.";
                }
            },

            function (error) {
                if (error.code === error.PERMISSION_DENIED) {
                    status.textContent =
                        "Location permission denied. Allow location access in your browser and try again.";
                } else {
                    status.textContent =
                        "Unable to get your location. Please try again.";
                }
            },

            {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000
            }
        );
    }
);


// ========================================
// USE RECENT RAINFALL
// ========================================
document.getElementById("useRecentRainfallBtn")?.addEventListener(
    "click",
    function () {
        const rainfall = Number(this.dataset.rainfall);

        if (!Number.isFinite(rainfall)) {
            document.getElementById("recentRainfallInfo").textContent =
                "Please fetch weather data first.";
            return;
        }

        document.getElementById("rainfall").value =
            rainfall.toFixed(1);

        document.getElementById("recentRainfallInfo").textContent =
            "Rainfall updated to " + rainfall.toFixed(1) +
            " mm. This is the previous 30-day total, not the full crop-season total.";
    }
);