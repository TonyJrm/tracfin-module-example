use chrono::{Datelike, NaiveDate, NaiveDateTime, Duration, Weekday};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use futures::stream::{self, StreamExt};
use rand::prelude::*;
use rayon::prelude::*;
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};
use std::env;
use std::error::Error as StdError;
use std::str::FromStr;
use std::time::Instant;
use tokio_postgres::{Client, NoTls};
use uuid::Uuid;

type DynError = Box<dyn StdError + Send + Sync>;

// ============================================================================
// CONFIGURATION
// ============================================================================
const DEFAULT_PLAYERS: usize = 40_000;
const BATCH_SIZE: usize = 2_000;
const DATA_PERIOD_DAYS: i64 = 540;
const PLAYER_AGE_MIN: i32 = 18;
const PLAYER_AGE_MAX: i32 = 85;
const ANPR_RATE: f64 = 0.05;
const IM_RATE: f64 = 0.08;
const LOYALTY_RATIO: f64 = 0.1;
const MACHINE_COUNT: usize = 120;
const ZONE_A_COUNT: usize = 72;
const ZONE_B_COUNT: usize = 36;
const CSG_RATE: f64 = 13.7;
const CHEQUE_PAYMENT_THRESHOLD: f64 = 2000.0;
const RTP_MIN: f64 = 0.85;
const RTP_MAX: f64 = 0.95;
const HANDPAY_THRESHOLD: f64 = 1499.0;
const STACKER_ALERT_MULTIPLIER: f64 = 3.0;
const STACKER_ALERT_ABSOLUTE: f64 = 2000.0;
const DEFAULT_AVG_BILLS: f64 = 150.0;
const OCCASIONAL_RATE: f64 = 0.6275;
const REGULAR_RATE: f64 = 0.1900;
const REGULAR_PLUS_RATE: f64 = 0.1000;
const VIP_RATE: f64 = 0.0200;
const PATHOLOGICAL_RATE: f64 = 0.0600;  // ~2400 joueurs sur 40k (~6% des visiteurs casino)
// HighRoller: else branche → 1 - 0.9975 = 0.00025 ≈ 10 joueurs sur 40 000
const LOSS_CHASE_BOOST: f64 = 3.5;           // multiplicateur visite après perte significative
const PATHOLOGICAL_BUDGET_ESCALATION: f64 = 1.008; // +0.8% budget par visite (escalade)
const PATHOLOGICAL_BUDGET_CAP: f64 = 4.0;    // plafond multiplicateur budget (4x le budget initial)

const MALE_AVATARS: &[u32] = &[1,3,6,7,8,11,12,13,14,15,17,18,33,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70];
const FEMALE_AVATARS: &[u32] = &[5,9,10,16,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,38,39,40,41,42,43,44,45,47,48,49];

/// Banques françaises utilisées pour les comptes joueurs
const FRENCH_BANKS: &[&str] = &[
    "BNP Paribas",
    "Société Générale",
    "Crédit Agricole",
    "Crédit Mutuel",
    "Caisse d'Épargne",
    "Banque Populaire",
    "La Banque Postale",
    "CIC",
    "LCL",
    "HSBC France",
];

/// Banque du casino (pour les chèques de paiement HANDPAY)
const CASINO_BANK_NAME: &str = "Crédit Coopératif";
const CASINO_BANK_IBAN: &str = "FR7642559900003571759003414";

const FR_STREETS_JSON: &str = include_str!("french-streets.json");

const DZ_STREETS: &[&str] = &[
    "RUE HASSIBA BEN BOUALI", "BOULEVARD COLONEL AMIROUCHE", "RUE LARBI BEN MHIDI",
    "AVENUE PASTEUR", "RUE DIDOUCHE MOURAD", "BOULEVARD ZIGHOUD YOUCEF",
    "RUE ABANE RAMDANE", "RUE DE LA LIBERTE", "BOULEVARD VICTOR HUGO",
    "RUE DES FRERES BOUADOU", "AVENUE BEN BOULAID", "RUE DU STADE",
    "CITE DES ORANGERS", "RUE AMAR AMRANI", "BOULEVARD COLONEL LOTFI",
    "AVENUE DE PEKIN", "RUE MAKARBA", "BOULEVARD SAID TOUATI",
    "RUE MOKHTAR BOUAZZA", "AVENUE DE L'ALNE",
];
const MA_STREETS: &[&str] = &[
    "AVENUE MOHAMMED V", "RUE IBN SINA", "BOULEVARD ZERKTOUNI", "RUE ALLAL BEN ABDALLAH",
    "AVENUE HASSAN II", "RUE DU PRINCE MOULAY ABDALLAH", "BOULEVARD D'ANFA",
    "RUE JABER IBN HAYANE", "AVENUE DES FAR", "RUE NATIONALE",
    "BOULEVARD GHANDI", "RUE DES ARENES", "AVENUE MERS SULTAN",
    "BOULEVARD MOULAY ISMAIL", "RUE OQBA BEN NAFII", "AVENUE DE LA VICTOIRE",
    "RUE DUMONT D'URVILLE", "BOULEVARD BAB MARRAKECH",
    "AVENUE DES FORCES ARMEES ROYALES", "RUE SOUIKA",
];
const TN_STREETS: &[&str] = &[
    "AVENUE HABIB BOURGUIBA", "RUE DE MARSEILLE", "AVENUE DE PARIS", "RUE DE LA LIBERTE",
    "RUE D'ESPAGNE", "AVENUE FARHAT HACHED", "RUE DU SENEGAL",
    "AVENUE JEAN JAURES", "RUE DE HOLLANDE", "AVENUE DE CARTHAGE",
    "RUE CHARLES DE GAULLE", "AVENUE BECHIR SFAR", "RUE D'ALGERIE",
    "AVENUE DE LA REPUBLIQUE", "RUE IBN KHALDOUN", "AVENUE MONCEF BEY",
    "RUE JAMEL ABDENNASSER", "AVENUE TAIEB MEHIRI",
    "RUE DES AGHLABITES", "BOULEVARD DE L'ENVIRONNEMENT",
];
const BE_STREETS: &[&str] = &[
    "RUE DE LA LOI", "AVENUE LOUISE", "RUE ROYALE", "BOULEVARD LEOPOLD II",
    "RUE DU COMMERCE", "AVENUE DE TERVUEREN", "RUE DE NAMUR",
    "CHAUSSEE DE WATERLOO", "RUE BELLIARD", "AVENUE DE LA COURONNE",
    "RUE DU MIDI", "BOULEVARD DU MIDI", "RUE DES BOUCHERS",
    "AVENUE MOLIERE", "CHAUSSEE D'IXELLES", "RUE DE L'ETUVE",
    "AVENUE DE LA RENAISSANCE", "RUE DU MARTEAU", "AVENUE BRUGMANN",
    "PLACE DU JEU DE BALLE",
];
const LU_STREETS: &[&str] = &[
    "AVENUE DE LA LIBERTE", "RUE DE STRASBOURG", "RUE DU FORT NEIPPERG", "AVENUE MONTEREY",
    "RUE DE HOLLERICH", "PLACE GUILLAUME II", "RUE DU CURE",
    "AVENUE DU X SEPTEMBRE", "RUE ALDRINGEN", "BOULEVARD ROYAL",
    "RUE DE L'EAU", "AVENUE GASTON DIDERICH", "RUE BEAUMONT",
    "BOULEVARD F.W. RAIFFEISEN", "RUE DU COMMERCE", "AVENUE DE LA FAIENCERIE",
];
const GB_STREETS: &[&str] = &[
    "HIGH STREET", "STATION ROAD", "CHURCH LANE", "VICTORIA ROAD", "KING STREET",
    "QUEEN STREET", "PARK AVENUE", "LONDON ROAD", "GEORGE STREET", "MILL LANE",
    "GREEN LANE", "MANOR ROAD", "CHURCH STREET", "WEST STREET", "EAST STREET",
    "NORTH STREET", "SOUTH STREET", "ALBERT ROAD", "GROVE ROAD", "OXFORD ROAD",
];
const DE_STREETS: &[&str] = &[
    "HAUPTSTRASSE", "KIRCHSTRASSE", "GARTENSTRASSE", "SCHULSTRASSE", "BAHNHOFSTRASSE",
    "LINDENSTRASSE", "FRIEDHOFSTRASSE", "BERGSTRASSE", "DORFSTRASSE", "MOZARTSTRASSE",
    "GOETHESTRASSE", "SCHILLERSTRASSE", "BEETHOVENSTRASSE", "BISMARCKSTRASSE",
    "KAISERSTRASSE", "KOENIGSTRASSE", "RINGSTRASSE", "WALDSTRASSE", "FELDSTRASSE",
    "MUEHLENSTRASSE",
];
const CH_STREETS: &[&str] = &[
    "RUE DU MONT-BLANC", "BAHNHOFSTRASSE", "RUE DU RHONE", "LIMMATQUAI",
    "AVENUE DE LA GARE", "RUE DE RIVE", "TALSTRASSE", "RUE DE LAUSANNE",
    "WEINBERGSTRASSE", "AVENUE DU THEATRE", "SCHANZENEGGSTRASSE", "RUE DU STAND",
    "PELIKANSTRASSE", "AVENUE DE FRANCE", "FREIGUTSTRASSE", "RUE DE LA CORRATERIE",
];
const US_STREETS: &[&str] = &[
    "MAPLE AVENUE", "OAK STREET", "WASHINGTON BOULEVARD", "LINCOLN AVENUE",
    "ELM STREET", "CEDAR LANE", "SUNSET BOULEVARD", "BROADWAY",
    "FIFTH AVENUE", "PARK AVENUE", "WALNUT STREET", "PINE STREET",
    "HILLCREST ROAD", "LAKE DRIVE", "RIVER ROAD", "FOREST DRIVE",
    "MEADOW LANE", "SPRING STREET", "HIGHLAND AVENUE", "VALLEY ROAD",
];

