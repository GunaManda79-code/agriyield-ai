
/* AgriYield AI — multilingual support with freeze protection */
(function () {
    "use strict";

    const KEY = "agriYieldLanguage";

    const languages = {
        en: "English",
        te: "తెలుగు",
        hi: "हिन्दी"
    };

    // Add or update translations in these dictionaries.
    const dictionaries = {
        en: {},
        te: {
            "Home": "హోమ్",
            "Dashboard": "డాష్‌బోర్డ్",
            "Predict Yield": "దిగుబడి అంచనా",
            "Weather": "వాతావరణం",
            "Soil Records": "నేల రికార్డులు",
            "Irrigation": "నీటిపారుదల",
            "Market Prices": "మార్కెట్ ధరలు",
            "Profit Calculator": "లాభాల కాలిక్యులేటర్",
            "Sowing Calendar": "విత్తనాల క్యాలెండర్",
            "Government Schemes": "ప్రభుత్వ పథకాలు",
            "Farmer Profile": "రైతు ప్రొఫైల్",
            "History": "చరిత్ర",
            "Weather Alerts": "వాతావరణ హెచ్చరికలు",
            "Agri AI Chatbot": "వ్యవసాయ AI చాట్‌బాట్",
            "Language": "భాష",
            "Select Language": "భాషను ఎంచుకోండి",
            "Your farming workspace": "మీ వ్యవసాయ కార్యస్థలం",
            "AGRIYIELD AI • SMART FARMING": "AGRIYIELD AI • స్మార్ట్ వ్యవసాయం",
            "Welcome back, Guna!": "తిరిగి స్వాగతం!",
            "Let's grow smarter.": "మరింత తెలివిగా సాగు చేద్దాం.",
            "Let’s grow smarter.": "మరింత తెలివిగా సాగు చేద్దాం.",
            "Predict crop yield": "పంట దిగుబడిని అంచనా వేయండి",
            "Explore weather": "వాతావరణాన్ని చూడండి",
            "Your farming toolkit": "మీ వ్యవసాయ సాధనాలు",
            "YOUR FARMING TOOLKIT": "మీ వ్యవసాయ సాధనాలు",
            "One place.": "ఒకే చోట.",
            "Many smarter decisions.": "మరిన్ని తెలివైన నిర్ణయాలు.",
            "AI & ANALYTICS": "AI మరియు విశ్లేషణలు",
            "FIELD DETAILS": "పొలం వివరాలు",
            "Tell us about your field": "మీ పొలం గురించి వివరించండి",
            "Select Crop": "పంటను ఎంచుకోండి",
            "Select crop": "పంటను ఎంచుకోండి",
            "Which crop are you growing?": "మీరు ఏ పంట పండిస్తున్నారు?",
            "Rice": "వరి",
            "Wheat": "గోధుమ",
            "Maize": "మొక్కజొన్న",
            "Cotton": "పత్తి",
            "Soybean": "సోయాబీన్",
            "Season": "సీజన్",
            "Select season": "సీజన్‌ను ఎంచుకోండి",
            "Kharif": "ఖరీఫ్",
            "Rabi": "రబీ",
            "Summer": "వేసవి",
            "Rainfall": "వర్షపాతం",
            "Temperature": "ఉష్ణోగ్రత",
            "Humidity": "తేమ",
            "Soil Type": "నేల రకం",
            "Soil pH": "నేల pH",
            "Soil nutrients": "నేల పోషకాలు",
            "Nitrogen": "నత్రజని",
            "Phosphorus": "భాస్వరం",
            "Potassium": "పొటాషియం",
            "Fertilizer": "ఎరువు",
            "Pesticide": "పురుగుమందు",
            "Cultivated Area": "సాగు విస్తీర్ణం",
            "Area": "విస్తీర్ణం",
            "Predict": "అంచనా వేయండి",
            "Estimate crop yield": "పంట దిగుబడిని అంచనా వేయండి",
            "Calculating your estimate…": "మీ అంచనాను లెక్కిస్తోంది…",
            "Your prediction result": "మీ అంచనా ఫలితం",
            "ESTIMATE COMPLETE": "అంచనా పూర్తయింది",
            "Crop:": "పంట:",
            "Estimated bags:": "అంచనా బస్తాలు:",
            "Total weight:": "మొత్తం బరువు:",
            "Actual harvest depends on many factors.": "వాస్తవ దిగుబడి అనేక అంశాలపై ఆధారపడి ఉంటుంది.",
            "View saved predictions": "భద్రపరిచిన అంచనాలను చూడండి",
            "Auto-fill from Location": "స్థానం ద్వారా ఆటోఫిల్ చేయండి",
            "Click to fetch local weather data.": "స్థానిక వాతావరణ వివరాల కోసం క్లిక్ చేయండి.",
            "FARM WEATHER": "వ్యవసాయ వాతావరణం",
            "Weather for your farm": "మీ పొలానికి వాతావరణం",
            "Village or town": "గ్రామం లేదా పట్టణం",
            "Get weather": "వాతావరణాన్ని పొందండి",
            "Five-day forecast": "ఐదు రోజుల వాతావరణ సూచన",
            "WATER MANAGEMENT": "నీటి నిర్వహణ",
            "Irrigation assistant": "నీటిపారుదల సహాయకుడు",
            "Recent rainfall (mm)": "ఇటీవలి వర్షపాతం (మిమీ)",
            "Measured soil moisture (%)": "కొలిచిన నేల తేమ (%)",
            "Forecast rain probability (%)": "వర్ష సూచన సంభావ్యత (%)",
            "Get guidance": "మార్గదర్శకత్వం పొందండి",
            "FARM RECORDS": "వ్యవసాయ రికార్డులు",
            "Soil health notebook": "నేల ఆరోగ్య నోట్‌బుక్",
            "Add a soil record": "నేల రికార్డును జోడించండి",
            "Farmer name": "రైతు పేరు",
            "Location": "స్థానం",
            "Crop": "పంట",
            "Soil moisture (%)": "నేల తేమ (%)",
            "Notes": "గమనికలు",
            "Save soil record": "నేల రికార్డును సేవ్ చేయండి",
            "Saved records": "భద్రపరిచిన రికార్డులు",
            "MARKET INFORMATION": "మార్కెట్ సమాచారం",
            "Crop market prices": "పంట మార్కెట్ ధరలు",
            "Filter crop": "పంటను ఫిల్టర్ చేయండి",
            "Search": "వెతకండి",
            "Show all": "అన్నీ చూపించు",
            "Farm Profit Estimator": "వ్యవసాయ లాభాల అంచనా",
            "Crop Sowing Calendar": "పంట విత్తనాల క్యాలెండర్",
            "Create a Crop Plan": "పంట ప్రణాళికను రూపొందించండి",
            "District / location": "జిల్లా / స్థానం",
            "Planned sowing date": "ప్రణాళిక చేసిన విత్తే తేదీ",
            "Generate Crop Plan": "పంట ప్రణాళికను రూపొందించండి",
            "Your Crop Activities": "మీ పంట కార్యకలాపాలు",
            "Extreme Weather Alerts": "తీవ్ర వాతావరణ హెచ్చరికలు",
            "Check Alerts": "హెచ్చరికలను తనిఖీ చేయండి",
            "Enter a location and check the forecast.": "స్థానాన్ని నమోదు చేసి వాతావరణ సూచనను తనిఖీ చేయండి.",
            "Login": "లాగిన్",
            "Register": "నమోదు",
            "Login with email OTP": "ఇమెయిల్ OTPతో లాగిన్",
            "Email address": "ఇమెయిల్ చిరునామా",
            "Send Login OTP": "లాగిన్ OTP పంపండి",
            "Six-digit OTP": "ఆరు అంకెల OTP",
            "Verify and Continue": "ధృవీకరించి కొనసాగించండి",
            "Create your account": "మీ ఖాతాను సృష్టించండి",
            "Full name": "పూర్తి పేరు",
            "Phone number": "ఫోన్ నంబర్",
            "Register and Send OTP": "నమోదు చేసి OTP పంపండి",
            "Verify Email": "ఇమెయిల్‌ను ధృవీకరించండి",
            "Cancel": "రద్దు చేయండి",
            "Save": "సేవ్ చేయండి",
            "Submit": "సమర్పించండి",
            "Back": "వెనుకకు",
            "Next": "తదుపరి",
            "Loading…": "లోడ్ అవుతోంది…",
            "Loading...": "లోడ్ అవుతోంది...",
            "No records yet.": "ఇంకా రికార్డులు లేవు.",
            "Get started": "ప్రారంభించండి",
            "View details": "వివరాలు చూడండి",
            "Logout": "లాగ్ అవుట్",
            "Guest": "అతిథి",
            "Welcome to AgriYield AI": "AgriYield AI కి స్వాగతం",
            "Smart insights for better farming.": "మెరుగైన వ్యవసాయం కోసం స్మార్ట్ సూచనలు.",
            "Smart Farming Platform": "స్మార్ట్ వ్యవసాయ వేదిక",
            "SMART FARMING PLATFORM": "స్మార్ట్ వ్యవసాయ వేదిక",
            "Make your next": "మీ తదుపరి",
            "season count.": "సీజన్‌ను విజయవంతం చేయండి.",
            "Enter your crop, cultivated area, weather and soil information to estimate your crop yield.": "పంట దిగుబడిని అంచనా వేయడానికి పంట, సాగు విస్తీర్ణం, వాతావరణం మరియు నేల వివరాలను నమోదు చేయండి.",
            "✦ AI-POWERED CROP ESTIMATOR": "✦ AI ఆధారిత పంట అంచనా",
            "✓ Field-based estimate ✓ Saved prediction history": "✓ పొలం ఆధారిత అంచనా ✓ భద్రపరిచిన అంచనా చరిత్ర",
            "Tell us about your field": "మీ పొలం గురించి వివరించండి",
            "Enter measured values where possible.": "సాధ్యమైనప్పుడు కొలిచిన విలువలను నమోదు చేయండి.",
            "Auto-fill from Location": "స్థానం ద్వారా ఆటోఫిల్ చేయండి",
            "Click to fetch local weather data.": "స్థానిక వాతావరణ వివరాల కోసం క్లిక్ చేయండి.",
            "Which crop are you growing?": "మీరు ఏ పంట పండిస్తున్నారు?",
            "Cultivated area": "సాగు విస్తీర్ణం",
            "Area unit": "విస్తీర్ణం యూనిట్",
            "Acres": "ఎకరాలు",
            "Hectares": "హెక్టార్లు",
            "Enter the total area you plan to cultivate.": "మీరు సాగు చేయాలనుకుంటున్న మొత్తం విస్తీర్ణాన్ని నమోదు చేయండి.",
            "Used to calculate your estimated total harvest.": "మొత్తం అంచనా దిగుబడిని లెక్కించడానికి ఉపయోగిస్తారు.",
            "Rainfall during the crop-growing period, in millimetres.": "పంట పెరుగుదల కాలంలో వర్షపాతం, మిల్లీమీటర్లలో.",
            "Use your location button to retrieve recent rainfall.": "ఇటీవలి వర్షపాతాన్ని పొందడానికి స్థాన బటన్‌ను ఉపయోగించండి.",
            "Use recent rainfall": "ఇటీవలి వర్షపాతాన్ని ఉపయోగించండి",
            "Temperature (°C)": "ఉష్ణోగ్రత (°C)",
            "Humidity (%)": "తేమ (%)",
            "Soil Type": "నేల రకం",
            "Soil pH": "నేల pH",
            "Nitrogen (N)": "నత్రజని (N)",
            "Phosphorus (P)": "భాస్వరం (P)",
            "Potassium (K)": "పొటాషియం (K)",
            "Predict Crop Yield": "పంట దిగుబడిని అంచనా వేయండి",
            "Prediction Result": "అంచనా ఫలితం",
            "Estimated Crop Yield": "అంచనా పంట దిగుబడి",
            "Estimated yield": "అంచనా దిగుబడి",
            "Model Confidence": "మోడల్ విశ్వసనీయత",
            "Recommendations": "సిఫార్సులు",
            "Suitable for good yield": "మంచి దిగుబడికి అనుకూలం",
            "Maintain regular irrigation": "క్రమం తప్పకుండా నీరు పెట్టండి",
            "Monitor soil nutrients": "నేల పోషకాలను పర్యవేక్షించండి",
            "Consider organic fertilizers": "సేంద్రియ ఎరువులను పరిగణించండి",
            "Town or city": "పట్టణం లేదా నగరం",
            "Get weather": "వాతావరణాన్ని పొందండి",
            "Current conditions and a five-day forecast for a selected town or city.": "ఎంచుకున్న పట్టణం లేదా నగరానికి ప్రస్తుత పరిస్థితులు మరియు ఐదు రోజుల సూచన.",
            "Five-day forecast": "ఐదు రోజుల వాతావరణ సూచన",
            "Recent rainfall (mm)": "ఇటీవలి వర్షపాతం (మిమీ)",
            "Soil moisture (%)": "నేల తేమ (%)",
            "Forecast rain probability (%)": "వర్ష సూచన సంభావ్యత (%)",
            "Get guidance": "మార్గదర్శకత్వం పొందండి",
            "Save soil record": "నేల రికార్డును సేవ్ చేయండి",
            "Saved records": "భద్రపరిచిన రికార్డులు",
            "Add a soil record": "నేల రికార్డును జోడించండి",
            "Farmer name": "రైతు పేరు",
            "Village / district": "గ్రామం / జిల్లా",
            "Optional observations": "ఐచ్ఛిక పరిశీలనలు",
            "Save": "సేవ్ చేయండి",
            "Email address": "ఇమెయిల్ చిరునామా",
            "Send Login OTP": "లాగిన్ OTP పంపండి",
            "Six-digit OTP": "ఆరు అంకెల OTP",
            "Enter OTP": "OTP నమోదు చేయండి",
            "Verify and Continue": "ధృవీకరించి కొనసాగించండి",
            "Create your account": "మీ ఖాతాను సృష్టించండి",
            "Full name": "పూర్తి పేరు",
            "Phone number": "ఫోన్ నంబర్",
            "Register and Send OTP": "నమోదు చేసి OTP పంపండి",
            "Verify Email": "ఇమెయిల్‌ను ధృవీకరించండి",
            "Never share your verification code with anyone.": "మీ ధృవీకరణ కోడ్‌ను ఎవరితోనూ పంచుకోవద్దు.",
            "Your farming workspace": "మీ వ్యవసాయ కార్యస్థలం",
            "Your farm, weather, crop predictions and planning tools — connected in one place.": "మీ వ్యవసాయం, వాతావరణం, పంట అంచనాలు మరియు ప్రణాళిక సాధనాలు — అన్నీ ఒకే చోట.",
            "Search crop, scheme, or information…": "పంట, పథకం లేదా సమాచారం వెతకండి…",
            "Useful estimates. Better-informed decisions.": "ఉపయోగకరమైన అంచనాలు. మెరుగైన నిర్ణయాలు.",
            "Plan • Predict • Review": "ప్రణాళిక • అంచనా • సమీక్ష",
            "Review water guidance": "నీటి మార్గదర్శకత్వాన్ని సమీక్షించండి",
            "Check available prices": "అందుబాటులో ఉన్న ధరలను చూడండి",
            "Estimate cost and profit": "ఖర్చు మరియు లాభాన్ని అంచనా వేయండి",
            "Plan when to sow": "విత్తే సమయాన్ని ప్రణాళిక చేయండి",
            "Search": "వెతకండి",
            "Submit": "సమర్పించండి",
            "Cancel": "రద్దు చేయండి",
            "Back": "వెనుకకు",
            "Next": "తదుపరి",
            "Previous": "మునుపటి",
            "Loading...": "లోడ్ అవుతోంది...",
            "Try again": "మళ్లీ ప్రయత్నించండి",
            "No records yet.": "ఇంకా రికార్డులు లేవు.",
            "No data available": "డేటా అందుబాటులో లేదు",
            "Get started": "ప్రారంభించండి",
            "View details": "వివరాలు చూడండి",
            "Profile": "ప్రొఫైల్",
            "Settings": "సెట్టింగ్‌లు",
            "Logout": "లాగ్ అవుట్",
            "Guest": "అతిథి",
            "Market information": "మార్కెట్ సమాచారం",
            "Crop market prices": "పంట మార్కెట్ ధరలు",
            "Filter crop": "పంటను ఫిల్టర్ చేయండి",
            "Show all": "అన్నీ చూపించు",
            "Farm Profit Estimator": "వ్యవసాయ లాభాల అంచనా",
            "Crop Sowing Calendar": "పంట విత్తనాల క్యాలెండర్",
            "Create a Crop Plan": "పంట ప్రణాళికను రూపొందించండి",
            "District / location": "జిల్లా / స్థానం",
            "Planned sowing date": "ప్రణాళిక చేసిన విత్తే తేదీ",
            "Generate Crop Plan": "పంట ప్రణాళికను రూపొందించండి",
            "Your Crop Activities": "మీ పంట కార్యకలాపాలు",
            "Extreme Weather Alerts": "తీవ్ర వాతావరణ హెచ్చరికలు",
            "Check Alerts": "హెచ్చరికలను తనిఖీ చేయండి"
        },

        hi: {
            "Home": "होम",
            "Dashboard": "डैशबोर्ड",
            "Predict Yield": "उपज का अनुमान",
            "Weather": "मौसम",
            "Soil Records": "मिट्टी के रिकॉर्ड",
            "Irrigation": "सिंचाई",
            "Market Prices": "बाजार भाव",
            "Profit Calculator": "लाभ कैलकुलेटर",
            "Sowing Calendar": "बुवाई कैलेंडर",
            "Government Schemes": "सरकारी योजनाएँ",
            "Farmer Profile": "किसान प्रोफ़ाइल",
            "History": "इतिहास",
            "Weather Alerts": "मौसम अलर्ट",
            "Agri AI Chatbot": "कृषि AI चैटबॉट",
            "Language": "भाषा",
            "Select Language": "भाषा चुनें",
            "Your farming workspace": "आपका कृषि कार्यक्षेत्र",
            "AGRIYIELD AI • SMART FARMING": "AGRIYIELD AI • स्मार्ट खेती",
            "Welcome back, Guna!": "वापसी पर स्वागत है!",
            "Let's grow smarter.": "आइए, खेती को और बेहतर बनाएँ।",
            "Let’s grow smarter.": "आइए, खेती को और बेहतर बनाएँ।",
            "Predict crop yield": "फसल की उपज का अनुमान लगाएँ",
            "Explore weather": "मौसम देखें",
            "Your farming toolkit": "आपके कृषि उपकरण",
            "YOUR FARMING TOOLKIT": "आपके कृषि उपकरण",
            "One place.": "एक ही जगह।",
            "Many smarter decisions.": "कई बेहतर निर्णय।",
            "AI & ANALYTICS": "AI और विश्लेषण",
            "FIELD DETAILS": "खेत का विवरण",
            "Tell us about your field": "अपने खेत के बारे में बताएँ",
            "Select Crop": "फसल चुनें",
            "Select crop": "फसल चुनें",
            "Which crop are you growing?": "आप कौन सी फसल उगा रहे हैं?",
            "Rice": "धान",
            "Wheat": "गेहूँ",
            "Maize": "मक्का",
            "Cotton": "कपास",
            "Soybean": "सोयाबीन",
            "Season": "मौसम",
            "Select season": "मौसम चुनें",
            "Kharif": "खरीफ",
            "Rabi": "रबी",
            "Summer": "गर्मी",
            "Rainfall": "वर्षा",
            "Temperature": "तापमान",
            "Humidity": "आर्द्रता",
            "Soil Type": "मिट्टी का प्रकार",
            "Soil pH": "मिट्टी का pH",
            "Soil nutrients": "मिट्टी के पोषक तत्व",
            "Nitrogen": "नाइट्रोजन",
            "Phosphorus": "फॉस्फोरस",
            "Potassium": "पोटैशियम",
            "Fertilizer": "उर्वरक",
            "Pesticide": "कीटनाशक",
            "Cultivated Area": "खेती का क्षेत्रफल",
            "Area": "क्षेत्रफल",
            "Predict": "अनुमान लगाएँ",
            "Estimate crop yield": "फसल की उपज का अनुमान लगाएँ",
            "Calculating your estimate…": "आपका अनुमान निकाला जा रहा है…",
            "Your prediction result": "आपका अनुमानित परिणाम",
            "ESTIMATE COMPLETE": "अनुमान पूरा हुआ",
            "Crop:": "फसल:",
            "Estimated bags:": "अनुमानित बोरे:",
            "Total weight:": "कुल वजन:",
            "Actual harvest depends on many factors.": "वास्तविक उपज कई कारकों पर निर्भर करती है।",
            "View saved predictions": "सहेजे गए अनुमान देखें",
            "Auto-fill from Location": "स्थान से अपने-आप भरें",
            "Click to fetch local weather data.": "स्थानीय मौसम जानकारी पाने के लिए क्लिक करें।",
            "FARM WEATHER": "कृषि मौसम",
            "Weather for your farm": "आपके खेत का मौसम",
            "Village or town": "गाँव या शहर",
            "Get weather": "मौसम देखें",
            "Five-day forecast": "पाँच दिन का पूर्वानुमान",
            "WATER MANAGEMENT": "जल प्रबंधन",
            "Irrigation assistant": "सिंचाई सहायक",
            "Recent rainfall (mm)": "हाल की वर्षा (मिमी)",
            "Measured soil moisture (%)": "मापी गई मिट्टी की नमी (%)",
            "Forecast rain probability (%)": "वर्षा की संभावना (%)",
            "Get guidance": "मार्गदर्शन प्राप्त करें",
            "FARM RECORDS": "कृषि रिकॉर्ड",
            "Soil health notebook": "मिट्टी स्वास्थ्य नोटबुक",
            "Add a soil record": "मिट्टी का रिकॉर्ड जोड़ें",
            "Farmer name": "किसान का नाम",
            "Location": "स्थान",
            "Crop": "फसल",
            "Soil moisture (%)": "मिट्टी की नमी (%)",
            "Notes": "टिप्पणियाँ",
            "Save soil record": "मिट्टी का रिकॉर्ड सहेजें",
            "Saved records": "सहेजे गए रिकॉर्ड",
            "MARKET INFORMATION": "बाजार की जानकारी",
            "Crop market prices": "फसल बाजार भाव",
            "Filter crop": "फसल फ़िल्टर करें",
            "Search": "खोजें",
            "Show all": "सभी दिखाएँ",
            "Farm Profit Estimator": "कृषि लाभ अनुमान",
            "Crop Sowing Calendar": "फसल बुवाई कैलेंडर",
            "Create a Crop Plan": "फसल योजना बनाएँ",
            "District / location": "ज़िला / स्थान",
            "Planned sowing date": "नियोजित बुवाई की तारीख",
            "Generate Crop Plan": "फसल योजना बनाएँ",
            "Your Crop Activities": "आपकी फसल गतिविधियाँ",
            "Extreme Weather Alerts": "चरम मौसम अलर्ट",
            "Check Alerts": "अलर्ट जाँचें",
            "Enter a location and check the forecast.": "स्थान दर्ज करें और पूर्वानुमान जाँचें।",
            "Login": "लॉगिन",
            "Register": "पंजीकरण",
            "Login with email OTP": "ईमेल OTP से लॉगिन",
            "Email address": "ईमेल पता",
            "Send Login OTP": "लॉगिन OTP भेजें",
            "Six-digit OTP": "छह अंकों का OTP",
            "Verify and Continue": "सत्यापित करें और जारी रखें",
            "Create your account": "अपना खाता बनाएँ",
            "Full name": "पूरा नाम",
            "Phone number": "फ़ोन नंबर",
            "Register and Send OTP": "पंजीकरण करें और OTP भेजें",
            "Verify Email": "ईमेल सत्यापित करें",
            "Cancel": "रद्द करें",
            "Save": "सहेजें",
            "Submit": "जमा करें",
            "Back": "वापस",
            "Next": "आगे",
            "Loading…": "लोड हो रहा है…",
            "Loading...": "लोड हो रहा है...",
            "No records yet.": "अभी कोई रिकॉर्ड नहीं है।",
            "Get started": "शुरू करें",
            "View details": "विवरण देखें",
            "Logout": "लॉग आउट",
            "Guest": "अतिथि",
            "Welcome to AgriYield AI": "AgriYield AI में आपका स्वागत है",
            "Smart insights for better farming.": "बेहतर खेती के लिए स्मार्ट सुझाव।",
            "Smart Farming Platform": "स्मार्ट कृषि प्लेटफ़ॉर्म",
            "SMART FARMING PLATFORM": "स्मार्ट कृषि प्लेटफ़ॉर्म",
            "Make your next": "अपने अगले",
            "season count.": "मौसम को सफल बनाएँ।",
            "Enter your crop, cultivated area, weather and soil information to estimate your crop yield.": "फसल की उपज का अनुमान लगाने के लिए फसल, खेती का क्षेत्र, मौसम और मिट्टी की जानकारी दर्ज करें।",
            "✦ AI-POWERED CROP ESTIMATOR": "✦ AI आधारित फसल अनुमान",
            "✓ Field-based estimate ✓ Saved prediction history": "✓ खेत आधारित अनुमान ✓ सहेजा गया अनुमान इतिहास",
            "Tell us about your field": "अपने खेत के बारे में बताएँ",
            "Enter measured values where possible.": "जहाँ संभव हो, मापे गए मान दर्ज करें।",
            "Auto-fill from Location": "स्थान से अपने-आप भरें",
            "Click to fetch local weather data.": "स्थानीय मौसम की जानकारी पाने के लिए क्लिक करें।",
            "Which crop are you growing?": "आप कौन सी फसल उगा रहे हैं?",
            "Cultivated area": "खेती का क्षेत्रफल",
            "Area unit": "क्षेत्रफल की इकाई",
            "Acres": "एकड़",
            "Hectares": "हेक्टेयर",
            "Enter the total area you plan to cultivate.": "खेती के लिए नियोजित कुल क्षेत्रफल दर्ज करें।",
            "Used to calculate your estimated total harvest.": "अनुमानित कुल उपज की गणना के लिए उपयोग किया जाता है।",
            "Rainfall during the crop-growing period, in millimetres.": "फसल उगने की अवधि में वर्षा, मिलीमीटर में।",
            "Use your location button to retrieve recent rainfall.": "हाल की वर्षा प्राप्त करने के लिए स्थान बटन का उपयोग करें।",
            "Use recent rainfall": "हाल की वर्षा का उपयोग करें",
            "Temperature (°C)": "तापमान (°C)",
            "Humidity (%)": "आर्द्रता (%)",
            "Soil Type": "मिट्टी का प्रकार",
            "Soil pH": "मिट्टी का pH",
            "Nitrogen (N)": "नाइट्रोजन (N)",
            "Phosphorus (P)": "फॉस्फोरस (P)",
            "Potassium (K)": "पोटैशियम (K)",
            "Predict Crop Yield": "फसल की उपज का अनुमान",
            "Prediction Result": "अनुमान का परिणाम",
            "Estimated Crop Yield": "अनुमानित फसल उपज",
            "Estimated yield": "अनुमानित उपज",
            "Model Confidence": "मॉडल की विश्वसनीयता",
            "Recommendations": "सुझाव",
            "Suitable for good yield": "अच्छी उपज के लिए उपयुक्त",
            "Maintain regular irrigation": "नियमित सिंचाई करें",
            "Monitor soil nutrients": "मिट्टी के पोषक तत्वों पर नज़र रखें",
            "Consider organic fertilizers": "जैविक उर्वरकों पर विचार करें",
            "Town or city": "कस्बा या शहर",
            "Get weather": "मौसम देखें",
            "Current conditions and a five-day forecast for a selected town or city.": "चुने गए कस्बे या शहर की वर्तमान स्थिति और पाँच दिन का पूर्वानुमान।",
            "Five-day forecast": "पाँच दिन का पूर्वानुमान",
            "Recent rainfall (mm)": "हाल की वर्षा (मिमी)",
            "Soil moisture (%)": "मिट्टी की नमी (%)",
            "Forecast rain probability (%)": "वर्षा की संभावना (%)",
            "Get guidance": "मार्गदर्शन प्राप्त करें",
            "Save soil record": "मिट्टी का रिकॉर्ड सहेजें",
            "Saved records": "सहेजे गए रिकॉर्ड",
            "Add a soil record": "मिट्टी का रिकॉर्ड जोड़ें",
            "Farmer name": "किसान का नाम",
            "Village / district": "गाँव / ज़िला",
            "Optional observations": "वैकल्पिक टिप्पणियाँ",
            "Save": "सहेजें",
            "Email address": "ईमेल पता",
            "Send Login OTP": "लॉगिन OTP भेजें",
            "Six-digit OTP": "छह अंकों का OTP",
            "Enter OTP": "OTP दर्ज करें",
            "Verify and Continue": "सत्यापित करें और जारी रखें",
            "Create your account": "अपना खाता बनाएँ",
            "Full name": "पूरा नाम",
            "Phone number": "फ़ोन नंबर",
            "Register and Send OTP": "पंजीकरण करें और OTP भेजें",
            "Verify Email": "ईमेल सत्यापित करें",
            "Never share your verification code with anyone.": "अपना सत्यापन कोड किसी के साथ साझा न करें।",
            "Your farming workspace": "आपका कृषि कार्यक्षेत्र",
            "Your farm, weather, crop predictions and planning tools — connected in one place.": "आपकी खेती, मौसम, फसल अनुमान और योजना उपकरण — सब एक ही जगह।",
            "Search crop, scheme, or information…": "फसल, योजना या जानकारी खोजें…",
            "Useful estimates. Better-informed decisions.": "उपयोगी अनुमान। बेहतर निर्णय।",
            "Plan • Predict • Review": "योजना • अनुमान • समीक्षा",
            "Review water guidance": "सिंचाई संबंधी सुझाव देखें",
            "Check available prices": "उपलब्ध कीमतें देखें",
            "Estimate cost and profit": "लागत और लाभ का अनुमान लगाएँ",
            "Plan when to sow": "बुवाई का समय तय करें",
            "Search": "खोजें",
            "Submit": "जमा करें",
            "Cancel": "रद्द करें",
            "Back": "वापस",
            "Next": "आगे",
            "Previous": "पिछला",
            "Loading...": "लोड हो रहा है...",
            "Try again": "फिर से प्रयास करें",
            "No records yet.": "अभी कोई रिकॉर्ड नहीं है।",
            "No data available": "कोई डेटा उपलब्ध नहीं है",
            "Get started": "शुरू करें",
            "View details": "विवरण देखें",
            "Profile": "प्रोफ़ाइल",
            "Settings": "सेटिंग्स",
            "Logout": "लॉग आउट",
            "Guest": "अतिथि",
            "Market information": "बाजार की जानकारी",
            "Crop market prices": "फसल बाजार भाव",
            "Filter crop": "फसल फ़िल्टर करें",
            "Show all": "सभी दिखाएँ",
            "Farm Profit Estimator": "कृषि लाभ अनुमान",
            "Crop Sowing Calendar": "फसल बुवाई कैलेंडर",
            "Create a Crop Plan": "फसल योजना बनाएँ",
            "District / location": "ज़िला / स्थान",
            "Planned sowing date": "नियोजित बुवाई की तारीख",
            "Generate Crop Plan": "फसल योजना बनाएँ",
            "Your Crop Activities": "आपकी फसल गतिविधियाँ",
            "Extreme Weather Alerts": "चरम मौसम अलर्ट",
            "Check Alerts": "अलर्ट जाँचें"
        }
    };

    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();

    const IGNORED = [
        "script",
        "style",
        "noscript",
        "textarea",
        "#agriLanguageSwitcher"
    ].join(",");

    function getLanguage() {
        const saved = localStorage.getItem(KEY);
        return Object.prototype.hasOwnProperty.call(languages, saved)
            ? saved
            : "en";
    }

    function translateValue(original, dictionary) {
        if (original == null) return original;

        const trimmed = original.trim();
        if (!trimmed) return original;

        if (!Object.prototype.hasOwnProperty.call(dictionary, trimmed)) {
            return original;
        }

        const start = original.indexOf(trimmed);

        return original.slice(0, start) +
            dictionary[trimmed] +
            original.slice(start + trimmed.length);
    }

    function translateTextNode(node) {
        if (!node.parentElement) return;
        if (node.parentElement.closest(IGNORED)) return;

        if (!originalText.has(node)) {
            originalText.set(node, node.nodeValue);
        }

        const dictionary = dictionaries[getLanguage()];
        const nextValue = translateValue(
            originalText.get(node),
            dictionary
        );

        // Critical: don't write unchanged text back to the DOM.
        if (node.nodeValue !== nextValue) {
            node.nodeValue = nextValue;
        }
    }

    function translateAttribute(element, attribute, dictionary) {
        if (!element.hasAttribute(attribute)) return;

        let saved = originalAttributes.get(element);

        if (!saved) {
            saved = {};
            originalAttributes.set(element, saved);
        }

        if (!(attribute in saved)) {
            saved[attribute] = element.getAttribute(attribute);
        }

        const nextValue = translateValue(
            saved[attribute],
            dictionary
        );

        if (element.getAttribute(attribute) !== nextValue) {
            element.setAttribute(attribute, nextValue);
        }
    }

    function translateInputValue(element, dictionary) {
        if (!element.matches(
            "input[type=button],input[type=submit],input[type=reset]"
        )) {
            return;
        }

        let saved = originalAttributes.get(element);

        if (!saved) {
            saved = {};
            originalAttributes.set(element, saved);
        }

        if (!("value" in saved)) {
            saved.value = element.value;
        }

        const nextValue = translateValue(saved.value, dictionary);

        if (element.value !== nextValue) {
            element.value = nextValue;
        }
    }

    function translateElement(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            translateTextNode(element);
            return;
        }

        if (element.nodeType !== Node.ELEMENT_NODE) return;
        if (element.closest(IGNORED)) return;

        const dictionary = dictionaries[getLanguage()];

        for (const child of element.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                translateTextNode(child);
            }
        }

        ["placeholder", "title", "aria-label"].forEach(attribute => {
            translateAttribute(element, attribute, dictionary);
        });

        translateInputValue(element, dictionary);
    }

    function applyTranslations() {
        const language = getLanguage();
        const dictionary = dictionaries[language];

        document.documentElement.lang = language;

        const selector = document.getElementById("agriLanguageSelect");
        if (selector) selector.value = language;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );

        let node;

        while ((node = walker.nextNode())) {
            translateTextNode(node);
        }

        document.querySelectorAll(
            "[placeholder],[title],[aria-label]," +
            "input[type=button],input[type=submit],input[type=reset]"
        ).forEach(element => {
            if (!element.closest("#agriLanguageSwitcher")) {
                translateElement(element);
            }
        });

        const title = document.querySelector("title");

        if (title) {
            if (!originalText.has(title)) {
                originalText.set(title, title.textContent);
            }

            const nextValue = translateValue(
                originalText.get(title),
                dictionary
            );

            if (title.textContent !== nextValue) {
                title.textContent = nextValue;
            }
        }
    }

  
function createLanguageSelector() {
    // The selector is now defined directly in index.html.
    // Do not create another dropdown automatically.
    const selector = document.getElementById("dashboardLanguage");

    if (!selector || selector.dataset.languageConnected === "true") {
        return;
    }

    selector.value = getLanguage();

    selector.addEventListener("change", function () {
        localStorage.setItem(KEY, selector.value);
        applyTranslations();
    });

    selector.dataset.languageConnected = "true";
}

    function init() {
        createLanguageSelector();
        applyTranslations();

        // Translate newly added content without observing our own writes.
        const observer = new MutationObserver(records => {
            observer.disconnect();

            try {
                for (const record of records) {
                    record.addedNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            translateTextNode(node);
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            translateElement(node);

                            node.querySelectorAll("*").forEach(
                                translateElement
                            );
                        }
                    });
                }
            } finally {
                observer.observe(document.body, {
                    subtree: true,
                    childList: true
                });
            }
        });

        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
