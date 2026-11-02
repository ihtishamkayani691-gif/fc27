# Install and operate UNIVERSAL FINAL

Version **27.0.6.0**. Purchasing starts OFF. Existing TEST/RC archives remain available for rollback.

1. Extract `FC_Enhancer_v8_UNIVERSAL_FINAL.zip` into its own permanent folder. Disable other FC Enhancer copies in this Chrome profile. In `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the folder containing manifest.json. Verify version **27.0.6.0**.
2. Reload the official EA Web App and sign in directly. Open Trader. In Universal controls, select a rarity by name. The list comes from native metadata; unavailable entries are disabled. Refresh native rarities when needed; reload EA if its cache has expired. Incompatible native APIs require an extension update.
3. Set your maximum snipe price, minimum estimated net profit, maximum per purchase, total budget, purchase count, additional costs and inventory restriction. **Save settings for this rarity** saves only that rarity's limits. New/renamed/changed-ID rarities do not inherit spending limits. Purchase permission is never saved.
4. Explicitly enable **Use native dynamic Buy Now pricing** for valuation. This does not enable buying. Existing native safety rules and modifiers remain enforced. The review now refuses to start if this rule is off instead of scanning without a valid profitability configuration.
5. For read-only discovery, keep **Enable purchases for this session** OFF and use **Start universal discovery**. Use Stop or Emergency purchase disable. The latter prevents new purchase submissions while discovery may continue. Reload and restart keep purchase mode OFF.
6. Future automatic purchase sessions require explicit session enablement and valid limits. Initial development acceptance must use the controlled one-purchase review and a separately approved exact transaction first. Do not treat installing this build or development instructions as authorization to spend.

## Initial real acceptance remains pending

Hard limits:maximum Buy Now 100,000 coins; minimum estimated net profit 15,000; total test expenditure 100,000; maximum one real purchase. Do not lower these requirements to force a result.

Open **Controlled one-purchase acceptance test**, set count 1, and choose **Prepare one-purchase review (no buying)**. It values at most three candidates within a bounded review window. It holds any later approved test item unassigned and does not auto-sell or move it. The review retains each rejection independently of why scanning ended.

Only a qualifying review can show READY. It displays the exact card/rarity/trade, BIN, native comparable evidence, estimated profit/fee/costs, available coins, remaining test budget and inventory verification. Obtain explicit approval of that exact transaction before checking **I approve this exact one-purchase acceptance test** and pressing **Execute the approved one-purchase test**. These controls have not been activated against EA during this task.

Approval is short-lived. Listing identity/price, valuation, coins, inventory, budget and permission are checked again. Sold/stale/changed listings are rejected; another card is never substituted. At most one approved transaction can run; purchasing stops afterward. Never place bids or blindly retry an uncertain result.

Current comparable asks must include at least three distinct exact-rarity/definition listings, excluding the target, with evidence≤15 seconds old. Profit subtracts a conservatively rounded 5% sale fee and configured additional costs. Asking prices do not guarantee a sale or realized profit. Extra rate-spaced valuation reads can make another discovery candidate stale; it is then rejected.

Unknown transactions persist in the journal. Stop, wait for the native request to settle and use explicit reconciliation. Exact native ownership and coin evidence must agree. Late-confirmed items may require manual handling. Never clear the journal to force a retry.

See ACCEPTANCE.md, DIAGNOSIS.json and VERIFICATION.json for actual results. This final delivery does not claim full production readiness.
