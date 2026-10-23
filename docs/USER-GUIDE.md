# Vibe Notes — Complete User & Feature Guide

Welcome to **Vibe Notes**, a modern, developer-focused, local-first notes and knowledge-management workspace.

---

## 1. Quick Navigation & Hotkeys

Vibe Notes is designed keyboard-first so you never have to leave your flow:

| Shortcut | Description |
|---|---|
| <kbd>⌘ K</kbd> / <kbd>Ctrl + K</kbd> | Open Advanced Fuzzy Search command palette |
| <kbd>⌘ N</kbd> / <kbd>Ctrl + N</kbd> | Create a new note in the active folder |
| <kbd>⌘ E</kbd> / <kbd>Ctrl + E</kbd> | Toggle between Markdown Edit and Preview modes |
| <kbd>⌘ I</kbd> / <kbd>Ctrl + I</kbd> | Jump back to the Workspace Index Dashboard |
| <kbd>⌘ B</kbd> / <kbd>Ctrl + B</kbd> | Toggle Sidebar open / collapsed |
| <kbd>⌘ P</kbd> / <kbd>Ctrl + P</kbd> | Open the Publishing Safety Boundary modal |
| <kbd>?</kbd> / <kbd>Shift + /</kbd> | Open Documentation, Video Walkthroughs & Cheatsheet |
| <kbd>Esc</kbd> | Close any open modal or return to index |

---

## 2. Interactive Tag Autocomplete & Creation

- **Instant Search**: Type in any tag input (in the Quick Capture bar or Note Editor properties panel). Existing workspace tags appear filtered in real time with note count pills (`3 notes`).
- **Create New Tag**: If the tag does not exist, type the tag name and click or press <kbd>Enter</kbd> on `+ Create "#{tag}"`.
- **Keyboard Ergonomics**:
  - <kbd>↓</kbd> / <kbd>↑</kbd>: Navigate through suggestions and create button.
  - <kbd>Enter</kbd>, <kbd>Tab</kbd>, or <kbd>,</kbd> (comma): Add the highlighted tag.
  - <kbd>Backspace</kbd>: When the input is empty, removes the previous tag badge.
  - <kbd>Esc</kbd>: Closes the dropdown.

---

## 3. Folder Combobox Picker & Hierarchy

- **Browse Existing Paths**: Click the folder picker button to view existing hierarchy paths with note counts.
- **Search & Filter**: Type in the search box to filter matching folders instantly.
- **Create New Nested Folder**: Type any path (e.g. `Engineering/DistributedSystems`) and press <kbd>Enter</kbd> to create and assign the note to that folder.
- **Sidebar Tree**: Browse ancestor and child folders in the left sidebar with note aggregation.

---

## 4. Quick Capture & Inline `#hashtags`

On the Workspace Index Dashboard:
- Enter a title in the Quick Capture bar.
- Choose or create a folder with the combobox picker.
- Add tags with the tag autocomplete picker.
- **Inline Hashtags**: Type `#tags` directly inside the title (e.g. `Event Sourcing with Kafka #streaming #architecture`). Vibe Notes extracts `#streaming` and `#architecture` automatically and creates the note.

---

## 5. Bidirectional Wiki-Links & Backlinks

- **Link Notes**: Type `[[Note Title]]` anywhere in your note content.
- In Preview mode, clicking the link navigates directly to the target note.
- **Backlink Discovery**: Notes with incoming references automatically display an interactive **Incoming Backlinks** explorer at the bottom.

---

## 6. Advanced Search Operators

In the <kbd>⌘K</kbd> search palette:
- `term`: Full-text search across titles and Markdown contents.
- `#tag`: Filter notes containing a specific tag (e.g. `#redis`).
- `folder:name`: Filter notes within a folder hierarchy (e.g. `folder:Java`).
- `status:published` / `status:local` / `status:staged`: Filter by publication status.
- Combine operators: `#architecture status:local cache`.

---

## 7. The 3-Tier Publishing Safety Boundary

1. **Local Only** (`local`): Private notes saved exclusively to local disk (`content/notes/`), ignored by Git, never published.
2. **Staged for Review** (`staged`): Staging area for pre-publication quality review accessible via <kbd>⌘P</kbd>.
3. **Published** (`published`): Select technical documentation served publicly on the web reader (`http://localhost:3001`).
