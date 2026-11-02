# RC2 production workflow verification

The simulation starts the actual production `TraderProcessor` and calls `runActions`; it does not call a separate mock sniper. Node uses the archived controller harness only to supply external services, user-access/UI prerequisites and deterministic rate scheduling. The installed fixture bundles that same session driver and actual RC2 factory table without `eval`.

| Stage | Production connection | Verification |
|---|---|---|
| Start | Native factory 61400 `start/runActions` | Explicit purchase opt-in while stopped; permissions OFF by default/reload |
| Filter | Native controller criteria, rarity 151, `defId=[]` | Recorded requests retain all-player intent and unchanged maximum |
| Discovery | 99011 → unchanged 99009 planner / 99013 pager / 65757 request adapter | Multiple players and repeated cycles; no manual player/page choice |
| Fresh window | Production candidate loop, observed remaining time 3,540–3,600 seconds | Old, expired and stale candidates rejected |
| Price | User maximum, stricter native/dynamic limit and scope intersection | Final exact BIN check before API, service and transport |
| Profitability / inventory | Original 7520 native middleware, including club ownership and native pricing | Unprofitable or already-owned cards cannot submit |
| Budgets | 99016 and RC2 coordinator 99017 | Funds, run spending, native card count and per-search limits; changes after wins affect subsequent candidates |
| Reservation | Native 91414 and coordinator ownership check | Only this transaction's own cache reservation is exempted; durable exact trade-ID journal |
| Submit | Native 83847 → 33147 → guarded native item service | One exact BIN permit, no bids; strict boolean success parsing |
| Confirm | 99020 native auction refresh + coin reader | Exact acknowledged item/trade, native ownership/closed state and consistent balance; malformed proof fails closed |
| Account | Native 2113 / 65734 / 43301 and coordinator spending | Confirmed purchases counted once; native inventory actions remain subject to their original settings/guards |
| Continue | Same native discovery loop after a confirmed win or sold listing | Multi-player, multi-listing and multi-cycle session tests |
| Stop | Coordinator stop result → adapter failure → native `TraderProcessor.stop` | Insufficient budget/coins, runtime outage and unknown results stop; Stop during in-flight work prevents new attempts |
| Reconcile | Explicit stopped-user action, shared Web Lock, native read hydration and refresh | Wait for the full old pipeline, never retry or re-arm; missing proof stays locked |
| Reload | New runtime permissions, persistent transaction journal | OFF after restart; settled duplicates and unresolved transactions remain protected |

Primary readable sources: `testing/v8/src/rc2-execution.cjs`, `rc2-state.cjs`, `rc2-purchase-bridge.js`, `rc2-controls.js`, and `testing/v8/build-rc2.cjs`.

Evidence: `testing/v8/RC2_SESSION_RESULTS.json`, `testing/browser/RC2_INSTALLED_RESULTS.json`, `RC2_ZIP_INSTALLED_RESULTS.json`, `RC2_MCP_RESULTS.json`, `RC2_LIVE_RESULTS.json` and `RC2_NATIVE_READ_CONTRACT.json`.

External services, access/UI prerequisites and scheduling are synthetic; the connected production decision and purchase code is real. None of the simulated success/failure evidence establishes real purchase acceptance or full-market coverage.
