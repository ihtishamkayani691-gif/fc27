# FC Enhancer v7.1 TEST — buying and bidding disabled

This supersedes the v7 TEST readme. It is NOT verified on a live EA session.

## Install

Disable the previous extension at chrome://extensions and close old Web App tabs. Extract FC_Enhancer_v7_1_Pagination_Fix_TEST.zip, enable Developer mode, then Load unpacked and select the folder containing manifest.json. Check the name says v7.1 and NO BUYING. Reload the Web App in a new tab. Both normal purchases and bids are blocked at the service instance and prototype; restore the previous extension and reload to resume ordinary manual trading.

## Your settings

Use broad Ultimate Scream rarity with no named player; Auto-Find on; Starting Search Page 50; Search Page Limit 39; your intended maximum BIN and safety settings. Keep individual-player Filter Rating rotation off. Select ALL/INFO in the normal Trader log. No F12 is required.

Search Page Limit is now explicitly labeled **pages per discovery**, not maximum absolute page number. Once starting page 50 has passed access validation, budget 39 allows 50 through 88 in a forward scan. If page 50 is above the target window, it instead probes adjacent earlier pages. Early calibration and a necessary sequential warm-up are not charged against this discovery budget. Existing configured wait, pause, stop and error-safety settings remain active. There is also a protective absolute service-page cap of 500.

## Expected progression

1. Page 1, then page 2 are calibration requests when starting page is greater than 2. Near-expiring rows here are NOT target discovery. `target=0`, `targetSec=3540-3600` and `mode=VALIDATING_ACCESS` make that explicit.
2. If numeric request offsets are observable, the build learns their stride. Your screenshot showed start 0 then 20 with num 21. Those observations imply an expected start 980 for a page-50 probe under that same mapping; the program learns this at runtime and never constructs a start/num request or assumes a 21-item stride.
3. It sends one page-50 probe through EA's existing Item service. A successful, nonempty, distinct listing set, matching observed offset and unchanged observed request count/size permits `access=direct-probe-validated`. This validates the observed REQUEST mapping plus corroborating listing identities; it is not authoritative server-page metadata. `confirmed=unknown` remains honest.
4. Empty/replayed/unverifiable probe results cause a logged fallback to page 1 and sequential warm-up to 50. If offsets cannot be observed at all, it continues sequentially after calibration without a blind direct jump. A target genuinely encountered during warm-up can be monitored immediately. A finite empty tail or configured safety stop still ends the run. Do not repeatedly restart after rate limiting.
5. `offset`, `count` and other named pagination-field mutations are reported as `ignoredTransport=...`; they no longer stop a request as a filter change. Actual price/rarity/player/other filter changes still stop with `search-filter-mutated:<field names>`.
6. Only finite numeric `3540 <= expires <= 3600` can produce target candidates. `minSec=49 maxSec=57 target=0` is below the window, not success. `59` and `60` seconds are also excluded.
7. Once found, expect `mode=TARGET_FOUND`, followed by `MONITORING`/`PROBING_NEIGHBOUR`. Both page boundaries are checked, and a disappearing target causes rediscovery. Exclusion filters and existing price/budget/safety middleware still apply. Buying remains DISABLED throughout.

## Useful example sequence (mock fixture, not a live claim)

```
requested=1  offset=0    minSec=15   maxSec=22   target=0  next=2  mode=VALIDATING_ACCESS
requested=2  offset=20   minSec=49   maxSec=57   target=0  next=50 mode=VALIDATING_ACCESS
requested=50 offset=980  minSec=3400 maxSec=3420 target=0  next=51 access=direct-probe-validated
requested=51 offset=1000 minSec=3540 maxSec=3560 target=21 mode=TARGET_FOUND
```

A supported page-50 result already containing target listings is monitored at 50 instead of scanning 51 first. A direct probe is an access test; it is never accepted just because the extension prints page 50.

## Stop reasons

- discovery-page-budget-exhausted: the configured number of distinct discovery pages was inspected without a target.
- empty-first-page / end-or-navigation-unavailable: three successful empty responses exhausted the bounded tail check. This is not proof of an EA restriction.
- service-error with 429/authentication/other service codes: stop, respect EA's restriction, and inspect the preceding error message. No automated bypass or immediate retry loop is added.
- search-filter-mutated:<names>: a real filter changed; values and private data are not logged.
- repeated-listings-across-pages: cannot trust sequential progress because complete listing identities repeated on different pages.
- stale-duration-or-cache: same listing identities and durations persisted beyond 15 seconds; freshness cannot be trusted.
- pre-search-blocked / post-search-blocked: an existing validator or Search Result Threshold blocked the operation; review the preceding normal log without disabling safeguards automatically.

After testing, send the normal [Fresh] lines for pages 1, 2, the starting-page probe/fallback, and the final target or stop decision. Include any mutated FIELD NAMES shown; never send session tokens, cookies or private headers. If the mutation still stops, those field names are necessary to distinguish additional DTO bookkeeping from a genuine filter change.
