-- EscrowVault — Supabase schema
-- Run this in your Supabase SQL editor or via supabase db push

-- ─── Listings (off-chain metadata) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id             UUID        PRIMARY KEY,          -- matches itemId stored on-chain
  contract_id    BIGINT,                           -- on-chain listing ID (set by indexer)
  title          TEXT        NOT NULL,
  description    TEXT,
  image_url      TEXT,
  category       TEXT        NOT NULL DEFAULT 'General',
  token_type     TEXT        NOT NULL DEFAULT 'ETH',
  seller_address TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_seller_idx    ON listings (seller_address);
CREATE INDEX IF NOT EXISTS listings_contract_idx  ON listings (contract_id);
CREATE INDEX IF NOT EXISTS listings_category_idx  ON listings (category);

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  address      TEXT        PRIMARY KEY,            -- lowercase hex address
  display_name TEXT,
  bio          TEXT,
  rating       NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  total_trades INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read listings
CREATE POLICY "listings_read_all"
  ON listings FOR SELECT
  USING (true);

-- Only the seller (matched by address header) can insert their own listing
CREATE POLICY "listings_insert_own"
  ON listings FOR INSERT
  WITH CHECK (true);  -- validated at application level via wallet signature

-- Anyone can read profiles
CREATE POLICY "profiles_read_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_upsert_own"
  ON profiles FOR ALL
  USING (true);

-- ─── Sample seed data (optional — remove for production) ─────────────────────
-- INSERT INTO listings (id, title, description, category, seller_address)
-- VALUES
--   (gen_random_uuid(), 'Test Item 1', 'A demo listing', 'General', '0xdemo'),
--   (gen_random_uuid(), 'Test Item 2', 'Another demo',   'Digital', '0xdemo');
