# Vibe Notes Vibe-Coding Kit

A checkpoint-driven starter kit for building Vibe Notes: a local-first, Notion-inspired developer knowledge workspace with a separate read-only public knowledge website.

## Product decisions

- **Name:** Vibe Notes
- **Monorepo:** Yarn workspaces only; no Turborepo.
- **Apps:** `apps/local` (editor, port 3000), `apps/web` (public read-only website, port 3001).
- **Packages:** `packages/ui` (shared UI) and `packages/notes-core` (shared note types and Markdown/frontmatter utilities).
- **Visual direction:** restrained Java IDE + terminal inspiration: graphite surfaces, Java orange accent, terminal green for success, developer blue for links.
- **Product scope:** notes and knowledge management only. Do not add tasks, reminders, calendars, or generic productivity features.
- **Publishing:** local notes stay local unless explicitly marked/selected for publishing. Public website must only consume approved/published content.
- **Safety:** never force-push, never blindly stage everything, never commit secrets or private notes.

## How to use

1. Extract this ZIP.
2. Open `prompts/00-MASTER-PROMPT.md`.
3. Give the master prompt to your coding agent as the project contract.
4. Run one phase prompt at a time from `prompts/`.
5. At each checkpoint, review the report and run the verification commands before continuing.
6. Keep this kit in the repository or copy it into your own `docs/` folder if useful.

## Important

The prompts ask the agent to inspect the existing repository before editing. They are not permission to overwrite existing work or publish anything automatically. The agent must stop and report when it reaches a checkpoint or encounters an unsafe ambiguity.

## Package contents

- `prompts/00-MASTER-PROMPT.md`: project contract and orchestration rules
- `prompts/01-REPO-AUDIT.md`: inspect current repo and report gaps
- `prompts/02-FOUNDATION.md`: monorepo and tooling cleanup
- `prompts/03-BRAND-AND-THEME.md`: SVG brand assets, metadata, color tokens
- `prompts/04-SHARED-CORE-AND-UI.md`: shared package foundations
- `prompts/05-LOCAL-EDITOR-SHELL.md`: local app shell
- `prompts/06-PUBLIC-WEBSITE.md`: read-only knowledge site
- `prompts/07-LOCAL-NOTES-PERSISTENCE.md`: safe local Markdown storage
- `prompts/08-SEARCH-AND-NAVIGATION.md`: folder tree, tags, search, backlinks
- `prompts/09-PUBLISHING-SAFETY.md`: explicit publication workflow
- `prompts/10-QUALITY-AND-RELEASE.md`: final QA and checkpoint report
- `assets/`: original SVG icon assets
- `styles/vibe-notes-theme.css`: reference theme tokens for Tailwind CSS v4/shadcn conventions
- `docs/CHECKPOINTS.md`: acceptance gates
