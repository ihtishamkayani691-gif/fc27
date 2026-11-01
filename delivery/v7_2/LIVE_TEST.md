# v7.2 Pagination Recovery TEST — exact live test procedure

**Buying and bidding remain disabled. No live EA success is claimed.** This readme supersedes the older v6/v7/v7.1 instructions. Manifest version: 27.0.1.6.

## Install

Disable previous FC Enhancer versions at chrome://extensions and close existing EA Web App tabs. Extract FC_Enhancer_v7_2_Pagination_Recovery_TEST.zip. Enable Chrome Developer mode, select Load unpacked, and select the directory containing manifest.json. Confirm the extension name includes v7.2 Recovery TEST (NO BUYING). Open a new Web App tab. Manual purchases/bids are also intentionally blocked by the TEST service interlocks. Restore your old extension and reload the tab for ordinary trading.

## Use your existing settings

Use the broad Ultimate Scream player filter with no selected player, Auto-Find ON, Starting Search Page 20, Search Page Limit 39, random minima OFF, your 400,000 maximum BIN and existing safety settings. Do not disable safety limits or change Starting Search Page as a workaround. Select ALL/INFO in the normal Trader log. No F12 is required.

A single selected SCREAM filter is retained, rather than reloaded from disk every few searches. Its current rarity/player/price criteria are not removed. If you selected multiple saved filters, automatic rotation is deferred during active discovery/warm-up. It can resume once a target is found; ordinary non-Auto-Find filter rotation is preserved.

## Expected sequence when the direct page-20 probe is empty

These are EXPECTATIONS, not a claim of live observations:

```
requested=1  state=CALIBRATE_BASELINE nextState=CALIBRATE_PAGE2 nextRequested=2
requested=2  state=CALIBRATE_PAGE2    nextState=PROBE_START     nextRequested=20
requested=20 state=PROBE_START count=0 emptyClass=successful-empty-inconclusive
             nextState=SEQUENTIAL_WARMUP nextRequested=1 directProbeFailed=true warmupTo=20
requested=1  state=SEQUENTIAL_WARMUP nextRequested=2 directProbeFailed=true warmupTo=20
requested=2  state=SEQUENTIAL_WARMUP nextRequested=3 directProbeFailed=true warmupTo=20
requested=3  state=SEQUENTIAL_WARMUP nextRequested=4 directProbeFailed=true warmupTo=20
requested=4  state=SEQUENTIAL_WARMUP nextRequested=5 directProbeFailed=true warmupTo=20
```

At warm-up page 20, if populated, the log adds `comparison=direct-empty-sequential-populated-time-varying-evidence`. This supports a direct/sequential difference, but market changes over time remain an alternative explanation. If all returned durations are below 3540, discovery continues. If a target was actually found before 20 during sequential warm-up, it can be monitored immediately.

A successful starting-page probe skips warm-up and keeps the existing monitored-page/boundary behavior. `access=direct-probe-validated` means the observed request mapping and listing identities passed checks; it is NOT authoritative server-page confirmation. `confirmed=unknown` remains truthful.

## What constitutes progress

- Check requested, observed offset/count and HTTP together. In your supplied trace they were 0/20/380 with num=21. Those are request observations, not proof of a returned page.
- Raw count and filteredCount separate available service results from client exclusions. `count=0` after HTTP 200 remains inconclusive.
- Different complete listing identities on new requested pages support progress. Identity values are not printed. `overlapPrevious=1` on adjacent 21-result pages would support a boundary overlap; no live overlap or universal 21-result page size is assumed.
- `progress=new-requested-page-with-distinct-listings` is corroborating evidence. No observable network request leaves offset/count unknown; it does not silently become a confirmed server page.
- `state=SEQUENTIAL_WARMUP` must stay in warm-up with directProbeFailed=true after a failed probe. It must not silently recalibrate/probe again.
- Every reset or restoration includes resetReason and resetSource. `processor-pointer-restored` and `controller-rebound-context-preserved` preserve warm-up rather than starting a new calibration.

## Target and monitoring

Only `3540 <= remainingSeconds <= 3600` qualifies. `minSec=41 maxSec=50 target=0` and 59-second cards are NOT a successful discovery. `3559` seconds qualifies. Expect TARGET_FOUND, then MONITORING/PROBING_NEIGHBOUR, with target pages and both boundaries revisited. A moving window can trigger `window-moved-rescan`.

`eligible` / `eligibleAfterClientFilters` count time-qualified cards after client exclusion filters. They are NOT a count of cards passing every pricing/budget safety check. `safetyEvaluation=original-middleware-pending` makes the distinction explicit; the original bid middleware evaluates those conditions afterward, and the TEST service block prevents purchases/bids regardless.

Search Page Limit is a distinct discovery-page budget, not a maximum absolute page number. Calibration and sequential warm-up retain the v7.1 behavior and are separate from the budget. Existing wait, pause, stop and error settings remain active. There is a protective absolute page cap of 500.

## Specific stop diagnoses

- observed-sequential-request-offset-mismatch: an observed sequential request did not match the previously observed mapping. The internal page counter is not accepted as progress.
- repeated-listings-across-pages: complete listing sets repeat on different requested pages. Pagination progress is unreliable; not proof of intentional EA blocking.
- end-or-navigation-unavailable: three successful empty responses on the sequential tail. Could be market depth, navigation/context or an earlier response modifier. This is inconclusive, not a claim that EA disallows automation.
- discovery-progress-watchdog:no-new-valid-page-in-12-requests: discovery keeps revisiting without a new accepted page in that search context. recentPages shows the bounded trace. Monitoring refreshes are exempt.
- search-context-churn-limit: more than eight search contexts appeared in one run. Inspect resetSource, resetReason and filterDecision instead of restarting repeatedly.
- service-error with 429/authentication/other codes: respect EA's restriction. No automatic bypass/restart loop is added.
- search-context-changed-while-awaiting-response: a real controller/filter change occurred while a request was in flight; stale candidates were discarded.
- search-filter-mutated:<names>: request filters changed. Named pagination DTO fields remain excluded from this semantic check.
- discovery-page-budget-exhausted, stale-duration-or-cache, pre-search-blocked, post-search-blocked: explicit scope/cache/original-validator conditions. Do not disable safeguards merely to suppress these messages.

## Send back exactly this evidence

Use the normal Trader log, not F12. Send:

1. Initialization/reset lines and [Fresh] request lines for 1, 2, 20 and the following 1, 2, 3, 4, 5.
2. Any resetReason/resetSource or filterDecision around that boundary, plus ordinary “Switching to … Filter” messages if present.
3. The first populated later page, or all three empty tail responses and the final stop reason.
4. If sequential page 20 is reached, its [Fresh] line for comparison with the earlier direct page-20 line.
5. If the target is found, several subsequent MONITORING/PROBING_NEIGHBOUR lines.

Stop manually once a short useful trace is collected. Never send cookies, tokens, headers or session/account identifiers. Passing the automated tests does not establish live acceptance: later-page retrieval and ultimately sustained 3540–3600-second results still require this live evidence.
