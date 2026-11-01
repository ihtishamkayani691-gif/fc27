# PenguBOT / FUT Workshop source investigation — phase 1 finding

## Result and limit

The three supplied archives contain extension loaders/login support, not the externally loaded market-search implementation. All nine first-party JavaScript files were parsed, decoded and inspected before any FC Enhancer code change. The shared jQuery library and manifest/HTML/resource inventories were checked too. This establishes how these archives load code; it does **not** establish how PenguBOT Pro+ discovers newly listed cards.

The actual injected script.js is missing from every ZIP. Reading its public URL is currently blocked by the environment's restricted network policy. No remote response body, market algorithm or current-EA compatibility can be inferred from that rejection. No FC Enhancer source, existing TEST ZIP or purchase safeguards were changed.

## Input identification

| Label | Supplied archive | SHA-256 |
|---|---|---|
| workshop | FUT Workshop Autotbuyer (1).zip | 09522a04dfe0a4c6ac5d0cafc993dbad8908639e50dac363cfd27ac6fff1f000 |
| pengu2024 | FWS_x_PenguBOT_Autobuyer_2024.zip | ea8a56ab2e33d8eddc7a04333b1067c3ff97ed0d4c127821bb76762b69a6a420 |
| pengu | FWS_x_PenguBOT_Autobuyer (1).zip | ca0350112b9ccc1b4a62c848c691b47a273f5358760c9bea5c51e75e708a9f72 |

All three identify version 1.0.0 and Manifest V2. Their manifests inject jquery-3.6.0.min.js and content.js on https://www.ea.com/* and load background.js. The product labels differ, but filenames/labels do not prove the contents equal any particular original PenguBOT Pro+ core version.

PenguProducts-6506f637dad58.txt contains setup/access information, not a search algorithm. Its credential/access values were not used for any request and are excluded from this report. No login, license redemption, ticket/contact, OAuth or notification/webhook action was performed.

## How the obfuscation was inspected

The scripts use rotated string tables, arithmetic decoder wrappers, string concatenation, proxy objects and switch-order flattening. The analysis parsed them with pinned Babel tools, evaluated only the extracted string-table/decoder rotation helpers in an isolated timeout-limited context with dynamic code generation disabled, and resolved constant string/proxy expressions. The extension application's browser, login, network and anti-debugger code was never executed.

There are separate original-preserving and readable analysis copies. Readable-copy line numbers below refer to analysis/<label>/content.resolved.js; original source function names are preserved. The original files are minified, so function names and hashes also locate the code. Thirty original/derived JavaScript parse checks passed. The analysis does not use absence of a keyword alone as proof: the concrete loader path below positively identifies the missing dependency.

## Actual code evidence

### FWS_x_PenguBOT_Autobuyer_2024.zip

File: FWS x PenguBOT Autobuyer/content.js.
Original function: _0x1c3946, called from the chrome.runtime.onMessage listener after the load-message branch initializes local page context.

Resolved lines 892–896:

```js
var _0x122065 = document["createElement"]("script");
_0x122065["src"] = "https://fut-workshop-free-beans6668.replit.app/script.js";
_0x122065['id'] = "autoload";
document["head"]["appendChild"](_0x122065);
document["getElementById"]("autoload")["remove"]();
```

Before constant resolution, the same src assignment uses _0x1e398c["HqYVB"], whose decoded object property contains that exact URL. This is a DOM script injection, not a market-search call.

### FUT Workshop Autotbuyer (1).zip

File: FUT Workshop Autotbuyer/content.js.
Original function: _0xc3841d, in the onMessage load path.

Resolved lines 802–806:

```js
var _0x5daabc = document["createElement"]("script");
_0x5daabc["src"] = "https://fut-workshop-free-25-Beans6668.replit.app/script.js";
_0x5daabc['id'] = "autoload";
document["head"]["appendChild"](_0x5daabc);
document["getElementById"]("autoload")["remove"]();
```

### FWS_x_PenguBOT_Autobuyer (1).zip

File: FWS x PenguBOT Autobuyer/content.js.
Original function: _0xcb1a31, in the onMessage load path.

Resolved lines 787–791:

```js
var _0x566ab7 = document["createElement"]("script");
_0x566ab7["src"] = "https://fut-workshop-free.beans6668.repl.co/script.js";
_0x566ab7['id'] = "autoload";
document["head"]["appendChild"](_0x566ab7);
document["getElementById"]("autoload")["remove"]();
```

These short relevant excerpts are provided as source evidence. Unrelated proprietary source is not copied into FC Enhancer or distributed with a new implementation.

## Other inspected paths

