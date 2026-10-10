-- Additive content storage. No catalog, stock, order or authentication mutations.
ALTER TABLE "StoreSettings" ADD COLUMN "editorial" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "StoreSettings" ALTER COLUMN "name" SET DEFAULT 'T KNIGHTS MARK',
 ALTER COLUMN "slogan" SET DEFAULT 'Carregue seu legado.',
 ALTER COLUMN "heroTitle" SET DEFAULT 'CARREGUE SEU LEGADO.',
 ALTER COLUMN "heroImage" SET DEFAULT '/images/tkm-campaign.webp',
 ALTER COLUMN "accent" SET DEFAULT '#C1A375';
-- Migrate only the previous demonstration identity. Preserve custom content.
UPDATE "StoreSettings" SET "name"='T KNIGHTS MARK' WHERE "name"='AUREO';
UPDATE "StoreSettings" SET "slogan"='Carregue seu legado.' WHERE "slogan"='O essencial tem presença.';
UPDATE "StoreSettings" SET "heroTitle"='CARREGUE SEU LEGADO.' WHERE "heroTitle"='Menos excesso. Mais essência.';
UPDATE "StoreSettings" SET "heroImage"='/images/tkm-campaign.webp' WHERE "heroImage"='/images/editorial.jpg';
UPDATE "StoreSettings" SET "accent"='#C1A375' WHERE "accent"='#151515';
UPDATE "StoreSettings" SET "announcement"='Um novo capítulo · Conheça o universo T Knights Mark' WHERE "announcement"='Coleção 01 — Uma nova forma de vestir o cotidiano';
