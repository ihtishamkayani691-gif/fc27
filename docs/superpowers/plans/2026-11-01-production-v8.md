# Production Trader v8 integration

The user's final objective is an automatic Ultimate Scream sniper, not a
permanent scanner. Current validation must issue no purchases or bids. Real
discovery may use the authenticated native EA UI/service only, retaining native
timers, account protections and error handling. The user signs in directly.

Architecture: route production TraderProcessor's existing Auto-Find branch to
a v8 adapter. Use existing native selected rarity criteria without hardcoded
promo IDs, no named players, and an explicit maximum snipe-price UI field.
The planner constrains native requests and rotates overlapping price scopes
only when native price-step helpers and actual request capacity are observed.
Raw results pass existing client filters, identity/rarity/fresh-window/price
checks, and a preview of the original purchase middleware without its cache
or bid terminal steps. Real execution stays hard-disabled in this TEST build.
Native scheduler and BotController remain in charge; listing/watchlist actions
are skipped during discovery validation to avoid unrelated account actions.

Tasks:
- [x] Write failing adapter tests including production runActions and invalid configuration.
- [x] Add production adapter, native middleware preview, fixed maximum field and builder.
- [x] Verify cancellation, context changes, dedup, ceilings, malformed/errors and native safety.
- [x] Install TEST bundle; inspect real selected rarity metadata and permitted discovery.
- [x] Fix observed failures, rerun regressions and review changes.
- [x] Commit verified changes on dev/v8-browser-testing and package exact tested files.

Acceptance requires real discovery evidence. Synthetic tests or an authenticated
login alone cannot establish all-player coverage or actual new listing creation.
No release that enables real execution is authorized by this plan.

Implementation ledger: native UI selected rarity151 with no named player;
temporary validation maximum100000coins, real execution locked. A save dropdown
refresh race and stop/restart race were each reproduced before repair. Real
price-only results were old; sequential paging was added and then kept
contiguous after interleaved page2 was empty while contiguous pages2/3 were
populated. Every new paging claim remains explicitly incomplete. Transient
emptiness uses cooldown/reprobe; actual access rejection bounds the traversal.
Only new IDs count as page progress. An early, native previous-step upper-boundary
cohort supplements the full price range rather than replacing it. Root traversals
are bounded to 2 pages and leaf traversals to 20, always at the native cadence.
Automatic full-range runs found 5+2 real candidate listings across 3 players without
manual player selection; native preview passed and execution stayed disabled.
The gated purchase bridge now routes to the original orchestrator only under
an injected authorized test policy; every production release gate stays false.
Full regression count: 195 plus browser checks. No credential-bearing browser
state is tracked or packaged. Remaining release acceptance limits are recorded
in testing/browser/V8_PRODUCTION_STATUS.md.
