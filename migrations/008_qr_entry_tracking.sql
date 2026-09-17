-- VIRALIO-021 — QR entry analytics
-- Adds an explicit QR-open event so merchant dashboards can distinguish
-- physical QR traffic from direct/referral visits without changing existing data.

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_name_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_name_check CHECK (name IN (
    'qr_opened',
    'landing_viewed',
    'unlock_viewed',
    'share_channel_selected',
    'share_initiated',
    'wheel_unlocked',
    'wheel_spun',
    'reward_issued',
    'whatsapp_save_clicked',
    'reward_viewed',
    'reward_redeemed',
    'referral_landing_viewed'
  ));

CREATE INDEX IF NOT EXISTS analytics_qr_opened_merchant_time_idx
  ON analytics_events(merchant_id, timestamp DESC)
  WHERE name = 'qr_opened';
