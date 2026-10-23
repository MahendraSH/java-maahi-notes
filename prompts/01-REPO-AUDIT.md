# Phase 1 — Repository Audit (READ-ONLY)

Audit `~/Developer/mshit` before making any edits.

Inspect:
- root package.json, yarn.lock, .yarnrc.yml, .gitignore, Git status and remotes
- apps/local and apps/web package files, Next.js configs, TypeScript configs, ESLint, Tailwind CSS and global styles
- App Router layouts/pages and current metadata/icon files
- packages/* and workspace dependency conventions
- existing shadcn/ui configuration and components
- build/dev scripts and port configuration
- any existing note storage, Markdown, publishing or Git integration
- accidental generated files or secrets in the tracked/untracked file list (do not print secret values)

Do not install packages or modify files in this phase.

Return:
1. Current architecture summary.
2. Existing working features vs starter placeholders.
3. Problems grouped by critical / important / optional.
4. Dependency and config mismatches, if any.
5. Privacy and Git risks.
6. Proposed phase plan, reusing what already exists.
7. Exact verification commands to run.

Checkpoint: stop after the report and wait for approval.