fn get_foreign_streets(code: &str) -> &'static [&'static str] {
    match code {
        "DZ" => DZ_STREETS,
        "MA" => MA_STREETS,
        "TN" => TN_STREETS,
        "BE" => BE_STREETS,
        "LU" => LU_STREETS,
        "GB" => GB_STREETS,
        "DE" => DE_STREETS,
        "CH" => CH_STREETS,
        "US" => US_STREETS,
        _ => US_STREETS,
    }
}

// ============================================================================
// SYSTEM DETECTION
// ============================================================================
fn detect_system() -> (usize, u64) {
    let cpus = num_cpus::get();
    let ram_gb = std::fs::read_to_string("/proc/meminfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("MemTotal:"))
                .and_then(|l| l.split_whitespace().nth(1))
                .and_then(|v| v.parse::<u64>().ok())
        })
        .map(|kb| kb / (1024 * 1024))
        .unwrap_or(16);
    (cpus, ram_gb)
}

// ============================================================================
// NATIONALITY CONFIG
// ============================================================================
#[derive(Clone)]
struct NationalityConfig {
    code: &'static str,
    name: &'static str,
    weight: f64,
    phone_prefix: &'static str,
    firstnames_m: &'static [&'static str],
    firstnames_f: &'static [&'static str],
    lastnames: &'static [&'static str],
    cities: &'static [(&'static str, &'static str)],
    is_eu: bool,
    residence_in_france: f64,
}

const FR_LASTNAMES: &[&str] = &["Martin","Bernard","Dubois","Thomas","Robert","Richard","Durand","Leroy","Moreau","Simon","Laurent","Petit","Dupont","Lambert","Bonnet","Francois","Martinez","Legrand","Fontaine","Rousseau","Vincent","Fournier","Girard","Andre","Lefebvre","Mercier","Blanc","Guerin","Boyer","Garnier","Chevalier","Gauthier","Garcia","Perrin","Robin","Clement","Morin","Nicolas","Henry","Roussel","Mathieu","Gautier","Masson","Marchand","Dufour","Blanchard","Roux","Renard","Guillot","Colin","Vidal","Picard","Arnaud","Roger","Faure","Aubert","Lemaire","Renaud","Dumas","Lacroix","Olivier","Philippe","Bourgeois","Pierre","Benoit","Rey","Leclerc","Payet","Rolland","Leclercq","Guillaume","Lecomte","Lopez","Jean","Dupuy","Guillou","Hubert","Berger","Carpentier","Sanchez","Dupuis","Moulin","Louis","Deschamps","Huet","Vasseur","Perez","Boucher","Fleury","Royer","Klein","Jacquet","Adam","Paris","Poirier","Marty","Aubry","Gaillard","Dumont","Barbier"];
const DZ_LASTNAMES: &[&str] = &["Benali","Bensalem","Bouazza","Boudjelal","Brahimi","Cherif","Djelloul","Hadj","Hamadi","Khelifa","Mansour","Mekhloufi","Meziane","Ouali","Said","Taleb","Yahia","Youcef","Ziani","Abdelkader","Belkacem","Boualem","Djamel","Kamel"];
const BE_LASTNAMES: &[&str] = &["Dubois","Lambert","Peeters","Janssens","Maes","Jacobs","Mertens","Willems","Claes","Goossens","Wouters","De Smet","Vermeulen","Dupont","Simon"];
const MA_LASTNAMES: &[&str] = &["Alaoui","Bennani","Berrada","Chadli","Driss","Filali","Haddad","Idrissi","Jamal","Kabbaj","Lahlou","Mansouri","Naciri","Ouazzani","Tazi"];
const TN_LASTNAMES: &[&str] = &["Ben Ahmed","Ben Ali","Trabelsi","Cherif","Hamdi","Jebali","Mabrouk","Nasr","Saidi","Yacoub","Bouazizi","Dridi","Karoui","Mzoughi","Sfar","Touati"];
const DE_LASTNAMES: &[&str] = &["Muller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schafer","Koch","Bauer","Richter","Klein","Wolf","Schroder","Neumann","Schwarz","Zimmermann","Braun","Kruger","Hofmann","Hartmann"];
const GB_LASTNAMES: &[&str] = &["Smith","Johnson","Williams","Jones","Brown","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson"];
const US_LASTNAMES: &[&str] = &["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris"];
const CH_LASTNAMES: &[&str] = &["Muller","Meier","Schmid","Keller","Weber","Huber","Schneider","Meyer","Steiner","Fischer","Gerber","Brunner","Baumann","Frei","Zimmermann","Moser"];

fn get_nationalities() -> Vec<NationalityConfig> {
    vec![
        NationalityConfig { code: "FR", name: "France", weight: 60.0, phone_prefix: "+33",
            firstnames_m: &["Pierre","Jean","Michel","Philippe","Alain","Jacques","Bernard","Laurent","Nicolas","Thomas","Alexandre","Francois"],
            firstnames_f: &["Marie","Nathalie","Isabelle","Catherine","Sophie","Christine","Julie","Sandrine","Patricia","Celine","Anne","Veronique"],
            lastnames: FR_LASTNAMES, cities: &[("Paris","75001"),("Lyon","69001"),("Marseille","13001"),("Toulouse","31000"),("Nice","06000")],
            is_eu: true, residence_in_france: 0.90 },
        NationalityConfig { code: "DZ", name: "Algeria", weight: 12.0, phone_prefix: "+213",
            firstnames_m: &["Mohamed","Ahmed","Ali","Karim","Rachid","Youssef","Amine","Sofiane"],
            firstnames_f: &["Fatima","Aicha","Samira","Leila","Amina","Nadia","Soraya","Karima"],
            lastnames: DZ_LASTNAMES, cities: &[("Algiers","16000"),("Oran","31000"),("Constantine","25000")],
            is_eu: false, residence_in_france: 0.70 },
        NationalityConfig { code: "BE", name: "Belgium", weight: 8.0, phone_prefix: "+32",
            firstnames_m: &["Jan","Luc","Pieter","Marc","Jean","Philippe","Tom","Maxime"],
            firstnames_f: &["Marie","Sophie","Emma","Laura","Julie","Nathalie","Lisa","Anna"],
            lastnames: BE_LASTNAMES, cities: &[("Brussels","1000"),("Antwerp","2000"),("Ghent","9000")],
            is_eu: true, residence_in_france: 0.40 },
        NationalityConfig { code: "MA", name: "Morocco", weight: 6.0, phone_prefix: "+212",
            firstnames_m: &["Mohammed","Hassan","Omar","Yassine","Mehdi","Samir","Khalid","Anas"],
            firstnames_f: &["Fatima","Khadija","Zineb","Salma","Imane","Btissam","Hanane","Laila"],
            lastnames: MA_LASTNAMES, cities: &[("Casablanca","20000"),("Rabat","10000"),("Marrakech","40000")],
            is_eu: false, residence_in_france: 0.70 },
        NationalityConfig { code: "LU", name: "Luxembourg", weight: 3.0, phone_prefix: "+352",
            firstnames_m: &["Pierre","Jean","Michel","Philippe"], firstnames_f: &["Marie","Sophie","Catherine","Anne"],
            lastnames: &DE_LASTNAMES[0..12], cities: &[("Luxembourg","L-1234")],
            is_eu: true, residence_in_france: 0.30 },
        NationalityConfig { code: "GB", name: "United Kingdom", weight: 3.0, phone_prefix: "+44",
            firstnames_m: &["James","John","William","David","Richard","Michael","Thomas","Christopher"],
            firstnames_f: &["Mary","Patricia","Jennifer","Linda","Elizabeth","Susan","Jessica","Sarah"],
            lastnames: GB_LASTNAMES, cities: &[("London","SW1A 1AA"),("Manchester","M1 1AE")],
            is_eu: false, residence_in_france: 0.30 },
        NationalityConfig { code: "DE", name: "Germany", weight: 2.0, phone_prefix: "+49",
            firstnames_m: &["Hans","Klaus","Peter","Michael","Thomas","Andreas","Stefan","Juergen"],
            firstnames_f: &["Anna","Maria","Petra","Sabine","Claudia","Andrea","Monika","Gisela"],
            lastnames: DE_LASTNAMES, cities: &[("Berlin","10115"),("Munich","80331")],
            is_eu: true, residence_in_france: 0.30 },
        NationalityConfig { code: "TN", name: "Tunisia", weight: 2.0, phone_prefix: "+216",
            firstnames_m: &["Mohamed","Karim","Mehdi","Amine","Anis","Hatem","Sami","Zied"],
            firstnames_f: &["Amira","Emna","Ines","Mariem","Sana","Salma","Yasmine","Nour"],
            lastnames: TN_LASTNAMES, cities: &[("Tunis","1000"),("Sfax","3000")],
            is_eu: false, residence_in_france: 0.70 },
        NationalityConfig { code: "CH", name: "Switzerland", weight: 1.5, phone_prefix: "+41",
            firstnames_m: &["Lukas","Fabien","Marco","Julien","Stefan","Thomas","David","Nicolas"],
            firstnames_f: &["Laura","Sophie","Anna","Marie","Chiara","Emma","Lisa","Julia"],
            lastnames: CH_LASTNAMES, cities: &[("Geneva","1200"),("Zurich","8001")],
            is_eu: false, residence_in_france: 0.30 },
        NationalityConfig { code: "US", name: "United States", weight: 1.0, phone_prefix: "+1",
            firstnames_m: &["Michael","Christopher","Matthew","Joshua","Daniel","David","James","Robert"],
            firstnames_f: &["Jessica","Ashley","Emily","Sarah","Samantha","Amanda","Brittany","Jennifer"],
            lastnames: US_LASTNAMES, cities: &[("New York","10001"),("Los Angeles","90001")],
            is_eu: false, residence_in_france: 0.30 },
        NationalityConfig { code: "OTHER", name: "Other", weight: 0.5, phone_prefix: "+1",
            firstnames_m: &["Michael","David","James","Robert"], firstnames_f: &["Jessica","Sarah","Amanda","Jennifer"],
            lastnames: US_LASTNAMES, cities: &[("International","00000")],
            is_eu: false, residence_in_france: 0.50 },
    ]
}

