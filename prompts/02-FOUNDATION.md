# Phase 2 — Monorepo Foundation

Use the audit report. Make only necessary foundation changes.

Requirements:
- Preserve Yarn workspaces; no Turborepo.
- Keep `apps/local` and `apps/web`, ports 3000 and 3001.
- Keep `packages/ui` and `packages/notes-core` if already created; do not duplicate them.
- Keep existing dependency versions unless a concrete incompatibility is found.
- Ensure root scripts exist where appropriate: `dev:local`, `dev:web`, `build:local`, `build:web`, and optionally typecheck/lint scripts only if they work.
- Verify workspace package names and dependencies.
- Ensure `.gitignore` excludes node_modules, `.next`, build outputs, local environment secrets, and local-only note data when it is stored inside the repo.
- Do not ignore intentional source Markdown or public content directories by broad patterns.
- Do not delete unfamiliar files or rewrite Git history.

Run `yarn install` only if dependency manifests changed or install verification is needed. Run checks that exist.

Checkpoint report: changed files, reasons, commands and actual outcomes. Stop for review.
