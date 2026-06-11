-- Wedding Budget Tracker — PostgreSQL Schema
-- Run this once against your Render PostgreSQL database:
--   psql $DATABASE_URL -f schema.sql
 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 
-- ── Couples ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  couple_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  couple_id    UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- ── Budget Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  estimate   NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual     NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid       NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_by    TEXT NOT NULL DEFAULT 'Bride & Groom',
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','deposited','paid','cancelled')),
  notes      TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
 
DROP TRIGGER IF EXISTS budget_items_updated_at ON budget_items;
CREATE TRIGGER budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_couple     ON users(couple_id);
CREATE INDEX IF NOT EXISTS idx_items_couple     ON budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_items_couple_pos ON budget_items(couple_id, position);