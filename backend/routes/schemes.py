
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(
    prefix="/api/schemes",
    tags=["Government Schemes & Agriculture Services"]
)

# Initial directory of schemes from official government sources.
# Eligibility and application requirements must be verified on each portal.
SCHEMES = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN Samman Nidhi",
        "category": "Income Support",
        "state": "All India",
        "description": (
            "Provides income support to eligible landholding farmer "
            "families through direct benefit transfers."
        ),
        "benefits": (
            "Eligible farmer families receive ₹6,000 per year "
            "in three equal instalments, subject to scheme rules."
        ),
        "eligibility_summary": (
            "Eligibility depends on landholding and government-defined "
            "exclusion categories. Check the official guidelines."
        ),
        "documents_to_check": [
            "Aadhaar details",
            "Land records",
            "Bank account details",
            "Other documents requested by the official portal"
        ],
        "how_to_start": (
            "Use the official portal to review eligibility, registration "
            "requirements, eKYC and beneficiary status."
        ),
        "official_url": "https://pmkisan.gov.in/",
        "source": "Government of India - PM-KISAN"
    },
    {
        "id": "pmfby",
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "category": "Crop Insurance",
        "state": "All India",
        "description": (
            "A government crop insurance scheme intended to help "
            "eligible farmers manage specified crop-loss risks."
        ),
        "benefits": (
            "Insurance protection under the applicable scheme rules "
            "and notified crop and area conditions."
        ),
        "eligibility_summary": (
            "Eligibility, notified crops, insurance terms and enrolment "
            "availability depend on current scheme rules and the "
            "relevant state, season and area."
        ),
        "documents_to_check": [
            "Land cultivation or tenancy records, as applicable",
            "Bank account details",
            "Identity documents",
            "Crop and season details",
            "Other documents required by the official portal"
        ],
        "how_to_start": (
            "Check current enrolment availability, notified crops, "
            "deadlines and policy conditions on the official portal."
        ),
        "official_url": "https://pmfby.gov.in/",
        "source": "Government of India - PMFBY"
    },
    {
        "id": "soil-health-card",
        "name": "Soil Health Card Scheme",
        "category": "Soil Testing",
        "state": "All India",
        "description": (
            "Helps farmers understand soil nutrient status and access "
            "fertilizer and soil-amendment recommendations based "
            "on soil testing."
        ),
        "benefits": (
            "Soil-test information and recommendations to support "
            "better nutrient management."
        ),
        "eligibility_summary": (
            "Contact the official portal or local agriculture department "
            "for the current soil-sampling and service process."
        ),
        "documents_to_check": [
            "Farm or land details",
            "Location of the field",
            "Information requested by the local soil testing service"
        ],
        "how_to_start": (
            "Visit the official Soil Health Card portal or contact "
            "your local agriculture office about soil sampling."
        ),
        "official_url": "https://soilhealth.dac.gov.in/",
        "source": "Government of India - Soil Health Card Portal"
    },
    
    {
        "id": "kisan-credit-card",
        "name": "Kisan Credit Card (KCC)",
        "category": "Agricultural Credit",
        "state": "All India",
        "description": (
            "Provides eligible farmers with access to bank credit "
            "for cultivation and other approved agricultural needs."
        ),
        "benefits": (
            "Access to agricultural credit through participating "
            "banks, subject to eligibility, bank assessment and "
            "applicable scheme rules."
        ),
        "eligibility_summary": (
            "Eligibility depends on farming activity, cultivation "
            "arrangements, eligible allied activities and the "
            "participating bank's requirements."
        ),
        "documents_to_check": [
            "Identity and address proof",
            "Land or cultivation-related records, where applicable",
            "Bank account details",
            "Other documents requested by the bank"
        ],
        "how_to_start": (
            "Review the official Kisan Rin Portal and contact a "
            "participating bank to confirm eligibility, application "
            "requirements and available credit facilities."
        ),
        "official_url": "https://fasalrin.gov.in/",
        "source": "Government of India - Kisan Rin Portal"
    },
    
    {
        "id": "pm-kisan-maandhan",
        "name": "PM-Kisan Maandhan Yojana",
        "category": "Farmer Pension",
        "state": "All India",
        "description": (
            "A voluntary contributory pension scheme for eligible "
            "small and marginal farmers in India."
        ),
        "benefits": (
            "Eligible subscribers can receive a monthly pension "
            "of ₹3,000 after attaining 60 years of age, subject "
            "to scheme conditions and contribution requirements."
        ),
        "eligibility_summary": (
            "Generally intended for small and marginal farmers "
            "aged 18 to 40 years, subject to landholding criteria "
            "and other eligibility and exclusion rules."
        ),
        "documents_to_check": [
            "Aadhaar details",
            "Savings bank account or Jan-Dhan account details",
            "Landholding records",
            "Other documents requested during enrolment"
        ],
        "how_to_start": (
            "Review the official scheme information and contact "
            "an authorised Common Service Centre (CSC) to check "
            "eligibility, contribution amounts and enrolment."
        ),
        "official_url": "https://maandhan.in/",
        "source": "Government of India - Maandhan Portal"
    },
    
    {
        "id": "agriculture-infrastructure-fund",
        "name": "Agriculture Infrastructure Fund (AIF)",
        "category": "Agricultural Infrastructure",
        "state": "All India",
        "description": (
            "Supports eligible investments in agricultural "
            "post-harvest infrastructure and community farming assets."
        ),
        "benefits": (
            "Eligible projects may receive interest subvention "
            "and credit-guarantee support, subject to current "
            "scheme guidelines and lending institution approval."
        ),
        "eligibility_summary": (
            "Eligible beneficiaries may include farmers, Farmer "
            "Producer Organisations, Primary Agricultural Credit "
            "Societies, agricultural entrepreneurs and other "
            "permitted entities. Project and borrower eligibility "
            "must be confirmed under the official guidelines."
        ),
        "documents_to_check": [
            "Applicant identity and registration documents",
            "Project proposal and cost estimates",
            "Land or site documents, where applicable",
            "Financial and bank documents",
            "Other documents required by the lending institution"
        ],
        "how_to_start": (
            "Review the official scheme guidelines and contact "
            "a participating lending institution or the relevant "
            "agriculture department to check project eligibility "
            "and the application process."
        ),
        "official_url": "https://agriinfra.dac.gov.in/",
        "source": "Government of India - Agriculture Infrastructure Fund"
    },
    
    {
        "id": "pm-kusum",
        "name": "PM-KUSUM Solar Agriculture Scheme",
        "category": "Solar Energy",
        "state": "All India",
        "description": (
            "Supports eligible agricultural solar power projects, "
            "including standalone solar pumps and solarisation "
            "of existing grid-connected agricultural pumps."
        ),
        "benefits": (
            "Eligible projects may receive central financial "
            "assistance under applicable components and guidelines. "
            "Assistance and farmer contributions vary by component "
            "and state."
        ),
        "eligibility_summary": (
            "Eligibility depends on the scheme component, applicant "
            "type, state implementation arrangements and current "
            "guidelines. Applications are handled through designated "
            "state agencies and other authorised channels."
        ),
        "documents_to_check": [
            "Identity and address proof",
            "Land or farm-related documents, where applicable",
            "Agricultural electricity connection details, where applicable",
            "Bank account details",
            "Other documents required by the state implementing agency"
        ],
        "how_to_start": (
            "Review the official PM-KUSUM portal and contact the "
            "designated state implementing agency to confirm whether "
            "applications are open, which components are available "
            "and what documents are required. Avoid unofficial "
            "websites requesting registration fees."
        ),
        "official_url": "https://pmkusum.mnre.gov.in/",
        "source": "Government of India - Ministry of New and Renewable Energy"
    },
    
    {
        "id": "national-beekeeping-honey-mission",
        "name": "National Beekeeping and Honey Mission (NBHM)",
        "category": "Beekeeping and Allied Agriculture",
        "state": "All India",
        "description": (
            "Supports the development of scientific beekeeping, "
            "honey production and related infrastructure in India."
        ),
        "benefits": (
            "Eligible projects may receive assistance for approved "
            "beekeeping activities, equipment, training or "
            "infrastructure, subject to current guidelines."
        ),
        "eligibility_summary": (
            "Eligibility depends on the activity, applicant category, "
            "project proposal and applicable programme guidelines. "
            "Assistance is not automatic for every beekeeper."
        ),
        "documents_to_check": [
            "Identity and address proof",
            "Project proposal, where applicable",
            "Beekeeping activity details",
            "Bank account details",
            "Other documents required by the implementing agency"
        ],
        "how_to_start": (
            "Visit the National Bee Board website and contact the "
            "relevant implementing agency to confirm current "
            "programme availability, eligibility and application steps."
        ),
        "official_url": "https://nbb.gov.in/",
        "source": "National Bee Board, Government of India"
    },
    
    {
        "id": "national-mission-natural-farming",
        "name": "National Mission on Natural Farming (NMNF)",
        "category": "Natural Farming",
        "state": "All India",
        "description": (
            "Promotes natural farming practices that use locally "
            "prepared bio-inputs, support soil health and reduce "
            "dependence on externally purchased agricultural inputs."
        ),
        "benefits": (
            "Eligible participants may access natural farming "
            "training, demonstrations, technical guidance and "
            "other support available through state implementation "
            "plans and applicable scheme guidelines."
        ),
        "eligibility_summary": (
            "Participation and available support depend on state "
            "implementation, local farming clusters and current "
            "programme guidelines. Confirm eligibility with the "
            "local agriculture department or designated training centre."
        ),
        "documents_to_check": [
            "Identity and address details",
            "Farm and land details, where applicable",
            "Current farming practices and crop details",
            "Other documents requested by the implementing agency"
        ],
        "how_to_start": (
            "Visit the official Natural Farming portal or contact "
            "your local agriculture department or Krishi Vigyan "
            "Kendra to ask about training, local programme "
            "availability and farmer enrolment."
        ),
        "official_url": "https://naturalfarming.dac.gov.in/",
        "source": "Government of India - National Mission on Natural Farming"
    },
    
    {
        "id": "e-nam",
        "name": "National Agriculture Market (e-NAM)",
        "category": "Market Access",
        "state": "All India",
        "description": (
            "An electronic trading platform connecting participating "
            "agricultural markets to help farmers access market "
            "information, buyers and transparent trading."
        ),
        "benefits": (
            "Access to participating markets, commodity price "
            "information, transparent bidding and electronic "
            "payments, subject to platform and market participation."
        ),
        "eligibility_summary": (
            "Farmers must register and follow the requirements of "
            "the relevant participating APMC or mandi. Availability "
            "of commodities and trading services varies by market."
        ),
        "documents_to_check": [
            "Government-issued identity proof",
            "Mobile number and contact details",
            "Bank account details",
            "Details of the relevant APMC or mandi",
            "Other documents requested during registration"
        ],
        "how_to_start": (
            "Visit the official e-NAM portal and choose farmer "
            "registration. Follow the registration and APMC "
            "approval process, or contact a participating mandi "
            "for assistance."
        ),
        "official_url": "https://enam.gov.in/",
        "source": "Government of India - Small Farmers' Agribusiness Consortium"
    },
    
    {
        "id": "paramparagat-krishi-vikas-yojana",
        "name": "Paramparagat Krishi Vikas Yojana (PKVY)",
        "category": "Organic Farming",
        "state": "All India",
        "description": (
            "Promotes cluster-based organic farming and sustainable "
            "agricultural practices, including support for eligible "
            "farmers participating in approved programme activities."
        ),
        "benefits": (
            "Depending on current programme guidelines and local "
            "implementation, participating farmers may receive "
            "training, technical guidance and support for organic "
            "farming practices and certification."
        ),
        "eligibility_summary": (
            "Eligibility and available assistance depend on current "
            "scheme guidelines, farmer groups or clusters, and "
            "state implementation arrangements."
        ),
        "documents_to_check": [
            "Identity and contact details",
            "Farm and land details",
            "Farmer group or cluster information, where applicable",
            "Organic farming activity details",
            "Other documents requested by the implementing agency"
        ],
        "how_to_start": (
            "Visit the official PGS-India portal and contact your "
            "local agriculture department to confirm current PKVY "
            "implementation, eligibility and enrolment availability."
        ),
        "official_url": "https://pgsindia-ncof.gov.in/",
        "source": "Government of India - PGS-India / National Centre of Organic Farming"
    },
    
    {
        "id": "national-food-security-mission",
        "name": "National Food Security Mission (NFSM)",
        "category": "Crop Productivity",
        "state": "All India",
        "description": (
            "Supports improved production and productivity of "
            "eligible food crops through approved agricultural "
            "interventions and state-level implementation."
        ),
        "benefits": (
            "Depending on current programme guidelines, eligible "
            "farmers may access demonstrations, improved crop "
            "production practices, seeds or other approved support."
        ),
        "eligibility_summary": (
            "Available assistance depends on the crop, state "
            "implementation plan, notified activities and current "
            "eligibility rules. Not all benefits are available "
            "to every farmer."
        ),
        "documents_to_check": [
            "Identity and contact details",
            "Farm and land details, where applicable",
            "Crop and cultivation details",
            "Bank account details, if financial assistance applies",
            "Other documents requested by the local agriculture department"
        ],
        "how_to_start": (
            "Visit the official Ministry of Agriculture and Farmers "
            "Welfare website or contact your district agriculture "
            "office to confirm current NFSM activities, eligibility "
            "and application procedures."
        ),
        "official_url": "https://agriwelfare.gov.in/",
        "source": "Government of India - Ministry of Agriculture and Farmers Welfare"
    },



]
@router.get("/")
def list_schemes(
    state: str | None = Query(default=None),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None)
):
    """List schemes, optionally filtered by state, category or search."""

    results = SCHEMES

    if state:
        results = [
            scheme for scheme in results
            if scheme["state"].lower() in ("all india", state.strip().lower())
        ]

    if category:
        results = [
            scheme for scheme in results
            if scheme["category"].lower() == category.strip().lower()
        ]

    if search:
        term = search.strip().lower()
        results = [
            scheme for scheme in results
            if term in scheme["name"].lower()
            or term in scheme["description"].lower()
            or term in scheme["category"].lower()
        ]

    return {
        "success": True,
        "count": len(results),
        "schemes": results
    }


@router.get("/{scheme_id}")
def get_scheme(scheme_id: str):
    """Return details for one scheme."""

    for scheme in SCHEMES:
        if scheme["id"] == scheme_id:
            return {"success": True, "scheme": scheme}

    raise HTTPException(
        status_code=404,
        detail="Scheme not found"
    )
