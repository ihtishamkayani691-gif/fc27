# FC Enhancer v8 reliability TEST acceptance

Build **27.0.2.2**, validated 2 November 2026. Baseline **6264458** is preserved; development branch: `dev/v8-browser-testing`.

**Accepted for locked discovery testing. Not accepted as a production-ready automatic purchaser.** Real buying and bidding stayed disabled throughout.

## Live discovery

Three separate native Trader sessions used Ultimate Scream rarity **151**, with no individual player selection (`defId=[]`, `maskedDefId=0`). The existing price-scope discovery method and native cadence were retained.

| Temporary test ceiling | Players observed in session | New fresh candidates passing native preview | Prices |
|---|---:|---|---|
| 25,000 | 6 | Laura Pérez, Chong | 25,000 each |
| 50,000 | 14 | Ryerson | 50,000 |
| 75,000 | 16 | Amoura | 75,000 |

All four qualifying listings respected the configured ceiling. Their observed remaining durations were 3,546–3,597 seconds. Every accepted session stopped successfully, retained all-player rarity criteria, and recorded zero mutation attempts. Retained messages from an earlier run cannot stop the current observer; saved TEST filter names are unique, and a mismatched expected ceiling refuses to start discovery.

These ceilings, including the historical 100,000-coin ceiling, **are not purchase instructions**. Trader was left stopped with its active maximum cleared to **zero**.

## Safeguards and integration

| Requirement | Evidence / result |
|---|---|
| Maximum price | Intersected v8, native fixed and configured dynamic ceilings; above-limit fixtures rejected before transaction terminals. |
| Profitability | Native dynamic-price fixtures enforce a stricter derived ceiling and reject unavailable pricing. A fixed ceiling alone is explicitly not proof of profitability. |
| Budgets / coins | Native card-count and per-search attempt limits, explicit monetary-budget fixtures, insufficient coins and unknown balance reject safely. Separate one-item calls share the search budget. |
| Duplicates / expiry / stale data | Exact trade IDs deduplicated; expired items, aged fresh-window observations, responses older than 15 seconds and late responses after Stop rejected. |
| Market errors | Mocked 401, 429, 500 and 503 responses stop safely; a new healthy session can recover. |
| Production purchase integration | Actual native factories 7520, 83847 and 30154 exercised with mocked transaction terminals/API outcomes. Rejected transactions no longer enter the won-item path. BIN limits remain bounded and v8 bidding parameters are zero. |
| Failure recovery | Confirmed pre-submit rejection permits a different trade on a later search, never the same trade. Submitted failures with uncertain outcomes, post-win failures and wins arriving after cancellation lock further routing pending native-state reconciliation. No automatic unlock/retry. |
| Execution lock | Frozen production policy has all three authorization flags false. Locked-path tests cannot even inspect transaction objects. Installed service and fetch/XHR guards also block purchase/bid mutations. |
| Trader display | Actual installed panel shows rarity/name/ID, configured/effective maximum, fresh candidates, rejection counts/reasons, and execution LOCKED; stopped results remain visible. |

## Regression and installable artifact

`npm test`: **215 passing tests** (92 v8, 47 evaluator, 2 baseline, 74 archived production regression), plus renderer fixtures and both installed-extension suites. The final extracted ZIP also registered its worker in local Chrome 156 and passed the installed integration/status checks without runtime errors. Final authenticated Chrome registration confirmed the service interlock, stopped state and zero active ceiling.

`FC_Enhancer_v8_Trader_Validation_TEST.zip`: **24 files** match the tested build byte-for-byte; all **12 manifest resource references** exist. SHA-256:

`8da6a6d3e2185a57cd5874f03939e22f2eb8df359f37ae66d0bdf5ff0644ede4`

Extract to a permanent folder, disable older FC Enhancer copies in that Chrome profile, and use **chrome://extensions → Developer mode → Load unpacked** on the folder containing `manifest.json`. The ZIP includes `V8_TEST_README.txt`; no profile, credentials or preset purchase limit is included.

Evidence: `testing/browser/RELIABILITY_SESSIONS.json`, `RELIABILITY_STATUS.png`, `FINAL_ZIP_REGISTRATION.json`, `FINAL_LIVE_REGISTRATION.json`, and `delivery/v8/VERIFICATION.json`. Re-run artifact checks with `node testing/v8/verify-delivery.cjs` after building/extracting the ZIP and running the suites.

## Remaining production limits

Bounded native pagination does not demonstrate exhaustive coverage of every eligible player or listing. Remaining duration does not prove listing creation time. Profitability, spending limits and transaction recovery were validated with mocks, not real purchases. A future purchase-enabled build still requires the user's chosen price, separate authorization, validated reconciliation, and further production acceptance. This TEST intentionally cannot purchase.
