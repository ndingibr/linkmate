import json
import os
import random

# Sub-industry to Industry mapping
sub_to_ind = {
    "Retail Banking": "Financial Services & Banking",
    "Investment Banking": "Financial Services & Banking",
    "Fintech": "Financial Services & Banking",
    "Asset Management": "Financial Services & Banking",
    "Insurance": "Financial Services & Banking",
    "Coal Mining": "Mining & Resources",
    "Platinum & Gold Mining": "Mining & Resources",
    "Mineral Processing": "Mining & Resources",
    "Mining Equipment": "Mining & Resources",
    "Wine & Viticulture": "Agriculture & Agro-processing",
    "Citrus & Fruit Farming": "Agriculture & Agro-processing",
    "Grain & Maize": "Agriculture & Agro-processing",
    "Livestock": "Agriculture & Agro-processing",
    "Forestry & Timber": "Agriculture & Agro-processing",
    "Automotive Assembly": "Manufacturing & Automotive",
    "Component Manufacturing": "Manufacturing & Automotive",
    "Steel & Metal Fabrication": "Manufacturing & Automotive",
    "Chemicals": "Manufacturing & Automotive",
    "Textiles & Apparel": "Manufacturing & Automotive",
    "E-commerce": "Retail, Wholesale & Logistics",
    "FMCG (Fast-Moving Consumer Goods)": "Retail, Wholesale & Logistics",
    "Warehousing": "Retail, Wholesale & Logistics",
    "Road Freight": "Retail, Wholesale & Logistics",
    "Supply Chain Management": "Retail, Wholesale & Logistics",
    "Mobile Networks & ISP": "Telecommunications & IT",
    "Software Development": "Telecommunications & IT",
    "SaaS": "Telecommunications & IT",
    "Cybersecurity": "Telecommunications & IT",
    "IT Consulting & Support": "Telecommunications & IT",
    "Hotel & Lodging": "Tourism & Hospitality",
    "Travel Agencies": "Tourism & Hospitality",
    "Ecotourism": "Tourism & Hospitality",
    "Catering & Events": "Tourism & Hospitality",
    "Medical Devices": "Healthcare & Pharmaceuticals",
    "Private Healthcare Services": "Healthcare & Pharmaceuticals",
    "Pharmaceutical Manufacturing": "Healthcare & Pharmaceuticals",
    "Health Insurance (Medical Aid)": "Healthcare & Pharmaceuticals",
    "Solar & Renewable Energy": "Energy & Utilities",
    "Electrical Engineering": "Energy & Utilities",
    "Water Management": "Energy & Utilities",
    "Waste Management": "Energy & Utilities",
    "Civil Engineering": "Construction & Infrastructure",
    "Commercial Property Development": "Construction & Infrastructure",
    "Residential Construction": "Construction & Infrastructure",
    "Building Materials": "Construction & Infrastructure",
    "Legal Services": "Business Services & Consulting",
    "Accounting & Tax": "Business Services & Consulting",
    "Recruitment & HR": "Business Services & Consulting",
    "Marketing & Advertising": "Business Services & Consulting",
    "Security Services": "Business Services & Consulting",
    "Generative AI & LLMs": "AI",
    "Computer Vision": "AI",
    "Machine Learning Operations (MLOps)": "AI",
    "AI Consulting & Strategy": "AI"
}

