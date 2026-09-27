# S&P 500 historical universe source

Vendored/derived for StockMind cross-sectional point-in-time research.

- Upstream: chinobing/historical_sp500_constituents
- Pinned commit: 019beba2644764db88219cee6a8c43b8aae4904e
- Master historical snapshot blob: cbe4a55138732c8e2a656ca2fc42b4765bef35ff
- Snapshot span: 1996-01-02 → 2026-09-27
- Derived change events: 704
- License: MIT; see LICENSE in this directory.

StockMind's runtime JSON is generated from the upstream full historical snapshot file `sp_500_historical_components.csv`, not reconstructed from the changes-only file.

Important limitation: upstream historical snapshots are visibly under-complete in older years (for example, materially fewer than ~500 members before the late 2010s). StockMind Web therefore caps the batched cross-sectional beta to the recent 8-year window (starting no earlier than 2018) and surfaces coverage for every period. Membership data is a research dataset, not an official S&P Global constituent feed.

Historical membership alone does not solve archived prices or historical SEC identifier coverage for removed/delisted issuers. Missing prices/fundamentals remain explicit coverage loss and are never fabricated.
