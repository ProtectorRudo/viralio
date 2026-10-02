create schema if not exists private;

revoke all on schema private from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema private from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema private from authenticated';
  end if;
end
$$;

create table if not exists private.ebook_assets (
  asset_key text primary key,
  filename text not null,
  mime_type text not null,
  content_encoding text not null default 'identity'
    check (content_encoding in ('identity','gzip')),
  content bytea not null default decode('', 'hex'),
  sha256 text not null,
  size_bytes integer not null check (size_bytes > 0),
  updated_at timestamptz not null default now()
);

create table if not exists private.ebook_purchases (
  payment_id text primary key,
  payer_email text not null,
  status text not null,
  amount numeric(12,2) not null,
  currency_id text not null,
  external_reference text,
  description text,
  approved_at timestamptz,
  delivery_email_status text not null default 'pending'
    check (delivery_email_status in ('pending','sent','not_configured','failed')),
  email_sent_at timestamptz,
  last_email_error text,
  download_count integer not null default 0 check (download_count >= 0),
  last_download_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.ebook_webhook_events (
  id bigint generated always as identity primary key,
  request_id text,
  payment_id text,
  event_type text not null,
  payload_sha256 text,
  received_at timestamptz not null default now(),
  unique (request_id, payment_id, event_type)
);

create index if not exists ebook_purchases_email_idx
  on private.ebook_purchases (lower(payer_email));

revoke all on all tables in schema private from public;
revoke all on all sequences in schema private from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema private from anon';
    execute 'revoke all on all sequences in schema private from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on all tables in schema private from authenticated';
    execute 'revoke all on all sequences in schema private from authenticated';
  end if;
end
$$;