// ============================================================================
// PLAYER PROFILE
// ============================================================================
#[derive(Clone, Copy, Debug)]
enum PlayerProfile {
    Occasional,
    Regular,
    RegularPlus,
    Vip,
    HighRoller,
    /// Joueur pathologique : visites fréquentes en semaine (journée), budget qui escalade,
    /// loss-chasing systématique, réinjecte quasi systématiquement ses gains.
    Pathological,
}

impl PlayerProfile {
    fn random(rng: &mut ThreadRng) -> Self {
        let roll: f64 = rng.gen_range(0.0..1.0);
        if roll < OCCASIONAL_RATE { PlayerProfile::Occasional }
        else if roll < OCCASIONAL_RATE + REGULAR_RATE { PlayerProfile::Regular }
        else if roll < OCCASIONAL_RATE + REGULAR_RATE + REGULAR_PLUS_RATE { PlayerProfile::RegularPlus }
        else if roll < OCCASIONAL_RATE + REGULAR_RATE + REGULAR_PLUS_RATE + VIP_RATE { PlayerProfile::Vip }
        else if roll < OCCASIONAL_RATE + REGULAR_RATE + REGULAR_PLUS_RATE + VIP_RATE + PATHOLOGICAL_RATE { PlayerProfile::Pathological }
        else { PlayerProfile::HighRoller }
    }
    fn base_visit_prob(&self) -> f64 {
        match self {
            PlayerProfile::Occasional   => 3.5  / DATA_PERIOD_DAYS as f64,
            PlayerProfile::Regular      => 20.0 / DATA_PERIOD_DAYS as f64,
            PlayerProfile::RegularPlus  => 35.0 / DATA_PERIOD_DAYS as f64,
            PlayerProfile::Vip          => 50.0 / DATA_PERIOD_DAYS as f64,
            PlayerProfile::HighRoller   => 100.0 / DATA_PERIOD_DAYS as f64,
            // Base modeste — le loss-chase boost multiplie les visites en clusters
            PlayerProfile::Pathological => 28.0 / DATA_PERIOD_DAYS as f64,
        }
    }
    fn budget_range(&self) -> (f64, f64) {
        match self {
            PlayerProfile::Occasional   => (20.0, 100.0),
            PlayerProfile::Regular      => (50.0, 200.0),
            PlayerProfile::RegularPlus  => (100.0, 500.0),
            PlayerProfile::Vip          => (500.0, 1000.0),
            PlayerProfile::HighRoller   => (1000.0, 100000.0),
            // Similaire au régulier, mais multiplié par budget_multiplier (escalade progressive)
            PlayerProfile::Pathological => (50.0, 200.0),
        }
    }
    fn sessions_per_visit_range(&self) -> (usize, usize) {
        match self {
            PlayerProfile::Occasional   => (1, 2),
            PlayerProfile::Regular      => (2, 4),
            PlayerProfile::RegularPlus  => (2, 5),
            PlayerProfile::Vip          => (3, 6),
            PlayerProfile::HighRoller   => (3, 6),
            PlayerProfile::Pathological => (3, 8), // joue très longtemps, tant qu'il a de l'argent
        }
    }
    fn preferred_zone(&self) -> (usize, usize) {
        match self {
            PlayerProfile::Occasional   => (0, ZONE_A_COUNT),
            PlayerProfile::Regular      => (0, ZONE_A_COUNT + ZONE_B_COUNT),
            PlayerProfile::RegularPlus  => (0, ZONE_A_COUNT + ZONE_B_COUNT),
            PlayerProfile::Vip          => (ZONE_A_COUNT, ZONE_A_COUNT + ZONE_B_COUNT),
            PlayerProfile::HighRoller   => (ZONE_A_COUNT + ZONE_B_COUNT, MACHINE_COUNT),
            PlayerProfile::Pathological => (0, ZONE_A_COUNT),
        }
    }
    /// Probabilité que le joueur finance une session en billets directs (vs achat ticket en caisse).
    fn bills_probability(&self) -> f64 {
        match self {
            PlayerProfile::Occasional   => 0.80,
            PlayerProfile::Regular      => 0.40,
            PlayerProfile::RegularPlus  => 0.25,
            PlayerProfile::Vip          => 0.30,
            PlayerProfile::HighRoller   => 0.45,
            PlayerProfile::Pathological => 0.92, // cash anonyme, difficile à tracer
        }
    }
    /// Probabilité que l'achat cage soit fait par chèque (vs CB). Seulement pour FR.
    fn cheque_probability(&self) -> f64 {
        match self {
            PlayerProfile::Occasional   => 0.05,
            PlayerProfile::Regular      => 0.10,
            PlayerProfile::RegularPlus  => 0.20,
            PlayerProfile::Vip          => 0.25,
            PlayerProfile::HighRoller   => 0.30,
            PlayerProfile::Pathological => 0.02,
        }
    }
    /// Poids des 3 créneaux horaires : (10h-19h, 19h-23h, 23h-3h)
    fn time_weights(&self) -> (f64, f64, f64) {
        match self {
            PlayerProfile::Occasional   => (0.60, 0.30, 0.10),
            PlayerProfile::Regular      => (0.50, 0.40, 0.10), // après-midis, quelques soirées
            PlayerProfile::RegularPlus  => (0.25, 0.50, 0.25), // principalement en soirée
            PlayerProfile::Vip          => (0.15, 0.45, 0.40), // soirée et nuit
            PlayerProfile::HighRoller   => (0.10, 0.35, 0.55), // très tard, week-end
            PlayerProfile::Pathological => (0.75, 0.22, 0.03), // journée semaine (n'a plus de travail)
        }
    }
    /// Plage de durée de session en minutes
    fn session_duration_range(&self) -> (i64, i64) {
        match self {
            PlayerProfile::Occasional   => (15,  60),  // vient essayer, repart vite
            PlayerProfile::Regular      => (30, 180),  // peut rester tout un après-midi
            PlayerProfile::RegularPlus  => (45, 180),
            PlayerProfile::Vip          => (30, 120),
            PlayerProfile::HighRoller   => (30, 120),
            PlayerProfile::Pathological => (60, 300),  // sessions très longues, perd la notion du temps
        }
    }
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================
#[derive(Clone)]
struct PlayerData {
    client_id: Uuid,
    parent_casino_id: Uuid,
    picture_url: String,
    firstname: String,
    lastname: String,
    gender: String,
    birth_date: NaiveDate,
    birth_place: String,
    nationality: String,
    phone_number: String,
    email: String,
    mobile: String,
    address_number: String,
    address_street: String,
    address_postal_code: String,
    address_city: String,
    address_country: String,
    id_doc_type: String,
    id_doc_number: String,
    profession: String,
    lives_in_france: bool,
    profile: PlayerProfile,
    /// Banque principale générée une fois — utilisée pour la table `banks` et les chèques
    bank_name: String,
    /// IBAN principal généré une fois (vide pour les non-résidents FR)
    account_number: String,
}

struct MachineState {
    machine_number: String,
    serial_number: String,
    busy_until: Option<NaiveDateTime>,
    stacker_today: Decimal,
}

impl MachineState {
    fn is_free_at(&self, t: NaiveDateTime) -> bool {
        self.busy_until.map_or(true, |until| t >= until)
    }
}

struct PlayerRuntime {
    client_id: Uuid,
    lives_in_france: bool,
    profile: PlayerProfile,
    bills_sum: Decimal,
    bills_count: u32,
    /// Nombre de jours restants avec probabilité de visite boostée (loss-chasing)
    loss_chase_remaining: u32,
    /// Multiplicateur de budget (escalade progressive pour Pathological)
    budget_multiplier: f64,
    /// Banque principale du joueur (fixe pour toute la simulation)
    bank_name: String,
    /// IBAN principal du joueur (fixe pour toute la simulation)
    account_number: String,
}

impl PlayerRuntime {
    fn avg_bills(&self) -> Decimal {
        if self.bills_count == 0 {
            Decimal::from_f64(DEFAULT_AVG_BILLS).unwrap()
        } else {
            self.bills_sum / Decimal::from(self.bills_count)
        }
    }
}

// ============================================================================
// VISIT PLAN STRUCTURES (plan/execute split for parallelism)
// ============================================================================

struct CashTxnInsert {
    id: Uuid,
    client_id: Uuid,
    game_session_id: Option<Uuid>,
    gamedate: NaiveDateTime,
    flow_datetime: NaiveDateTime,
    place: String,
    buy: Decimal,
    sell: Decimal,
    transaction: String,
    subtransaction: String,
    value: Option<Decimal>,
    cheque_number: Option<String>,
    account_number: Option<String>,
    bank_name: Option<String>,
    is_jackpot: Option<bool>,
    is_taxable: Option<bool>,
    amount_before_tax: Option<Decimal>,
    tax_amount: Option<Decimal>,
    amount_after_tax: Option<Decimal>,
    is_guaranteed: Option<bool>,
    guarantee_number: Option<String>,
}

struct SessionInsert {
    id: Uuid,
    client_id: Uuid,
    start_time: NaiveDateTime,
    end_time: NaiveDateTime,
    machine_number: String,
    bills: Decimal,
    coin_in: Decimal,
    cash_out: Decimal,
    jackpot: Decimal,
    out_type: String,
    has_stacker_alert: bool,
}

struct TitoInsert {
    id: Uuid,
    game_session_id: Uuid,
    client_id: Uuid,
    ticket_number: String,
    amount: Decimal,
    issuance_status: String,
    redemption_status: String,
    issuance_device: String,
    redemption_device: String,
    issuance_time: NaiveDateTime,
    redemption_time: Option<NaiveDateTime>,
    ttype: String,
    issuance_serial_number: String,
    redemption_serial_number: Option<String>,
}

struct VisitPlan {
    bills_delta_sum: Decimal,
    bills_delta_count: u32,
    sessions: Vec<SessionInsert>,
    cash_txns: Vec<CashTxnInsert>,
    titos: Vec<TitoInsert>,
    /// Résultat net de la visite : positif = gain, négatif = perte
    net_result: f64,
}

// ============================================================================
// ROUNDING
// ============================================================================
/// Génère un IBAN français plausible (format FR76 + 23 chiffres = 27 chars).
/// Les chiffres de contrôle (position 3-4) sont fixés à 76 pour simplifier —
/// suffisant pour des données de démonstration.
fn generate_iban_fr(rng: &mut ThreadRng) -> String {
    let bank  = rng.gen_range(10000u32..99999);
    let branch = rng.gen_range(10000u32..99999);
    let account: u64 = rng.gen_range(10000000000u64..99999999999);
    let key = rng.gen_range(10u32..99);
    format!("FR76{:05}{:05}{:011}{:02}", bank, branch, account, key)
}

fn round_to_nearest_10(amount: f64) -> Decimal {
    let rounded = (amount / 10.0).round() * 10.0;
    Decimal::from_f64(rounded.max(10.0)).unwrap()
}

fn round_to_bill(amount: f64) -> Decimal {
    let bill = if amount <= 15.0 { 10.0 }
               else if amount <= 35.0 { 20.0 }
               else if amount <= 75.0 { 50.0 }
               else if amount <= 150.0 { 100.0 }
               else if amount <= 350.0 { 200.0 }
               else { 500.0 };
    Decimal::from_f64(bill).unwrap()
}

// ============================================================================
// PLAYER GENERATION
// ============================================================================
fn random_date(min_date: NaiveDate, max_date: NaiveDate, rng: &mut ThreadRng) -> NaiveDate {
    let min_days = min_date.num_days_from_ce();
    let max_days = max_date.num_days_from_ce();
    NaiveDate::from_num_days_from_ce_opt(rng.gen_range(min_days..=max_days)).unwrap()
}

fn generate_player(casino_id: Uuid, nationalities: &[NationalityConfig], french_streets: &[String]) -> PlayerData {
    let mut rng = rand::thread_rng();
    let total_weight: f64 = nationalities.iter().map(|n| n.weight).sum();
    let mut r = rng.gen::<f64>() * total_weight;
    let nationality = nationalities.iter().find(|n| { r -= n.weight; r <= 0.0 })
        .unwrap_or(&nationalities[0]);
    let lives_in_france = rng.gen::<f64>() < nationality.residence_in_france;
    let gender = if rng.gen_bool(0.5) { "Male" } else { "Female" };
    let img_number = if gender == "Male" { MALE_AVATARS.choose(&mut rng).unwrap() }
                     else { FEMALE_AVATARS.choose(&mut rng).unwrap() };
    let firstname = if gender == "Male" { nationality.firstnames_m.choose(&mut rng).unwrap() }
                    else { nationality.firstnames_f.choose(&mut rng).unwrap() };
    let lastname = nationality.lastnames.choose(&mut rng).unwrap();
    let today = chrono::Utc::now().naive_utc().date();
    let birth_date = random_date(
        NaiveDate::from_ymd_opt(today.year() - PLAYER_AGE_MAX, 1, 1).unwrap(),
        NaiveDate::from_ymd_opt(today.year() - PLAYER_AGE_MIN, 12, 31).unwrap(),
        &mut rng,
    );
    let (address_city, address_postal_code, address_country, phone_prefix, birth_place) =
        if lives_in_france {
            let city = nationality.cities[0];
            (city.0.to_string(), city.1.to_string(), "France".to_string(), "+33", city.0)
        } else {
            let city = nationality.cities.choose(&mut rng).unwrap();
            (city.0.to_string(), city.1.to_string(), nationality.name.to_string(), nationality.phone_prefix, city.0)
        };
    let id_doc_type = if !nationality.is_eu { "passport" }
                      else if lives_in_france && rng.gen_bool(0.65) { "id_card" }
                      else { "passport" };
    PlayerData {
        client_id: Uuid::new_v4(),
        parent_casino_id: casino_id,
        picture_url: format!("https://i.pravatar.cc/300?img={}", img_number),
        firstname: firstname.to_string(),
        lastname: lastname.to_string(),
        gender: gender.to_string(),
        birth_date,
        birth_place: birth_place.to_string(),
        nationality: nationality.name.to_string(),
        phone_number: format!("{} {} {} {}", phone_prefix, rng.gen_range(100..999), rng.gen_range(100..999), rng.gen_range(1000..9999)),
        email: format!("{}.{}{}@gmail.com", firstname.to_lowercase(), lastname.to_lowercase(), rng.gen_range(1..999)),
        mobile: format!("{} {} {} {}", phone_prefix, rng.gen_range(100..999), rng.gen_range(100..999), rng.gen_range(1000..9999)),
        address_number: rng.gen_range(1..999).to_string(),
        address_street: if lives_in_france {
            french_streets.choose(&mut rng).unwrap().clone()
        } else {
            get_foreign_streets(&nationality.code).choose(&mut rng).unwrap().to_string()
        },
        address_postal_code,
        address_city,
        address_country,
        id_doc_type: id_doc_type.to_string(),
        id_doc_number: format!("{}{}", nationality.code, rng.gen_range(100000..999999)),
        profession: "Employee".to_string(),
        lives_in_france,
        profile: PlayerProfile::random(&mut rng),
        bank_name: if lives_in_france {
            FRENCH_BANKS.choose(&mut rng).copied().unwrap_or("BNP Paribas").to_string()
        } else { String::new() },
        account_number: if lives_in_france { generate_iban_fr(&mut rng) } else { String::new() },
    }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================
async fn clear_database(client: &Client) -> Result<(), DynError> {
    println!("Clearing existing data...");
    client.execute("TRUNCATE TABLE tito_transactions CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE cash_transactions CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE game_sessions CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE banks CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE players CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE machines CASCADE", &[]).await?;
    client.execute("TRUNCATE TABLE casinos CASCADE", &[]).await?;
    println!("Database cleared\n");
    Ok(())
}

async fn insert_casinos(client: &Client) -> Result<(), DynError> {
    client.execute(
        "INSERT INTO casinos (casino_id, name) VALUES
            ('550e8400-e29b-41d4-a716-446655440001', 'Vikings Casino Bourbon-Lancy'),
            ('550e8400-e29b-41d4-a716-446655440002', 'Vikings Casino Bourbon-l''Archambault'),
            ('550e8400-e29b-41d4-a716-446655440003', 'Vikings Casino Fort-Mahon'),
            ('550e8400-e29b-41d4-a716-446655440004', 'Vikings Casino Houlgate'),
            ('550e8400-e29b-41d4-a716-446655440005', 'Vikings Casino Sanary-sur-Mer'),
            ('550e8400-e29b-41d4-a716-446655440006', 'Vikings Casino Frejus'),
            ('550e8400-e29b-41d4-a716-446655440007', 'Vikings Casino Vittel'),
            ('550e8400-e29b-41d4-a716-446655440008', 'Vikings Casino Bussang'),
            ('550e8400-e29b-41d4-a716-446655440009', 'Vikings Casino Barbazan'),
            ('550e8400-e29b-41d4-a716-446655440010', 'Vikings Casino Castera-Verduzan'),
            ('550e8400-e29b-41d4-a716-446655440011', 'Vikings Casino Les Sables-d''Olonne')
        ON CONFLICT (casino_id) DO NOTHING",
        &[],
    ).await?;
    Ok(())
}

async fn get_casinos(client: &Client) -> Result<Vec<Uuid>, DynError> {
    let rows = client.query("SELECT casino_id FROM casinos", &[]).await?;
    Ok(rows.iter().map(|r| r.get(0)).collect())
}

async fn insert_machines(client: &Client) -> Result<Vec<(String, String)>, DynError> {
    println!("Creating machine floor ({} machines)...", MACHINE_COUNT);
    let mut machines = Vec::with_capacity(MACHINE_COUNT);
    for i in 1..=MACHINE_COUNT {
        let number = format!("M{:03}", i);
        let (machine_type, denomination, zone) = if i <= ZONE_A_COUNT {
            let t = if i % 5 == 0 { "VIDEO_POKER" } else { "SLOT" };
            let d = match i % 4 { 0 => 0.01_f64, 1 => 0.05, 2 => 0.10, _ => 0.50 };
            (t, d, "ZONE_A")
        } else if i <= ZONE_A_COUNT + ZONE_B_COUNT {
            let t = if i % 6 == 0 { "ROULETTE_ELEC" } else { "SLOT" };
            let d = match i % 3 { 0 => 1.0_f64, 1 => 2.0, _ => 5.0 };
            (t, d, "ZONE_B")
        } else {
            ("SLOT", 10.0_f64, "ZONE_VIP")
        };
        let denom = Decimal::from_f64(denomination).unwrap();
        let serial = format!("SN{:07}", i);
        client.execute(
            "INSERT INTO machines (machine_number, serial_number, machine_type, denomination, location_zone, is_active)
             VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (machine_number) DO NOTHING",
            &[&number, &serial, &machine_type, &denom, &zone],
        ).await?;
        machines.push((number, serial));
    }
    println!("Machine floor created\n");
    Ok(machines)
}

async fn insert_players_batch(client: &Client, players: &[PlayerData]) -> Result<(), DynError> {
    if players.is_empty() { return Ok(()); }
    let mut query = String::from(
        "INSERT INTO players (
            client_id, parent_casino_id, picture_url, gender, firstname, lastname,
            birth_date, birth_place, nationality, profession, phone_number, email, mobile,
            address_number, address_street, address_postal_code, address_city, address_country,
            id_doc_type, id_doc_number, id_doc_delivery_date, id_doc_delivery_place,
            id_doc_delivery_dept, id_doc_expiring_date, id_doc_country,
            comments, is_anpr, is_im, loyalty_points, created_at, updated_at
        ) VALUES "
    );
    let now = chrono::Utc::now().naive_utc();
    let mut params: Vec<Box<dyn tokio_postgres::types::ToSql + Sync>> = Vec::new();
    for (i, p) in players.iter().enumerate() {
        if i > 0 { query.push_str(", "); }
        let b = i * 31;
        query.push_str(&format!(
            "(${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${},${})",
            b+1,b+2,b+3,b+4,b+5,b+6,b+7,b+8,b+9,b+10,b+11,b+12,b+13,b+14,b+15,b+16,
            b+17,b+18,b+19,b+20,b+21,b+22,b+23,b+24,b+25,b+26,b+27,b+28,b+29,b+30,b+31
        ));
        params.push(Box::new(p.client_id));
        params.push(Box::new(p.parent_casino_id));
        params.push(Box::new(Some(p.picture_url.clone())));
        params.push(Box::new(p.gender.clone()));
        params.push(Box::new(p.firstname.clone()));
        params.push(Box::new(p.lastname.clone()));
        params.push(Box::new(p.birth_date));
        params.push(Box::new(p.birth_place.clone()));
        params.push(Box::new(p.nationality.clone()));
        params.push(Box::new(p.profession.clone()));
        params.push(Box::new(p.phone_number.clone()));
        params.push(Box::new(p.email.clone()));
        params.push(Box::new(p.mobile.clone()));
        params.push(Box::new(p.address_number.clone()));
        params.push(Box::new(p.address_street.clone()));
        params.push(Box::new(p.address_postal_code.clone()));
        params.push(Box::new(p.address_city.clone()));
        params.push(Box::new(p.address_country.clone()));
        params.push(Box::new(p.id_doc_type.clone()));
        params.push(Box::new(p.id_doc_number.clone()));
        params.push(Box::new(p.birth_date));
        params.push(Box::new(p.birth_place.clone()));
        params.push(Box::new("Dept".to_string()));
        params.push(Box::new(p.birth_date));
        params.push(Box::new(p.nationality.clone()));
        params.push(Box::new(Option::<String>::None));
        params.push(Box::new(rand::thread_rng().gen_bool(ANPR_RATE)));
        params.push(Box::new(rand::thread_rng().gen_bool(IM_RATE)));
        params.push(Box::new(Decimal::ZERO));
        params.push(Box::new(now));
        params.push(Box::new(now));
    }
    let refs: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = params.iter().map(|p| p.as_ref()).collect();
    client.execute(&query, &refs[..]).await?;
    Ok(())
}

async fn insert_banks(client: &Client, client_id: Uuid, bank_name: &str, account_number: &str) -> Result<(), DynError> {
    let mut rng = rand::thread_rng();
    // Compte principal (IBAN fixe transmis depuis PlayerRuntime)
    client.execute(
        "INSERT INTO banks (id, client_id, bank_name, account_number) VALUES ($1,$2,$3,$4)",
        &[&Uuid::new_v4(), &client_id, &bank_name, &account_number],
    ).await?;
    // Optionnellement un second compte dans une autre banque
    if rng.gen_bool(0.3) {
        let second_bank = FRENCH_BANKS.iter()
            .filter(|&&b| b != bank_name)
            .collect::<Vec<_>>();
        let second_bank = second_bank.choose(&mut rng).copied().unwrap_or(&"LCL");
        let second_iban = generate_iban_fr(&mut rng);
        client.execute(
            "INSERT INTO banks (id, client_id, bank_name, account_number) VALUES ($1,$2,$3,$4)",
            &[&Uuid::new_v4(), &client_id, &second_bank, &second_iban],
        ).await?;
    }
    Ok(())
}

async fn update_loyalty_points(client: &Client, client_id: Uuid) -> Result<(), DynError> {
    let ratio = Decimal::from_f64(LOYALTY_RATIO).unwrap();
    client.execute(
        "UPDATE players SET loyalty_points = (
            SELECT COALESCE(SUM(coin_in), 0) * $1 FROM game_sessions WHERE client_id = $2
         ) WHERE client_id = $2",
        &[&ratio, &client_id],
    ).await?;
    Ok(())
}

