-- Vérification des transactions CSG
-- =====================================

-- 1. Vue d'ensemble des transactions TAX-CSG
SELECT 
    COUNT(*) as total_tax_transactions,
    SUM(value) as total_csg_collected,
    AVG(value) as avg_csg_per_transaction,
    MIN(value) as min_csg,
    MAX(value) as max_csg
FROM cash_transactions
WHERE transaction = 'TAX' AND subtransaction = 'CSG';

-- 2. Vérification cohérence HANDPAY : game_sessions vs cash_transactions
SELECT 
    gs.id as session_id,
    gs.cash_out as handpay_brut,
    ct_tax.value as csg_taxe,
    ct_win.sell as win_net,
    -- Vérification calculs
    ROUND(gs.cash_out * 0.137, 2) as csg_attendue,
    ROUND(gs.cash_out - (gs.cash_out * 0.137), 2) as net_attendu,
    -- Écarts
    ROUND(ct_tax.value - (gs.cash_out * 0.137), 2) as ecart_csg,
    ROUND(ct_win.sell - (gs.cash_out - gs.cash_out * 0.137), 2) as ecart_net
FROM game_sessions gs
LEFT JOIN cash_transactions ct_tax 
    ON ct_tax.game_session_id = gs.id 
    AND ct_tax.transaction = 'TAX' 
    AND ct_tax.subtransaction = 'CSG'
LEFT JOIN cash_transactions ct_win 
    ON ct_win.game_session_id = gs.id 
    AND ct_win.transaction = 'WIN'
WHERE gs.out_type = 'HANDPAY'
ORDER BY gs.start_time DESC
LIMIT 20;

-- 3. Transactions TAX-CSG sans game_session_id (final cash-out)
SELECT 
    ct.id,
    ct.client_id,
    ct.gamedate,
    ct.value as csg_taxe,
    ct.flow_datetime
FROM cash_transactions ct
WHERE ct.transaction = 'TAX' 
  AND ct.subtransaction = 'CSG'
  AND ct.game_session_id IS NULL
ORDER BY ct.flow_datetime DESC
LIMIT 10;

-- 4. Vérifier que chaque TAX a un WIN associé
WITH tax_wins AS (
    SELECT 
        ct_tax.id as tax_id,
        ct_tax.value as tax_value,
        ct_tax.game_session_id,
        ct_tax.gamedate,
        ct_win.id as win_id,
        ct_win.sell as win_amount,
        ct_win.amount_before_tax,
        ct_win.tax_amount
    FROM cash_transactions ct_tax
    LEFT JOIN cash_transactions ct_win 
        ON (ct_tax.game_session_id IS NOT NULL AND ct_win.game_session_id = ct_tax.game_session_id)
        OR (ct_tax.game_session_id IS NULL 
            AND ct_win.client_id = ct_tax.client_id 
            AND ct_win.gamedate = ct_tax.gamedate
            AND ct_win.transaction = 'WIN'
            AND ABS(EXTRACT(EPOCH FROM (ct_win.flow_datetime - ct_tax.flow_datetime))) < 60)
    WHERE ct_tax.transaction = 'TAX' 
      AND ct_tax.subtransaction = 'CSG'
      AND ct_win.transaction = 'WIN'
)
SELECT 
    COUNT(*) as total_pairs,
    COUNT(CASE WHEN win_id IS NULL THEN 1 END) as tax_without_win,
    COUNT(CASE WHEN tax_value != tax_amount THEN 1 END) as tax_mismatch
FROM tax_wins;

-- 5. Exemple de joueur avec handpays pour vérification manuelle
SELECT 
    p.client_id,
    p.firstname,
    p.lastname,
    COUNT(gs.id) as handpay_count,
    SUM(gs.cash_out) as total_brut,
    SUM(ct_tax.value) as total_csg,
    SUM(ct_win.sell) as total_net
FROM players p
JOIN game_sessions gs ON gs.client_id = p.client_id AND gs.out_type = 'HANDPAY'
LEFT JOIN cash_transactions ct_tax 
    ON ct_tax.game_session_id = gs.id 
    AND ct_tax.transaction = 'TAX'
LEFT JOIN cash_transactions ct_win 
    ON ct_win.game_session_id = gs.id 
    AND ct_win.transaction = 'WIN'
GROUP BY p.client_id, p.firstname, p.lastname
HAVING COUNT(gs.id) > 0
ORDER BY handpay_count DESC
LIMIT 5;
