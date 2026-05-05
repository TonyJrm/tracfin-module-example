-- Seed data: Vikings Group Casinos (fixed UUIDs referenced by seeder)
INSERT INTO "casinos" ("casino_id", "name") VALUES
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
ON CONFLICT ("casino_id") DO NOTHING;
