# Phase 7 — Local Markdown Persistence

Implement local Markdown persistence only after confirming the target runtime and user-approved storage directory.

Requirements:
- Prefer Markdown files with frontmatter as the durable format.
- Keep filesystem operations server-side in the local app only; never expose arbitrary filesystem access to browser code.
- Do not assume a deployed serverless app can write to the user's Mac filesystem.
- If Next.js local app needs a local Node server or another local bridge for disk operations, explain the tradeoff and implement the simplest safe approach compatible with the current setup.
- Normalize and validate paths; reject path traversal and unsafe filenames.
- Use atomic writes where practical to reduce corruption risk.
- Do not silently overwrite an existing note with the same slug; ask/resolve collision safely.
- Local save must not require GitHub/network connectivity.
- Provide clear saved/saving/error states and retry behavior.
- Do not commit private note contents as part of implementing this feature.
- Add tests for path safety, validation, duplicate names and frontmatter parsing if the repository supports tests.

Before implementing filesystem access, report the proposed storage directory and API boundary, then wait for approval if it could affect files outside the project.

Checkpoint after verification.
