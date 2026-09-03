ALTER TABLE public.merchant_accounts
  DROP CONSTRAINT IF EXISTS merchant_accounts_template_check;

ALTER TABLE public.merchant_accounts
  ADD CONSTRAINT merchant_accounts_template_check
  CHECK (template IN ('coffee', 'barber', 'generic'));

ALTER TABLE public.merchant_accounts
  ADD COLUMN IF NOT EXISTS business_type text;

UPDATE public.merchant_accounts
SET business_type = CASE
  WHEN template = 'coffee' THEN 'Café / gastronomía'
  WHEN template = 'barber' THEN 'Barbería / peluquería'
  ELSE 'Comercio'
END
WHERE business_type IS NULL OR btrim(business_type) = '';

ALTER TABLE public.merchant_accounts
  ALTER COLUMN business_type SET DEFAULT 'Comercio',
  ALTER COLUMN business_type SET NOT NULL;

ALTER TABLE public.merchant_accounts
  DROP CONSTRAINT IF EXISTS merchant_accounts_business_type_check;

ALTER TABLE public.merchant_accounts
  ADD CONSTRAINT merchant_accounts_business_type_check
  CHECK (char_length(btrim(business_type)) BETWEEN 2 AND 60);
