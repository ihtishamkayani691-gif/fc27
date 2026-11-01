# Readable v7.1 -> v7.2 patch guide

The exact applicable patch is changes-from-v7_1.diff. Readable actual production code is work/fresh-module.js, work/filter-rotation-module.js and work/search-module.js. Extracted before/after modules and SOURCE_LOCATIONS.tsv locate the bundled implementation.

## TraderProcessor.runActions (main 61400)

```diff
  if (this.isOperationInProgress) return;
  if (this.traderData.cache.filter.changesMade) return this.showUnSavedChanges();
+ this.isOperationInProgress = true;
+ try {
    await runAutoActionsMiddlewares();
+   if (!this.isStarted) return;
    // Existing criteria/orchestrator/search/purchase middleware and TL/WL flow.
+ } finally {
+   this.isOperationInProgress = false;
+ }
```

Errors in pre-actions are logged safely and stop the bot. Existing inner search-error handling remains. Controller rebinding emits a lifecycle event; explicit stop ends the shared recovery ledger.

## Rotation middleware (875)

Use the existing rotation implementation with these guards only:

```js
if (fresh.filterRotationDecision(data, settings) !== 'allow')
  return next(event);
// Keep an already active single filter; defer rotation during discovery.
// Otherwise execute original random/sequential selection, counters,
// cache counter assignment and FilterHandler.loadFilter.
```

The same-filter case is checked after random selection too. Explicit loads remain in the original controller/FilterHandler code. Non-Auto-Find behavior is regression-tested.

## Recovery helper (99007)

- WeakMap keyed by existing Trader data retains canonical contexts across processor-pointer loss/rebinding. No localStorage.
- Failed direct probes latch attempted/failed state. Restoring/revisiting a failed context resumes sequential recovery, not blind re-probing.
- Shared-session in-flight guard prevents two processor owners from issuing overlapping requests.
- Twelve-request progress watchdog excludes monitoring; an eight-context bound diagnoses churn.
- Compare observed sequential offsets against already observed native mapping without changing any request.
- Compare later sequential page data with prior direct-empty evidence, with an explicit time-varying qualifier.
- Detailed state/reset/filter/progress log fields; adjacent identity-overlap counts only, not actual identities.
- Late stopped-run/controller-changed responses cannot become purchase candidates.

## Request response module (65757)

Retains existing native service call, validators, thresholds and error middleware. Only adds safe display of a boolean endOfList flag if the actual DTO includes it. No new endpoint/parameter/parser assumption.

## Preserved

The native service adapter, raw-before-modern-filter hook, profitability/buy-price/bid-price/budget/rating/expiration/cache safety modules, waits, normal stop/pause rules, transfer-list/watch-list modules and vendor bundle remain intact. TEST instance/prototype bid interlocks remain and identify v7.2. Manifest version is 27.0.1.6; permissions and hosts are unchanged.
