-- ─── Messages (real-time chat per escrow) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id      TEXT        NOT NULL,    -- on-chain listing ID as string
  sender_address TEXT        NOT NULL,    -- lowercase hex wallet address
  content        TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_escrow_idx ON messages (escrow_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read_all"   ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_all" ON messages FOR INSERT WITH CHECK (true);

-- Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─── Ratings (post-trade 1–5 star ratings) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id     TEXT        NOT NULL,
  rater_address TEXT        NOT NULL,
  rated_address TEXT        NOT NULL,
  score         SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment       TEXT        CHECK (char_length(comment) <= 300),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (escrow_id, rater_address)   -- one rating per party per escrow
);

CREATE INDEX IF NOT EXISTS ratings_rated_idx ON ratings (rated_address);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_read_all"   ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_all" ON ratings FOR INSERT WITH CHECK (true);

-- ─── Reputation view (aggregated per address) ─────────────────────────────────
CREATE OR REPLACE VIEW reputation AS
SELECT
  r.rated_address                   AS address,
  ROUND(AVG(r.score)::NUMERIC, 2)   AS avg_rating,
  COUNT(r.id)                       AS total_ratings,
  -- join to listings for trade counts
  COALESCE(t.total_trades,     0)   AS total_trades,
  COALESCE(t.successful_trades, 0)  AS successful_trades
FROM ratings r
LEFT JOIN (
  SELECT
    seller_address,
    COUNT(*)                                           AS total_trades,
    COUNT(*) FILTER (WHERE contract_id IS NOT NULL)    AS successful_trades
  FROM listings
  GROUP BY seller_address
) t ON t.seller_address = r.rated_address
GROUP BY r.rated_address, t.total_trades, t.successful_trades;
