-- TeHiceEsto checkout repair: only unpaid checkouts without a Mercado Pago link.
-- Never marks purchases approved, and retries use the same order payment token.
create table if not exists public.tehiceesto_checkout_recovery_attempts (
  order_id uuid primary key references public.orders(id) on delete cascade,
  first_detected_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0)
);
alter table public.tehiceesto_checkout_recovery_attempts enable row level security;
revoke all on public.tehiceesto_checkout_recovery_attempts from public, anon, authenticated;

create or replace function public.retry_tehiceesto_unavailable_checkouts()
returns integer language plpgsql security definer
set search_path to pg_catalog, public, net
as $$
declare
  missing_order record;
  queued integer := 0;
begin
  if not exists (select 1 from public.commerce_settings where id='default' and auto_checkout_enabled=true)
    then return 0;
  end if;

  for missing_order in
    select o.id,o.payment_token
    from public.orders o
    left join public.tehiceesto_checkout_recovery_attempts a on a.order_id=o.id
    where o.status='pending'
      and o.checkout_url is null
      and o.provider_reference is null
      and o.payment_token is not null
      and o.created_at < now() - interval '90 seconds'
      and o.created_at > now() - interval '4 hours'
      and (a.last_attempt_at is null or a.last_attempt_at < now() - interval '10 minutes')
      and coalesce(a.attempt_count,0)<12
    order by o.created_at asc
    limit 20
  loop
    insert into public.tehiceesto_checkout_recovery_attempts(order_id,last_attempt_at,attempt_count)
    values (missing_order.id,now(),1)
    on conflict (order_id) do update
      set last_attempt_at=excluded.last_attempt_at,
          attempt_count=public.tehiceesto_checkout_recovery_attempts.attempt_count+1;

    perform net.http_post(
      url := 'https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2',
      body := jsonb_build_object('action','create','token',missing_order.payment_token),
      headers := '{"content-type":"application/json"}'::jsonb,
      timeout_milliseconds := 15000
    );
    queued := queued+1;
  end loop;
  return queued;
end;
$$;
revoke all on function public.retry_tehiceesto_unavailable_checkouts() from public, anon, authenticated;
select cron.schedule('tehiceesto-checkout-recovery','*/5 * * * *',
                    'select public.retry_tehiceesto_unavailable_checkouts();');
