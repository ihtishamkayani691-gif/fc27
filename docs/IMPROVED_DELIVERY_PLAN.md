# Focused v8 improvement plan

Goal: readable candidate economics, fair full-price discovery, fresh-window efficiency, purchasing OFF.

Design: retain native all-player rarity requests, native rate spacing, price helpers, sequential page evidence and the purchase engine. Add an opt-in improved build (27.0.7.0), fair initial quarter-price scopes and at most two consecutive page requests per scope. Productive scopes receive a bounded bonus turn; broad backstops and fair leaf turns remain. Show a bounded safe-text candidate history directly beside Trader controls, using the existing read-only economic review and explicit NOT VALUED reasons. No new ordering parameter or guessed page offset.

- [x] Pin coverage, fairness, reporting and disabled-purchase behavior with failing tests.
- [x] Implement only the opt-in planner, adapter and report wiring; preserve baseline builds and archives.
- [x] Compare request-count discovery latency on shifting synthetic markets; bounded live observations if authenticated.
- [x] Run full regression and clean installed-extension suites; package Windows ZIP and extract in Explorer.
- [x] Commit and push packaging fix and improved deliverable.

Constraints: user maximum 100000, min net profit 15000, per-card 100000, total 100000, count 1 unchanged for live validation; no real purchase or bid. Missing/stale values reject safely; no exhaustive-market or real-transaction readiness claim.

Ruling: proceed directly under the user's detailed one-session implementation request; no design approval round.

Verification: 413 automated tests; 28 existing installed checks and 14 new UI checks. One review-detected skipped-page queue bug was reproduced and fixed. Live initial coverage sessions: 24 Ultimate Scream and 34 Hero players. Final pre-queue-fix live session: 28 bounded native searches over 312s, 26 players, full price-band requests, no fresh-window candidate; therefore live freshness speedup remains unverified. Final queue correction is covered by regression and packaged clean-install tests.
