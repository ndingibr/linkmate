"""
seed_users.py
Injects 10,000 realistic South African fake user records into the LinkMate users table.
All users share the email admin@linkmate.co.za (with a unique suffix per record to avoid
unique-constraint violations), different first/last names, locations, job titles, companies,
intents, and profile fields reflecting the local B2B market.

Run from the backend root:
    venv\\Scripts\\python.exe seed_users.py
"""

import random
import sys
import os
from datetime import datetime, timedelta
import bcrypt

# make sure the app package is importable
sys.path.insert(0, os.path.dirname(__file__))
from app.core.db import get_conn

# password hashing — compute once, reuse for speed
_salt = bcrypt.gensalt()
SHARED_HASH = bcrypt.hashpw(b"Admin@1234!", _salt).decode("utf-8")

# ─────────────────────────────────────────────────────────────────────────────
# DATA POOLS
# ─────────────────────────────────────────────────────────────────────────────

FIRST_NAMES = [
    # Zulu / Ndebele
    "Siyanda","Thabo","Bongani","Lungelo","Sipho","Nhlanhla","Mthokozisi","Lwazi","Sandile","Musa",
    "Mpendulo","Sifiso","Nkosinathi","Mandla","Sibusiso","Sakhile","Mthembeni","Bhekani","Dalisu","Zakhele",
    # Sotho / Tswana / Pedi
    "Lerato","Kgomotso","Tebogo","Tshepo","Mpho","Katlego","Boitumelo","Refilwe","Thabo","Karabo",
    "Naledi","Keabetswe","Lesego","Moipone","Dineo","Sello","Lebogang","Sefako","Tumelo","Palesa",
    # Xhosa
    "Ayanda","Nolwazi","Sakhiwo","Luyanda","Bulelani","Thembinkosi","Nomalanga","Olwethu","Asanda","Zintle",
    "Unathi","Khanya","Zola","Lungisa","Aviwe","Khanyisile","Buyisa","Aphiwe","Vuyo","Noxolo",
    # Afrikaans / Coloured community
    "Riaan","Deon","Francois","Charl","Yolanda","Melanie","Lizette","Anri","Barend","Pieter",
    "Elna","Adri","Jannie","Gideon","Mareli","Christiaan","Elmien","Frikkie","Renate","Neels",
    # Indian South African
    "Priya","Kavitha","Shivani","Devika","Preshaan","Roshan","Arjun","Nishika","Ashwin","Sanjeev",
    "Meera","Yogesh","Kiran","Deepa","Anil","Sunita","Ravi","Pooja","Vikesh","Nadia",
    # Cape Malay / Muslim
    "Faatiema","Zainab","Yusuf","Rashid","Tasneem","Bilal","Nuraan","Riyadh","Aisha","Imraan",
    # General / mixed heritage
    "Keegan","Chanel","Tayla","Dylan","Samantha","Bradley","Michelle","Gareth","Simone","Clinton",
    "Taryn","Justin","Candice","Darren","Natasha","Grant","Roxanne","Craig","Tiffany","Wayne",
]

LAST_NAMES = [
    # Zulu/Ndebele
    "Dlamini","Nkosi","Zulu","Mthembu","Mkhize","Ndlovu","Gumede","Buthelezi","Ntuli","Cele",
    "Mhlongo","Mbatha","Zwane","Shabalala","Ngcobo","Khumalo","Sithole","Majola","Madlala","Bhengu",
    # Sotho/Tswana/Pedi
    "Mokoena","Molefe","Sithole","Motsepe","Nkosi","Tshwete","Lekota","Ramaphosa","Dlamini","Matlala",
    "Sekgala","Moremi","Sefatsa","Phiri","Ntlhane","Mokone","Setshedi","Malatji","Dikgale","Moraba",
    # Xhosa
    "Dlamini","Mthethwa","Jama","Mhlana","Nkabinde","Mgijima","Somfu","Ntuli","Nabe","Sokhela",
    # Afrikaans
    "Van der Merwe","Botha","Pretorius","Du Plessis","Joubert","Venter","Nel","Steyn","Van Zyl","De Beer",
    "Visser","Swart","Potgieter","Engelbrecht","Cronje","Olivier","Louw","Kotze","Barnard","Hugo",
    # Indian
    "Naidoo","Pillay","Govender","Chetty","Moodley","Naicker","Reddy","Maharaj","Sewpersad","Sunker",
    # Cape Malay
    "Cassiem","Hendricks","Davids","Abdurahman","Jacobs","Samaai","Adams","Arendse","Fortune","Dollie",
    # General
    "Smith","Williams","Jones","Brown","Taylor","Davies","Wilson","Evans","Thomas","Johnson",
]

