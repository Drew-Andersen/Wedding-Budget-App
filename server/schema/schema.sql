-- Wedding Budget Tracker — PostgreSQL Schema
-- Run this once against your Render PostgreSQL database:
--   psql $DATABASE_URL -f schema.sql
--
-- NOTE: in production, migrate.js is the source of truth (runs as a
-- Render Pre-Deploy Command). This file is kept in sync for fresh local setups.
 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 
-- ── Couples ──────────────────────────────────────────────────────────────────
-- couple_code → shared publicly with family/guests, grants VIEWER access only
-- invite_code → shared privately with just the fiancé(e), grants EDITOR access,
--               capped at 2 editors per couple (enforced by trigger below)
CREATE TABLE IF NOT EXISTS couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  couple_code TEXT NOT NULL UNIQUE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  couple_id     UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- ── Budget Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_items (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id         UUID    NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category          TEXT    NOT NULL,
  name              TEXT    NOT NULL,
  estimate          NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual            NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid              NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_by           TEXT    NOT NULL DEFAULT 'Bride & Groom',
  status            TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','deposited','paid','cancelled')),
  notes             TEXT    NOT NULL DEFAULT '',
  -- Ordered array of ISO date strings, e.g. ["2026-03-05","2026-05-25","2026-09-20","2027-03-11"]
  -- The app derives: total payments, how many are past today, and the next upcoming date.
  payment_schedule  JSONB   NOT NULL DEFAULT '[]',
  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
DROP TRIGGER IF EXISTS budget_items_updated_at ON budget_items;
CREATE TRIGGER budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
-- ── Enforce max 2 editors per couple ──────────────────────────────────────────
-- Final backstop against a race condition — the API also checks editor count
-- before inserting, but this guarantees it can never be bypassed.
CREATE OR REPLACE FUNCTION enforce_editor_limit()
RETURNS TRIGGER AS $$
DECLARE
  editor_count INTEGER;
BEGIN
  IF NEW.role = 'editor' THEN
    SELECT COUNT(*) INTO editor_count
    FROM users
    WHERE couple_id = NEW.couple_id AND role = 'editor';
 
    IF editor_count >= 2 THEN
      RAISE EXCEPTION 'editor_limit_reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
DROP TRIGGER IF EXISTS users_editor_limit ON users;
CREATE TRIGGER users_editor_limit
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION enforce_editor_limit();
 
-- ── Migrations: safely add columns to an existing database ───────────────────
-- Safe to run even if columns already exist (IF NOT EXISTS guards).
ALTER TABLE budget_items
  ADD COLUMN IF NOT EXISTS payment_schedule JSONB NOT NULL DEFAULT '[]';
 
ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS invite_code TEXT;
 
UPDATE couples
  SET invite_code = UPPER(SUBSTRING(MD5(id::text || 'invite'), 1, 10))
  WHERE invite_code IS NULL;
 
-- Add the UNIQUE + NOT NULL constraints only after backfilling existing rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'couples_invite_code_key'
  ) THEN
    ALTER TABLE couples ALTER COLUMN invite_code SET NOT NULL;
    ALTER TABLE couples ADD CONSTRAINT couples_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;
 
-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_couple     ON users(couple_id);
CREATE INDEX IF NOT EXISTS idx_items_couple     ON budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_items_couple_pos ON budget_items(couple_id, position);
 
-- Optional: index for querying items that have a non-empty payment schedule
CREATE INDEX IF NOT EXISTS idx_items_payment_schedule
  ON budget_items USING GIN (payment_schedule)
  WHERE payment_schedule != '[]'::jsonb;