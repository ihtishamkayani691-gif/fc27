# FC Enhancer browser testing

For the subsequent production Trader integration and authenticated discovery
results, see `V8_PRODUCTION_STATUS.md`. The offline-only limitations and bundle
descriptions below record the earlier setup stage, not the latest v8 build.

## Verified local Windows setup — 2026-11-01

See `LOCAL_SETUP_RESULTS.md` for the actual local run, which supersedes the
cloud-only limitations below. From the verified checkout run:

```powershell
npm.cmd ci --ignore-scripts --registry=https://registry.npmjs.org
npm.cmd test
npm.cmd run test:mcp
npm.cmd run browser:offline
```

The test runner extracts the tracked source archive, builds the offline v8
factory integration and supplies Windows paths automatically. Override
`CHROMIUM_PATH` if Chrome is installed elsewhere. `test:mcp` starts and closes
its own isolated browser on port 9222; stop `browser:offline` first if it is
already using that port. The persistent offline browser blocks HTTP(S) with a
dead proxy and routing. It contains no account data. Stop it with Ctrl+C.

Both MCP servers are registered in the local Codex configuration and were
verified through real MCP initialization, tool discovery and browser inspection.
A newly started Codex session can expose those tools; registering servers does
not inject them into this already-running chat. No sign-in is required.

On local Chrome 156, command-line extension flags produced a worker timeout.
The supported `Extensions.loadUnpacked` debugging API succeeded, with a
registered service-worker target and matching runtime manifest. No administrator
policy was changed. This local result is distinct from the historical cloud
administrator rejection below.

The new test bundle matches only `https://fc-offline-smoke.invalid/*`, removes
external host permissions and does not wire v8 into the live EA Trader loop.
It joins v8 planner and read-only native safety to the real Trader logger for
explicit synthetic replay. This is an offline integration increment, not a
finished live v8 release.
Open the extension's `offline-test.html` resource to run the seven synthetic
integration checks on its installed origin; `npm.cmd test` does this automatically.

## Observed cloud support (2026-11-01)

No Playwright MCP or Chrome DevTools MCP tools are exposed to this ChatGPT session.
Both official npm packages can run their CLI help here; that does not attach an MCP
server to this session. Playwright's Node API launches Chromium 154.0.8037.57.
However, CDP `Extensions.loadUnpacked` returns:

> Loading of unpacked extensions is disabled by the administrator.

The extension has no registered service worker. Background/service-worker logs,
installed-extension UI testing, and complete v8 integration testing are therefore
**blocked**, not passing. Do not change or bypass the administrator policy.

The offline renderer harness runs the exact v7.2 content loader against inert asset
markers and explicitly selected production module factories with mocked dependencies.
It does not execute the EA app or install an extension. The synthetic Trader logger
fixture passes 12 checks. No account, EA navigation, market requests, purchases, or
bids are used. v8 planner and safety modules are development components, not yet an
integrated v8 extension. These results must not be described as a successful v8 UI run.

## Local Windows Codex setup

Use a local Codex CLI session with Node.js 22.12+ and a policy-permitted desktop
Chrome/Chromium installation. This configuration does not add MCP tools to an
already-running ChatGPT cloud conversation.

1. Extract the extension to a stable directory, for example `C:\fc27\extension`.
   Use the completed logging-only TEST build when available; do not assume these
   development components constitute that build.
2. Launch a separate browser profile from PowerShell (adjust executable path):

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 "--user-data-dir=$env:LOCALAPPDATA\FCEnhancerOfflineTest" about:blank
```

3. In that browser open `chrome://extensions`, enable Developer mode, click **Load
   unpacked**, and select the extracted directory. Use manual loading rather than
   relying on command-line extension flags, which some Chrome builds disable. If
   administrator policy blocks loading locally too, ask the administrator for an
   approved environment; do not bypass it. Disable previous FC Enhancer versions.
4. Register these servers in the **local** Codex installation, then restart Codex:

```powershell
codex mcp add playwright -- npx -y @playwright/mcp@0.0.84 --cdp-endpoint http://127.0.0.1:9222
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@1.12.0 --browserUrl http://127.0.0.1:9222 --categoryExtensions
codex mcp list
```

These package versions and connection flags were checked using their actual CLI
help. Run the servers one at a time when testing the same tab to avoid conflicting
commands. The browser debugger must remain bound to loopback. MCP tools can inspect
the browser's data; use this isolated profile without saved credentials initially.
Do not paste passwords, cookies, tokens, or raw authenticated network captures.

## Local offline verification and worker diagnostics

From the repository, install `playwright` locally (`npm install --no-save playwright`)
and point the harness to the extracted extension. In PowerShell:

```powershell
$env:FC_EXTENSION_DIR = 'C:\fc27\extension'
$env:CHROMIUM_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node testing/browser/smoke.cjs $env:FC_EXTENSION_DIR testing/browser/SMOKE_RESULTS.json
node testing/browser/renderer-smoke.cjs $env:FC_EXTENSION_DIR testing/browser/logger-fixture.cjs testing/browser/LOGGER_RENDERER_RESULTS.json
node --test testing/v8/tests/planner.test.cjs testing/v8/tests/safety.test.cjs
node delivery/fresh-listing-research/offline/evaluator.test.cjs
```

The automated smoke uses a fresh profile and command-line extension loading; if
your Chrome build disallows those flags, its worker timeout is inconclusive. Use
the manually loaded browser and MCP instead. Verify the extension's manifest name,
version, extension ID and background worker target. Inspect errors through the
extension's normal Errors view or worker inspector (no EA page open). With CDP,
`Target.getTargets` should show a `service_worker` at the extension URL. Attach to
that target, enable `Runtime` and `Log`, then collect `Runtime.consoleAPICalled`,
`Runtime.exceptionThrown` and `Log.entryAdded`; redacting any account data. A stopped
MV3 worker can be normal: wake it using the extension's supported UI before assuming
registration failed. The cloud has a specific administrator rejection, not merely
an idle-worker timeout.

First exercise only synthetic fixtures. Capture page exceptions, console errors,
failed fixture requests, loader order, normal Trader log rendering and guard tests.
Do not navigate to EA or start Trader market activity until the separate logging-only
live-validation plan has been approved. Purchases and bids must remain disabled.
Historical setup note: live native fresh-window retrieval was subsequently demonstrated at baseline 6264458. See delivery/v8/ACCEPTANCE.md for the final TEST validation and its limits.

Official references: https://github.com/microsoft/playwright-mcp and
https://github.com/ChromeDevTools/chrome-devtools-mcp .


## Final v8 reliability validation

`npm test` rebuilds and runs the complete offline regression suite, renderer
fixtures, and both offline and production installed-extension suites. It does
not open EA or make market requests. `npm run build:v8` builds the locked TEST
extension under `.local/v8-trader-validation`.

The separately authorized live validation uses the isolated authenticated Chrome
on loopback port 9223. Only in such a permitted discovery-only session, use
`node testing/browser/reliability-sessions.cjs 25000 50000 75000` with Trader open
and Search Settings visible. These arguments are temporary test ceilings, never
purchase instructions. The runner changes the visible field, saves clearly named
TEST filters, starts/stops through normal Trader controls, and checks sanitized
reports. It excludes messages left over from earlier runs. Do not run concurrent
UI controllers against that tab.

Real execution remains disabled in the immutable build policy and service/transport
guards. Mock-only authorization in unit tests never changes the installed policy.
Unknown transaction outcomes or wins arriving after cancellation require native
state reconciliation before future execution; there is no automatic unlock.
The ZIP contains no browser profile, account data, or preset purchase limit.
