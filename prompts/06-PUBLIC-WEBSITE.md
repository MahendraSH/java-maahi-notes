# Phase 6 — Read-Only Knowledge Website

Create a reading-first public site in `apps/web`.

Requirements:
- Share Vibe Notes branding and theme tokens, but optimize for article and technical-note readability.
- Include a home/index page and a note/article reading layout.
- Use semantic headings, comfortable line length, code blocks, inline code, lists and links.
- Show a clear empty state if no published content is available.
- Consume only an explicitly public/published content source.
- Do not import local filesystem/Git modules, local editor controls, private note data, credentials or environment secrets into client-side code.
- Do not automatically publish all Markdown files.
- If the publishing source is not implemented yet, use a clearly isolated sample content fixture and label it as sample data in code.
- Avoid inventing a CMS or database unless the existing architecture requires it.

Verify the website build and check imports/dependencies for accidental local-only modules. Stop at checkpoint.
