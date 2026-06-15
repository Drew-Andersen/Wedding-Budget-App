/**
 * migrate.js
 *
 * Runs all database migrations in order.
 * Safe to run repeatedly — every statement uses IF NOT EXISTS.
 *
 * Render runs this automatically as a Pre-Deploy Command:
 *   node migrate.js
 *
 * You can also run it locally:
 *   DATABASE_URL=<your-db-url> node migrate.js
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// ── Migrations ────────────────────────────────────────────────────────────────
// Add new migrations to the END of this array only.
// Never edit or remove an existing migration — add a new one instead.
// Each migration has a unique name and a SQL string.

const migrations = [
  // ── 001: Initial schema ────────────────────────────────────────────────────
  {
    name: "001_initial_schema",
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 
      CREATE TABLE IF NOT EXISTS couples (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        couple_code TEXT NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
 
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username      TEXT NOT NULL UNIQUE,
        display_name  TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
        couple_id     UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
 
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
 
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
 
      DROP TRIGGER IF EXISTS budget_items_updated_at ON budget_items;
      CREATE TRIGGER budget_items_updated_at
        BEFORE UPDATE ON budget_items
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
      CREATE INDEX IF NOT EXISTS idx_users_couple     ON users(couple_id);
      CREATE INDEX IF NOT EXISTS idx_items_couple     ON budget_items(couple_id);
      CREATE INDEX IF NOT EXISTS idx_items_couple_pos ON budget_items(couple_id, position);
    `,
  },

  // ── 002: Payment schedule column ──────────────────────────────────────────
  {
    name: "002_payment_schedule",
    sql: `
      ALTER TABLE budget_items
        ADD COLUMN IF NOT EXISTS payment_schedule JSONB NOT NULL DEFAULT '[]';
    `,
  },
];

// ── Migration runner ──────────────────────────────────────────────────────────

async function migrate() {
  const client = await pool.connect();

  try {
    // Create the migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Find which migrations have already been run
    const { rows: completed } = await client.query(
      "SELECT name FROM _migrations",
    );
    const completedNames = new Set(completed.map((r) => r.name));

    const pending = migrations.filter((m) => !completedNames.has(m.name));

    if (pending.length === 0) {
      console.log("✓ Database is up to date — no migrations to run");
      return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
      console.log(`  → ${migration.name}`);
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [
          migration.name,
        ]);
        await client.query("COMMIT");
        console.log(`  ✓ ${migration.name} complete`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ✗ ${migration.name} failed:`, err.message);
        throw err;
      }
    }

    console.log("✓ All migrations complete");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1); // Non-zero exit code causes Render to abort the deploy
});
