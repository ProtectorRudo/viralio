create table if not exists private.ebook_asset_chunks (
  asset_key text not null references private.ebook_assets(asset_key) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content bytea not null,
  primary key (asset_key, chunk_index)
);

revoke all on private.ebook_asset_chunks from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on private.ebook_asset_chunks from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on private.ebook_asset_chunks from authenticated';
  end if;
end
$$;
