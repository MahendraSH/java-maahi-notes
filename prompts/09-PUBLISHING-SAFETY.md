# Phase 9 — Explicit GitHub Publishing Boundary

Implement a deliberate, safe publishing workflow. Do not push or change GitHub settings without explicit user approval.

Requirements:
- Private/local notes are the default.
- Public website consumes only approved/published notes from a clearly defined directory or manifest.
- Publishing selection must be explicit and visible to the user.
- Local save and publish are separate operations.
- Show statuses honestly: local saved, publication prepared, push pending, published/deployed only when confirmed.
- Git staging must include only intended public files, never private notes, environment files, credentials, or generated files.
- Never use blind `git add .`, force push, or history rewriting.
- If Git operations are implemented, show the exact files to be staged and require confirmation before commit/push.
- A failed network operation must not undo the local save; offer retry.
- Keep the public build isolated from local-only storage modules.
- Explain that a GitHub push may trigger deployment only if the repository's deployment workflow is actually configured.
- Test that private fixtures are not included in the website build.

Checkpoint: document the privacy boundary, staging logic and verification evidence; stop for review.
