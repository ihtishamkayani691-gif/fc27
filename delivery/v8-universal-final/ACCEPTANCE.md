# FC Enhancer v8 UNIVERSAL FINAL — acceptance

Baseline: `14afe0f` on dev/v8-browser-testing. Final version **27.0.6.0**. All previous TEST/RC ZIPs remain unchanged. FINAL is the requested delivery name; it is not a claim of full production readiness.

## Precise Hero diagnosis and fix

The prior Hero artifact recorded one fresh listing and one `profitability-rule-not-configured` rejection. The native dynamic Buy Now rule was not enabled, so the required profitability preflight rejected the listing. No profitable purchase candidate was established. The old review-window handler then overwrote the rejection with a timeout result, leading to the incorrect prior summary that no fresh listing appeared. The historical card's identity was not retained; it is not invented here.

FINAL checks valuation configuration before scanning. A visible **Use native dynamic Buy Now pricing** control enables valuation only, disarms purchases and does not silently rewrite saved settings. Candidate history now retains exact names, IDs, prices, reasons and available valuation evidence independently of window/candidate limits. DIAGNOSIS.json cites the old evidence and the new results. No discovery strategy or safeguard was replaced.

## Verification

`npm test`: **399** passing tests—276 v8, 47 evaluator, 2 baseline and 74 archived regression. Every original 396 test is retained. Three added regressions cover missing valuation preflight, rejection preservation at window end, and the exact100,000/15,000 after-fee boundaries including extra costs.

28 installed-extension checks passed and were repeated on the extracted final ZIP in a fresh Chrome profile. The checks cover manifest 27.0.6.0, compiled production factories, blank limits/default OFF, isolated profiles, delayed DOM mounting, metadata rename during a run, settings changes, Start/Stop/reload/error recovery, valuation-only enablement, exact consent, reviewed budget/balance evidence and one complete simulated acceptance purchase. Official Playwright MCP and Chrome DevTools MCP tests pass with zero EA requests in the isolated fixture. 42 connected simulation snapshots cover all 18 currently market-selectable native rarity plus compatible future metadata. Offline timing/service dependencies are simulated; production decisions/controllers/guards are used.

The actual final main.js SHA matches the authenticated live sessions and extracted package. VERIFICATION.json verifies all 25 build files, 12 manifest resources, unchanged prior archive hashes, test counts and current live outcomes. Full output is TEST_OUTPUT.txt.

## Current live discovery and valuation

Both sessions used the installed FINAL extension, native valuation ON, an empty individual-player selection, native rarity 72 or 151, maximum 100,000, minimum estimated net profit 15,000, total test budget 100,000 and maximum one purchase. Purchase mode and exact consent stayed OFF; blocked mutation attempts were zero. No bids or purchases were submitted.

| Rarity/card | Trade ID | BIN | Lowest verified comparable ask | Fee | Net estimate | Precise rejection |
|---|---|---:|---:|---:|---:|---|
| Base Hero / Nakata |620285685782|100,000|102,000|5,100|−3,100|minimum-net-profit-not-met|
| Base Hero / Zamorano |620285613966|99,500|99,000|4,950|−5,450|minimum-net-profit-not-met|
| Base Hero / Giuly |620285592633|100,000|unavailable|unavailable|unavailable|stale-response|
| Ultimate Scream / Crnogorčević |620285946892|100,000|16,750|838|−84,088|minimum-net-profit-not-met|
| Ultimate Scream / Laura Pérez |620285907928|100,000|unavailable|unavailable|unavailable|outside-fresh-window|

Each completed live valuation used 21 verified distinct exact-definition/rarity native asks; the target is excluded. Fee/cost arithmetic is enforced before any purchase permission. Giuly and Laura Pérez were fresh when discovered but their evidence aged out before a valid purchase decision. No estimate was invented for them. The Hero review stopped at its three-candidate bound; Scream stopped at its time bound while retaining the actual rejection history. Evidence: testing/browser/completion/LIVE_RESULTS.json. The five observations do not prove exhaustive coverage or that no qualifying card exists elsewhere.

## Rarity and future compatibility

The current native provider exposes 23 named player rarities, 18 marked market-selectable and five unavailable for native market selection. RARITIES.md/JSON retain the earlier bounded 18-rarity query matrix, including seven matching multi-player samples and eleven empty samples. That completed research was not repeated. Current FINAL re-read native metadata dynamically and validated fresh discovery for Heroes and Scream. No rarity IDs were guessed. TOTY/TOTS/RTTK names absent from this metadata snapshot remain unavailable until exposed compatibly by EA.

Compatible future addition/removal/rename/ID change, duplicate names, missing/expired metadata and profile isolation pass the existing tests. Actual future EA deployments and incompatible API changes remain unverified. Unavailable or ambiguous metadata fails safely.

## A–I decision

| Criterion | Decision | Evidence and scope |
|---|---|---|
| A. Universal native rarity discovery |PASS|Current native metadata;28 installed checks;23 known names/18 market selections.|
| B. Automatic all-player fresh discovery |PASS, observed scope|Five fresh-window listings across players and two rarities, empty defId. Same proven price-scope/paging method. Exhaustive coverage and listing birth are unverified.|
| C. Maximum snipe enforcement |PASS in tested paths|100,000 live ceiling; all observed candidates≤ceiling; original submission/transport tests and new100,000 boundary test.|
| D. Profitability and budget enforcement |PASS in tested paths|Three actual negative-net rejections; stale/missing evidence refused; fee/cost/per-purchase/total/count/coins/inventory regression tests.|
| E. Simulated purchase and reconciliation |PASS|42 connected snapshots; all 18 native market rarities; installed exact one-purchase mock confirms ownership, deduction and automatic Stop.|
| F. Actual EA purchase and reconciliation |UNVERIFIED / PENDING|No qualifying candidate; no exact approval requested or received; zero real buys/bids.|
| G. Stop/emergency/restart safety |PASS in tested paths|Native live bounded Stop and reload/default OFF; installed tests and delayed-review/refresh/lock cancellation regressions. An already submitted transaction may require reconciliation; Stop prevents new submissions.|
| H. New native rarity metadata compatibility |PASS for compatible schema|Dynamic native metadata and future-promo fixture; actual future promotions/incompatible APIs are unverified.|
| I. Clean install and production build |PASS|Extracted ZIP/new profile28 checks; manifest 27.0.6.0; compiled-file equality and live main SHA.|

## Remaining limitations

Real EA acceptance/rejection/timeout semantics, native wire serialization, competition, actual coin/inventory synchronization and post-purchase effects still require a separately approved real transaction. Current asks estimate resale value, not guaranteed liquidity or realized 15,000 profit. Fresh-window duration 3540–3600 seconds is observable evidence, not proof of listing creation; relists, complete market coverage and long-duration stability are not proven. Compatible metadata handling cannot guarantee unknown future API behavior. Late-confirmed wins can need manual item handling; unknown outcomes stay locked and never retry blindly.

The live purchase test remains pending. Limits were not lowered, a different card was not substituted, and no successful real transaction is claimed.
