# FC Enhancer v8 RC2 acceptance

RC2 **27.0.3.2**, continued from pushed `4e3d8d6` on `dev/v8-browser-testing`.

**Implemented:** a connected automatic Trader workflow, verified through full production-session simulation and installed Chrome. **Not declared production-ready:** no real purchase or bid was made.

## Deliverable

`FC_Enhancer_v8_RC2.zip` contains 26 files matching the tested build byte-for-byte; all 12 manifest resources exist. SHA-256:

`a42b80b7303fad935705dddfff0815e03d58eca9f22f50c645dd3e54c1dea49a`

The locked TEST and RC1 ZIPs are unchanged; their original hashes are checked by the suite and recorded in `VERIFICATION.json`. RC2 has its own name/version and purchasing defaults **OFF after every reload**.

Extract the ZIP, disable other FC Enhancer copies in the same profile, then use **chrome://extensions → Developer mode → Load unpacked** on the folder containing `manifest.json`. Select Ultimate Scream and configure your own maximum. Discovery can run with purchasing OFF. Purchase mode additionally requires native dynamic pricing, a native card-count limit, a positive RC coin budget and a fresh explicit opt-in while stopped. No temporary validation price is a purchase instruction.

## Substantial production changes

- The actual `TraderProcessor.start/runActions` loop now connects discovery, eligibility, the original native purchase middleware/API, ownership/coin confirmation, won-item accounting, continuation and safety Stop. See `WORKFLOW.md` for the trace.
- Confirmed sold listings can continue to the next eligible player. Unknown, inconsistent or timed-out submissions stop Trader and cannot trigger uncontrolled retries.
- A confirmed win requires exact trade/item identity, native ownership and consistent coin evidence. Native card accounting and run spending update once. Explicit reconciliation waits for the entire native/post-purchase pipeline to settle and never re-arms purchases.
- Restart reconciliation can hydrate native unassigned items, watched targets and transfers when the exact DTO is absent from cache. Reads are bounded; failure/restriction stops further reads. Missing authoritative proof remains locked.
- The authenticated read-only check exposed the real `refreshAuctions` contract: `data.itemIds` acknowledges a DTO updated in place. RC2 now supports that observed contract with exact identity checks, rather than relying on the earlier synthetic `data.items` assumption.
- Fixed the real Trader checkbox event-order bug: the document refresh could undo a click before its change handler saw it. RC2 handles trusted input synchronously. Added **Disable purchases now**, outcome counters/history, budget/safety state and explicit reconciliation feedback.
- Critical pricing/state failures now stop the actual Trader rather than quietly leaving an enabled run as a scanner. Malformed truthy success values cannot count as native wins.
- Removed one redundant outer safety preview when purchase mode is enabled. The coordinator preview, original final native middleware, final price/budget checks and exact BIN permit remain enforced. Discovery strategy and native cadence were not replaced.

## Automated and installed validation

**284 tests pass**, retaining all original **252** and adding **32 RC2 tests**: 161 v8, 47 evaluator, 2 baseline and 74 archived regression. Full output: `AUTOMATED_TEST_RESULTS.txt`.

The session suite drives the real production entry point and emits **16 session snapshots**. Cases include multiple automatically discovered players/listings; prices above/below the cap; failed profitability; duplicate trades and ownership; coin and inventory changes; competing buyers; insufficient funds/budgets; malformed search and purchase responses; delayed requests; runtime pricing outage; transaction timeout/late win; Stop during search/purchase; and restart with settled or unresolved journal entries.

External services, authentication/UI prerequisites and rate scheduling are synthetic in these tests. The discovery, eligibility, purchase bridge, native API wrapper and won-item/card-counter decision code are not replaced by a mock sniper. No simulated transaction can reach an EA endpoint.

Chrome 156 passed **11 installed checks** on both the build and extracted ZIP, including worker identity, complete production-session outcomes, native card/coin accounting, visible rarity/price, hard disable, Stop, reload default OFF, and zero offline page network/console errors. The configured **Playwright MCP and Chrome DevTools MCP** independently operated the installed workflow: three simulated attempts, two confirmed owned cards and one confirmed sold listing, then hard disable and Stop. See the `RC2_*RESULTS.json` files under `testing/browser`.

Independent review found and verified fixes for rejection/reconciliation deadlock and reconciliation racing delayed won-item accounting. Final read-only re-review found no important issues in the reviewed changes.

## Authenticated discovery, with an unconditional purchase lock

After direct user sign-in, a temporary RC2 variant used an unconditional TEST execution guard. Its discovery factories match final RC2; reconciliation-only compatibility changes were tested separately. The live variant could not issue purchase permits.

| Test ceiling | Players observed | Fresh qualifying listings | Result |
|---|---:|---:|---|
| 25,000 | 6 | 0 | Clean stop; zero purchase attempts |
| 50,000 | 12 | 1 | Vobian at 49,750, 3,586 seconds remaining; clean stop; zero purchase attempts |

Both sessions retained rarity 151 and no selected player (`defId=[]`), and all qualifying prices respected the configured ceiling. The maximum was cleared to zero afterward and the original locked TEST extension restored. These test ceilings, including the historical 100,000 coins, are not intended purchase limits.

The native read-only acknowledgement, identity types, repository methods and numeric coin representation were also checked. No winning ownership or coin deduction was tested with real money. One cached EA `/akam/` HTTP 404 resource error was observed; no platform/security behavior was altered. Market responses and extension discovery continued successfully.

## Performance

`PERFORMANCE.json` distinguishes real native search samples from synthetic transaction benchmarks. Five passive live search samples measured **33.1–802.8 ms**, median **558.2 ms**.

Installed-browser synthetic medians were approximately: search **3–5 ms**, candidate parsing **below 0.1 ms**, safety **2 ms**, decision **0.1–0.2 ms**, transaction completion **4–5 ms**, and confirmation **2 ms**. Local coordinator failure-disabling time in session simulations was below **0.1 ms**. Exact measurements and sample counts are in the JSON.

These numbers do not establish live purchase latency or win probability. Native rate limits, search timers and post-bid waits are unchanged; the test driver simulates scheduling/waits. Recovery timing measures local disarming/status work, with native confirmation timed separately.

## Remaining genuine production uncertainties

1. Real purchase completion, winning ownership, coin synchronization and transaction latency require separately authorized transaction evidence.
2. Live economic profitability, fees/resale assumptions and inventory/listing side effects are not established by mocks. Existing checks are retained; the guard still blocks auctionhouse listing mutations.
3. Exhaustive coverage of every eligible player/listing and long-duration live soak remain unproven. Remaining duration is a fresh-window observation, not proof of listing creation time.
4. If native inventory/targets/history cannot provide the exact old item/trade and coin proof after restart, reconciliation intentionally remains locked. RC2 does not infer loss, clear uncertainty or retry a purchase.

No credentials are included in the archive or reports. Purchasing remains OFF until an explicit user action; real execution still requires separate authorization and further acceptance.
