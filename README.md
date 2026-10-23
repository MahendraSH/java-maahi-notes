# Vibe Notes

> A developer-focused, local-first notes and knowledge-management workspace with a static public web reader.

[![Live Demo](https://img.shields.io/badge/demo-vibe--notes--demo.vercel.app-blue)](https://vibe-notes-demo.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

---

## 🚀 Live Demo

- **Public Knowledge Base:** [https://vibe-notes-demo.vercel.app/](https://vibe-notes-demo.vercel.app/)
- **Setup Guide:** [https://vibe-notes-demo.vercel.app/setup](https://vibe-notes-demo.vercel.app/setup)
- **LLM Context:** [https://vibe-notes-demo.vercel.app/llms.txt](https://vibe-notes-demo.vercel.app/llms.txt)

---

## ⚡ Overview & Architecture

Vibe Notes provides a distraction-free, terminal-and-IDE-inspired notes experience for software engineers. It solves the friction of traditional cloud note apps by separating your **private daily workspace** from your **public published documentation**:

```
vibe-notes/
├── apps/
│   ├── local/          # Port 3000 — Local Markdown editor with disk persistence
│   └── web/            # Port 3001 — Static public knowledge reader (Vercel-ready)
├── packages/
│   ├── notes-core/     # Pure TypeScript core logic (safety, parsing, search, backlinks)
│   └── ui/             # Shared styling tokens and reusable components
├── content/
│   └── notes/          # Your private Markdown (.md) notes (git-ignored)
└── docs/               # Architecture guides and checkpoints
```

1. **`apps/local` (Local-First Daily Editor):**
   Runs on `http://localhost:3000`. Reads and writes Markdown notes with YAML frontmatter directly to your hard drive in `content/notes/`. Zero cloud lock-in, offline-ready, completely private.
2. **`apps/web` (Public Knowledge Base):**
   Runs on `http://localhost:3001` or deployed to Vercel at `https://vibe-notes-demo.vercel.app/`. Serves **only** notes explicitly marked with `publicationStatus: "published"`. Local and staged notes are completely isolated.

---

## 📦 Getting Started

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/vibe-notes.git
cd vibe-notes
yarn install
```

### 2. Run the Daily Local Editor
Start your daily notes editor:

```bash
yarn dev:local
```

Open [http://localhost:3000](http://localhost:3000) in your browser. All notes are saved automatically to `content/notes/*.md`.

### 3. Run the Public Web Reader
Preview your published documentation locally:

```bash
yarn dev:web
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🌐 Deploy to Vercel (Public Frontend Only)

The public knowledge reader (`apps/web`) compiles into pure static HTML (SSG) with zero backend requirement.

### One-Click Deployment
Import your forked repository in [Vercel](https://vercel.com/new). The root `vercel.json` automatically configures the build:

- **Framework Preset:** Next.js
- **Build Command:** `yarn build:web`
- **Output Directory:** `apps/web/.next`
- **Install Command:** `yarn install`

Your public documentation will be live at `https://<your-project>.vercel.app/`.

---

## ✨ Features

- **🏷️ Modern Tag Autocomplete:** Instant search across existing workspace tags with usage count pills (`3 notes`). Press <kbd>Enter</kbd> to select or create a new tag on the fly.
- **📁 Folder Combobox:** Browse existing folder hierarchies with note counts, or type new nested paths like `Engineering/Distributed` to create folders instantly.
- **⚡ Quick Capture:** Capture thoughts in 2 seconds. Type `#tags` directly in the title (e.g. `Kafka Streams #distributed #streaming`) to auto-extract and attach tags.
- **🔗 [[Wiki-Links]] & Backlinks:** Type double brackets `[[Note Title]]` to link notes. In Preview mode, click to jump. Incoming references automatically appear in the Backlinks card.
- **⌨️ Keyboard-First Speed:**
  - <kbd>⌘ K</kbd> / <kbd>Ctrl + K</kbd>: Advanced fuzzy search with `#tag`, `folder:xyz`, and `status:xyz` operators.
  - <kbd>⌘ N</kbd> / <kbd>Ctrl + N</kbd>: Create a new note in active folder.
  - <kbd>⌘ E</kbd> / <kbd>Ctrl + E</kbd>: Toggle Markdown Edit vs Preview.
  - <kbd>⌘ I</kbd> / <kbd>Ctrl + I</kbd>: Return to Workspace Index Dashboard.
  - <kbd>⌘ B</kbd> / <kbd>Ctrl + B</kbd>: Toggle Sidebar.
  - <kbd>⌘ P</kbd> / <kbd>Ctrl + P</kbd>: Open Publishing Safety Boundary review hub.
  - <kbd>?</kbd>: Open Documentation & Video Walkthroughs modal.
- **🛡️ 3-Tier Publishing Boundary:** Clear separation between `local` (private), `staged` (review), and `published` (public).

---

## 🤖 AI & LLM Assistance

Working with Claude, ChatGPT, Cursor, or Antigravity?
Refer to [LLMS.md](LLMS.md) (or [llms.txt](https://vibe-notes-demo.vercel.app/llms.txt)) for concise architecture and convention details.

---

## 📄 License

Released under the [MIT License](LICENSE). Free for personal and commercial use.