// ============================================================================
// MULTIPLICATEUR D'AFFLUENCE
// ============================================================================
fn day_multiplier(date: NaiveDate) -> f64 {
    let is_weekend = matches!(date.weekday(), Weekday::Sat | Weekday::Sun);
    let month = date.month();
    let is_peak = month == 12 || (month >= 6 && month <= 8);
    let mut m = 1.0_f64;
    if is_weekend { m *= 1.6; }
    if is_peak    { m *= 1.3; }
    m
}

// ============================================================================
// PLAN VISIT — pure computation, zero DB calls, sequential
// Machine state is updated here (machine assignment must remain sequential)
// ============================================================================
fn plan_visit(
    runtime: &PlayerRuntime,
    machines: &mut Vec<MachineState>,
    day: NaiveDate,
    rng: &mut ThreadRng,
) -> VisitPlan {
    let mut plan = VisitPlan {
        bills_delta_sum: Decimal::ZERO,
        bills_delta_count: 0,
        sessions: Vec::new(),
        cash_txns: Vec::new(),
        titos: Vec::new(),
        net_result: 0.0,
    };

    let place = "CAGE-UNIQUE".to_string();
    let gamedate = day.and_hms_opt(0, 0, 0).unwrap();
    // Horaires casino : 10h-3h (17h fenêtre). 3 segments : 10h-19h (540 min), 19h-23h (240 min), 23h-3h (240 min)
    // Poids par profil — chaque segment est échantillonné proportionnellement
    let (tw1, tw2, tw3) = runtime.profile.time_weights();
    let seg1 = 540.0 * tw1;
    let seg2 = 240.0 * tw2;
    let seg3 = 240.0 * tw3;
    let total_tw = seg1 + seg2 + seg3;
    let w: f64 = rng.gen_range(0.0..total_tw);
    let arrival_minutes: i64 = if w < seg1 {
        (w / seg1 * 540.0) as i64                         // 10h-19h
    } else if w < seg1 + seg2 {
        540 + ((w - seg1) / seg2 * 240.0) as i64         // 19h-23h
    } else {
        780 + ((w - seg1 - seg2) / seg3 * 240.0) as i64  // 23h-3h
    };
    let arrival = day.and_hms_opt(10, 0, 0).unwrap() + Duration::minutes(arrival_minutes);
    let closing_time = day.and_hms_opt(3, 0, 0).unwrap() + Duration::days(1); // Fermeture : 3h du matin suivant

    let (min_b, max_b) = runtime.profile.budget_range();
    // Pathological : budget escalade progressivement sur les mois
    let eff_min = min_b * runtime.budget_multiplier;
    let eff_max = max_b * runtime.budget_multiplier;
    let initial_budget = round_to_nearest_10(rng.gen_range(eff_min..eff_max));
    // Tout le budget est disponible en cash — pas de pré-achat cage en début de visite.
    // Le financement est décidé session par session (billets ou achat cage).
    let mut available_funds = initial_budget;
    let mut handpay_net = Decimal::ZERO; // gains HANDPAY reçus, pour le calcul du résultat net

    let (min_s, max_s) = runtime.profile.sessions_per_visit_range();
    let num_sessions = rng.gen_range(min_s..=max_s);
    // Pathological : continue tant qu'il a de l'argent (jusqu'à hard cap)
    let max_sessions = if matches!(runtime.profile, PlayerProfile::Pathological) { 20usize } else { num_sessions };
    let mut session_start = arrival;

    for session_num in 0..max_sessions {
        if available_funds <= Decimal::ZERO { break; }
        if session_start >= closing_time { break; } // Casino fermé à 3h
        // Suivi du chèque utilisé pour financer cette session (réinitialisé à chaque session)
        let mut cage_cheque_amount = Decimal::ZERO;
        let mut cage_cheque_number: Option<String> = None;

        let (zone_start, zone_end) = runtime.profile.preferred_zone();
        let machine_idx = machines[zone_start..zone_end]
            .iter().position(|m| m.is_free_at(session_start))
            .map(|i| i + zone_start)
            .or_else(|| machines.iter().position(|m| m.is_free_at(session_start)));
        let machine_idx = match machine_idx { Some(i) => i, None => break };

        let session_id = Uuid::new_v4();
        let (dur_min, dur_max) = runtime.profile.session_duration_range();
        let session_duration = rng.gen_range(dur_min..dur_max);
        let session_end = (session_start + Duration::minutes(session_duration)).min(closing_time);
        // --- FINANCEMENT DE LA SESSION ---
        // 1. Montant frais à injecter depuis le budget cash.
        let fresh_target = if session_num == max_sessions - 1 {
            available_funds
        } else {
            available_funds * Decimal::from_str(&format!("{:.2}", rng.gen_range(0.3..0.7_f64))).unwrap()
        };
        let fresh_amount = fresh_target.min(available_funds).max(Decimal::ZERO);

        // 3. Décision : billets directs ou achat ticket en caisse (selon profil joueur).
        let (bills_amount, cage_ticket_in): (Decimal, Decimal);
        if fresh_amount > Decimal::ZERO {
            if rng.gen_bool(runtime.profile.bills_probability()) {
                // Billets : le joueur insère du cash directement dans la machine.
                let b = round_to_bill(fresh_amount.to_f64().unwrap());
                available_funds -= b;
                bills_amount = b;
                cage_ticket_in = Decimal::ZERO;
            } else {
                // Achat cage : CB ou chèque → ticket TITO → inséré en machine.
                // Ticket plafonné à 1000€ (au-delà déclencherait un HANDPAY immédiat).
                let cage_amount = round_to_nearest_10(fresh_amount.to_f64().unwrap().min(1000.0));
                let buy_time = session_start - Duration::minutes(rng.gen_range(2_i64..15));
                if runtime.lives_in_france && rng.gen_bool(runtime.profile.cheque_probability()) {
                    let guarantee = format!("GAR{}", rng.gen_range(10000000..99999999));
                    let cheque_num = format!("CHQ{}", rng.gen_range(1000000..9999999));
                    cage_cheque_amount = cage_amount;
                    cage_cheque_number = Some(cheque_num.clone());
                    plan.cash_txns.push(CashTxnInsert {
                        id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: None,
                        gamedate, flow_datetime: buy_time, place: place.clone(),
                        buy: cage_amount, sell: Decimal::ZERO,
                        transaction: "CHEQUE".into(), subtransaction: "CHEQUE".into(),
                        value: Some(cage_amount),
                        cheque_number: Some(cheque_num),
                        account_number: Some(runtime.account_number.clone()),
                        bank_name: Some(runtime.bank_name.clone()),
                        is_jackpot: None, is_taxable: None, amount_before_tax: None, tax_amount: None, amount_after_tax: None,
                        is_guaranteed: Some(true), guarantee_number: Some(guarantee),
                    });
                } else {
                    plan.cash_txns.push(CashTxnInsert {
                        id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: None,
                        gamedate, flow_datetime: buy_time, place: place.clone(),
                        buy: cage_amount, sell: Decimal::ZERO,
                        transaction: "CREDITCARD".into(), subtransaction: "CREDITCARD".into(),
                        value: None, cheque_number: None, account_number: None, bank_name: None,
                        is_jackpot: None, is_taxable: None, amount_before_tax: None, tax_amount: None, amount_after_tax: None,
                        is_guaranteed: None, guarantee_number: None,
                    });
                }
                // Le ticket acheté en caisse est immédiatement inséré dans la machine courante.
                let machine_dev = machines[machine_idx].machine_number.clone();
                let machine_serial = machines[machine_idx].serial_number.clone();
                plan.titos.push(TitoInsert {
                    id: Uuid::new_v4(), game_session_id: session_id, client_id: runtime.client_id,
                    ticket_number: format!("TKT{}", rng.gen_range(100000..999999)),
                    amount: cage_amount,
                    issuance_status: "ISSUED".into(), redemption_status: "COUNTED".into(),
                    issuance_device: "CAGE-UNIQUE".into(), redemption_device: machine_dev,
                    issuance_time: buy_time, redemption_time: Some(session_start),
                    ttype: "CASHABLE_TICKET".into(),
                    issuance_serial_number: "SN_CAGE".into(),
                    redemption_serial_number: Some(machine_serial),
                });
                available_funds -= cage_amount;
                bills_amount = Decimal::ZERO;
                cage_ticket_in = cage_amount;
            }
        } else {
            bills_amount = Decimal::ZERO;
            cage_ticket_in = Decimal::ZERO;
        }

        let player_avg = runtime.avg_bills();
        let alert_threshold = player_avg * Decimal::from_f64(STACKER_ALERT_MULTIPLIER).unwrap();
        let has_stacker_alert = bills_amount > Decimal::ZERO
            && (bills_amount > alert_threshold || bills_amount > Decimal::from_f64(STACKER_ALERT_ABSOLUTE).unwrap());

        if bills_amount > Decimal::ZERO {
            plan.bills_delta_sum += bills_amount;
            plan.bills_delta_count += 1;
            machines[machine_idx].stacker_today += bills_amount;
        }

        // credits_in = tout ce qui entre dans la machine : billets + ticket acheté en caisse
        let credits_in = bills_amount + cage_ticket_in;
        let coin_in = credits_in * Decimal::from_str(&format!("{:.2}", rng.gen_range(1.5..3.0_f64))).unwrap();
        let rtp = Decimal::from_str(&format!("{:.3}", rng.gen_range(RTP_MIN..RTP_MAX))).unwrap();
        let jackpot = if rng.gen_bool(0.0005) { round_to_nearest_10(rng.gen_range(1500.0..20000.0_f64)) }
                      else { Decimal::ZERO };
        let cash_out = ((credits_in * rtp) + jackpot).max(Decimal::ZERO);
        let out_type = if cash_out > Decimal::from_f64(HANDPAY_THRESHOLD).unwrap() { "HANDPAY" } else { "TICKET" };
        let machine_number = machines[machine_idx].machine_number.clone();
        machines[machine_idx].busy_until = Some(session_end);

        plan.sessions.push(SessionInsert {
            id: session_id, client_id: runtime.client_id,
            start_time: session_start, end_time: session_end, machine_number,
            bills: bills_amount, coin_in, cash_out, jackpot,
            out_type: out_type.into(), has_stacker_alert,
        });

        if out_type == "TICKET" && cash_out > Decimal::ZERO {
            // Le ticket est obligatoirement encaissé à la caisse à la fin de la session.
            let machine_dev = machines[machine_idx].machine_number.clone();
            let machine_serial = machines[machine_idx].serial_number.clone();
            let redemption_time = session_end + Duration::minutes(rng.gen_range(2_i64..15));
            plan.titos.push(TitoInsert {
                id: Uuid::new_v4(), game_session_id: session_id, client_id: runtime.client_id,
                ticket_number: format!("TKT{}", rng.gen_range(100000..999999)),
                amount: cash_out,
                issuance_status: "ISSUED".into(), redemption_status: "REDEEMED".into(),
                issuance_device: machine_dev, redemption_device: "CAGE-UNIQUE".into(),
                issuance_time: session_end, redemption_time: Some(redemption_time), ttype: "CASHABLE_TICKET".into(),
                issuance_serial_number: machine_serial,
                redemption_serial_number: Some("SN_CAGE".into()),
            });
            plan.cash_txns.push(CashTxnInsert {
                id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: None,
                gamedate, flow_datetime: redemption_time, place: place.clone(),
                buy: Decimal::ZERO, sell: cash_out,
                transaction: "SELL".into(), subtransaction: "TICKET".into(),
                value: Some(cash_out), cheque_number: None, account_number: None, bank_name: None,
                is_jackpot: None, is_taxable: None, amount_before_tax: None, tax_amount: None, amount_after_tax: None,
                is_guaranteed: None, guarantee_number: None,
            });
            available_funds += cash_out;
        } else if out_type == "HANDPAY" {
            let sub_type = if jackpot > Decimal::ZERO { "JACKPOT" } else { "GAINMAS" };
            let csg = Decimal::from_f64(CSG_RATE / 100.0).unwrap();
            let tax_amount = cash_out * csg;
            let amount_after_tax = cash_out - tax_amount;
            let cheque_threshold = Decimal::from_f64(CHEQUE_PAYMENT_THRESHOLD).unwrap();

            plan.cash_txns.push(CashTxnInsert {
                id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: Some(session_id),
                gamedate, flow_datetime: session_end, place: place.clone(),
                buy: Decimal::ZERO, sell: Decimal::ZERO,
                transaction: "TAX".into(), subtransaction: "CSG".into(),
                value: Some(tax_amount), cheque_number: None, account_number: None, bank_name: None,
                is_jackpot: None, is_taxable: None, amount_before_tax: None, tax_amount: None, amount_after_tax: None,
                is_guaranteed: None, guarantee_number: None,
            });

            // Retour de chèque : si la session était financée par chèque et que le gain net
            // dépasse le montant du chèque, le casino rend le chèque au joueur.
            // → Transaction CHEQUE négative avec le même numéro de chèque.
            let win_payment = if cage_cheque_amount > Decimal::ZERO
                && amount_after_tax > cage_cheque_amount
            {
                if let Some(ref orig_cheque_num) = cage_cheque_number {
                    plan.cash_txns.push(CashTxnInsert {
                        id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: Some(session_id),
                        gamedate, flow_datetime: session_end, place: place.clone(),
                        buy: Decimal::ZERO, sell: Decimal::ZERO,
                        transaction: "CHEQUE".into(), subtransaction: "CHEQUE_RETURN".into(),
                        value: Some(-cage_cheque_amount), // valeur négative = rendu du chèque
                        cheque_number: Some(orig_cheque_num.clone()),
                        account_number: Some(runtime.account_number.clone()),
                        bank_name: Some(runtime.bank_name.clone()),
                        is_jackpot: None, is_taxable: None, amount_before_tax: None,
                        tax_amount: None, amount_after_tax: None,
                        is_guaranteed: None, guarantee_number: None,
                    });
                }
                amount_after_tax - cage_cheque_amount // casino paie seulement le net
            } else {
                amount_after_tax
            };

            if win_payment > cheque_threshold {
                let casino_cheque_num = format!("CASINO{}", rng.gen_range(1000000..9999999));
                plan.cash_txns.push(CashTxnInsert {
                    id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: Some(session_id),
                    gamedate, flow_datetime: session_end, place: place.clone(),
                    buy: Decimal::ZERO, sell: win_payment,
                    transaction: "WIN".into(), subtransaction: sub_type.into(),
                    value: Some(win_payment),
                    cheque_number: Some(casino_cheque_num),
                    account_number: Some(CASINO_BANK_IBAN.to_string()),
                    bank_name: Some(CASINO_BANK_NAME.to_string()),
                    is_jackpot: Some(jackpot > Decimal::ZERO), is_taxable: Some(true),
                    amount_before_tax: Some(cash_out), tax_amount: Some(tax_amount), amount_after_tax: Some(amount_after_tax),
                    is_guaranteed: None, guarantee_number: None,
                });
            } else {
                plan.cash_txns.push(CashTxnInsert {
                    id: Uuid::new_v4(), client_id: runtime.client_id, game_session_id: Some(session_id),
                    gamedate, flow_datetime: session_end, place: place.clone(),
                    buy: Decimal::ZERO, sell: win_payment,
                    transaction: "WIN".into(), subtransaction: sub_type.into(),
                    value: Some(win_payment), cheque_number: None, account_number: None, bank_name: None,
                    is_jackpot: Some(jackpot > Decimal::ZERO), is_taxable: Some(true),
                    amount_before_tax: Some(cash_out), tax_amount: Some(tax_amount), amount_after_tax: Some(amount_after_tax),
                    is_guaranteed: None, guarantee_number: None,
                });
            }
            handpay_net += amount_after_tax;
            break;
        }

        // available_funds = budget cash restant (billets et achats cage ont déjà été déduits dans le bloc financement).
        // Les tickets CASHABLE_TICKET sont rachetés à la caisse et remis dans available_funds.
        session_start = session_end + Duration::minutes(rng.gen_range(5_i64..30));
    }

    // Casino plein : aucune machine disponible → le client ne peut pas entrer, aucune trace
    if plan.sessions.is_empty() {
        return VisitPlan {
            bills_delta_sum: Decimal::ZERO,
            bills_delta_count: 0,
            sessions: Vec::new(),
            cash_txns: Vec::new(),
            titos: Vec::new(),
            net_result: 0.0,
        };
    }

    plan.net_result = (available_funds + handpay_net - initial_budget).to_f64().unwrap_or(0.0);
    plan
}