# Industry core terms mapping (rich set of B2B terms for each sub-industry)
core_terms = {
    "Retail Banking": ["business bank account", "merchant account", "commercial credit card", "business overdraft", "sme loan", "merchant services"],
    "Investment Banking": ["m&a advisory", "corporate valuation", "project finance", "capital raising", "private equity syndication", "debt restructuring"],
    "Fintech": ["payment gateway", "crypto api", "checkout api", "open banking api", "digital wallet", "fintech platform"],
    "Asset Management": ["pension fund portfolio", "wealth management", "discretionary fund", "institutional asset management", "corporate treasury"],
    "Insurance": ["public liability insurance", "fleet vehicle insurance", "directors and officers insurance", "commercial property insurance", "business interruption insurance"],
    "Coal Mining": ["steam coal", "bituminous coal", "anthracite coal", "coal washing", "coal supply contract", "bulk coal supply"],
    "Platinum & Gold Mining": ["gold bullion", "platinum bullion", "gold refining", "pgm trading", "precious metal refining", "gold smelting"],
    "Mineral Processing": ["ore flotation", "chrome beneficiation", "dense medium separation", "gravity separation", "ore processing plant", "magnetic separation"],
    "Mining Equipment": ["underground drill rig", "load haul dump lhd", "roof bolter", "mining safety gear", "dragline excavator", "crusher machinery"],
    "Wine & Viticulture": ["chenin blanc exporter", "cabernet sauvignon supplier", "viticulture consulting", "custom label wine", "bulk wine distributor", "organic vineyard"],
    "Citrus & Fruit Farming": ["valencia citrus exporter", "bulk avocado supplier", "cold chain fruit logistics", "citrus packhouse", "soft citrus export", "table grape wholesale"],
    "Grain & Maize": ["white maize supplier", "yellow maize exporter", "maize roller milling", "wheat grain storage", "sorghum wholesale", "soya bean supplier"],
    "Livestock": ["angus cattle supplier", "halal feedlot", "abattoir meat processing", "livestock breeding", "sheep wholesale", "pork carcass supplier"],
    "Forestry & Timber": ["pine poles supplier", "structural timber wholesale", "eucalyptus timber exporter", "sawmill processing", "hardwood timber supplier", "treated timber poles"],
    "Automotive Assembly": ["wire harness assembly", "chassis welding", "automotive logistics", "vehicle paint shop", "automotive assembly plant", "contract vehicle assembly"],
    "Component Manufacturing": ["press tooling manufacturer", "alloy wheel casting", "oem brake pads", "catalytic converter exporter", "automotive alternator supplier", "radiator manufacturer"],
    "Steel & Metal Fabrication": ["structural steel fabrication", "sheet metal fabrication", "mild steel plates", "cnc laser cutting", "heavy steel fabrication", "stainless steel welding"],
    "Chemicals": ["phosphoric acid supplier", "ethanol wholesale", "cosmetics chemical manufacturer", "hydrocarbon solvent", "sodium hydroxide supplier", "hydrochloric acid wholesale"],
    "Textiles & Apparel": ["shweshwe cotton fabric", "school uniform apparel", "cmt clothing factory", "polyester yarn wholesale", "protective workwear apparel", "denim fabric manufacturer"],
    "E-commerce": ["shopify dropshipping supplier", "woocommerce shipping gateway", "takealot seller fulfillment", "ecommerce courier services", "ecommerce warehouse logistics", "b2c fulfillment partner"],
    "FMCG (Fast-Moving Consumer Goods)": ["baby diapers distributor", "bulk canned food wholesale", "private label cosmetics", "beverage packaging partner", "bulk laundry detergent", "toilet paper wholesale"],
    "Warehousing": ["ambient warehousing", "bonded warehouse 3pl", "cold storage warehousing", "hazardous chemical storage", "fulfillment warehouse center", "cross docking facility"],
    "Road Freight": ["superlink road freight", "refrigerated trucking", "cross border trucking", "heavy haulage transport", "flatbed trucking services", "tri axle road freight"],
    "Supply Chain Management": ["supply chain consulting", "warehouse management software", "procurement consulting", "logistics control tower", "supply chain optimization", "demand planning software"],
    "Mobile Networks & ISP": ["microwave link backhaul", "dedicated business fiber", "cloud hosted voip", "lte network failover", "sd-wan networking", "apn mobile solutions"],
    "Software Development": ["junior c# developer", "databricks service provider", "c# development agency", "junior python developer", "react frontend developer", "node js backend consultant", "java developer contract", "snowflake data engineer"],
    "SaaS": ["stripe billing integration", "odoo erp saas", "salesforce integration", "hubspot crm consultant", "shopify app developer", "saas billing software"],
    "Cybersecurity": ["penetration testing services", "managed soc security", "owasp web audit", "cyber forensics consultant", "iso 27001 auditing", "endpoint security supplier"],
    "IT Consulting & Support": ["postgresql database administrator", "snowflake data cloud migration", "aws certified devops architect", "kubernetes cluster deployment", "managed desktop support", "active directory consultant"],
    "Hotel & Lodging": ["corporate hotel booking", "hotel guest amenities supplier", "safari lodge management", "pms hotel software", "hotel property developer", "boutique hotel partner"],
    "Travel Agencies": ["travel policy compliance", "corporate travel agent", "flights booking planner", "group retreat booking", "incentive travel agency", "business travel agency"],
    "Ecotourism": ["fair trade ecotourism", "solar powered lodge design", "kruger walking safari", "community tourism project", "birding tour operator", "sustainable tourism consultant"],
    "Catering & Events": ["corporate buffet catering", "expo stand contractor", "mobile barista catering", "conference av staging", "event management agency", "wedding catering supplier"],
    "Medical Devices": ["medical syringe suppliers", "orthopedic implants manufacturer", "ultrasound scanner supplier", "surgical glove wholesale", "patient monitor distributor", "mri machine supplier"],
    "Private Healthcare Services": ["occupational health clinic", "primary care clinic network", "vitality wellness programs", "home nursing service", "dialysis center operator", "private ambulance service"],
    "Pharmaceutical Manufacturing": ["pharma contract manufacturing", "api pharma supplier", "paracetamol manufacturing", "pharma cold chain logistics", "mcc approved pharma factory", "sterile injectables manufacturer"],
    "Health Insurance (Medical Aid)": ["discovery health broker", "gap cover insurance broker", "medical aid design consultant", "employee assistance program", "medical scheme advisory"],
    "Solar & Renewable Energy": ["solar panel wholesale", "commercial solar epc", "lithium battery storage", "grid tie inverter installer", "wind farm epc contractor", "biomass energy developer"],
    "Electrical Engineering": ["substation engineering consultant", "transformer testing maintenance", "plcs scada automation", "electrical area classification", "mv hv reticulation design", "generator maintenance contractor"],
    "Water Management": ["reverse osmosis water treatment", "greywater recycling plant", "borehole filtration system", "municipal wastewater sanitation", "water pump wholesale supplier", "sludge dewatering contractor"],
    "Waste Management": ["hazardous chemical waste disposal", "medical waste incineration", "e-waste recycling collection", "paper cardboard shredding", "plastic waste recycling", "landfill management services"],
    "Civil Engineering": ["sanral approved contractor", "asphalt road construction", "reinforced concrete bridge", "earthworks clearing contractor", "geotechnical drilling services", "stormwater drainage engineering"],
    "Commercial Property Development": ["commercial property developers", "retail strip mall builders", "logistics warehouse developers", "turnkey office fit out", "green building architects", "quantity surveyor consultant"],
    "Residential Construction": ["nhbrc home builders", "housing estate architects", "gated community infrastructure", "apartment building contractor", "low cost housing developer", "roof truss supplier"],
    "Building Materials": ["building cement wholesale", "plaster sand suppliers", "concrete brick manufacturer", "aac block supplier", "crushed stone aggregate", "steel reinforcing rebar"],
    "Legal Services": ["mergers acquisitions law firm", "fais compliance legal advisory", "ccma labor dispute representation", "saica audit legal consultant", "intellectual property lawyers", "commercial contract attorneys"],
    "Accounting & Tax": ["sars tax dispute resolution", "saipa public accounting", "cloud payroll integration", "ifrs financial auditors", "corporate tax consultant", "bookkeeping outsourcing services"],
    "Recruitment & HR": ["it placement recruitment agency", "executive search headhunters", "saqa qualification verification", "temporary blue collar staffing", "payroll administration outsourcing", "hr policy consulting"],
    "Marketing & Advertising": ["b2b lead generation agency", "google ads ppc audit", "corporate brand design", "abm marketing consultant", "linkedin advertising agency", "seo optimization company"],
    "Security Services": ["corporate security guarding", "cctv thermal camera installation", "armed response guard services", "close protection vip bodyguard", "access control system supplier", "riot control security"],
    "Generative AI & LLMs": ["custom fine tuned llm", "rag system architecture", "enterprise generative ai", "openai api custom integration", "agentic workflow development", "langchain developer", "llamaindex consulting", "vector database integration"],
    "Computer Vision": ["yolov8 object detection", "industrial anomaly detection", "ocr document processing", "facial recognition access control", "video analytics security", "image segmentation partner", "thermal camera vision"],
    "Machine Learning Operations (MLOps)": ["kubeflow mlops pipeline", "mlflow model registry", "gpu cluster compute hosting", "hugging face deployment", "ml model monitoring", "triton inference server", "sagemaker mlops architect"],
    "AI Consulting & Strategy": ["corporate ai readiness strategy", "responsible ai ethics compliance", "fractional chief ai officer caio", "ai center of excellence coe", "enterprise ai transformation", "ai strategy roadmap"]
}

