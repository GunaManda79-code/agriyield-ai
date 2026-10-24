
# Illustrative crop market prices for AgriYield AI.
# These are simulated estimates, NOT actual mandi prices.
# Prices are in INR per quintal.

ESTIMATED_MARKET_DATA = [
    {
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "market": "Rajamahendravaram",
        "crop": "Paddy",
        "min_price": 1900,
        "max_price": 2400,
        "modal_price": 2200,
    },
    {
        "state": "Andhra Pradesh",
        "district": "Kakinada",
        "market": "Samalkot",
        "crop": "Maize",
        "min_price": 1700,
        "max_price": 2200,
        "modal_price": 1950,
    },
    {
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "market": "Guntur",
        "crop": "Chilli",
        "min_price": 8000,
        "max_price": 18000,
        "modal_price": 12000,
    },
    {
        "state": "Telangana",
        "district": "Nizamabad",
        "market": "Nizamabad",
        "crop": "Maize",
        "min_price": 1700,
        "max_price": 2300,
        "modal_price": 2000,
    },
    {
        "state": "Karnataka",
        "district": "Belagavi",
        "market": "Belagavi",
        "crop": "Sugarcane",
        "min_price": 250,
        "max_price": 400,
        "modal_price": 320,
    },
    {
        "state": "Tamil Nadu",
        "district": "Thanjavur",
        "market": "Thanjavur",
        "crop": "Paddy",
        "min_price": 1800,
        "max_price": 2500,
        "modal_price": 2150,
    },
    {
        "state": "Maharashtra",
        "district": "Pune",
        "market": "Pune",
        "crop": "Groundnut",
        "min_price": 4500,
        "max_price": 6500,
        "modal_price": 5500,
    },
    {
        "state": "Punjab",
        "district": "Ludhiana",
        "market": "Ludhiana",
        "crop": "Wheat",
        "min_price": 2100,
        "max_price": 2700,
        "modal_price": 2400,
    },
    {
        "state": "Gujarat",
        "district": "Rajkot",
        "market": "Rajkot",
        "crop": "Cotton",
        "min_price": 5500,
        "max_price": 8000,
        "modal_price": 6800,
    },
    {
        "state": "Rajasthan",
        "district": "Jaipur",
        "market": "Jaipur",
        "crop": "Mustard",
        "min_price": 4500,
        "max_price": 6500,
        "modal_price": 5500,
    },

        {
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "market": "Rajamahendravaram",
        "crop": "Rice",
        "min_price": 2000,
        "max_price": 2600,
        "modal_price": 2300,
    },
    {
        "state": "West Bengal",
        "district": "Bardhaman",
        "market": "Bardhaman",
        "crop": "Rice",
        "min_price": 1900,
        "max_price": 2500,
        "modal_price": 2200,
    },
]

for record in ESTIMATED_MARKET_DATA:
    record["source_note"] = (
        "SIMULATED ESTIMATE — NOT A REAL MARKET QUOTE"
    )
