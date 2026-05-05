-- ============================================================================
-- TRACFIN DATABASE SCHEMA
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CASINOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS casinos (
    casino_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_casinos_name ON casinos(name);

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS players (
    client_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_casino_id UUID NOT NULL REFERENCES casinos(casino_id) ON DELETE CASCADE,
    
    -- Personal info
    picture_url TEXT,
    gender VARCHAR(50) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    profession VARCHAR(255) NOT NULL,
    
    -- Contact
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    
    -- Address (JSON)
    address_number VARCHAR(50) NOT NULL,
    address_street TEXT NOT NULL,
    address_postal_code VARCHAR(20),
    address_city VARCHAR(255) NOT NULL,
    address_country VARCHAR(100) NOT NULL,
    
    -- ID Document
    id_doc_type VARCHAR(50) NOT NULL,
    id_doc_number VARCHAR(100) NOT NULL,
    id_doc_delivery_date DATE NOT NULL,
    id_doc_delivery_place VARCHAR(255) NOT NULL,
    id_doc_delivery_dept VARCHAR(100) NOT NULL,
    id_doc_expiring_date DATE NOT NULL,
    id_doc_country VARCHAR(100) NOT NULL,
    
    -- Flags
    comments TEXT,
    is_anpr BOOLEAN DEFAULT FALSE,
    is_im BOOLEAN DEFAULT FALSE,
    
    -- Loyalty program
    loyalty_points DECIMAL(12, 2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_casino ON players(parent_casino_id);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_lastname ON players(lastname);
CREATE INDEX idx_players_anpr ON players(is_anpr) WHERE is_anpr = TRUE;
CREATE INDEX idx_players_im ON players(is_im) WHERE is_im = TRUE;

-- ============================================================================
-- BANKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES players(client_id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_banks_client ON banks(client_id);
CREATE INDEX idx_banks_account ON banks(account_number);

-- ============================================================================
-- MACHINES TABLE (floor de 100 machines)
-- ============================================================================
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_number VARCHAR(10) NOT NULL UNIQUE,
    machine_type VARCHAR(50) NOT NULL DEFAULT 'SLOT', -- SLOT, VIDEO_POKER, ROULETTE_ELEC
    denomination DECIMAL(6, 2) NOT NULL DEFAULT 0.01, -- mise minimum en euros
    location_zone VARCHAR(50) NOT NULL DEFAULT 'ZONE_A', -- ZONE_A, ZONE_B, ZONE_VIP
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_machines_number ON machines(machine_number);
CREATE INDEX idx_machines_zone ON machines(location_zone);

-- ============================================================================
-- GAME SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES players(client_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    machine_number VARCHAR(10) NOT NULL REFERENCES machines(machine_number),
    bills DECIMAL(12, 2) NOT NULL DEFAULT 0,   -- billets insérés directement
    coin_in DECIMAL(12, 2) NOT NULL,             -- total misé (bills + ticket + recyclage)
    cash_out DECIMAL(12, 2) NOT NULL,
    jackpot DECIMAL(12, 2) DEFAULT 0,
    out_type VARCHAR(20) NOT NULL,               -- HANDPAY or TICKET
    has_stacker_alert BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_sessions_client ON game_sessions(client_id);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time);
CREATE INDEX idx_game_sessions_machine ON game_sessions(machine_number);

-- ============================================================================
-- TITO TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tito_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES players(client_id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    issuance_status VARCHAR(20) NOT NULL, -- ISSUED, REDEEMED, CANCELLED
    redemption_status VARCHAR(20) NOT NULL, -- PENDING, COUNTED, REDEEMED
    issuance_device VARCHAR(50) NOT NULL,
    redemption_device VARCHAR(50) NOT NULL,
    issuance_time TIMESTAMP NOT NULL,
    redemption_time TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    issuance_serial_number VARCHAR(100) NOT NULL,
    redemption_serial_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tito_game_session ON tito_transactions(game_session_id);
CREATE INDEX idx_tito_client ON tito_transactions(client_id);
CREATE INDEX idx_tito_ticket ON tito_transactions(ticket_number);
CREATE INDEX idx_tito_issuance_time ON tito_transactions(issuance_time);

-- ============================================================================
-- CASH TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES players(client_id) ON DELETE CASCADE,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
    gamedate TIMESTAMP NOT NULL,
    flow_datetime TIMESTAMP NOT NULL,
    place VARCHAR(100) NOT NULL,
    buy DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sell DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Transaction type (CREDITCARD, WIN, CHEQUE)
    transaction VARCHAR(50) NOT NULL,
    subtransaction VARCHAR(50) NOT NULL,
    
    -- WIN specific fields
    is_jackpot BOOLEAN,
    is_taxable BOOLEAN,
    amount_before_tax DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    amount_after_tax DECIMAL(12, 2),
    
    -- CHEQUE specific fields
    value DECIMAL(12, 2),
    cheque_number VARCHAR(100),
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    is_guaranteed BOOLEAN,
    guarantee_number VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_trans_client ON cash_transactions(client_id);
CREATE INDEX idx_cash_trans_gamedate ON cash_transactions(gamedate);
CREATE INDEX idx_cash_trans_type ON cash_transactions(transaction);
CREATE INDEX idx_cash_trans_flow_datetime ON cash_transactions(flow_datetime);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Vue pour les joueurs avec totaux
CREATE OR REPLACE VIEW players_summary AS
SELECT 
    p.client_id,
    p.firstname,
    p.lastname,
    p.email,
    c.name AS casino_name,
    COUNT(DISTINCT gs.id) AS total_sessions,
    COALESCE(SUM(gs.coin_in), 0) AS total_coin_in,
    COALESCE(SUM(gs.cash_out), 0) AS total_cash_out,
    COALESCE(SUM(gs.jackpot), 0) AS total_jackpots,
    COUNT(DISTINCT ct.id) AS total_cash_transactions,
    COALESCE(SUM(ct.buy), 0) AS total_purchases,
    COALESCE(SUM(ct.sell), 0) AS total_sales
FROM players p
LEFT JOIN casinos c ON p.parent_casino_id = c.casino_id
LEFT JOIN game_sessions gs ON p.client_id = gs.client_id
LEFT JOIN cash_transactions ct ON p.client_id = ct.client_id
GROUP BY p.client_id, p.firstname, p.lastname, p.email, c.name;

-- Vue pour les transactions suspectes (gros montants)
CREATE OR REPLACE VIEW suspicious_transactions AS
SELECT 
    ct.id,
    ct.client_id,
    p.firstname,
    p.lastname,
    ct.transaction,
    ct.subtransaction,
    ct.buy,
    ct.sell,
    ct.gamedate,
    CASE 
        WHEN ct.buy >= 10000 THEN 'Large Purchase'
        WHEN ct.sell >= 10000 THEN 'Large Sale'
        WHEN ct.is_jackpot = TRUE THEN 'Jackpot'
        ELSE 'Other'
    END AS alert_type
FROM cash_transactions ct
JOIN players p ON ct.client_id = p.client_id
WHERE ct.buy >= 10000 OR ct.sell >= 10000 OR ct.is_jackpot = TRUE
ORDER BY ct.gamedate DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour players
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Vikings Group Casinos)
-- ============================================================================
INSERT INTO casinos (casino_id, name) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Vikings Casino Bourbon-Lancy'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Vikings Casino Bourbon-l''Archambault'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Vikings Casino Fort-Mahon'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Vikings Casino Houlgate'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Vikings Casino Sanary-sur-Mer'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Vikings Casino Fréjus'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Vikings Casino Vittel'),
    ('550e8400-e29b-41d4-a716-446655440008', 'Vikings Casino Bussang'),
    ('550e8400-e29b-41d4-a716-446655440009', 'Vikings Casino Barbazan'),
    ('550e8400-e29b-41d4-a716-446655440010', 'Vikings Casino Castera-Verduzan'),
    ('550e8400-e29b-41d4-a716-446655440011', 'Vikings Casino Les Sables-d''Olonne')
ON CONFLICT (casino_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tracfin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tracfin_user;
