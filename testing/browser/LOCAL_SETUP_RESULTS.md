# Local Windows development verification

This is the historical initial offline setup report from 2026-11-01.
Subsequent authorized production Trader and authenticated market-read validation
is documented in `V8_PRODUCTION_STATUS.md`; the no-EA statements below describe
the initial setup only.

Verified checkout: `../../`, branch `dev/v8-browser-testing`, commit
`66d12bc13c96c48daf26fe05d4c43a8e8cd588b1`, origin
`https://github.com/ihtishamkayani691-gif/fc27.git`.
The original downloaded folder had no `.git` directory. All 79 tracked files
match the requested branch after normalizing CRLF. Development continues in
the sibling `verified-checkout` clone; the downloaded source was preserved.

Installed: Git 2.56.0.windows.4, Node.js 24.12.0, npm 11.6.2,
Chrome 156.0.8078.79, Codex CLI 0.166.0-alpha.5.1.
Official npm development dependencies installed and locked; audit: zero vulnerabilities.

| Verification | Result |
| --- | --- |
| v8 planner, safety, integration and failed-build regression | 35 passed |
| Offline evaluator | 47 passed |
| Archived production baseline | 2 passed |
| Archived v7.2 regressions | 74 passed |
| Existing production logger browser fixture | 12 checks passed |
| v8 planner → native safety → production logger browser fixture | 17 checks passed |
| Unpacked Chrome registration, assets and installed integration page | 6 checks passed |
| v8 integration checks executed inside the installed extension | 7 passed |
| Playwright MCP initialization, discovery, browser tabs | Passed, 25 tools |
| Chrome DevTools MCP initialization, discovery, list pages | Passed, 37 tools |

Browser reports: `LOCAL_LOGGER_RESULTS.json`, `LOCAL_V8_RENDERER.json`,
`LOCAL_V8_REGISTRATION.json`, `LOCAL_MCP_RESULTS.json`.
Full native output: `../../.local/LOCAL_TEST_OUTPUT.txt`.
Unpacked development bundle: `../../.local/v8-offline-extension`.
Screenshots accompany the renderer reports.

Extension ID: `boffdonfioidojlcpmfnkngipappmcoh`; version `27.0.2.0`.
The service worker was visible at
`chrome-extension://boffdonfioidojlcpmfnkngipappmcoh/background.js`.
Runtime name/version/ID were read from an installed extension page; the worker
target was verified through CDP. The installed `offline-test.html` page also
executed the bundled v8 planner, native read-only safety and production logger
under extension CSP, passing all seven integration checks. Worker-specific
Runtime/Log error monitoring and a full installed EA Trader UI run remain untested.

Both MCP servers were registered globally in Codex, using loopback port 9222.
DevTools usage statistics and CrUX are disabled. Test processes close their own
temporary browsers; `npm.cmd run browser:offline` starts an isolated persistent
headless debugger for subsequent MCP use. Restart Codex to discover newly
registered servers in a fresh tool session.

The original command-line-loading smoke was run and timed out waiting for a
worker. It is inconclusive on this Chrome build. The supported DevTools loading
API subsequently succeeded; the local environment has no reproduced admin-policy
block. No policy was bypassed or altered.

Integration delivered: three v8 factories are assembled into the production
bundle, exercising planned intents, native read-only safety checks, exact trade
ID deduplication, stop/stale-response handling and escaped production log output.
The bundle's manifest only matches the synthetic `.invalid` site, removes all
external host permissions, and preserves original TEST buying interlocks.
The controller accepts explicit offline items and has no request adapter.
The full modern EA-dependent app entrypoints are not executed by the fixture.
The development ZIP is `../../delivery/v8/FC_Enhancer_v8_OFFLINE_Integration_TEST.zip`.
Live request-loop wiring, true market coverage, live freshness and full purchase
safety remain unverified. No EA navigation, market request, purchase or bid was
performed, and no buying setting was enabled.

Official setup references: [Codex MCP](https://developers.openai.com/codex/mcp),
[Playwright MCP](https://github.com/microsoft/playwright-mcp),
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp).
