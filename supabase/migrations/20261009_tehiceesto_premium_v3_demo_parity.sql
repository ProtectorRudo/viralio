-- TeHiceEsto: upgrade the five launch purchases incorrectly pinned to premium-v2.
-- This is a parity repair, not a modification to the customer's personal content.
-- Exact original gift values are kept in this private recovery log.
create table if not exists public.tehiceesto_template_parity_audit (
  gift_id uuid primary key references public.gifts(id) on delete cascade,
  previous_template_version text not null,
  previous_scene_recipe jsonb not null,
  previous_story_data jsonb not null,
  upgraded_at timestamptz not null default now()
);
alter table public.tehiceesto_template_parity_audit enable row level security;
revoke all on public.tehiceesto_template_parity_audit from public, anon, authenticated;

with canonical(slug,recipe) as (
  values
    ('pareja', '["intro","door","memories","voices","light","stars","everyday","scratch","hold","letter","finale"]'::jsonb),
    ('cumpleanos', '["intro","candles","balloons","memories","light","voices","hold","letter","finale"]'::jsonb),
    ('hijos', '["intro","timeline","memories","voices","light","stars","capsule","hold","letter","finale"]'::jsonb),
    ('abuelos', '["intro","archive","timeline","memories","home","voices","letter","legacy","finale"]'::jsonb),
    ('aniversario', '["intro","timeline","memories","rituals","chapters","letter","future","finale"]'::jsonb),
    ('propuesta', '["intro","origin","memories","reasons","certainty","letter","threshold","proposal"]'::jsonb),
    ('mama', '["intro","childhood","memories","care","sacrifices","voices","letter","finale"]'::jsonb),
    ('papa', '["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"]'::jsonb),
    ('amistad', '["intro","casefile","memories","insidejokes","incidents","proof","letter","pact","finale"]'::jsonb)
),
affected as (
  select g.id, g.template_version, g.scene_recipe, g.story_data, c.recipe
  from public.gifts g
  join canonical c on c.slug=g.experience_slug
  where g.template_version='premium-v2'
    and g.created_at >= '2026-10-07T00:00:00Z'::timestamptz
    and exists (select 1 from public.orders o where o.gift_id=g.id)
),
snapshots as (
  insert into public.tehiceesto_template_parity_audit
    (gift_id,previous_template_version,previous_scene_recipe,previous_story_data)
  select id,template_version,scene_recipe,story_data
  from affected
  on conflict (gift_id) do nothing
  returning gift_id
)
update public.gifts g
  set template_version='premium-v3',
      scene_recipe=a.recipe,
      story_data=jsonb_set(
        coalesce(g.story_data,'{}'::jsonb),
        '{creator}',
        coalesce(g.story_data->'creator','{}'::jsonb) ||
          jsonb_build_object('templateVersion','premium-v3','templateRecipe',a.recipe),
        true
      )
from affected a
where g.id=a.id
  and exists(select 1 from public.tehiceesto_template_parity_audit s where s.gift_id=a.id);
