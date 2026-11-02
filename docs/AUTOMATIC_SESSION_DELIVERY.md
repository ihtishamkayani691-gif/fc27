# Automatic session delivery

Continue from f97033b. User now authorizes automatic decisions after deliberate per-session enablement; no per-card approval is needed. Development must not enable or execute real EA purchases.

Implementation: opt-in27.0.8.0 build preserves previous archives and their workflows. Separate trusted checkbox; enforce ceiling/per-card/total <=100000, minimum net profit>=15000, count1, plus every existing guard. Session expires at five minutes from enablement and is rechecked immediately before native submission. Stop/reload/safety failures revoke authorization. After one confirmed purchase, stop immediately. Confirmed items remain unassigned. Native result, inventory and exact coin reconciliation are required before reporting success. Unknown results stop, retain the transaction journal and never retry blindly. Candidate economics, fair price scopes, adaptive pagination and native rarities remain.

Validation: failing baseline tests first; focused production-factory tests; full regression; clean installed extension on an isolated synthetic origin with HTTP blocked; Windows ZIP CRC and File Explorer extraction; byte match and clean installation from the final extracted folder; review, commit and push. Live EA purchase mode stays OFF throughout.
