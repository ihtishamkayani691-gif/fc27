# FC Enhancer v8 AUTOMATIC27.0.8.0

Based on f97033b. The user now authorizes independent purchase decisions after an explicit session enablement, replacing the previous per-card approval requirement. Purchasing remains OFF by default. No real purchasing was enabled in development.

## Implemented behavior

- Separate trusted **Enable automatic purchasing for this session** control. Native dynamic valuation and valid saved limits are required before arming. Hidden historical per-card controls do not gate the normal automatic path.
- Maximum search/purchase ceiling and per-card/session budget cannot exceed100000; minimum net profit cannot be below15000; max confirmed purchases must equal1. Stricter settings are allowed. No limits are automatically raised or reduced.
- Previous fair full-price scopes, fresh-window evidence, native rarities, multiple-player discovery, comparable-price rules, fee/cost deductions, inventory/coin checks, duplicate journal and native service/transport locks remain active.
- Five-minute authorization from enablement, checked in terminal purchase preflight as well as by a timer. Stop/reload/emergency/safety failure revokes permission. Configuration changes cancel the old timer/permission. No qualifier means no spending before bounded session expiry.
- One confirmed ownership/coin-reconciled purchase stops immediately. Uncertain results stop and retain the journal; no blind retries or automatic rearming. Purchased cards are held unassigned rather than automatically sold or moved.
- Direct Trader transaction display includes player, rarity, trade ID, price, estimated comparable resale, fee/cost/net estimate, native outcome, inventory confirmation and observed updated balance. Success is reported only after the existing native confirmation and exact coin/inventory reconciliation.

## Evidence

- Full `npm.cmd test`:422 tests pass, zero failures (299 v8 +47 evaluator +2 baseline +74 regression). Previous413 preserved; nine focused tests cover no-consent automatic purchase, one-purchase stop, hard limits, rejected then qualifying candidates, uncertain results, budget/balance/inventory, expiry before/inside valuation and Stop/restart.
- Isolated clean installed Chrome:16 checks pass, with HTTP blocked and no EA account. Trusted checkbox + Start performs ONE synthetic100000 purchase against four125000 comparable asks, fee6250, estimated profit18750, coins250000 to150000, owned inventory confirmed; it then stops with authorization OFF, without exact-card consent. Reload remains OFF. Player/price/value/profit/result/balance are visible in Trader. Icons12, Heroes72 and Ultimate Scream151 selection also pass.
- Native-positive responses with missing inventory or coin evidence are UNCERTAIN, never successful. They stop and prevent rearming until reconciliation.
- Code review found no blocking authorization, terminal preflight, Stop or reload regressions.
- Final archive integrity, Windows Explorer extraction and final extracted-folder installation results are recorded alongside this report. No historical ZIP was overwritten.

## Not verified by real EA purchases

No real transaction was submitted. The automatic decision-to-buy and reconciliation flow is verified with actual production factories and mocked native transactions. Actual EA purchase API acceptance, real inventory timing, price competitiveness and realized resale profit remain unverified. Fresh-window duration is not proof of creation time; comparable asks are not completed sale prices. Existing bounded coverage limitations remain. This is not a claim of proven live purchasing or production readiness.

Your deliberate checkbox enablement authorizes automatic decisions for that session; no separate card approval is required. See INSTALL.md before your own session.
