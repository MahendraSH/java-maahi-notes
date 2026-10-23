# LLMS.md — AI Agent Context for Vibe Notes

This document provides concise, machine-readable architectural context for AI coding agents, LLMs, and pair-programmers working in this repository.

---

## 1. Project Overview

- **Name:** Vibe Notes
- **Description:** Notion-inspired, developer-focused, local-first notes & technical knowledge management workspace with a static public web reader.
- **Monorepo:** Yarn 4 workspaces (`apps/*`, `packages/*`). No Turborepo.
- **Core Stacks:**
  - `apps/local`: Next.js 16 (App Router), React 19, Tailwind CSS v4, port 3000. Full Markdown editor, local disk storage, fuzzy search, backlinks, publishing boundary.
  - `apps/web`: Next.js 16 (App Router), React 19, Tailwind CSS v4, port 3001. Read-only static knowledge base deployed on Vercel (`https://vibe-notes-demo.vercel.app/`).
  - `packages/notes-core`: Pure TypeScript business logic (path safety, frontmatter parsing, folder hierarchy tree, reading time calculation, full-text search, backlinks).
  - `packages/ui`: Shared design tokens, styles, and reusable UI primitives.

---

## 2. Key Commands

```bash
# Install dependencies
yarn install

# Run local editor (Port 3000)
yarn dev:local

# Run public web reader (Port 3001)
yarn dev:web

# Build public web reader for Vercel
yarn build:web

# Run full monorepo build
yarn build

# Run unit tests
yarn test

# Typecheck all workspaces
yarn typecheck
```

---

## 3. Data & Storage Architecture

- **Local Storage Directory:** `/content/notes/*.md`
- **Safety Boundary:** All private notes are strictly stored on the local filesystem and ignored in `.gitignore`.
- **Note Schema (`Note`):**
  - `id`: unique string identifier (`note-<timestamp>`)
  - `title`: human-readable title
  - `slug`: URL-safe slug
  - `folder`: hierarchical folder path (e.g. `Architecture/DistributedSystems`)
  - `tags`: array of string tags (e.g. `["kafka", "architecture"]`)
  - `publicationStatus`: `'local' | 'staged' | 'published'`
  - `readingTimeMinutes`: estimated reading time (words / 200 wpm)
  - `createdAt` / `updatedAt`: ISO timestamps
  - `content`: raw Markdown text with YAML frontmatter

---

## 4. Key Architectural Rules

1. **Local-First Safety:**
   - Notes with `publicationStatus: "local"` or `"staged"` must NEVER be exposed on the public web app (`apps/web`).
   - Only notes marked `"published"` may be included in the public manifest or SSG routes.
2. **Keyboard-First Workflow:**
   - <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>: Fuzzy search command palette.
   - <kbd>⌘N</kbd> / <kbd>Ctrl+N</kbd>: Create note in active folder.
   - <kbd>⌘E</kbd> / <kbd>Ctrl+E</kbd>: Toggle Markdown Edit vs Preview.
   - <kbd>⌘I</kbd> / <kbd>Ctrl+I</kbd>: Return to Workspace Index Dashboard.
   - <kbd>⌘B</kbd> / <kbd>Ctrl+B</kbd>: Toggle Sidebar collapsed/expanded.
   - <kbd>⌘P</kbd> / <kbd>Ctrl+P</kbd>: Open Publishing Safety Boundary review hub.
   - <kbd>?</kbd>: Open Documentation & Video Walkthroughs modal.
3. **Tags & Folders UX:**
   - `TagAutocompletePicker`: Real-time search across workspace tags, displays frequency pills, Enter to add, `+ Create tag` on the fly, Backspace to delete previous tag badge.
   - `FolderComboboxPicker`: Searchable combobox for existing folders with note counts, or type new path to create.
   - Quick Capture: Auto-extracts `#hashtags` typed directly in the title.
4. **Wiki-Links:**
   - `[[Note Title]]` links automatically render as clickable links in Preview mode.
   - Incoming backlinks are indexed and displayed at the bottom of the note.

---

## 5. Vercel Deployment Guide

- **Live Demo:** `https://vibe-notes-demo.vercel.app/`
- **Target Application:** `apps/web`
- **Build Command:** `yarn build:web`
- **Output Directory:** `apps/web/.next`
- **Framework:** Next.js
- `apps/web` pre-renders all published notes into pure static HTML (SSG) with `generateStaticParams`.