# Template definitions by B2B intent categories
templates = [
    # 1. Direct Service Provider
    {"template": "hire {term} services", "intent": "Service Provider"},
    {"template": "{term} provider {location}", "intent": "Service Provider"},
    {"template": "trusted {term} agency", "intent": "Service Provider"},
    {"template": "outsource {term} projects", "intent": "Service Provider"},
    {"template": "local {term} contractor {location}", "intent": "Service Provider"},
    # 2. Supplier
    {"template": "bulk {term} wholesale", "intent": "Supplier"},
    {"template": "{term} manufacturer supplier", "intent": "Supplier"},
    {"template": "{term} wholesale distributor {location}", "intent": "Supplier"},
    {"template": "buy {term} bulk pricing", "intent": "Supplier"},
    # 3. Consultant
    {"template": "registered {term} consultant", "intent": "Consultant"},
    {"template": "corporate {term} specialist {location}", "intent": "Consultant"},
    {"template": "independent {term} advisory services", "intent": "Consultant"},
    {"template": "{term} strategy auditor", "intent": "Consultant"},
    # 4. Networking, JV, Strategic Subcontracting (Solved only by networking)
    {"template": "{term} joint venture partner", "intent": "Networking"},
    {"template": "prequalified {term} subcontractor for tender", "intent": "Networking"},
    {"template": "find {term} strategic alliance", "intent": "Networking"},
    {"template": "direct introduction to {term} director", "intent": "Networking"},
    {"template": "{term} referral network partner", "intent": "Networking"},
    {"template": "black owned {term} subcontractor {location}", "intent": "Networking"},
    {"template": "{term} co-investment syndicate partner", "intent": "Networking"}
]