// ============================================================================
// EXECUTE PLAN — async DB inserts, called concurrently per player per day
// Takes owned Pool (Arc clone, free) for concurrent access
// ============================================================================
async fn execute_plan(pool: Pool, plan: VisitPlan) -> Result<(), DynError> {
    let client = pool.get().await?;

    // 1. Game sessions first (FK dependencies)
    for s in &plan.sessions {
        client.execute(
            "INSERT INTO game_sessions (id, client_id, start_time, end_time, machine_number, bills, coin_in, cash_out, jackpot, out_type, has_stacker_alert)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
            &[&s.id, &s.client_id, &s.start_time, &s.end_time, &s.machine_number,
              &s.bills, &s.coin_in, &s.cash_out, &s.jackpot, &s.out_type, &s.has_stacker_alert],
        ).await?;
    }

    // 2. TITO transactions
    for t in &plan.titos {
        client.execute(
            "INSERT INTO tito_transactions (id, game_session_id, client_id, ticket_number, amount, issuance_status, redemption_status, issuance_device, redemption_device, issuance_time, redemption_time, type, issuance_serial_number, redemption_serial_number)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
            &[&t.id, &t.game_session_id, &t.client_id, &t.ticket_number, &t.amount,
              &t.issuance_status, &t.redemption_status, &t.issuance_device, &t.redemption_device,
              &t.issuance_time, &t.redemption_time, &t.ttype,
              &t.issuance_serial_number, &t.redemption_serial_number],
        ).await?;
    }

    // 3. Cash transactions (uniform INSERT covering all nullable fields)
    for c in &plan.cash_txns {
        client.execute(
            "INSERT INTO cash_transactions (id, client_id, game_session_id, gamedate, flow_datetime, place, buy, sell, transaction, subtransaction, value, cheque_number, account_number, bank_name, is_jackpot, is_taxable, amount_before_tax, tax_amount, amount_after_tax, is_guaranteed, guarantee_number)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)",
            &[&c.id, &c.client_id, &c.game_session_id, &c.gamedate, &c.flow_datetime,
              &c.place, &c.buy, &c.sell, &c.transaction, &c.subtransaction,
              &c.value, &c.cheque_number, &c.account_number, &c.bank_name,
              &c.is_jackpot, &c.is_taxable, &c.amount_before_tax, &c.tax_amount, &c.amount_after_tax,
              &c.is_guaranteed, &c.guarantee_number],
        ).await?;
    }

    Ok(())
}

