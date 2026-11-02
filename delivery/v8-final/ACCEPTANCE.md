# FINAL RC implementation and acceptance scope

Starting point: pushed `87c3c41`, branch `dev/v8-browser-testing`. Final build version 27.0.4.0. TEST, RC1 and RC2 archive hashes are retained in VERIFICATION.json. Their code and tests remain available; FINAL is a separate build.

## Connected production path

The installed bundle uses the actual TraderProcessor.start/runActions controller, all-player discovery adapter, original native safety middleware and native transfer orchestrator. The new coordinator connects eligibility → refreshed inventory → fresh price evidence → native safety preview → durable reservation → one exact native Buy Now service/transport → auction/coins/refreshed-inventory confirmation → native won handling → scanning continuation. The synthetic service layer replaces network/account effects, not these decisions or controllers.

FINAL retains rarity 151, empty player selection, the successful all-player price-scope discovery planner, sequential evidence-based paging and native request/rate protections. There is no direct page-20 shortcut. The existing traversal limit is a bounded safety budget; observed server capacity/offset proof determines progression. It does not establish exhaustive market coverage. Remaining duration within 3540–3600 seconds is actual listing evidence for the fresh window; `listingBirthProven=false` explicitly distinguishes that inference from proof of creation or first market appearance. Relists and unseen listings are not ruled out.

## Hardening added

- Explicit positive profit/per-purchase/budget/count limits; purchase mode OFF on reload and default installation; trusted UI action required to arm while stopped.
- Native comparable-ask valuation, exact definition/rarity and distinct trade IDs, target excluded, expiry-aware samples and 15-second age checks. Search/valuation scheduling is shared and cancellation-aware. Native percentage/step pricing modifiers remain additional restrictions.
- Fee/cost-aware economics repeated at the final submission boundary. Fee rounds upward conservatively. The bundled native economics also uses 0.95; EA's published guide describes the 5% transaction fee: https://www.easports.com/au/fifa/ultimate-team/news/2017/how-to-improve-your-fifa-ultimate-team-squad . This is an ask-based estimate, not proven realized profit.
- Supported native unassigned-cache reset/request before pricing; current native inbox-full and duplicate checks before submission. Missing, stale or full inventory cannot authorize a purchase. Exact purchased item ID must appear in freshly requested unassigned inventory before a win is confirmed.
- Pending transaction phases and a durable trade-ID journal. A single exact deferred native transport is permitted; price/body/identity/coins/settings/Stop checks repeat immediately before send. Repeated submissions fail closed.
- Success notifications/counters occur after confirmation, not merely API acceptance. Missing coin or item updates, malformed/late results, timeout, Stop and reload preserve uncertainty and prevent another purchase. Reconciliation does not re-arm or blindly replay item actions; late ownership requires manual item handling.
- The production native purchase function is still used. FINAL auto-discovery suppresses premature raw native win accounting and stale external price enrichment; other feature implementations are preserved and remain behind the purchase guard.

## Evidence and decision

`npm test` passed **325** tests: 202 v8, 47 evaluator, 2 baseline and 74 archived regression tests. It runs the complete existing suites and new FINAL checks. See VERIFICATION.json for exact counts and archive integrity; testing/v8/FINAL_SESSION_RESULTS.json for full connected sessions; testing/browser/FINAL_* for browser, MCP, native-read and live evidence. A third timed live session observed five fresh-window candidates at 43.69 seconds; its five native response durations ranged 379.8–1074.8 ms (median 519.8 ms). Native quote preparation took 7200.5 ms including the required seven-second spacing, with 197.1 ms response latency. No live session produced an error or mutation attempt. Offline timers are simulated; production service spacing remains enforced. PERFORMANCE.json distinguishes local synthetic timings from real read-only timings.

| Question | Decision | Evidence |
|---|---|---|
| A. Installed Trader discovers fresh Ultimate Scream listings across players without a selected card | PASS, observed scope | Final hard-locked live sessions: empty defId, rarity 151, six and seventeen observed players; fresh Lukeba 60,000 and Perišić 59,500 at the 60,000 test ceiling. Not exhaustive coverage or proven listing birth. |
| B. Reject listings above the configured snipe price | PASS in tested paths | Search ceiling, eligibility and final service/transport checks; FINAL changed-price test, per-purchase tests, existing preflight/boundary regression and installed mixed-listing session. Universal behavior outside tested/native contract changes is not claimed. |
| C. Production engine completes simulated purchases and reconciles outcomes | PASS, simulation | 23 recorded connected session snapshots; installed/extracted-ZIP/MCP sessions confirm two purchases, one sold listing, coins 5,000→3,200 and two owned items. Missing proof never counts a win. |
| D. Profitability, budgets, duplicates and Stop enforced | PASS in tested paths | FINAL economics/quotes/execution/guard/session tests cover fees/costs, stale/missing quotes, per-purchase/count/total limits, capacity/duplicate ownership, changed coins, duplicate IDs, expiry, Stop and timeout. Original 284 regressions retained. |
| E. Explicit session opt-in, default OFF | PASS | Fifteen fresh-profile browser checks, repeated on extracted ZIP, plus MCP and restart/journal tests. Blank limits cannot arm; emergency disable, Stop and reload disarm. |
| F. Real-world transactions and realized profit | UNVERIFIED | Zero real buys/bids. Actual EA acceptance/rejection response, native wire serialization, winning competition, coin/ownership propagation, late response/reload recovery and post-purchase item actions still need separate authorization. Ask liquidity/realized resale profit, exhaustive coverage and long-duration stability remain unproven. |
| G. Ready for a separately authorized tightly limited live acceptance | PASS for controlled test readiness only | Clean install and connected simulation pass; live all-player reads and native valuation/inventory contracts verified under an unconditional mutation lock. Before live acceptance choose explicit low limits, one purchase, sufficient coins, fresh quotes, no unresolved journal and direct supervision. This does not authorize a transaction or certify production readiness. |

## Remaining limitations

- No real purchase or bid was attempted. Mocks cannot prove the current EA purchase transport, account/server transaction semantics, synchronization delays, competition or real post-purchase effects. Unknown results deliberately stop rather than retry.
- Fresh comparable asks are defensible current observations but not executed-sale evidence, guaranteed liquidity or a manipulation-proof price oracle. Missing three comparables can reject otherwise desirable listings.
- Extra valuation/inventory reads and safety spacing add latency. The fresh window can expire before a later candidate is evaluated; it is then rejected. No service-protection bypass or speed/win-rate claim is made.
- Observed players/candidates do not prove complete market coverage, creation time, discovery of every new listing or a long live soak.
- Reconciled late wins may require manual inventory handling. No blind replay of potentially completed item movements/listing actions is permitted.

The package is a testable FINAL release candidate. `productionReady:false` remains explicit.