locations = ["johannesburg", "cape town", "durban", "pretoria", "south africa", "gauteng", "western cape"]

generated_dataset = []
unique_phrases = set()

# Seed generation loop
for sub_name, terms in core_terms.items():
    ind_name = sub_to_ind[sub_name]
    for term in terms:
        for t in templates:
            for loc in locations:
                # Compile phrase
                phrase = t["template"].format(term=term, location=loc)
                if phrase in unique_phrases:
                    continue
                unique_phrases.add(phrase)
                
                # Derive canonical term
                canonical = term.title()
                
                # Calculate search volume & difficulty realistically
                phrase_len = len(phrase.split())
                if phrase_len <= 3:
                    vol = random.randint(800, 4500)
                    diff = random.randint(45, 68)
                elif phrase_len <= 5:
                    vol = random.randint(250, 950)
                    diff = random.randint(30, 49)
                else:
                    vol = random.randint(50, 240)
                    diff = random.randint(20, 29)
                
                # Generate high-quality copy fields dynamically
                canonical_clean = canonical.replace("Llm", "LLM").replace("Api", "API").replace("Ocr", "OCR").replace("M&A", "M&A").replace("Voip", "VOIP").replace("Saas", "SaaS").replace("M2m", "M2M").replace("Plc", "PLC").replace("Scada", "SCADA").replace("Epc", "EPC").replace("Hv", "HV").replace("Mv", "MV").replace("Dba", "DBA").replace("Soc", "SOC").replace("Cctv", "CCTV").replace("Nhbrc", "NHBRC")
                loc_title = loc.title()
                
                if t["intent"] == "Service Provider":
                    heading = f"Prequalified {canonical_clean} Service Providers in {loc_title}"
                    description = f"Looking to hire verified experts for {phrase}? LinkMate introduces you directly to compatible {canonical_clean} companies and contractors in {loc_title} to start warm business conversations instantly."
                    pre_fill = f"Need {phrase} in {loc_title}"
                    what_to_look_for = [
                        f"Prior experience and a proven B2B portfolio in {canonical_clean} projects",
                        "Accredited certifications and industry-standard compliance validation",
                        "SLA guarantees, clear delivery timelines, and milestone-based scoping",
                        "Past client references and verified local casework in South Africa"
                    ]
                elif t["intent"] == "Supplier":
                    heading = f"Wholesale {canonical_clean} Suppliers & Manufacturers in {loc_title}"
                    description = f"Source {canonical_clean} raw materials, parts, or products in bulk. Connect with registered {canonical_clean} manufacturers and distributors in {loc_title} who are pre-vetted and ready to do business."
                    pre_fill = f"Looking for bulk {phrase} suppliers in {loc_title}"
                    what_to_look_for = [
                        "Quality assurance certifications and raw material grading standards",
                        "Lead times, production scaling capacity, and supply chain logistics resilience",
                        "Transparent bulk-order pricing tiers, wholesale terms, and trade credit options",
                        "Clear refund, return policies, and defective product replacement guarantees"
                    ]
                elif t["intent"] == "Consultant":
                    heading = f"Registered {canonical_clean} Advisors & Consultants in {loc_title}"
                    description = f"Need professional consulting or strategic advisory for {phrase}? Partner with accredited {canonical_clean} experts and independent auditors in {loc_title} to optimize your business operations."
                    pre_fill = f"Looking for a certified {phrase} consultant in {loc_title}"
                    what_to_look_for = [
                        f"Accreditations, professional credentials, and advisory track record in {canonical_clean}",
                        "Independent, vendor-neutral consulting model ensuring objective recommendations",
                        "Highly structured roadmap deliverables, actionability, and post-project review options",
                        "Deep domain understanding aligned with South African business regulatory standards"
                    ]
                else:  # Networking, JV, Subcontracting
                    heading = f"Find {canonical_clean} Joint Venture & Subcontracting Partners"
                    description = f"Solve complex projects through verified business networking. Connect with trustworthy {canonical_clean} partners, black-owned subcontractors, and co-investment syndicates in {loc_title}."
                    pre_fill = f"Need a joint venture subcontractor for {phrase} in {loc_title}"
                    what_to_look_for = [
                        f"Shared strategic vision, operational synergy, and culture fit in {canonical_clean}",
                        "Successful track record in previous consortia, tenders, or joint venture schemes",
                        "Clear legal framework outlining risk-sharing, accountability, and project equity splits",
                        "Complementary technical resources, regional access points, or specialized expertise sets"
                    ]

                # Create keyword entry
                generated_dataset.append({
                    "phrase": phrase,
                    "canonical_term": canonical,
                    "intent": t["intent"],
                    "industry": ind_name,
                    "sub_industry": sub_name,
                    "search_volume": vol,
                    "difficulty": diff,
                    "heading": heading,
                    "description": description,
                    "pre_fill": pre_fill,
                    "what_to_look_for": what_to_look_for
                })

# Deduplicate and sort
generated_dataset.sort(key=lambda x: (x["industry"], x["sub_industry"], -x["search_volume"]))

# Write directly to seo_seed.json
seed_path = r"c:\projects\linkmate\backend\app\seo_seed.json"
with open(seed_path, "w", encoding="utf-8") as f:
    json.dump(generated_dataset, f, indent=2)

print(f"SUCCESS: Generated {len(generated_dataset)} highly targeted B2B SEO keywords across all 12 industries.")
