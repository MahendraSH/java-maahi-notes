# Phase 10 — Final Quality Gate

Do a focused quality pass; don't use this phase as an excuse for broad redesign.

Verify:
- Yarn workspace installation and scripts.
- Local app on port 3000 and public site on port 3001.
- Both production builds.
- TypeScript and lint checks supported by the repository.
- Favicon/metadata in both apps.
- Dark and light theme token consistency.
- Keyboard focus, labels and empty/error states.
- Note save and reload behavior if implemented.
- Search/folder/tag behavior if implemented.
- Publishing allowlist and proof that private notes do not reach public output.
- `.gitignore` and Git status; do not commit or push without explicit approval.
- No accidental `.env`, credentials, `node_modules`, `.next`, or private content in tracked/staged files.

Do not report a check as passed unless you ran it and observed success. If any checks cannot be run, state why.

Final report format:
1. Current architecture.
2. Features actually implemented.
3. Files changed.
4. Commands run and results.
5. Known gaps and risks.
6. Exact commands to run each app.
7. Git status and publishing readiness (do not publish automatically).
8. Suggested next checkpoint, limited to the most important remaining work.

Stop and wait for user review.
