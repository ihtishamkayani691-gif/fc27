# FC Fresh Listing Research and Offline Prototype

This package contains research, a production-code audit, and a local JSON evaluator. It is NOT a Chrome extension. No automated EA search or purchase is implemented, enabled, or authorized by this package.

Read RESEARCH_REPORT.md first. PROGRESS.md records completed and blocked work. SOURCE_PROVENANCE.json separates read sources from unverified leads. PENGUBOT_STATUS.md records the historical loader/core-source limitation.

Requirements: Node.js 20+ (24.19.0 tested). No npm dependencies.

```
node offline/evaluator.test.cjs
node audit/run-audit.cjs
node offline/cli.cjs offline/fixtures/synthetic-market.json --replay
```

All bundled market responses, names, trade IDs and rarity ID 4242 are synthetic. They do not demonstrate live success. The replay clock is explicit. See offline/README.md for the saved-response schema, dedup-state import/export, CLI exit codes and limitations.

The 5 audit assertions execute exact extracted FC Enhancer v7.2 production functions with browser/search/purchase dependencies stubbed. The evaluator has 47 independent behavioral tests. Test counts refer to OFFLINE checks. The existing extension and all previously delivered TEST ZIPs remain unchanged.

The two public guide pages and the historical remote PenguBOT core remain blocked by the running network policy. Their content is not described as verified. The saved network-access draft is not applied or published. Any live validation or purchase integration requires a separate user-approved scope.
