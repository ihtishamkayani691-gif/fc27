# FC Enhancer v8 production Trader validation

Development branch: `dev/v8-browser-testing`, based on
`66d12bc13c96c48daf26fe05d4c43a8e8cd588b1`.
The user's final objective remains an automatic all-player Ultimate Scream
sniper with separately authorized future purchasing. This TEST build cannot
execute real purchases or bids. It is not a completed production release.

## Code integrated

- The existing production TraderProcessor Auto-Find branch calls v8's planner
  through the native timer and orchestrator. Account protections and BotController
  remain active. Validation skips unrelated watchlist and transfer-list actions.
- The Trader Search Settings panel includes a maximum snipe-price field. Native
  search maxima, this fixed ceiling and dynamic native buying limits intersect;
  none is automatically raised. Named-player searches are rejected in all-player mode.
- Native-selected rarity criteria and existing client filters are preserved.
  The installed UI confirmed **Ultimate Scream = rarity 151**, empty `defId`,
  `maskedDefId=0`. The separate Ultimate Scream Hero option was not selected.
- The planner rotates bounded, overlapping native price scopes. Only observed
  request capacity and native price-step helpers justify splitting. A native
  page traversal stays contiguous within one query. The crowded broad backstop
  is bounded to two pages; leaf price cohorts are bounded to 20 pages. A native
  upper-boundary price cohort is probed early, using the native previous-price
  step, while preserving the broad root and remaining price scopes.
  Native offsets, count and listing identities are checked; no EA endpoint or
  offset formula is constructed. Empty success is inconclusive and allows a
  later bounded reprobe; auth/rate failures stop.
- Exact trade-ID deduplication spans all scopes in a run. Only unseen IDs on
  verified new pages reset discovery-progress cooldown. Late responses cannot
  stop a restarted run. A full dedup cache stops rather than forgets IDs.
- Original purchase middleware is previewed without its cache-write and bid
  terminal steps. Native full-chain fixtures reach only mocked purchase terminals.
  A separate native-chain guard enforces the v8 maximum on execution and rebid paths.
- The purchase bridge is connected after a successful preview. Its immutable
  validation, purchase-enable and separate-user-authorization gates are all
  false in this TEST package, so it returns before touching the orchestrator.
  An injected authorized fixture proves routing through the original transfer
  orchestrator and native checks, using mocked transaction terminals only.
- The MAIN-world document-start guard blocks bid/listing HTTP mutations.
  Before discovery it also locks native `services.Item.bid` and the item-service
  prototype against reassignment. The TEST purchase bridge cannot authorize execution.
- A real filter-save race was fixed: refreshed dropdown options are awaited
  before selecting/reloading the saved filter. The installed UI retained the
  saved rarity and 100,000-coin temporary test maximum after the fix.
- Legacy scheduled filter rotation is suppressed from the very first Auto-Find
  cycle, preventing another saved filter from replacing chosen criteria or
  raising the configured ceiling before v8 creates its session.

## Real browser evidence

Playwright MCP drove the normal Trader UI. Chrome DevTools MCP installed the
unpacked build, read the sanitized diagnostic interface, and checked interlocks.
The isolated authenticated browser uses loopback port 9223. No credentials,
cookies, tokens, headers or response bodies are recorded in these reports.
Browser profiles and automatic UI snapshots are Git-ignored.

The first price-scope-only run made 15 native read requests at the existing
cadence. HTTP 200 results matched the selected rarity and price scopes, but
returned expiry ranges of approximately 43–274 seconds rather than the
3,540–3,600-second candidate window. It found no fresh candidate.
See `LIVE_PRICE_SCOPE_BASELINE.json`.

An interleaved page probe returned a successful empty page 2 at observed offset
20. A subsequent contiguous same-query probe returned populated pages 1, 2 and 3
at observed offsets 0, 20 and 40. This supports keeping each native traversal
contiguous; it does not establish server ordering or complete market coverage.
See `LIVE_INTERLEAVED_PAGE_PROBE.json` and `LIVE_CONTIGUOUS_PAGE_PROBE.json`.

The full-range automatic run in `LIVE_AUTOMATIC_DISCOVERY_BASELINE.json` found
**five real fresh-window candidates across three players** at 100,000 coins,
with 3,552–3,582 seconds remaining, at page 6 of the automatically chosen native
99,500–100,000 price cohort. No player was individually selected and native
minimum price remained zero in the user-facing configuration. The original
native safety preview passed for all five; the run stopped without purchases.
This demonstrates real candidate discovery and fixed-ceiling eligibility, not
profitability or proof of listing creation time.

The latest bounded run is recorded in `LIVE_V8_RESULTS.json`. Native bid
interlocks were confirmed active and recorded blocked mutation attempts were
zero. Every validation run is explicitly stopped by its harness.
The final build, including the gated orchestrator bridge, reproduced this
behavior with two additional candidates at 3,542 and 3,570 seconds. Both passed
the native preview; the purchase policy denied execution and the run stopped.

## Verification and acceptance limits

Latest regression run: **195 tests passed** (72 v8, 47 offline evaluator,
2 archived baseline, 74 archived production regressions). Existing logger and
v8 renderer fixtures passed. The final production bundle also passed its
unpacked-registration checks and all seven installed-extension fixture checks
in `LOCAL_TRADER_REGISTRATION.json`. Review findings for restart cancellation,
transient empty-page recovery and repeated traversal progress were reproduced
as failing regressions, fixed, and reviewed again.

Run `npm.cmd test` for the v8 suite, offline evaluator, archived v7.2 regressions,
existing logger browser fixture, bundled v8 fixture and installed extension test.
Run `npm.cmd run build:v8` to rebuild `.local/v8-trader-validation`.
`npm.cmd run build:v8:offline` retains the isolated synthetic-only bundle.
The complete installable validation ZIP is
`delivery/v8/FC_Enhancer_v8_Trader_Validation_TEST.zip`; its hash and exact-file
verification are recorded in `delivery/v8/VERIFICATION.json`.

Verified properties include ceiling rejection, native checks, no cache/bid
effects during preview, safely mocked execution flow, cancellation, duplicate
handling, bounded paging/cooldown and real Trader UI integration.

**Still required before enabling a real-purchase release:** longer validation of
full-pool reliability under actual native response limits, and complete live
profitability/budget behavior with the intended settings
before enabling any real execution. A 3,540–3,600-second duration is only a
candidate window, not proof of listing creation time. Native rating defaults
(`ovrMin`/`ovrMax`) are preserved and reported as potential coverage restrictions.

No real purchase, bid, listing mutation or enabling of purchasing was authorized
or performed. Do not substitute synthetic success for these remaining criteria.
