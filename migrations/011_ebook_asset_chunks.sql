create table if not exists private.ebook_asset_chunks (
  asset_key text not null references private.ebook_assets(asset_key) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content bytea not null,
  primary key (asset_key, chunk_index)
);

revoke all on private.ebook_asset_chunks from public, anon, authenticated;