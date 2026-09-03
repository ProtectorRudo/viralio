CREATE TABLE IF NOT EXISTS merchant_login_throttles (
  throttle_key text PRIMARY KEY,
  failure_count integer NOT NULL CHECK (failure_count >= 0),
  window_started_at timestamptz NOT NULL,
  blocked_until timestamptz NULL,
  updated_at timestamptz NOT NULL
);

ALTER TABLE merchant_login_throttles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS merchant_login_throttles_blocked_idx
  ON merchant_login_throttles(blocked_until)
  WHERE blocked_until IS NOT NULL;
