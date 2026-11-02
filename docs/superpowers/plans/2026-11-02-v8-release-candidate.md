# V8 Release Candidate Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, with a final independent review.

**Goal:** Deliver a separate, default-disabled RC with a fully mocked native purchase path, preserving pushed 2c9d672 and its locked TEST ZIP.

**Architecture:** Derive the RC from the tested bundle without changing discovery/planning. Replace only RC purchase, execution-guard and control factories. Keep the TEST archive byte-identical. Purchases require a fresh trusted user checkbox action, explicit maximum, native dynamic pricing/card limits and a positive per-run coin budget. Stop, reload, errors and configuration changes disarm. A durable transaction journal prevents duplicate/retry execution across reload; uncertain outcomes fail closed without an automatic reconciliation bypass.

**Tech stack:** Existing Node CJS factory build, native Trader middleware/orchestrator, Playwright offline installed-extension tests.

**Spec:** User's ten-point release-candidate request in this chat; this document records the implementation choices delegated to us.

## Global constraints

- No real purchases, bids or EA market calls during RC work. All RC browser tests use an isolated offline Chrome profile.
- Preserve TEST ZIP SHA-256 8da6a6d3e2185a57cd5874f03939e22f2eb8df359f37ae66d0bdf5ff0644ede4.
- Keep native discovery, rarity 151/all-player criteria and cadence unchanged.
- Work in the existing dedicated development checkout on dev/v8-browser-testing, as requested; do not reset/amend either baseline.
- RC purchasing disabled on initialization, reload, Stop/error and configuration changes; saved filters cannot arm it.

## Review focus

- Awaited middleware can outlive authorization, changed caps, balances or freshness: recheck at native API and service/transport boundaries.
- A hung transaction must time out without unlocking a possibly submitted purchase.
- A late success after Stop/timeout must not create a second purchase or silently resume.
- Native cache reservation is not an external duplicate; permit only this transaction's own reservation.
- A corrupt/unavailable journal must disable execution; reload cannot clear uncertainty or persisted duplicate IDs.

## Tasks

1. **RC coordinator (new src/rc-execution.cjs and tests/rc-execution.test.cjs):** RED tests for default disable, explicit arming, authoritative cap, native profitability/budgets, success, pre-submit rejection, unknown failure, timeout, duplicates/reload and stop/config races. Implement `createExecution({storage,preview,readBalance,guard,now,timeoutMs})` with `arm/disarm/status/execute/beginNativeTransaction/recordNativeOutcome`. GREEN targeted tests.
2. **RC guarded native integration (new rc-execution-guard.js, rc-purchase-bridge.js, rc-controls.js, build-rc.cjs and native tests):** RED actual factory-path tests with stubbed native API, gate service calls with a single exact BIN permit and deny all unrelated mutations. Bind final preflight to the synchronous service invocation; reject mismatched URLs/bodies. Controls arm only from trusted input, never persistence. Disarm at native Stop/error and show actual RC status. GREEN actual pipeline, guard and lifecycle tests. Preserve discovery source except RC status/control lifecycle additions.
3. **Verification/distribution:** Extend `npm test` to build/test RC and install it offline alongside existing suites. Verify disabled control defaults and reload behavior in the installed extension, with intercepted synthetic EA fixture only. Package RC separately; verify extraction/resources/hashes and original TEST hash. Write concise RC acceptance/unverified report, run complete suite, independent review, commit/push descendant, verify remote SHA.

## Execution ledger

- Plan reviewed against all ten user requirements. Ruling: no new live discovery research/session is needed; previous validation is preserved and current task forbids real transactions.
- Ruling: the RC opt-in is ephemeral per run, rather than a persisted checkbox, to prevent saved filters/reload from arming purchases accidentally.
- Ruling: unknown native outcomes require reconciliation outside this RC; no unsafe automatic-clear control will be added.
- Task 1 complete: core red/green coverage includes 17 coordinator tests, with durable deduplication and timeout locking. Corrected a test fixture passing native safe settings as a mock success boolean; no production behavior was changed to accommodate that mistake.
- Task 2 integration implemented: RC derives from the original bundle; actual native factories 7520/83847/33147/30154 execute against mocks. Guard tests pass and original Trader lifecycle tests cover Stop/restart and HTTP-error recovery. Independent read-only safety review dispatched.
- Installed RC: 12 Chrome checks pass, including trusted opt-in, refusal of synthetic/saved flags, actual native mocked win, duplicate/budget rejection, Stop and reload disarming. All browser tests are offline, proxy-blocked and reject HTTP(S) routes.
- Independent review found four gaps (journal final check, cache ownership, unexpected transport mutation and preview error disarming). All reproduced RED and fixed GREEN; re-review found no remaining important issues.
- Ruling: native 61400 rotates cancellation tokens every search cycle. Authorization remains per user-enabled run, while each transaction captures and checks its own token; Stop/endRun always disarms. Regression confirms continued execution over distinct cycles and rejection of in-flight rotation.
- Native Stop changes isStarted after endRun. An asynchronous control refresh now reflects the completed Stop; installed regression proves controls can be explicitly re-enabled afterward. Unsafe native safety-limit disabling prevents arming.
- Final verification: npm test passes 252 tests plus renderer/installed suites. RC ZIP extraction passes both registration and all 13 installed RC checks. All 25 extracted files match the tested build; the locked TEST ZIP retains its original SHA-256.
- Task 3 complete pending final commit/push: acceptance and machine-readable verification distinguish mocked coverage from unverified real transaction behavior; no production-readiness claim.
