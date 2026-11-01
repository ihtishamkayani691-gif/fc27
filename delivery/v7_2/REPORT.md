# FC Enhancer v7.2 — pagination recovery investigation

**Status: focused production integration correction and diagnostic TEST build. Buying/bidding disabled. No authenticated EA session or live Chrome execution was available; live acceptance remains unproven.**

## 1. Exact inspected build and evidence boundary

Inspected the actual v7.1 ZIP already delivered in the connected repository, not just development helper files:

- Filename: FC_Enhancer_v7_1_Pagination_Fix_TEST.zip
- Size: 1,788,252 bytes
- SHA-256: 4ac783f12d3d516bbf59567fe6e73633cfed3d02d4c993353d1778ae21691b7e
- Manifest version: 27.0.1.5

The ZIP's main.js and index.js match the inspected v7.1 production files byte-for-byte. Verified webpack modules 99007 (Auto-Find), 50379 (setting), 30501 (test interlocks) and the modern index.js pre-filter capture hook. Native EA Item service/controller implementations are not present in main.js, index.js or vendor.js. They are external globals supplied by the live Web App. There is no captured authenticated EA response body or native service implementation in the supplied material.

The supplied live trace proves HTTP 200, service-level counts 21/21/0 and observed request offsets 0/20/380 for requested pages 1/2/20. It proves neither arbitrary-page support nor an endless loop. In particular, the final return to 1 is the programmed sequential fallback, not itself evidence of a defect.

## 2. First reproduction result: the fallback itself persists in stable v7.1

Before editing navigation code, extended the reported prefix through the actual v7.1 Trader loop, filter middleware, filter loader/store update, service wrapper and observable adapter, with EA/database/UI dependencies mocked:

```
v7.1 stable single SCREAM:
1 -> 2 -> 20(empty) -> 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

The fixture reproduces the exact 44–51s and 41–50s time ranges, HTTP 200, num 21 and offsets 0/20/380, then models a service accepting adjacent sequential pages. It includes a real scheduled same-SCREAM filter reload. The fallback remains warmup=true, accessStage=DISCOVERY; that reload does not inherently reset the navigator when criteria/settings remain equal.

**Therefore the provided live trace is not enough to say recovery repeatedly resets.** The actual reason the user's direct page 20 is empty remains unresolved. The test demonstrates what the current production functions do under the stated mocked service behavior, not what EA does after page 2 in the user's session.

All captured traces in TRACE_EVIDENCE.json are prominently marked MOCKED EA responses. No synthetic trace is represented as live evidence.

## 3. Complete ownership and execution trace

```
TraderController.init (83067) -> TraderProcessor.setControllerInstance (61400)
  UI filter selection -> viewmodel.resetSearch -> loadFiter
  -> FilterHandler.loadFilter (17820)
     Object.assign(viewmodel.searchCriteria, saved.criteria)
     updateTraderSetting for buy/sell/search and shared settings
     custom_rating.setValue, changesMade=false

TraderProcessor.start -> timer -> runActions (61400)
  -> runAutoActionsMiddlewares (47751)
     clearLogs (36639)
     switchFilterIfRequired (875)
       scheduled saved-filter rotation/reload; nextPageNumber=1
       -> FilterHandler.loadFilter (17820)
  -> controller.viewmodel.searchCriteria
  -> fresh.run (99007)
     derive effective multiple-rarity criteria and semantic session key
     choose persisted recovery state; set requested page/cache alias
     construct marked request DTO copy
  -> BackGroundTransferOrchestrator (51171)
  -> searchMarketBG (65757)
     pre-search middleware (1098): validators, rating helpers,
       scoped minimum-price stepping (85462), search count
     -> export API -> searchTransferMarket (33147)
        page <= 1: clearTransferMarketCache
        services.Item.searchTransferMarket(criteria,page)
        -> extension overrides (30501, index CXe; installation-order dependent)
        -> external EA Item service (not bundled)
        -> existing native request; passive XHR/fetch observations only
     observableToPromise (83195): success/data/error normalization
     raw snapshot before index RXe filtering, when available
     post-search middleware (4364): search log (65685/51477),
       per-filter count (55503), no-op v6 page middleware (80966),
       rating reset, existing raw-result threshold, optional price fetching
  -> fresh.process/advance -> existing next-page choice and time window
  -> original transfer-result, price/bid/safety chain (7520/83847 etc.)
     -> TEST instance/prototype bid interlocks prevent native purchase/bid
  -> original bot pause/stop checks and transfer-list/watch-list handling
