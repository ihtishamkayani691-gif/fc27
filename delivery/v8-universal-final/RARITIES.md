# Native rarity verification

Source: authenticated EA Web App factories.DataProvider.getItemRarityDP. Native IDs are recorded as evidence; users select names and never need to enter IDs. One bounded market search per currently market-selectable rarity; a 100,000-coin discovery ceiling is not a purchase authorization. Empty results do not prove absence from the market.

| Native name | Native ID | Market selectable | Native query | Returned-card match | Distinct players observed | Simulated complete workflow |
|---|---:|---|---|---|---:|---|
| Common | 0 | Yes | PASS | PASS | 9 | PASS |
| Base Hall of FUT | 9 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Base Hero | 72 | Yes | PASS | PASS | 14 | PASS |
| Base Icon | 12 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Debut International Icon | 160 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Destined for Glory | 22 | Yes | PASS | PASS | 10 | PASS |
| FC Heritage | 103 | Yes | PASS | UNVERIFIED | 0 | PASS |
| FUT Champions | 19 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Future Stars | 71 | Yes | PASS | PASS | 12 | PASS |
| Ones to Watch | 150 | Yes | PASS | UNVERIFIED | 0 | PASS |
| POTM Bundesliga | 42 | No | NATIVE_UNAVAILABLE | UNVERIFIED | 0 | NOT_MARKET_SELECTABLE |
| POTM LALIGA EA SPORTS | 86 | No | NATIVE_UNAVAILABLE | UNVERIFIED | 0 | NOT_MARKET_SELECTABLE |
| POTM LIGA F | 177 | Yes | PASS | UNVERIFIED | 0 | PASS |
| POTM Ligue 1 | 79 | No | NATIVE_UNAVAILABLE | UNVERIFIED | 0 | NOT_MARKET_SELECTABLE |
| POTM Premier League | 43 | No | NATIVE_UNAVAILABLE | UNVERIFIED | 0 | NOT_MARKET_SELECTABLE |
| POTM Serie A | 114 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Showdown | 58 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Showdown Upgrade | 57 | Yes | PASS | UNVERIFIED | 0 | PASS |
| Squad Foundations | 87 | No | NATIVE_UNAVAILABLE | UNVERIFIED | 0 | NOT_MARKET_SELECTABLE |
| Star Performer | 8 | Yes | PASS | PASS | 3 | PASS |
| Team of the Week | 3 | Yes | PASS | PASS | 16 | PASS |
| Ultimate Scream | 151 | Yes | PASS | PASS | 12 | PASS |
| Ultimate Scream Hero | 168 | Yes | PASS | UNVERIFIED | 0 | PASS |

The native metadata did not expose Team of the Year, Team of the Season or Road to the Knockouts under those names in this snapshot. No identifiers were invented for them. They can appear automatically when exposed through compatible native metadata; actual future API compatibility and availability remain unverified.

Future addition/removal/ID change/rename/duplicate-name/expired-metadata/profile-isolation cases pass offline and in the installed fixture. These are simulations of compatible metadata changes, not proof of a future EA deployment.
