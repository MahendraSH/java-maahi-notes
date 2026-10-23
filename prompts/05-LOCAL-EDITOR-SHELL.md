# Phase 5 — Local Editor Shell

Build a polished but restrained Vibe Notes local app shell.

Layout:
- Left sidebar with Vibe Notes mark, search trigger, nested pages/folders and a small settings/theme entry if supported.
- Main editor canvas with breadcrumbs or parent path, title, tags/metadata and note body.
- Useful empty state when no note is selected.
- Responsive sidebar behavior for smaller screens.
- Keyboard shortcuts should be discoverable and not conflict with browser conventions unnecessarily.

Visual details:
- Use shared semantic theme tokens.
- Keep the content area calm and readable.
- Use Lucide icons, not emoji as interface icons.
- Use monospace styling only for code, keyboard shortcuts and technical identifiers.
- Provide proper focus states, accessible names, and semantic buttons/links.
- Don't build a fake functional editor. If persistence isn't ready, label sample content as demo data and make limitations explicit.
- Avoid adding tasks, reminders, calendars or unrelated features.

At this phase, use clearly identified sample data if storage isn't ready. Keep the code structured so persistence can be added without a rewrite.

Verify both responsive layout and build. Stop at checkpoint.
