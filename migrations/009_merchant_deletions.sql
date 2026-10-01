CREATE TABLE IF NOT EXISTS public.merchant_deletions (
  merchant_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS merchant_deletions_slug_idx
  ON public.merchant_deletions(slug);

ALTER TABLE public.merchant_deletions ENABLE ROW LEVEL SECURITY;
