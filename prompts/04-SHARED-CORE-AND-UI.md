# Phase 4 — Shared Core and UI Foundations

Inspect current packages first. Reuse existing implementations and avoid unnecessary abstractions.

## packages/notes-core
Create or verify:
- TypeScript types for Note, Folder/Collection, Tag and publication status.
- Zod schemas for validated note metadata if Zod is already used or justified.
- Pure helpers for slug/path normalization and frontmatter/Markdown parsing.
- Safe handling of missing/invalid metadata.
- No browser-specific APIs and no filesystem/Git imports in shared pure code.

A possible Note model should support an id, title, content, folder/path, tags, created/updated timestamps, and explicit publication state. Follow existing naming conventions if present.

## packages/ui
- Share genuinely reusable UI primitives only.
- Keep app-specific layout/navigation in each app.
- Follow existing shadcn/ui configuration and component style.
- Use Lucide React only if already installed or a compatible dependency is necessary.
- Add components only when used: Button, Input, Textarea, Label, Select, Card, Badge, Separator, Dialog, Dropdown Menu and Tooltip are reasonable candidates, but don't generate a large unused component catalog.
- Confirm package exports and workspace imports resolve correctly.

Keep local filesystem and Git operations in local-app-only modules. The public website must never import those modules.

Run type checks, lint and builds as supported. Stop at checkpoint.
