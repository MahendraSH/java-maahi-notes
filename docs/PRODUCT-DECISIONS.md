# Vibe Notes Product Decisions

## Core purpose
A local-first notes and knowledge editor for developer learning, technical documentation, code snippets, interview notes, and personal knowledge.

## Out of scope
Tasks, reminders, calendars, habit tracking, generic productivity dashboards, social feeds, and unnecessary AI features.

## Two apps
- Local editor: port 3000, local editing and storage.
- Public website: port 3001, read-only published knowledge.

## Persistence and publication
- Saving locally is independent of network access.
- Publishing is explicit and separate from local save.
- Private is the default.
- Public website must use an allowlisted published content source.
- A GitHub push triggers deployment only if the repo's deployment workflow is configured.
- Never force-push or blindly stage all files.

## Design
- Dark-first graphite UI.
- Java orange brand accent.
- Terminal green for success states.
- Developer blue for links and informational states.
- Proper light theme and accessible contrast.
- Use SVG brand assets; no emoji logo.
