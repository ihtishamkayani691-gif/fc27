# FC Enhancer v8 RC1 acceptance

**Release candidate 27.0.3.1**, based on pushed `2c9d672`, branch `dev/v8-browser-testing`. Accepted for further controlled validation, **not declared production-ready**.

## Delivered builds

- Existing locked TEST: `delivery/v8/FC_Enhancer_v8_Trader_Validation_TEST.zip`, unchanged byte-for-byte. SHA-256: `8da6a6d3e2185a57cd5874f03939e22f2eb8df359f37ae66d0bdf5ff0644ede4`.
- Separate RC: `FC_Enhancer_v8_RC1_PURCHASING_OFF_DEFAULT.zip`. SHA-256: `69d4f0330190cb32a4bf1cb1900d962611c0ccda79cb12f4bbdf2e77360f4bdf`. Its 25 files match the tested build exactly; all 12 manifest resource references exist. The RC has a distinct name/version and no inherited extension key or automatic update URL.

Extract either archive and load the folder containing `manifest.json` through **chrome://extensions → Developer mode → Load unpacked**. Disable other FC Enhancer copies in the same profile before using one. The TEST remains permanently locked; the RC requires explicit runtime opt-in. Neither archive includes a browser profile, credentials or a chosen production purchase limit.

## Execution controls

Purchases start **OFF** and cannot be enabled by saved filters, discovery results, reload or synthetic checkbox events. The user must configure a positive snipe maximum, native dynamic pricing, a native card-count limit and a positive RC coin budget, then explicitly check **Enable purchases for next Trader run** while stopped. Native safety limits must remain enabled. No purchase-enabled setting is persisted.

Stop, reload, configuration changes and runtime errors disarm execution. Trader's normal per-search token rotation remains supported; an in-flight attempt still checks its own cancellation token at every final boundary. Automatic discovery retains the existing planner, scope pager, native request adapter and native cadence. The discovery factories are identical to the validated TEST counterparts.

The configured snipe maximum is an absolute ceiling, intersected with stricter native/dynamic prices and the discovery scope. A protected transaction must use the listing's exact BIN price, never a bid. Before the native API, service and matching transport, checks enforce authorization, unchanged configuration, price, remaining funds/budgets, fresh observation, expiry, rarity, exact trade ID, durable pending journal and ownership of the native cache reservation. An exact service permit cannot authorize a second call, a different item/amount, or an unexpected mutation URL/body.

Duplicate IDs persist across reload. A 15-second timeout, uncertain submission or post-purchase failure requires reconciliation and cannot trigger an automatic retry. Known pre-submit rejection can recover on another trade. The guard blocks bids and auctionhouse listing mutations; it is not a general firewall for every inventory operation.

## Verification

`npm test`: **252 tests passed**: 129 v8 (including 37 new RC tests), 47 evaluator, 2 baseline and 74 archived production regression. All pre-existing tests remain passing. Renderer suites and offline, locked TEST and RC installed-extension suites also pass.

Actual native purchase factories **7520, 91414, 83847, 33147 and 30154** were exercised with mocked service/API outcomes. Native won-item/card-budget middleware was also exercised, with purchased items retained unassigned in the fixture. Tests cover success, failure, timeout/late success, duplicates/reload, insufficient coins and budgets, unavailable/unprofitable pricing, expiry/staleness, cancellation, configuration changes and journal/cache races.

Chrome 156 passed **13 RC control/integration checks**, both on the built extension and on the extracted final ZIP: trusted opt-in only, default/reload/Stop disarming, continued control availability after Stop, mocked native success and duplicate/budget rejection. The original Trader lifecycle tests cover native discovery, Stop/restart, discarded late responses and HTTP-error recovery. Independent code review findings were reproduced and fixed with regression tests; re-review found no remaining important findings in those changes.

**No real purchase, bid or EA market request was made during RC preparation.** RC browser testing used fresh offline profiles, blocked HTTP(S) routes and synthetic native APIs. The RC was not installed in the authenticated EA profile. The previous live discovery evidence and locked TEST artifact are preserved.

## What remains unverified

- Real EA purchase transport timing, response semantics and compatibility with this RC's exact permit. Deferred or unexpected transport fails closed.
- Live economic profitability, resale prices/fees, inventory movement and post-purchase/listing effects. Mocked checks do not establish real profit.
- Exhaustive coverage of all eligible players/listings, long live soak behavior and account-specific production acceptance. Remaining duration is not proof of listing creation time.
- Reconciliation of an uncertain real transaction. This RC intentionally offers no automatic unlock or journal-clear shortcut.

Separate authorization and further acceptance are required before real execution. Temporary discovery ceilings, including the earlier 100,000 coins, are not purchase instructions.

Machine-readable evidence: `VERIFICATION.json`, `testing/browser/RC_INSTALLED_RESULTS.json`, `RC_REGISTRATION.json`, `RC_ZIP_INSTALLED_RESULTS.json` and `RC_ZIP_REGISTRATION.json`. Build with `npm run build:v8:rc`; verify the extracted artifact with `node testing/v8/verify-rc-delivery.cjs` after the complete test run.
