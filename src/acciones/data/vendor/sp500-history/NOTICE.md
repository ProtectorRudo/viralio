# S&P 500 historical universe source

Vendored for StockMind cross-sectional point-in-time research.

- Upstream: chinobing/historical_sp500_constituents
- Pinned commit: 019beba2644764db88219cee6a8c43b8aae4904e
- Upstream refresh timestamp: 2026-09-27 04:20:16 UTC (repository commit time)
- Files: sp500_constituents.csv, sp500_changes_since_1996.csv
- License: MIT; see LICENSE in this directory.

The upstream project reconstructs historical S&P 500 membership from 1996 onward. StockMind treats this as a research dataset, not an official S&P Global constituent feed. Backtest output must surface universe coverage and data-source limitations. Historical membership alone does not solve historical price/fundamental coverage for delisted issuers.