// ============================================================================
// MAIN
// ============================================================================
#[tokio::main]
async fn main() -> Result<(), DynError> {
    let start = Instant::now();

    let args: Vec<String> = std::env::args().collect();
    let player_count = args.get(1)
        .and_then(|a| a.parse::<usize>().ok())
        .unwrap_or(DEFAULT_PLAYERS);

    // Resource detection
    let (cpu_count, ram_gb) = detect_system();
    // Pool: limited by PG max_connections (default 100), leave room for admin
    let pool_size = (cpu_count * 6).max(16).min(90);
    // Concurrency: how many visit plans execute DB concurrently
    let concurrency = pool_size;

    println!("=== Tracfin Casino Seeder (parallel day-by-day) ===");
    println!("Players:     {}", player_count);
    println!("System:      {} CPUs | {} GB RAM", cpu_count, ram_gb);
    println!("DB pool:     {} connections | concurrency: {}\n", pool_size, concurrency);

    let db_host = env::var("DB_HOST").unwrap_or_else(|_| "tracfin-db".into());
    let db_port = env::var("DB_PORT").unwrap_or_else(|_| "5432".into());
    let db_user = env::var("DB_USER").unwrap_or_else(|_| "tracfin_user".into());
    let db_password = env::var("DB_PASSWORD").unwrap_or_else(|_| "tracfin_password".into());
    let db_name = env::var("DB_NAME").unwrap_or_else(|_| "tracfin".into());

    let mut cfg = Config::new();
    cfg.host = Some(db_host);
    cfg.port = Some(db_port.parse().unwrap());
    cfg.user = Some(db_user);
    cfg.password = Some(db_password);
    cfg.dbname = Some(db_name);
    cfg.manager = Some(ManagerConfig { recycling_method: RecyclingMethod::Fast });

    let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls)?;
    pool.resize(pool_size);

    let client = pool.get().await?;
    println!("Connected to database\n");

    // Phase 0: Reset + infra
    clear_database(&client).await?;
    insert_casinos(&client).await?;
    let casinos = get_casinos(&client).await?;
    println!("{} casinos\n", casinos.len());
    let machine_data = insert_machines(&client).await?;
    drop(client); // return connection to pool

    // Phase 1: Generate players (rayon parallelized)
    println!("Phase 1/3 — Generating {} players...", player_count);
    let nationalities = get_nationalities();
    let french_streets: Vec<String> = serde_json::from_str(FR_STREETS_JSON)
        .expect("Failed to parse embedded french-streets.json");
    let mut all_players: Vec<PlayerData> = Vec::with_capacity(player_count);
    let total_batches = (player_count + BATCH_SIZE - 1) / BATCH_SIZE;

    for batch_num in 0..total_batches {
        let batch_end = std::cmp::min((batch_num + 1) * BATCH_SIZE, player_count);
        let batch_start = batch_num * BATCH_SIZE;
        let batch: Vec<PlayerData> = (batch_start..batch_end)
            .into_par_iter()
            .map(|_| generate_player(*casinos.choose(&mut rand::thread_rng()).unwrap(), &nationalities, &french_streets))
            .collect();
        let client = pool.get().await?;
        insert_players_batch(&client, &batch).await?;
        all_players.extend(batch);
        let elapsed = start.elapsed().as_secs_f64();
        println!("  Batch {:>2}/{}: {:>6}/{} ({:.0}/s)",
            batch_num+1, total_batches, all_players.len(), player_count,
            all_players.len() as f64 / elapsed);
    }

    // Bank accounts — concurrent
    println!("\nInserting bank accounts (concurrent)...");
    let france_players: Vec<(Uuid, String, String)> = all_players.iter()
        .filter(|p| p.lives_in_france)
        .map(|p| (p.client_id, p.bank_name.clone(), p.account_number.clone()))
        .collect();
    let bank_results: Vec<_> = stream::iter(france_players)
        .map(|(cid, bank, iban)| {
            let p = pool.clone();
            async move {
                let client = p.get().await?;
                insert_banks(&client, cid, &bank, &iban).await
            }
        })
        .buffer_unordered(concurrency)
        .collect()
        .await;
    for r in bank_results { r?; }

    // Phase 2: Day-by-day simulation
    println!("\nPhase 2/3 — Day-by-day simulation ({} days, concurrency={})...", DATA_PERIOD_DAYS, concurrency);

    let mut runtimes: Vec<PlayerRuntime> = all_players.iter().map(|p| {
        PlayerRuntime {
            client_id: p.client_id,
            lives_in_france: p.lives_in_france,
            profile: p.profile,
            bills_sum: Decimal::ZERO,
            bills_count: 0,
            loss_chase_remaining: 0,
            budget_multiplier: 1.0,
            bank_name: p.bank_name.clone(),
            account_number: p.account_number.clone(),
        }
    }).collect();

    let mut machines: Vec<MachineState> = machine_data.iter().map(|(n, s)| MachineState {
        machine_number: n.clone(),
        serial_number: s.clone(),
        busy_until: None,
        stacker_today: Decimal::ZERO,
    }).collect();

    let today = chrono::Utc::now().naive_utc().date();
    let sim_start = today - chrono::Duration::days(DATA_PERIOD_DAYS);
    let mut total_visits = 0u64;
    let mut rng = rand::thread_rng();

    for day_offset in 0..DATA_PERIOD_DAYS {
        let current_day = sim_start + chrono::Duration::days(day_offset);

        // Reset machines nightly
        for m in machines.iter_mut() {
            m.stacker_today = Decimal::ZERO;
            if let Some(until) = m.busy_until {
                if until.date() < current_day { m.busy_until = None; }
            }
        }

        let day_mult = day_multiplier(current_day);
        let mut visitor_indices: Vec<usize> = runtimes.iter().enumerate()
            .filter_map(|(i, r)| {
                let base_prob = r.profile.base_visit_prob() * day_mult;
                // Loss-chase : probabilité multipliée pour les jours suivant une perte
                let prob = if r.loss_chase_remaining > 0 {
                    (base_prob * LOSS_CHASE_BOOST).min(1.0)
                } else {
                    base_prob.min(1.0)
                };
                if rand::thread_rng().gen_bool(prob) { Some(i) } else { None }
            })
            .collect();
        visitor_indices.shuffle(&mut rng);

        let visitor_count = visitor_indices.len();
        total_visits += visitor_count as u64;

        // Phase A: Plan all visits (sequential, pure computation — maintains machine state integrity)
        let mut day_plans: Vec<(usize, VisitPlan)> = Vec::with_capacity(visitor_count);
        for &idx in &visitor_indices {
            let plan = plan_visit(&runtimes[idx], &mut machines, current_day, &mut rng);
            day_plans.push((idx, plan));
        }

        // Update runtime stats
        for (idx, plan) in &day_plans {
            let r = &mut runtimes[*idx];
            r.bills_sum += plan.bills_delta_sum;
            r.bills_count += plan.bills_delta_count;
            // Décrémenter le compteur loss-chase
            if r.loss_chase_remaining > 0 { r.loss_chase_remaining -= 1; }
            if !plan.sessions.is_empty() {
                // Déclencher le loss-chasing après une perte significative
                if plan.net_result < -50.0 {
                    match r.profile {
                        PlayerProfile::Pathological => {
                            // Systématique : 2-5 jours de visites renforcées
                            let chase = rng.gen_range(2u32..=5);
                            r.loss_chase_remaining = r.loss_chase_remaining.max(chase);
                            // Escalade du budget à chaque visite (tente de "récupérer")
                            r.budget_multiplier = (r.budget_multiplier * PATHOLOGICAL_BUDGET_ESCALATION)
                                .min(PATHOLOGICAL_BUDGET_CAP);
                        }
                        PlayerProfile::Occasional | PlayerProfile::Regular => {
                            // Ponctuel : 30% de chance de revenir dans 1-2 jours
                            if rng.gen_bool(0.30) {
                                let chase = rng.gen_range(1u32..=2);
                                r.loss_chase_remaining = r.loss_chase_remaining.max(chase);
                            }
                        }
                        _ => {} // RegularPlus/Vip/HighRoller : pas de loss-chasing
                    }
                }
            }
        }

        // Phase B: Execute all DB inserts concurrently (uses full pool)
        let plans: Vec<VisitPlan> = day_plans.into_iter().map(|(_, p)| p).collect();
        let results: Vec<_> = stream::iter(plans)
            .map(|plan| {
                let p = pool.clone();
                async move { execute_plan(p, plan).await }
            })
            .buffer_unordered(concurrency)
            .collect()
            .await;
        for r in results { r?; }

        if day_offset % 30 == 0 || day_offset == DATA_PERIOD_DAYS - 1 {
            let elapsed = start.elapsed().as_secs_f64();
            println!("  Day {:>3}/{} ({}) — {:>4} visitors | {:>8} total | {:.1}s",
                day_offset+1, DATA_PERIOD_DAYS,
                current_day.format("%Y-%m-%d"),
                visitor_count, total_visits, elapsed);
        }
    }

    // Phase 3: Loyalty points — concurrent
    println!("\nPhase 3/3 — Updating loyalty points (concurrent)...");
    let client_ids: Vec<Uuid> = runtimes.iter().map(|r| r.client_id).collect();
    let lp_results: Vec<_> = stream::iter(client_ids)
        .map(|cid| {
            let p = pool.clone();
            async move {
                let client = p.get().await?;
                update_loyalty_points(&client, cid).await
            }
        })
        .buffer_unordered(concurrency)
        .collect()
        .await;
    for r in lp_results { r?; }

    let total_time = start.elapsed().as_secs_f64();
    println!("\n=== Seeding completed ===");
    println!("Players:      {}", player_count);
    println!("Total visits: {}", total_visits);
    println!("Duration:     {:.2}s", total_time);
    Ok(())
}