- content.js: runtime message handling, page-context/session initialization, remote script injection and obfuscator self-defending/anti-debug code. The load callback stores context fields, then invokes the injection function. Values are not reproduced here.
- background.js: extension login/OAuth and browser-message support. No bundled EA market request/evaluation loop was identified.
- login.js: login UI, account/access handling, status/configuration retrieval and load-message dispatch. No bundled snipe-price/fresh-listing evaluation implementation was identified.
- Timers: for example, pengu2024 content.js schedules _0xf37bec every 4000 ms. Its resolved body contains Function-constructor debugger/anti-debugger logic, including constructor("debugger").call("action"). This is **not** evidence of a four-second market-search refresh.
- The three jQuery copies are byte-identical, 89,503 bytes each, with the jQuery v3.6.0 banner and SHA-256 ce9d07500ad91ec2b524c270764ec4c9a33e78320d8d374ec400ede488f6251b. They are shared library code, not a separately named bot core.
- The manifests, login HTML/CSS, assets and small readme do not bundle script.js. No hidden archive member providing the injected script was found.

Consequently, the supplied source does not prove whether the missing implementation uses repeated searches, price adjustments, filter cycling, newest-first server sorting, remaining-time detection, market-cache invalidation, a refresh trigger, an alternate search endpoint, or another mechanism. Remote loading is the only relevant mechanism positively established here, and it explains why the archive alone cannot answer those questions.

## Current EA / FC Enhancer capability assessment

These are capability assessments of the existing FC Enhancer integration, **not claims about PenguBOT's absent algorithm or successful live fresh discovery**.

| Mechanism | Status in the inspected integration | Evidence and limitation |
|---|---|---|
| Repeated native market searches | Partially Supported | Existing services.Item.searchTransferMarket calls and live responses show searching works. The supplied live results are near-expired; freshness discovery is not established. |
| Min/max Buy Now constraints | Supported as search/evaluation fields | Current UI/DTO exposes minBuy/maxBuy; original checkBuyPrice and bid middleware enforce configured BIN thresholds. Whether varying these exposes the missing new cards still needs investigation and live evidence. |
| Cycling criteria/price ranges | Partially Supported | Criteria can be constructed using existing UI-supported fields. No evidence from the supplied Pengu loaders establishes a correct cycling strategy or guarantees complete market coverage. |
| Reading remaining seconds and trade IDs | Supported as data processing | Current auction DTO exposes expires and tradeId. First-seen ID tracking and numeric 3540–3600 filtering can be implemented independently; this does not supply unseen market results. |
| Market-cache clearing/refresh helpers | Partially Supported | Existing FC service wrappers clear market cache and expose auction refresh helpers. Fresh market coverage after clearing is not proved. |
| Server newest-first sorting | Not Supported by the examined code | No demonstrated native request option was found that retrieves newest listings first. Client-side sorting cannot retrieve listings absent from the response. This is not proof that EA has no such capability elsewhere. |
| Alternate market endpoint | Not Supported by available evidence | No authorized, demonstrated alternate endpoint is supplied. None will be invented. |
| Reusing these archives as-is in FC Enhancer | Not Supported | They are Manifest V2 remote-code loaders, not an independently understood fresh-discovery implementation for the current Manifest V3 extension. No proprietary remote code will be imported into FC Enhancer. |

A remaining timer near one hour is evidence of the requested candidate window, not always proof of listing birth time: a longer auction can also eventually enter that window. A future log must distinguish first seen by this observer from authoritative newly listed time unless the service supplies reliable creation/duration metadata. The user-requested 3540–3600-second candidate band remains an explicit acceptance test; 30/59-second listings are rejected.

## Blocker and next step

A read-only unauthenticated fetch of the first referenced public script URL was attempted through the configured proxy. It failed with CONNECT tunnel response 403 and HTTP code 000 before a response from the script host was received. Current runtime policy does not permit the three script hosts. No claim is made that the sites are offline, require a license, or returned any particular response. The other two hosts were not retried under the same unchanged denied policy.

A network-only draft was saved, preserving existing preset rules and adding exactly:

- fut-workshop-free-25-beans6668.replit.app
- fut-workshop-free-beans6668.replit.app
- fut-workshop-free.beans6668.repl.co

The save was confirmed. It does not apply runtime access or publish the environment; the tool reported requires_publish=true. The user may review/save and publish that environment configuration to activate it, or supply the actual script.js from an authorized installation/download without changing network settings. No environment was published by the agent.

Runtime networking guidance requires blocked destinations to use the supported configuration workflow, not a proxy bypass. No such bypass was attempted. Reference: skill://plugin_connector_1p_c5b7d5df5d7081918f2c4be5a633ed5d/cloud-environment-runtime/references/networking.md.

After the missing public/authorized script is available, finish tracing the actual search and snipe-price logic, assess its current native-service compatibility, and only then implement an independently written logging-only discovery feature. If the remote dependency cannot be obtained, an exact claim about PenguBOT's discovery method would be a guess. No replacement TEST ZIP is being represented as finished at this stage.