SA_LOCATIONS = [
    # Gauteng
    "Sandton, Johannesburg","Rosebank, Johannesburg","Midrand, Gauteng","Centurion, Pretoria",
    "Randburg, Johannesburg","Soweto, Johannesburg","Pretoria CBD, Gauteng","Germiston, Ekurhuleni",
    "Boksburg, Ekurhuleni","Fourways, Johannesburg","Edenvale, Johannesburg","Benoni, Ekurhuleni",
    "Krugersdorp, West Rand","Roodepoort, Johannesburg","Alberton, Ekurhuleni","Vanderbijlpark, Vaal",
    # Western Cape
    "Cape Town CBD, Western Cape","Bellville, Cape Town","Stellenbosch, Western Cape",
    "Paarl, Western Cape","George, Western Cape","Knysna, Western Cape","Somerset West, Western Cape",
    "Mitchells Plain, Cape Town","Wynberg, Cape Town","Claremont, Cape Town","Tygervalley, Cape Town",
    # KwaZulu-Natal
    "Durban CBD, KwaZulu-Natal","Umhlanga, KwaZulu-Natal","Pinetown, KwaZulu-Natal",
    "Pietermaritzburg, KwaZulu-Natal","Richards Bay, KwaZulu-Natal","Westville, KwaZulu-Natal",
    "Ballito, KwaZulu-Natal","Hillcrest, KwaZulu-Natal","Amanzimtoti, KwaZulu-Natal",
    # Eastern Cape
    "Port Elizabeth (Gqeberha), Eastern Cape","East London, Eastern Cape","Mthatha, Eastern Cape",
    "King William's Town, Eastern Cape","Uitenhage, Eastern Cape",
    # Other provinces
    "Bloemfontein, Free State","Kimberley, Northern Cape","Polokwane, Limpopo",
    "Nelspruit (Mbombela), Mpumalanga","Witbank (eMalahleni), Mpumalanga","Rustenburg, North West",
    "Mahikeng, North West","Tzaneen, Limpopo","Thohoyandou, Limpopo","Vryburg, Northern Cape",
]

ROLES = [
    "Seeker – I need a supplier",
    "Supplier – I have something to offer",
    "Networker – I'm here to connect",
]

INFLUENCES = [
    "Decision Maker","Budget Holder","Technical Evaluator",
    "Procurement Officer","Executive Sponsor","End User","Consultant",
]

COMM_CHANNELS = ["Email","WhatsApp","Phone Call","LinkedIn","In-Person Meeting"]
COMM_HOURS    = ["08:00–12:00","12:00–17:00","17:00–20:00","Anytime","Weekends only"]
INTENT_LIFESPANS = ["0–3 months","3–6 months","6–12 months","12+ months"]

JOB_TITLES = [
    # Executive
    "CEO","MD","COO","CFO","CTO","Founder","Co-Founder","Director","Executive Director","Chairman",
    # Sales & BD
    "Sales Director","Business Development Manager","Account Executive","Key Account Manager",
    "National Sales Manager","Regional Sales Director","Sales Representative","Head of Growth",
    # Operations
    "Operations Manager","Supply Chain Manager","Logistics Manager","Procurement Manager",
    "Warehouse Manager","Fleet Manager","Production Manager","Quality Assurance Manager",
    # Finance
    "Financial Manager","Chief Accountant","Bookkeeper","Financial Analyst","Treasury Manager",
    # Tech & IT
    "IT Manager","Systems Administrator","Software Developer","Data Analyst","DevOps Engineer",
    "Cybersecurity Specialist","Network Engineer","Cloud Architect",
    # Marketing
    "Marketing Manager","Brand Manager","Digital Marketing Specialist","PR Manager","Content Strategist",
    # HR
    "HR Manager","Talent Acquisition Specialist","People Operations Lead","Training & Development Manager",
    # Other
    "Project Manager","Compliance Officer","Legal Advisor","Risk Manager","Franchise Owner",
    "Contractor","Consultant","Freelancer","Business Analyst","Strategy Lead",
]

