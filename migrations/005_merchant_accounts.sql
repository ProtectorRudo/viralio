CREATE TABLE IF NOT EXISTS public.merchant_accounts (
  merchant_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  template text NOT NULL CHECK (template IN ('coffee', 'barber')),
  pin_salt text NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS merchant_accounts_slug_idx ON public.merchant_accounts(slug);
ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;
