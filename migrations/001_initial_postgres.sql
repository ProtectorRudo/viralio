CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  merchant_id text NOT NULL,
  referral_token text NOT NULL UNIQUE,
  referred_by text NULL,
  state text NOT NULL CHECK (state IN ('LANDING', 'UNLOCK', 'SHARED', 'REWARDED')),
  reward_id uuid NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT sessions_referred_by_fk
    FOREIGN KEY (referred_by) REFERENCES sessions(referral_token)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  merchant_id text NOT NULL,
  session_id uuid NOT NULL UNIQUE,
  prize_id text NOT NULL,
  prize_name text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz NULL,
  CONSTRAINT rewards_session_fk
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_reward_fk'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_reward_fk
      FOREIGN KEY (reward_id) REFERENCES rewards(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (name IN (
    'landing_viewed', 'unlock_viewed', 'share_channel_selected', 'share_initiated',
    'wheel_unlocked', 'wheel_spun', 'reward_issued', 'whatsapp_save_clicked',
    'reward_viewed', 'reward_redeemed', 'referral_landing_viewed'
  )),
  merchant_id text NOT NULL,
  session_id uuid NULL,
  reward_id uuid NULL,
  referral_token text NULL,
  share_channel text NULL CHECK (
    share_channel IS NULL OR share_channel IN (
      'whatsapp', 'whatsapp_status', 'instagram_story', 'native', 'social'
    )
  ),
  timestamp timestamptz NOT NULL,
  CONSTRAINT analytics_session_fk
    FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT analytics_reward_fk
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS sessions_merchant_idx ON sessions(merchant_id);
CREATE INDEX IF NOT EXISTS sessions_referral_idx ON sessions(referral_token);
CREATE INDEX IF NOT EXISTS rewards_merchant_idx ON rewards(merchant_id);
CREATE INDEX IF NOT EXISTS rewards_token_idx ON rewards(token);
CREATE INDEX IF NOT EXISTS rewards_short_code_idx ON rewards(short_code);
CREATE INDEX IF NOT EXISTS analytics_merchant_time_idx ON analytics_events(merchant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS analytics_session_idx ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS analytics_reward_idx ON analytics_events(reward_id);
CREATE INDEX IF NOT EXISTS analytics_referral_idx ON analytics_events(referral_token) WHERE referral_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS analytics_reward_view_once_idx
  ON analytics_events(session_id, reward_id)
  WHERE name = 'reward_viewed' AND session_id IS NOT NULL AND reward_id IS NOT NULL;
