CREATE TABLE IF NOT EXISTS public.merchant_settings (
  merchant_id text PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamptz NOT NULL
);

ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;
