
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sowing-form");
    const cropInput = document.getElementById("sowing-crop");
    const locationInput = document.getElementById("sowing-location");
    const seasonInput = document.getElementById("sowing-season");
    const dateInput = document.getElementById("sowing-date");
    const status = document.getElementById("sowing-status");
    const results = document.getElementById("sowing-results");

    if (!form || !cropInput || !locationInput ||
        !seasonInput || !dateInput || !status || !results) {
        console.error("Crop Sowing Calendar: required HTML elements are missing.");
        return;
    }

    // Illustrative activity intervals, counted from the planned sowing date.
    const cropActivities = {
        Rice: [
            { day: 0, title: "Sowing / transplanting", detail: "Prepare the field and follow the recommended planting method." },
            { day: 7, title: "Seedling establishment check", detail: "Check plant establishment and gaps in the field." },
            { day: 21, title: "Nutrient management check", detail: "Check crop growth and follow local fertilizer recommendations." },
            { day: 35, title: "Weed management", detail: "Inspect the field for weeds and manage them appropriately." },
            { day: 60, title: "Crop health inspection", detail: "Check for pests, diseases, and water stress." },
            { day: 90, title: "Growth and maturity check", detail: "Monitor crop development and follow variety-specific guidance." }
        ],
        Maize: [
            { day: 0, title: "Sowing", detail: "Sow using locally recommended spacing and seed depth." },
            { day: 7, title: "Germination check", detail: "Check emergence and identify missing plants." },
            { day: 20, title: "Weed inspection", detail: "Inspect for weeds and manage them appropriately." },
            { day: 30, title: "Crop nutrition check", detail: "Review crop growth and local fertilizer recommendations." },
            { day: 50, title: "Pest and disease check", detail: "Inspect leaves and stems for crop health issues." },
            { day: 90, title: "Maturity monitoring", detail: "Check maturity using the selected variety's guidance." }
        ],
        Cotton: [
            { day: 0, title: "Sowing", detail: "Plant according to local spacing and variety recommendations." },
            { day: 10, title: "Plant establishment check", detail: "Check germination and seedling health." },
            { day: 25, title: "Weed inspection", detail: "Inspect the field and manage weeds appropriately." },
            { day: 45, title: "Nutrition and growth check", detail: "Review crop growth and recommended nutrient management." },
            { day: 65, title: "Pest scouting", detail: "Inspect for bollworms, sucking pests, and other local pest risks." },
            { day: 120, title: "Boll development check", detail: "Monitor boll development and crop health." }
        ],
        Groundnut: [
            { day: 0, title: "Sowing", detail: "Prepare suitable soil and sow healthy seed." },
            { day: 7, title: "Germination check", detail: "Check plant emergence and establishment." },
            { day: 20, title: "Weed management", detail: "Inspect for weeds and manage them appropriately." },
            { day: 30, title: "Crop nutrition check", detail: "Review crop growth and locally recommended nutrients." },
            { day: 45, title: "Flowering and pegging check", detail: "Inspect flowering, pegging, and soil moisture." },
            { day: 90, title: "Pod development check", detail: "Monitor pod development and signs of maturity." }
        ],
        Chilli: [
            { day: 0, title: "Planting", detail: "Transplant healthy seedlings according to local recommendations." },
            { day: 7, title: "Seedling establishment check", detail: "Check transplant recovery and plant health." },
            { day: 20, title: "Weed inspection", detail: "Inspect for weeds and manage them appropriately." },
            { day: 35, title: "Nutrition check", detail: "Review plant growth and recommended nutrient management." },
            { day: 50, title: "Pest and disease scouting", detail: "Check leaves and fruits for common crop health issues." },
            { day: 80, title: "Flowering and fruiting check", detail: "Monitor flowering, fruit development, and plant health." }
        ]
    };

    function formatDate(date) {
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const crop = cropInput.value;
        const location = locationInput.value.trim();
        const season = seasonInput.value;
        const sowingDate = new Date(`${dateInput.value}T12:00:00`);

        if (!cropActivities[crop] || !location || !season ||
            !dateInput.value || Number.isNaN(sowingDate.getTime())) {
            status.textContent = "Please complete all fields with valid details.";
            results.innerHTML = "";
            return;
        }

        const activities = cropActivities[crop];

        const cards = activities.map((activity, index) => {
            const activityDate = new Date(sowingDate);
            activityDate.setDate(activityDate.getDate() + activity.day);
            const today = new Date();
today.setHours(0, 0, 0, 0);

const plannedDate = new Date(activityDate);
plannedDate.setHours(0, 0, 0, 0);

const daysUntil = Math.round(
    (plannedDate - today) / (1000 * 60 * 60 * 24)
);

let reminderStatus = "";

if (daysUntil < 0) {
    reminderStatus = "Overdue";
} else if (daysUntil === 0) {
    reminderStatus = "Due today";
} else if (daysUntil <= 7) {
    reminderStatus = "Coming up soon";
} else {
    reminderStatus = "Scheduled";
}

            return `
                <article class="fy-panel sowing-activity">
                    <p><strong>Activity ${index + 1}</strong></p>
                    <h3>${activity.title}</h3>
                    <p class="sowing-reminder-status ${reminderStatus.toLowerCase().replaceAll(" ", "-")}">
    <strong>Reminder:</strong> ${reminderStatus}
</p>
                    <p><strong>Planned date:</strong> ${formatDate(activityDate)}</p>
                    <p>${activity.detail}</p>
                    <label>
                        <input type="checkbox" class="sowing-complete"
       data-activity-index="${index}">
                        Mark as completed
                    </label>
                </article>
            `;
        }).join("");

        status.textContent =
            `Illustrative plan for ${crop} in ${location}, ${season} season. ` +
            `Dates are calculated from your planned sowing date.`;

        results.innerHTML = `
            <div class="sowing-plan-summary">
                <h3>${crop} growing plan</h3>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Season:</strong> ${season}</p>
                <p><strong>Sowing date:</strong> ${formatDate(sowingDate)}</p>
                <p><strong>Planned activities:</strong> ${activities.length}</p>
            </div>
            <div class="sowing-activity-list">${cards}</div>
            <p class="sowing-disclaimer">
                These are general planning estimates, not location-verified
                agricultural advice. Actual timing varies by crop variety,
                climate, soil, and local agricultural recommendations.
                Completion status is temporary and is not saved after refresh.
            </p>
        `;
        // Restore saved checkbox states for this crop plan
const storageKey = `agriSowing_${crop}_${location}_${season}_${dateInput.value}`;

results.querySelectorAll(".sowing-complete").forEach((checkbox) => {
    const index = checkbox.dataset.activityIndex;

    checkbox.checked =
        localStorage.getItem(`${storageKey}_${index}`) === "true";

    checkbox.addEventListener("change", () => {
        localStorage.setItem(
            `${storageKey}_${index}`,
            checkbox.checked ? "true" : "false"
        );
    });
});
        results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
