# Vibe Notes Implementation Checkpoints

| Checkpoint | Goal | Accept before moving on |
|---|---|---|
| C1 — Audit | Understand existing repo | Existing code/features mapped; risks listed; no files changed |
| C2 — Foundation | Stable workspace and ports | Install, scripts, workspace names and ports verified |
| C3 — Brand | CSS theme, icons, metadata | SVGs valid; both apps build; semantic tokens consistent |
| C4 — Shared core | Reusable primitives and note types | Imports/typechecks pass; no local-only imports in shared core |
| C5 — Local shell | Usable editor layout | Responsive shell; no fake functionality presented as complete |
| C6 — Public site | Reading-first public experience | Build works; public-only content boundary explicit |
| C7 — Persistence | Local Markdown save/load | Path safety, duplicate handling, reload and error states verified |
| C8 — Navigation | Folder tree, tags, search, links | Key flows tested; keyboard access and empty states work |
| C9 — Publishing | Explicit public selection and Git workflow | Private notes excluded; staged-file allowlist reviewed; no push without approval |
| C10 — Release | Overall quality gate | Actual test/build results documented; Git state reviewed |

## Gate rule

Do not move to the next checkpoint until the previous checkpoint's report is reviewed. If a phase fails, fix that phase before adding features. Keep each change small enough to understand and revert.
