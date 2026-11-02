# FC Enhancer v8 development

Branch: `dev/v8-browser-testing`. The v8 discovery adapter is connected to the
production Trader. This is a **TEST build with real buying and bidding locked**.
Its future purchase bridge uses the existing orchestrator and native checks;
authorized execution is tested only with mocked transaction terminals.

## Local Windows development

```powershell
npm.cmd ci --ignore-scripts --registry=https://registry.npmjs.org
npm.cmd test
npm.cmd run build:v8
```

Load `.local/v8-trader-validation` as an unpacked Chrome extension, or extract
`delivery/v8/FC_Enhancer_v8_Trader_Validation_TEST.zip` to a stable folder and
load that folder. Disable previous FC Enhancer copies and reload the EA Web App.

In Trader, select **Ultimate Scream**, leave player selection empty, open
**Search Settings**, enter **v8 Maximum Snipe Price**, and enable **v8 Auto-Find /
Auto-Snipe**. Save the filter and start Trader. Page traversal and native price
scopes are automatic; the legacy starting-page field is not used by v8.
Stricter native buy/search limits and existing safety settings still apply.

`npm.cmd run browser:validation` opens an isolated visible Chrome profile for
manual EA sign-in and loopback debugging on port 9223. The offline browser and
MCP checks remain available through `browser:offline` and `test:mcp`.
Browser profiles are ignored by Git and never packaged.

See [production validation status](testing/browser/V8_PRODUCTION_STATUS.md)
for actual live observations, regression results and remaining acceptance limits.
See [local setup](testing/browser/LOCAL_CODEX_SETUP.md) for browser/MCP details.

Changing a saved filter cannot enable purchases in this TEST build. Real
execution requires a separately validated and explicitly authorized release;
the current immutable release gates and independent interlocks stay closed.
