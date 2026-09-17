-- VIRALIO-031 — QR funnel attribution
-- Links each measured QR entrance to the Viralio session that follows it.
-- Historical qr_opened analytics remain untouched; attribution starts with this migration.

CREATE TABLE IF NOT EXISTS qr_entries (
  entry_token uuid PRIMARY KEY,
  merchant_id text NOT NULL,
  session_id uuid NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  linked_at timestamptz NULL,
  CONSTRAINT qr_entries_session_fk
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS qr_entries_merchant_opened_idx
  ON qr_entries(merchant_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS qr_entries_merchant_session_idx
  ON qr_entries(merchant_id, session_id)
  WHERE session_id IS NOT NULL;
