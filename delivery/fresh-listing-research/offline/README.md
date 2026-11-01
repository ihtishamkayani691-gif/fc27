# Fresh Listing Offline Evaluator

This is a Node.js research tool, NOT a Chrome extension or autobuyer. It cannot contact EA or execute a purchase/bid. All included market fixtures, player identities, trade IDs and rarity ID 4242 are SYNTHETIC. No real Ultimate Scream mapping or live-success claim is included.

Use Node.js 20+ (24.19.0 tested). No dependencies or npm install are needed.

From the extracted package root:

```
node offline/evaluator.test.cjs
node audit/run-audit.cjs
node offline/cli.cjs offline/fixtures/synthetic-market.json --replay
node offline/cli.cjs offline/fixtures/synthetic-price-crowding.json --replay
```

Save stdout if desired, for example on Windows:

```
node offline/cli.cjs offline/fixtures/synthetic-market.json --replay > result.json
```

Omit --replay to evaluate authorized saved captures at your current system clock. Old captures should fail snapshot-age/freshness checks. With --replay, every snapshot must supply an explicit evaluatedAt; the output is labeled offline replay and cannot establish current market freshness. Invalid input exits 1; invalid/failed snapshots or dedup exhaustion exit 2; otherwise exit 0. A zero exit is only a data-processing result, never live success.

## Input contract

Top level: schemaVersion=1, config, snapshots array. Optional searchCriteria is a plain JSON representation of the existing native DTO for a non-executable price-intersection proposal. Optional groupSize sets conceptual roster partition size. Optional initialState is a previously exported finalSeenState from the same context.

Required config:

- contextId: an opaque market/dataset label, not an account ID or token.
- snipeMaximum: positive integer maximum coins.
- selectedRarityIds: explicit numeric IDs from an authorized, verified mapping for real data. Never assume fixture 4242 or generic promo 55 means Ultimate Scream.
- maxSnapshotAgeSeconds: optional, defaults to 15.
- maxSeenTradeIds: optional, defaults to 50000; reaching capacity halts rather than forgetting IDs.
- roster: optional object with asOf timestamp and players [{definitionId, rarityId, name}]. Completeness is not independently verified by the tool.
- rarityMappingProvenance: synthetic for fixtures; otherwise reported as user-supplied/unverified.

Every snapshot requires capturedAt, format, status, response. Use timezone-qualified ISO timestamps. observedRequestCount is optional numeric metadata, not a universal page size. sourceStage may be before-client-filter or after-client-filter; unknown is allowed and explicit. criteria.playerDefinitionIds is an OFFLINE full-card scope, not a native multi-ID API parameter. Empty/absent means broad scope.

Formats:

1. normalized: response.listings holds plain objects with tradeId, definitionId, rarityId, playerName (optional), itemType="player", remainingSeconds, buyNowPrice, currentBid, tradeState="active".
2. ea-rest: response.auctionInfo holds auction fields tradeId/expires/buyNowPrice/currentBid/tradeState, plus itemData.resourceId/cardsubtypeid/itemType/name.
3. fc-model: response.items holds serialized definitionId/rareflag/type/name or _staticData.name, plus _auction.tradeId/expires/buyNowPrice/currentBid/tradeState or _tradeState. No model functions/getters are invoked.

Use quoted decimal trade IDs if they can exceed JavaScript's safe integer range. Do not include authentication/session headers, cookies or secrets. Unknown response properties are not emitted, but best practice is to exclude them before supplying the file.

## Meaning of output

newlyDiscovered means not seen by this evaluator's ledger before, not authoritative market creation time. remainingSeconds subtracts capture age. snipeEligible means the listed OFFLINE checks passed, with originalSafetyPending=true and purchaseAuthorized=false. The original live price/profit/balance/budget/ownership/purchase safety middleware is not executed here and must remain a separate gate in any later approved integration.

The evaluator deduplicates trade IDs, not player IDs: multiple separate trades for the same player can each be new. Exported seen state is per context. Switching the price ceiling does not make an old trade newly listed again. Raw or rejected rows with a valid trade ID can enter the ledger, so repaired/redelivered data for the same trade remains a duplicate. No expiry-based eviction is guessed.

Possible crowding uses returned count versus supplied request capacity. A non-saturated or empty result does not prove completeness. Group plans cover only the supplied roster and generate no executable native requests. Query intent, observed identities and complete coverage are separate. Fresh selected-rarity cards outside an incomplete roster remain visible in broad scope, with a warning.

Source/API representation references are historical/community evidence. See RESEARCH_REPORT.md in the package root for the production audit, conflicts, proposed architecture and explicit live-unverified list.
