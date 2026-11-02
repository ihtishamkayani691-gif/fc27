# Universal rarity RC implementation plan

Baseline:394632c, preserved FINAL archive. User requests autonomous implementation; no real spending authorized by this plan.

Design: reuse the current native DataProvider.getItemRarityDP for tradable/all player rarities. Native metadata is the sole source of identifiers and labels. Show unavailable nontradable/ambiguous/missing metadata, validate native selection at every search and purchase boundary. Single selected rarity per run. Preserve existing price-scope and observed-page discovery. Avoid a static promo table or synthetic future IDs in production.

1. Add universal-catalog.cjs with strict native normalization, status/fingerprint and per-rarity profile persistence. Test future addition, removal, rename/ID change, duplicate names/IDs, missing/expired metadata and blank profile isolation before implementing.
2. Build universal-economics/quotes/execution as a separate revision of FINAL factories. Supply selected metadata to execution and exact rarity to price evidence. Test different/zero/new IDs, cross-rarity cache isolation, mismatch rejection and metadata disappearance at final boundary. Keep all FINAL protections and tests unchanged.
3. Add production bridge and controls: native-driven rarity selector, explicit refresh, save/load limits per rarity, blank new profiles, max snipe price and inventory restriction. Trusted selection/enablement only; stopped edits disarm. Integrate with actual native controller, search criteria and session state. Test installed UI reload/config isolation.
4. Derive separate UNIVERSAL27.0.5.0 build, original planner/guard unchanged. Add complete actual-production sessions for every native tradable rarity and synthetic future-rarity metadata cases. Run npm test plus new installed tests/MCP.
5. Under hard lock, enumerate actual native metadata and perform at most bounded rate-spaced native searches per supported rarity. Record exact query/results, empty/mismatched/blocked separately; no exhaustive or future-live claim.
6. Preserve baseline archives, package FC_Enhancer_v8_UNIVERSAL_RC.zip, extract into fresh profile, validate files/resources/default-OFF/production sessions. Review, commit and push. Report remaining unverified live behavior.
7. Prepare first real acceptance only after software validation: require explicit user-approved exact card/trade, price/total budget, one-purchase limit and live-test enablement. No bids. Revalidate all conditions after approval; if stale/sold/mismatched, stop instead of substituting. No spending without this approval.
