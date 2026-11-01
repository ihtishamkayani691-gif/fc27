# v7.1 review guide

Read work/fresh-module.js: this is the actual webpack 99007 production source inserted by build.py, not a separate simulation.

- semantic() excludes the named pagination DTO properties from stable session keys and request filter comparisons. changedKeys() logs property names only. Other filters remain validated.
- create() initializes BASELINE/CALIBRATE/PROBE_START access stages for a configured start >2; normal starts at 1 use DISCOVERY.
- process() uses wire() observations to learn stride, validates a single starting-page probe, or selects sequential warm-up. It never constructs an EA request URL or pagination parameter.
- advance() retains the multi-boundary monitoring state machine, adds explicit discovery-page budgeting and a backward adjacent heuristic for above-window results, and skips repeatedly empty boundaries while valid targets remain.
- run() reports mutations, ignoredTransport, access stage, warmupTo, scanned/budget, minSec/maxSec/target and the fixed targetSec=3540-3600. confirmed remains unknown without server metadata.
- Main module 50379 labels Search Page Limit as pages per discovery. The persisted field is unchanged.
- Main module 30501 retains the v7 instance/prototype no-bid interlock, with its error text updated to identify v7.1.
- Manifest version 27.0.1.5 identifies this as v7.1 TEST. No permissions or host permissions were added.

work/search-module.js and the index.js raw-before-filter hook retain their v7 behavior. All original buy-price/profit/safety/exclusion middleware remains present. Full exact diffs and production module extracts accompany this guide.
