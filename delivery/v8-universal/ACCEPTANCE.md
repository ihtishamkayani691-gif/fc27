# Universal RC acceptance report

Baseline `394632c` on dev/v8-browser-testing. UNIVERSAL version **27.0.5.0** is a separate build; TEST, RC1, RC2 and FINAL archive hashes are unchanged. See VERIFICATION.json for file integrity and exact results.

## Software validation

- Complete `npm test`:396 passing tests (273 v8, 47 evaluator, 2 baseline, 74 archived regression). All original 325 tests remain.
- 42 recorded connected session snapshots. Every one of the 18 current native market rarities completes a simulated multi-player discovery→native safety→purchase→ownership/coins reconciliation workflow. A synthetic future native promo also completes that workflow.
- 25 installed-extension checks, repeated against a clean extraction of the final ZIP in a new Chrome profile. Runtime manifest/version, latest compiled factories, blank-limit rejection, profile isolation, delayed native DOM mounting, running metadata rename→Stop, reload/default OFF, errors/recovery and exact one-purchase review/consent/confirmation all pass. Zero external requests or runtime errors in those offline suites.
- Official local Playwright MCP and Chrome DevTools MCP both exercise the installed production factories with synthetic account/network dependencies. Two confirmed simulated purchases and one sold listing reconcile; no real EA requests occur in this suite.
- New delayed-review, delayed-refresh and delayed-browser-lock regressions prove that Stop/emergency disable invalidates old work and leaves a newer session intact. Wrong trade/item/price, stale approval, missing evidence and unconfirmed results cannot authorize a substituted purchase.

## Native live evidence

EA exposed 23 named player rarities, 18 currently marked market-selectable. Every one of those 18 was selected through the installed Universal control and searched with the correct native rarity and an empty individual-player selection. Seven returned matching listings across multiple players; eleven returned no listings under the temporary 100,000 discovery ceiling, leaving live card matching/fresh discovery unverified for those empty samples. No returned-card mismatch was observed. The other five metadata entries are unavailable for native market selection and are disabled. See RARITIES.md/JSON and testing/browser/universal/LIVE_RARITY_MATRIX.json for each rarity and raw sanitized evidence.

The release preserves the exact live-tested discovery/quote factories, native planner, paging proof, timer and purchase middleware. The live matrix records its compiled hash; later acceptance cancellation hardening affects the execution coordinator, not those discovery factories. Latest production code also performs bounded read-only acceptance preparation in the authenticated Web App with purchasing OFF. Live UI bootstrap console messages are not a claim of a clean third-party EA runtime; native market results used here report success. Offline extension console checks are captured comprehensively.

The fresh window uses actual remaining listing duration 3540–3600 seconds. It does not prove listing creation time, distinguish all relists or establish exhaustive coverage. No direct page 20 shortcut, synthetic rarity table or rate/security bypass was introduced. Existing filters can restrict coverage, and bounded observations do not prove every player/card was found.

## Native metadata and future compatibility

The production selector, query validation, returned-rarity check, valuation, final preflight and profile identity use the selected native identifier. ID 0 is supported. New compatible metadata entries appear dynamically; duplicate names are disambiguated. Removed, renamed, expired, ambiguous or changed-ID metadata fails safely and cannot inherit old spending limits. Profiles never store purchase enablement. Synthetic future addition, removal, name/ID changes, duplicates, missing data and no-saved-profile tests pass. Future incompatible EA APIs still require an update.

## Purchase acceptance status

User supplied planning maximum 100,000 and minimum net profit 15,000. The initial test is constrained to one purchase and at most 100,000 total expenditure. Those planning values are not exact transaction approval.

No real transaction has been approved or submitted. The installed production flow can prepare a read-only exact-card review and can execute at most that specifically approved trade through the actual native Trader timer and original native purchase path. Mocked acceptance verifies separate consent, price/identity restriction, refreshed native listing checks, inventory/coin proof and automatic Stop; Stop, emergency disable, changed settings and expired approval cancel it. Real transport/EA acceptance, market competition, actual balance/inventory propagation and realized profit remain UNVERIFIED.

Two bounded read-only reviews (Ultimate Scream and Base Hero) each reached the two-minute window without a fresh-window candidate to evaluate. No exact transaction approval was requested because there was no qualifying transaction to present. See PURCHASE_ACCEPTANCE.json. Read-only preparation outcomes and final safe state are recorded in testing/browser/universal/LIVE_ACCEPTANCE_PREPARATION.json and related acceptance evidence. If no candidate qualifies under the user limits during a bounded review, there is no transaction to approve; limits are not lowered and another card is never substituted after approval.

## Readiness

PASS: current native metadata discovery; isolated saved settings; all 18 bounded native query filters; strict result matching where listings were returned; simulated complete transactions for all 18 and a future promo; price/profit/budget/inventory/duplicate/Stop controls; default-OFF and exact acceptance safeguards; clean install/build integrity.

UNVERIFIED: live result matching for eleven empty rarity samples; live tradability of the five native-unavailable entries; real future promotions; complete market coverage/long soak; actual EA purchase success/failure/latency and post-purchase reconciliation; realized resale profit. No production-readiness claim is made. Only a separately approved, tightly limited one-purchase acceptance test can close the real-transaction gap.