COMPANY_PREFIXES = [
    "","","","",   # many solo traders / no company name
    "","","","",
    "Thabo","Siyanda","Mkhize","Botha","Naidoo","Van der Merwe","Pillay","Joubert","Modise","Baloyi",
    "Khumalo","Cele","Lekota","Nkosi","Ramaphosa","Sithole","Zulu","Pretorius",
]

COMPANY_SUFFIXES = [
    "Trading","Logistics","Solutions","Consulting","Enterprises","Holdings","Group","Technologies",
    "Services","Distributors","Contractors","Projects","Construction","Mining","Agri","Finance",
    "Healthcare","Media","Retail","Properties","Engineering","Investments","Supply","Wholesale",
]

COMPANY_FORMATS = [
    "{prefix} {suffix} (Pty) Ltd",
    "{prefix} & Associates",
    "{prefix} {suffix} CC",
    "{prefix} {suffix}",
    "{suffix} of South Africa",
    "SA {suffix}",
    "{prefix} {suffix} (RF) Ltd",
]

INTENTS = [
    # Selling / offering
    "Ons het 'n nuwe reeks organiese boerderyprodukte en soek groothandelaars in Gauteng om dit te versprei.",
    "I run a small IT support business in Pretoria and I'm looking for companies that need outsourced helpdesk services.",
    "Siyathengisa izimpahla zezimali ezincane futhi sifuna amabhizinisi afuna ukusiza abasebenzi babo ngokuboleka.",
    "We manufacture bespoke steel fabrications in KZN and are looking for construction companies and contractors.",
    "I offer certified bookkeeping and payroll services remotely — looking for SMEs that need reliable monthly accounting.",
    "Ons is 'n BBBEE-gesertifiseerde koerier- en afleweringsdiens in Kaapstad en soek nuwe sakekliënte.",
    "I provide digital marketing and SEO services for local businesses — affordable packages for small retailers.",
    "Re direla ditirelo tsa khiro ya thepa le dithulaganyo tsa boitapišo mo Gauteng.",
    "We supply eco-friendly packaging materials to cosmetics and food brands across South Africa.",
    "I'm a certified HR consultant helping businesses with employment equity plans and SETA compliance.",
    "Sikhiqiza izicathulo ezigqajwe ngesandla futhi sifuna izitolo zamalebheli ezizimele zikwazi ukuwathengisa.",
    "We offer fleet tracking and telematics solutions for logistics companies, mines, and municipalities.",
    "I'm a solar energy installer looking for property developers, farms, and factories to supply off-grid systems.",
    "Ke rekiša dipolelo tsa semmuši le ditirelo tsa go ngwala pukuntšhu tša molao.",
    "I run a catering company in Durban specialising in corporate events and daily canteen management.",
    "Ons verskaf plaaslike-vervaardigde meubels aan kantoor- en hotelprojekte regoor Suid-Afrika.",
    "We provide accredited first-aid training and safety officer courses for mines and construction sites.",
    "I develop custom mobile and web applications — looking for startups and SMEs that need a tech partner.",
    "Sinikezela ngezindawo zokugcina impahla ekhanda futhi sifuna amabhizinisi adinga izindawo zokuqasha.",
    "We import and distribute industrial cleaning chemicals — looking for hospitals, hotels, and factories.",
    # Buying / seeking
    "I need a reliable frozen food supplier who can deliver weekly to my restaurant in Sandton.",
    "Sifuna inkampani yokwakha amabhilidi amancane futhi ikhiqize izindlu ezimsebenzisa amandla elanga e-Soweto.",
    "We are looking for a local PPE supplier to fulfil a government tender in Limpopo.",
    "I need an affordable cloud hosting provider for a fintech app we're launching in Q3.",
    "Ons soek 'n betroubare groothandelaar van vars produkte vir ons supermarkketting in die Vrystaat.",
    "I'm looking for an auditing firm to help us prepare for our first SOC 2 Type II audit in Cape Town.",
    "Ke nyaka morekisi wa dilwana tša go apara tša kholoi tše nnyane mo porofenseng ya Limpopo.",
    "We need a certified BBBEE verification agency for our annual compliance report.",
    "I'm looking for a local graphic design studio to rebrand our township retail chain.",
    "Sifuna umthengisi wezinsiza zezolimo kubalwa imbewu, imifino yezitshalo, kanye namafitha egceke e-KZN.",
    "We need a specialised recruitment agency to source artisans for our manufacturing plant in Rosslyn.",
    "I am looking for a commercial property to lease in the Tygervalley area of Cape Town.",
    "Ons soek 'n IT-ouditeursfirma om ons se ERP-stelsel te hersien voor ons volgende raadsvergadering.",
    "I'm a township entrepreneur looking for a FMCG distributor who services informal traders in Soweto.",
    "We require cold-storage logistics from Durban harbour to our inland distribution centre in Midrand.",
    "Ke nyaka semphato sa go reka dikhomphutha le diprenta tše mpsha bakeng sa ofisi ya rena.",
    "I need a local contractor to install solar panels on 12 properties in the Boland region.",
    "Sifuna inkampani yemifuyo engafaka i-CCTV kanye nezinhlelo zokuphepha emndenini wesikole sethu.",
    # Networking
    "I'm a township startup founder looking to connect with other entrepreneurs in the retail space.",
    "Ke hlo go kopana le balekolodi ba dithuto tša semphato mo Gauteng — re ka thušana.",
    "I want to network with other Black-owned manufacturing businesses to explore joint ventures.",
    "Sifuna ukuxhumana nabanye osomabhizinisi abancane eMzansi esebenzisana nabo ekudayiseni kumazwe angaphandle.",
    "I'm a young agri-entrepreneur looking to connect with farming co-operatives in the Eastern Cape.",
    "Ons soek ander Afrikaner sakelui wat belangstel in die uitvoer van SA-produkte na Europa.",
    "I want to find other women-owned businesses in Gauteng to form a procurement consortium.",
    "Ke tshepa go kopana le baagi ba diprojeke tša motse wa go thušana le go gola mmogo.",
    "I'm a tech professional looking to connect with fintech founders building solutions for township markets.",
    "Sifuna ukuxhumana nezinye izinkampani ezikhiqiza izimpahla zekhwalithi yomhlaba ukuze sixoxe ngokusebenzisana.",
]

