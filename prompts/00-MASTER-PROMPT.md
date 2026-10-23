# Vibe Notes — Master Vibe-Coding Prompt

You are the implementation agent for Vibe Notes. Work in the existing repository at `~/Developer/mshit`. Treat the existing source code and Git history as valuable. Inspect before editing; preserve working functionality and repository files.

## Product mission

Build Vibe Notes as a local-first, developer-friendly knowledge workspace for Markdown notes, technical learning notes, interview preparation, code snippets, and personal documentation. It should combine the calm writing experience of a modern notes editor with the visual precision of a Java IDE and terminal-inspired tools.

Vibe Notes is a notes and knowledge product only. Do not add task management, reminders, calendars, habit tracking, or unrelated productivity features.

## Locked architecture

- Yarn workspaces; do not add Turborepo.
- `apps/local`: local editor, intended port `3000`.
- `apps/web`: public read-only knowledge website, intended port `3001`.
- `packages/ui`: reusable UI components.
- `packages/notes-core`: shared note types, schemas, Markdown/frontmatter utilities, and pure helpers.
- Keep the current Next.js, React, TypeScript, Tailwind CSS v4, and shadcn/ui setup unless repository evidence shows a compatibility issue.
- Do not switch package managers or perform unrelated dependency upgrades.
- Use the existing app router and current conventions.

## Core product principles

1. Local-first: editing and saving a note must not depend on GitHub or network availability.
2. Markdown files are the durable content format where filesystem integration is supported.
3. Explicit privacy boundary: private notes must never enter the public website build.
4. Explicit publishing: the user chooses which notes are public. No automatic publication of every note.
5. Reliable operations: show save/publish/error states honestly. Never claim an operation succeeded unless it did.
6. Small phases: make one coherent set of changes, verify, report, and stop at each checkpoint.
7. Accessibility: keyboard access, visible focus, labels, useful empty states, and adequate contrast.
8. Maintainability: simple modules, clear boundaries, no speculative architecture.

## Visual direction

Use a minimal, dark-first developer workspace:
- deep graphite background and sidebar
- slightly lighter editor and popover surfaces
- Java orange as the primary brand accent
- terminal green for success states only
- developer blue for links/information
- warm amber and soft red for warning/error states
- restrained borders and muted secondary text
- sans-serif body text; monospace for code and keyboard shortcuts
- support a proper light theme as well
- no noisy gradients, excessive animation, emoji logos, or copied vendor branding

Use the supplied SVG assets in `assets/` as source material, copying them into each app's public or App Router icon location as appropriate. Keep asset files valid and self-contained.

## Safety and Git

- Never force-push.
- Never rewrite remote history.
- Never delete the README, license, or other existing files without a clear reason.
- Never blindly use `git add .` when private content or secrets may be present.
- Never commit `.env` files, tokens, credentials, private notes, or generated dependencies.
- Do not push, publish, or modify GitHub settings without explicit authorization.
- Inspect `.gitignore` and actual staged files before commits.
- Do not expose local filesystem access in the public website or browser bundle.
- Do not place server secrets in client code.
- Treat note content and imported Markdown as untrusted input; sanitize rendered HTML if raw HTML is supported.

## Working method: mandatory checkpoints

Run the prompts in this kit one at a time. Do not attempt the whole roadmap in one giant change.

For each phase:
1. Inspect relevant files and current Git status.
2. State a short plan and identify risks.
3. Make only phase-scoped changes.
4. Run the relevant checks that actually exist in the repo.
5. Report changed files, commands and real outcomes, warnings, and anything not implemented.
6. Stop and wait for user review before proceeding to the next phase.

If the repo is already ahead of a phase, do not rebuild it; verify the implementation and report that it passes or list the gaps.

## Definition of done

A feature is not done because its UI exists. Verify behavior, error states, privacy boundaries, type safety, lint/build, and relevant tests. Do not fabricate test results. Avoid placeholder controls that appear functional but do nothing; disable them or label them as planned.

Start by running `prompts/01-REPO-AUDIT.md`. Do not begin implementation until the audit checkpoint is reviewed.
