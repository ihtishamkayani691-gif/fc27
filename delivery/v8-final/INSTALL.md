# FC Enhancer v8 FINAL RC — installation and use

Version 27.0.4.0. This is a release candidate for separately authorized live acceptance, not a production-readiness claim. No real purchase or bid was performed during validation.

1. Preserve your existing TEST/RC copies. Disable other FC Enhancer extensions in this Chrome profile so only one is active.
2. Extract `FC_Enhancer_v8_FINAL_RC.zip` into its own permanent folder. In `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the folder containing `manifest.json`. Verify version **27.0.4.0**.
3. Open the EA Web App, sign in directly, and open Trader. Select **Ultimate Scream** (rarity 151). Leave the individual player selection empty. Enable the existing automatic newest-listing discovery option in Search Settings.
4. Enter **your** maximum snipe price. Configure the existing native Buy/Bid, Safety and inventory rules. Discovery uses the intersection of configured ceilings; a lower native maximum may further restrict results. There is no FINAL 50,000/100,000 purchase default.
5. For discovery only, leave **Enable purchases for this session** OFF, then Start. Stop ends the run. Fresh-window observations and rejection reasons appear in the Trader status/logs.
6. Only after separately authorizing real transactions, enable the native dynamic Buy Now pricing rule and fill every FINAL session field: minimum net profit, maximum coins per purchase, total budget and maximum purchases. Enter any additional per-purchase costs (zero is visible and editable). While stopped, explicitly check **Enable purchases for this session**, then Start. These session limits are not silently saved over your existing settings.
7. **Emergency purchase disable** prevents new submissions immediately while discovery may continue. Stop also disarms purchasing. Fresh sessions, reloads and extension restarts always start with purchase mode OFF. Edits to session limits or search configuration disarm purchasing.

Pricing uses at least three distinct, current, exact-definition native comparable asks, excluding the target, with a maximum evidence age of 15 seconds. The lowest observed comparable ask is an estimate, not a guaranteed sale. Net estimate = reference ask minus conservatively rounded-up 5% sale fee minus purchase price minus configured additional costs. Missing/stale evidence cannot authorize a buy. Discovery and valuation reads share a minimum seven-second interval, plus existing native safety scheduling; this prioritizes safety over speed.

An uncertain transaction disables purchases and persists its trade ID. Stop, wait for any pending request, then use **Reconcile uncertain transaction**. Exact native auction, coin and refreshed item ownership evidence must agree. There are no blind retries. After late-confirmed ownership, the status/history flags **manual item handling required**; review the item directly instead of replaying potentially completed post-purchase mutations. Never erase the transaction journal to force a retry.

Do not enable other purchasing tools, buying or bidding during discovery-only validation. Changing service responses or account restrictions can cause safe pauses; never bypass them.