BUDGET_RANGES = [
    (0, 0),                 # no budget
    (5_000, 20_000),
    (20_000, 75_000),
    (75_000, 250_000),
    (250_000, 1_000_000),
    (1_000_000, 5_000_000),
    (5_000_000, 20_000_000),
]

def rand_phone():
    prefix = random.choice(["060","061","062","063","064","065","066","067","071","072","073","074","076","078","079","081","082","083","084"])
    return f"{prefix}{random.randint(1_000_000, 9_999_999)}"

def rand_company():
    prefix = random.choice(COMPANY_PREFIXES)
    suffix = random.choice(COMPANY_SUFFIXES)
    fmt    = random.choice(COMPANY_FORMATS)
    name   = fmt.format(prefix=prefix, suffix=suffix).strip()
    return name if name else None

def rand_budget():
    bmin, bmax = random.choice(BUDGET_RANGES)
    if bmin == 0:
        return False, None, None
    amount = random.randint(bmin, bmax)
    return True, float(amount), float(bmax)

def rand_created_at():
    days_ago = random.randint(0, 365 * 2)
    return datetime.now() - timedelta(days=days_ago)

# ─────────────────────────────────────────────────────────────────────────────
# MAIN SEEDER
# ─────────────────────────────────────────────────────────────────────────────
BATCH   = 500   # rows per INSERT batch
TOTAL   = 10_000
SA_DOMAINS = [
    "gmail.com", "yahoo.co.za", "webmail.co.za", "mweb.co.za",
    "absamail.co.za", "outlook.com", "vodamail.co.za", "telkomsa.net",
    "fnb.co.za", "standardbank.co.za", "capitec.co.za", "discovery.co.za"
]

