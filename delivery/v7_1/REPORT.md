# v7.1 correction for the supplied live observations

**UNVERIFIED ON LIVE EA. TEST build: purchases and bids remain disabled.**

## What the screenshot establishes

The supplied v7 log records page 1 with HTTP 200, observed `start:0,num:21`, 21 items, minSec 15/maxSec 22; page 2 with HTTP 200, `start:20,num:21`, 21 items, minSec 49/maxSec 57. Both have target=0. V7 then stops with criteria-mutated-during-request. This is genuine evidence of advancing request offsets on the first two searches. It is not evidence that page 50 works, nor does it expose which DTO property changed.

V7 already filtered 3540–3600 seconds. The problem was premature stopping and the deliberate omission of a starting-page probe, not a seconds-to-minutes conversion error. The raw “Found 21” rows were ordinary search results and were never classified as a target in those logs.

## Root causes and code locations

1. **Entire-object mutation check, main webpack module 99007 (`run`)**: the v7 request fingerprint included transport/bookkeeping fields. The same bundled EA search DTO is visibly used with `offset` and `count` in storage pagination (main module 11424); the live market query independently exposes start/num. An offset update can trip v7's entire-object equality even when minBuy, maxBuy, rarity and all other actual filters are unchanged. The exact live mutated field cannot be proven from the screenshot alone.
2. **Starting Search Page intentionally ignored, module 99007 (`create`/`run`)**: v7 always began sequential discovery at 1. It did not test the selected page. That prevented honoring a valid direct-access capability.
3. **Absolute limit versus starting page**: interpreting a page limit of 39 as maximum absolute page 39 conflicts with a requested start of 50. v7.1 explicitly treats it as a discovery-page budget, and labels the setting accordingly (main module 50379). This behavior change is visible and documented.
4. **Empty monitored boundary**: v7 stopped after repeated empty neighbour batches even if a valid target remained on its anchor. v7.1 bounds those batches and skips the known-empty boundary while continuing to monitor valid targets. Rediscovery clears that boundary knowledge when the target moves.

The earlier result-filtering, stable-minimum-price, semantic candidate safety and TEST interlock changes remain. This update modifies only the first-party modules needed for these corrections. Vendor code is untouched. Exact production locations and extracted functions are included in SOURCE_LOCATIONS.tsv and module-extracts/. The complete readable production helper is work/fresh-module.js.

## Criteria fix

Session keys and the before/after filter comparison omit only named pagination properties: offset, count, start, num, page, pageIndex, pageNumber (case-insensitive, allowing leading underscores). All other nonfunction properties still participate in the semantic comparison. Real changes to price, rarity, player IDs, etc. stop safely with field names. The log prints `mutations` and `ignoredTransport` names without property values, credentials or private account data.

This is not a blanket removal of criteria validation. Unknown semantic changes still stop. If the actual live mutation is additional undocumented bookkeeping, a future live log will now identify its name; this build does not silently allow every unknown mutation.

Regression evidence: a fixture loads the actual prior v7 bundle, sets an initial DTO offset=0/count=21, returns the exact supplied time ranges, and changes offset to 20 at page 2. It reproduces the premature stop. The new production path continues through that same modeled mutation. The fixture is a plausible, source-supported reproduction, not proof of the exact hidden live field.

## Starting-page access validation

For start >2, the first two native-service searches calibrate observed offsets. In the screenshot's mapping, stride is 20 despite num=21. The helper learns this from passive request observations. It does not issue a guessed endpoint, start/count parameter or page-to-offset request conversion.

After successful calibration with stable observed request count/size, it passes the configured start once to the existing `services.Item.searchTransferMarket(criteria,page)` call. A successful nonempty probe requires an offset matching the learned mapping, the same observed count/size, and listing identities distinct from baseline results. It then searches from that start and monitors any target band. Starting page 2 is already checked sequentially and does not need a redundant jump probe.

If the probe is empty, replays a baseline page, lacks usable offset evidence, or maps to the wrong observed offset, the helper rejects it as an access proof and logs sequential fallback. It returns to 1 and warms up sequentially toward the configured start; genuine target listings encountered earlier can be monitored immediately. Without calibration evidence, it simply continues sequential warm-up from page 2 instead of performing a blind jump. No sort order or bisection is assumed. Above-window results can guide an adjacent backward probe; below-window results guide an adjacent forward probe. The scan remains bounded.

**Evidence limit:** matching outbound offsets and distinct results support request access; they do not authenticate a server-returned page number. The EA service implementation and authoritative page metadata remain absent. Logs therefore retain `confirmed=unknown`. The code has a safe failure for first-page replay during sequential fallback. It cannot prove a server is honoring pagination if the server returns different wrong-page data without metadata. No live compatibility is claimed.

Rate limiting/authentication and other service errors stop rather than causing an evasion fallback. Existing error middleware and safety stops remain active. A rejected 400/416 start probe can request sequential fallback if existing safety/error middleware has not already cancelled the run.

## Limits and time window

Search Page Limit now means distinct discovery pages from the selected, validated starting region. Start 50 with budget 39 allows a forward scan through page 88. Calibration and necessary sequential warm-up are separate. Warm-up has a protective absolute page cap of 500, honors the original delay/pause/stop rules, and stops at bounded empty tails or unreliable sequential progress. Therefore a sequential fallback can take several minutes; it does not speed up or bypass EA's restrictions.

Only finite numeric remaining seconds in the inclusive interval 3540–3600 are target candidates. Values 15–22, 49–57, 59 or 60 never count as target discovery or reach the candidate handler in Auto-Find. Existing bid middleware has its additional time gate. Existing price/profit/budget/rating/exclusion/safety checks remain intact. Service instance and prototype bid methods still enforce the TEST no-buy interlock.

## Regression and package validation

48 regression tests pass, with no failures or skips. The suite executes production Trader runActions, real pre/post middleware composition with external dependencies mocked, the actual modern result hook, native service wrapper/observable adapter, and relevant production time gates. It includes the prior-v7 reproduction and the following new paths:

- The live time ranges continue through offset/count changes, probe page 50 at observed offset 980, then find 3540–3560 seconds on page 51.
- A valid page-50 target is monitored directly.
- Empty unsupported jumps and baseline replay fall back to sequential navigation and reach 50 even with discovery budget 39.
- Wrong offsets and changing observed page sizes are not accepted as direct access.
- No observable offsets means sequential warm-up, not a guessed jump.
- 59/60 seconds are never a target.
- Semantic rarity/price changes still fail closed.
- A different learned stride (7, with num 13) is handled without hardcoding 20 or 21.
- Above-window start results probe backward; a 39-page budget at start 50 ends explicitly at 88 if nothing qualifies.
- Rate limiting at the starting-page probe stops without a sequential bypass.
- Start=2 avoids redundant probing.
- Known empty boundaries do not terminate monitoring of valid target pages.

The older two-test v6 defect reproduction remains available as a separate baseline. All packaged JavaScript passes syntax checks; ZIP CRC, root manifest, manifest resources, file hashes and an applicable source diff are verified. These checks do not substitute for Chrome loading or an authenticated live EA test.

## Deliverables

FC_Enhancer_v7_1_Pagination_Fix_TEST.zip is the complete extension, manifest version 27.0.1.5. Original v7 ZIP is preserved unchanged. LIVE_TEST.md gives installation, expected logs and stop reasons. TEST_RESULTS.txt and VERIFICATION.json contain execution/package evidence. Changes-from-v7.diff provides the incremental source patch; changes.diff is against the supplied v6 build. The source/test archive contains the prior v7 production helper needed to rerun the new reproduction.