```

Exact production module extracts and source offsets/line locations accompany the report. The readable production helper is work/fresh-module.js; rotation change is work/filter-rotation-module.js; request response adapter is work/search-module.js.

### Who can modify what

| Path | Actual effect and recovery relevance |
|---|---|
| 99007.run/create/process/advance | Owns requested page, anchor, warm-up, access/probe state, criterion fingerprint and discovery budget. |
| 61400.runActions | Owns async cycle and calls the navigator; v7.1 set its operation lock too late. |
| 61400.setControllerInstance | Rebinds controller. v7.2 records this lifecycle event, preserving equal-context recovery. |
| 61400.stop | Clears processor pointer; v7.2 explicitly ends the shared run ledger. |
| 61400.resetPageNumber | Clears pointer only when !isStarted, otherwise resynchronizes cache.nextPageNumber with navigator state. |
| setPauseValues/setStopValues/resume | Call resetPageNumber; an active pause/resume does not automatically recreate the navigator. |
| 875.switchFilterIfRequired | Before each cycle, can choose/reload a filter and write nextPageNumber=1. |
| 17820.loadFilter / 78017.updateTraderSetting | Assign saved criteria and merge saved buy/sell/search/shared settings. Can overwrite start/budget/price settings and change the semantic session key. Loading alone does not call controller.resetSearch. |
| 83067 filter dropdown/reset handlers | Explicit user selection calls viewmodel.resetSearch and filter loading; distinct from a harmless scheduled assignment. |
| 55503 | Increments currentFilterRunCount after a successful search, enabling later scheduled reload/rotation. |
| 80966 | Actual v7.1 body is a no-op. It cannot independently advance/reset this navigator. |
| 85462 | Price stepping is skipped only on marked Auto-Find DTOs; original behavior remains for other searches. |
| 33147 | Forwards the service page unchanged; clears cache only for page <=1. It does not construct an offset. |
| External EA Item service | Constructs/mutates native pagination fields. Its implementation/session semantics are unavailable here. |
| 30501 / index CXe/RXe | Enhance search criteria/results; scoped raw capture prevents hidden-item exclusions defining the navigator's raw count. |
| 93519 standard results-controller override | Separate controller refresh may change minBid, clear cache and call _requestItems(currentPageIndex). This is not the Trader's direct background loop; external controller implementation is absent. |
| Other price/storage/search helpers | Can use the shared Item service/cache. Ambiguous passive observations remain labeled ambiguous. |

A new marked DTO copy IS made every Auto-Find request. In v7.1, navigator state is on TraderProcessor, not that DTO, so DTO recreation alone does not recreate the navigator. No localStorage anchor is used in v7.1 or v7.2. Whether EA's external native service keys search context by DTO identity is still unknown; no speculative identity rewrite was introduced.

## 4. Demonstrated integration defects and focused corrections

### A. Filter rotation can starve discovery

Cause: 47751 invokes 875 before every search. 55503 increments the per-filter count afterward. With two saved filters and a one-search rotation interval, 875 changes the current filter every cycle; 17820 reloads criteria/settings; 99007 sees a new session key and starts calibration again.

Actual v7.1 functions reproduce eight consecutive page-1 searches under this configuration. This is a confirmed interference path, **not proof that the user's single-SCREAM trace used multiple filters**. A single selected filter can also be needlessly reloaded, overwriting active settings with saved ones; if saved settings differ, the context genuinely changes. Equal-value assignment is harmless and is tested separately.

Correction: retain a single already-active SCREAM filter without scheduled reloading, and defer automatic multi-filter rotation while discovery/warm-up is active and bounded. Preserve the filter and current broad search criteria. Once a target is found, original rotation may proceed; explicit user filter loads and non-Auto-Find rotation remain supported. Legitimate different markets have separate progress identities and can each reach later pages.

Tests: old actual multi-filter rotation starvation; new sequential recovery with real 875/17820/78017; saved stale settings cannot undo start/budget; unchanged criteria fingerprint; legitimate post-target rotation; non-Auto-Find original behavior.

### B. Async operation lock is acquired after the first await

Cause: v7.1 checks isOperationInProgress, awaits runAutoActionsMiddlewares, and only later sets the flag. Two invocations can both pass the guard and issue duplicate page-1 requests against the same state. A stop during filter loading can also be followed by a late market request because the old cycle recreates a fresh cancellation token afterward.

Correction: acquire the existing operation lock before awaiting pre-actions, recheck isStarted after that await, and release in finally, including missing-criteria/error exits. A shared-run in-flight guard serializes requests even if a processor is rebound/recreated while sharing Trader data. Late stopped-run responses are discarded and logged.

Tests: old production runActions reproduces [1,1]; new concurrent calls send one request; two processor owners cannot overlap; stop during real async filter loading sends no late request; missing criteria releases the lock.

### C. Recovery lifetime had no protection against pointer/context loss or re-entry

V7.1 normally preserves the processor-owned object. However, an erased processor pointer or repeated genuine context changes can recreate calibration, and there is no persistent per-run failed-probe latch outside that pointer or progress watchdog.

Correction: a WeakMap ledger keyed by the existing shared Trader data object retains full canonical context identities and state. No credentials/localStorage are introduced. Same-context controller or processor rebinding restores recovery and logs why. A failed probe is explicitly latched; even a corrupted attempt to re-enter calibration/probe is redirected to sequential warm-up before issuing another direct probe. Returning to an old context reinitializes its native access from page 1 while retaining its attempted/failed-probe flags. Explicit Stop ends the ledger; a user Start is a new run.

Tests: erase the processor pointer and recreate the criteria on every warm-up tick; recreate processor/controller sharing the data; force PROBE_START after failure; revisit genuine contexts. None silently re-probe the same failed start within that recovery run.

### D. No bounded discovery progress watchdog

Correction: track the last 12 requested pages and accepted distinct-listing progress per full search-context identity. Twelve requests without a new accepted page stop with discovery-progress-watchdog. More than eight contexts per run stop with search-context-churn-limit. Neither a failed probe nor a processor-pointer restoration resets the watchdog. Monitoring refreshes are exempt; explicit target-window rediscovery resets that epoch with a visible reason.

Tests: forced 1/2 warm-up cycling stops; alternating contexts cannot keep resetting calibration forever; legitimate monitoring refreshes and another market's later-page discovery do not false-fail.

### E. Internal page numbers could still hide a wrong sequential request

Correction: when the original page-1/page-2 request mapping was observed, compare later sequential outbound offsets with that observed mapping. A wrong offset stops with observed-sequential-request-offset-mismatch; no outgoing parameter is changed. Without usable wire data, offsets remain unknown and identity/staleness checks provide weaker, explicitly labeled evidence.

Test: the native-adapter mock returns unique page-3 listings but emits the old page-2 offset. New code stops rather than treating the internal page increment as success.

These changes retain the existing v7.1 navigation strategy. No new gallop/bisection/search algorithm or guessed controller API was added.

## 5. Pagination analysis: what is and is not established

The bundled adapter calls services.Item.searchTransferMarket(criteria,page). It forwards page 20 as 20. It does not itself compute 380. The live observation shows EA's current service translated that call into start=380,num=21 after starts 0 and 20. This supports an item-offset mapping with a 20-step stride for those observed requests; it does not prove arbitrary offsets are supported or that the server honored the page.

Twenty-one returned items might include an overlapping boundary/sentinel item, but the live trace contains no listing-ID comparison proving it. v7.2 logs the NUMBER of identical listing identities shared with the preceding adjacent accepted page, never the identities themselves. A mocked 21-item/20-stride boundary-overlap fixture passes without a false replay diagnosis. No universal page size or overlap is hardcoded.

Direct probe 1->2->20 and sequential 1->2->3... use the same existing native service adapter. The direct probe emptiness remains inconclusive: possibilities include market depth, changing market/filter scope, unsupported/stateful access, caching, prior response modifiers or service semantics. Native controller state requirements, continuation/session tokens, clamping and ignored offsets cannot be determined from the absent EA implementation.

New diagnostics compare a failed direct page 20 with a later populated sequential page 20 if it occurs. That is meaningful evidence of differing outcomes, but market movement between requests remains a confounder. A sequential empty tail is stopped after the existing three successful-empty checks and labeled inconclusive. HTTP 200 alone never confirms navigation. Rate limits/authentication errors stop and are not bypassed.

`confirmed=unknown` is retained: outbound request evidence and changing listing identities are not authoritative server-page confirmation. No new EA endpoint, authentication manipulation, direct HTTP market call, rate-limit bypass or undocumented parameter has been introduced.

**Current live support classification: direct jumps UNVERIFIED; sequential progress beyond the supplied prefix UNVERIFIED.** The corrected build must still demonstrate later populated pages in the actual Trader. This report does not assert acceptance criteria have been met live.

## 6. Diagnostics and preserved time/safety behavior

Every completed request logs requested page, observed offset/count, HTTP, raw and filtered counts, minSec/maxSec, target, eligibility after client exclusions, semantic criteria fingerprint, previous/current/next state, next requested page, reason, warm-up target, direct-probe flags, progress/no-progress, recent page trace, reset reason/source, filter decision and direct-versus-sequential comparison. Initializations, controller restoration, explicit stops and latch corrections are separately identified. Optional boolean endOfList metadata is displayed only if actually present; it is not invented or assumed.

Only finite numeric seconds in [3540,3600] qualify. A 59-second value is rejected; 3559 seconds qualifies. Raw 41–50-second searches are not discovery success. Split target pages and moving-window behavior are retained and regression-tested.

`eligible` and `eligibleAfterClientFilters` are time-qualified candidates after modern and legacy client exclusions. They are not a promise that all price/profit/budget conditions passed: the log explicitly says original-middleware-pending. Original safety middleware runs afterward. The v7.2 service instance and prototype TEST interlocks still block all native buying/bidding, including manual actions.

No auth headers, cookies, tokens, query credentials, URLs or private account identifiers are logged. Wire logs retain only selected numeric pagination parameters/status; item identities stay in memory for comparisons and are not printed. The criteria fingerprint and full canonical context are local state; only the fingerprint/field names appear in logs.

## 7. Regression scope and validation

74 regression tests pass, zero failures/skips. They include preserved prior cases plus the actual v7.1 prefix extension, multi-filter starvation and concurrency reproductions; v7.2 sequential recovery, full warm-up to a mocked 3559-second target, lifecycle/recreation, re-entry prevention, context churn/watchdog, direct versus sequential mock differences, real request adapter failure paths, empty tails, rate limiting, overlapping boundaries and preserved non-Auto-Find behavior. The older separate two-test v6 defect baseline also passes.

The expanded harness now executes real production modules 61400, 47751, 875, 17820, 78017, 55503, 1098/4364 and relevant validators, 65757, 33147 and 83195. Modern index capture and bid-time/safety-chain tests are also retained. The earlier tests had stubbed auto-actions/filter rotation; that coverage gap is corrected. External EA Item service/network responses, DB data/UI, filter migrations and some unrelated service/notification/pricing dependencies are mocked. This is not a native EA implementation or live Chrome integration test.

All five extension JavaScript files pass node --check. Manifest/resource paths, ZIP root manifest, CRC, tested-file hashes and applicable incremental/source diffs are checked. All unmodified production webpack modules are compared, and vendor.js is unchanged. No general rebuild/toolchain or dependency changes were needed. Existing v7/v7.1 ZIPs are preserved.

## 8. Live acceptance and next evidence needed

Install the v7.2 TEST build and use the same start=20/budget=39/SCREAM settings. Capture normal Trader lines for 1,2,20 and the subsequent 1,2,3,4,5, including any reset/filter events. If the service produces an empty sequential tail, send all three responses and the final diagnostic. If sequential page 20 is reached, compare it to the original direct probe. If target listings appear, send several monitoring/boundary cycles.

A functional Auto-Find success still requires actual sustained 3540–3600-second results. If both direct and sequential native requests remain empty or unreliable, the result is a documented unresolved/finite pagination diagnosis, not a successful feature claim. Credentials should not be sent in chat; the normal log is sufficient for this next diagnostic step.