def build_email(fn: str, ln: str, company: str, i: int) -> str:
    fn_clean = "".join(c for c in fn.lower() if c.isalnum())
    ln_clean = "".join(c for c in ln.lower() if c.isalnum())
    
    # 30% chance of a custom company email domain
    if company and random.random() < 0.3:
        # Extract first word of company name
        co_part = company.split()[0]
        co_clean = "".join(c for c in co_part.lower() if c.isalnum())
        if len(co_clean) > 2:
            return f"{fn_clean}.{ln_clean}{i}@{co_clean}.co.za"
            
    # Default to consumer/ISP domains
    dom = random.choice(SA_DOMAINS)
    sep = random.choice([".", "_", ""])
    return f"{fn_clean}{sep}{ln_clean}{i}@{dom}"

def seed():
    conn = get_conn()
    cur  = conn.cursor()

    # Wipe existing seed data (both old subaddressed and new seed_user tagged)
    print("Removing previously seeded records …")
    cur.execute("DELETE FROM users WHERE email LIKE %s OR provider_id = %s", ("admin+%@linkmate.co.za", "seed_user"))
    print(f"  {cur.rowcount} old rows removed.")

    print(f"Inserting {TOTAL:,} fake users in batches of {BATCH} …")
    inserted = 0

    for batch_start in range(0, TOTAL, BATCH):
        batch_end = min(batch_start + BATCH, TOTAL)
        rows = []
        for i in range(batch_start + 1, batch_end + 1):
            fn  = random.choice(FIRST_NAMES)
            ln  = random.choice(LAST_NAMES)
            loc = random.choice(SA_LOCATIONS)
            role = random.choice(ROLES)
            inf  = random.choice(INFLUENCES)
            title = random.choice(JOB_TITLES)
            intent = random.choice(INTENTS)
            company = rand_company() or f"{fn} {title} Solutions"
            has_budget, bmin, bmax = rand_budget()
            comm_ch  = random.choice(COMM_CHANNELS)
            comm_hr  = random.choice(COMM_HOURS)
            lifespan = random.choice(INTENT_LIFESPANS)
            created  = rand_created_at()
            phone    = rand_phone()
            email    = build_email(fn, ln, company, i)

            rows.append((
                fn, ln, email, phone, company,
                SHARED_HASH,        # password_hash
                "email",            # auth_provider
                "seed_user",        # provider_id (tag for easy removal/identification)
                True,               # is_active
                intent, role, inf,
                has_budget, bmin, bmax, "ZAR",
                comm_ch, comm_hr, lifespan, loc,
                True,               # intent_active
                created,
            ))

        args_str = ",".join(
            cur.mogrify(
                "(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                row
            ).decode("utf-8")
            for row in rows
        )

        cur.execute(f"""
            INSERT INTO users
              (first_name, last_name, email, phone, company_name,
               password_hash, auth_provider, provider_id, is_active,
               intent, role, influence,
               has_budget, budget_min, budget_max, budget_currency,
               comm_channel, comm_hours, intent_lifespan, location,
               intent_active, created_at)
            VALUES {args_str}
            ON CONFLICT (email) DO NOTHING
        """)

        inserted += cur.rowcount
        conn.commit()
        pct = (batch_end / TOTAL) * 100
        print(f"  [{pct:5.1f}%]  {inserted:,} rows inserted so far …", end="\r")

    conn.close()
    print(f"\n[SUCCESS] Done! {inserted:,} fake user records inserted.")

if __name__ == "__main__":
    seed()
