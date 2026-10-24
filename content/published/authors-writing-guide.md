---
id: "authors-writing-guide"
title: "Author's Writing Handbook & Documentation Standards"
slug: "authors-writing-guide"
folder: "Guides"
tags: ["Guide", "Markdown", "WritingStandards", "TTS"]
createdAt: "2026-10-24T12:00:00.000Z"
updatedAt: "2026-10-24T12:00:00.000Z"
publicationStatus: "published"
description: "How to craft clean notes with YAML frontmatter, bidirectional wiki-links, syntax-highlighted code blocks, GFM tables, and voice player cues."
readingTimeMinutes: 4
---

# Author's Writing Handbook & Documentation Standards

Welcome to the **Author's Writing Guide** for Vibe Notes. This handbook provides formatting standards and tips for crafting notes that achieve maximum readability, automated backlink indexing, responsive table formatting, and speech-ready text for the built-in Read-Aloud engine.

---

## 1. Structuring Notes with Frontmatter

Every note file in `content/notes/` starts with a YAML frontmatter block:

```yaml
---
id: "note-spring-boot-architecture"
title: "Spring Boot Architecture & Internals"
slug: "spring-boot-architecture"
folder: "Backend Mastery"
tags: ["java", "spring-boot", "architecture"]
publicationStatus: "published"
description: "In-depth guide to Spring Boot auto-configuration, ApplicationContext hierarchy, and bean lifecycles."
---
```

> [!TIP]
> **Quick Capture:** When typing a note title in the editor, typing `#tags` directly in the title input automatically extracts them into the tags list!

---

## 2. Adding Bidirectional Wiki-Links

Vibe Notes supports native internal links:

```markdown
To understand Spring Boot auto-configuration, make sure to review 
[[Getting Started & TODO Checklist]] and [[Keyboard Shortcuts & Cheatsheet]].
```

* **How it renders:**
  - In **Preview mode** and on the **Public Web Reader**, `[[Note Title]]` is automatically converted into an internal hyperlink.
  - The system indexes these links and generates an **Incoming Backlinks** section at the bottom of the target note, revealing relational connections across your knowledge base.

---

## 3. Code Snippets with Syntax Highlighting

Wrap code in triple backticks followed by the language identifier (e.g. `java`, `typescript`, `tsx`, `bash`, `sql`, `python`, `json`):

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findUserById(id));
    }
}
```

**Best Practices for Code Snippets:**
- Keep code blocks focused (10–35 lines).
- Provide a brief 1-line explanatory header or summary above the snippet.

---

## 4. GitHub-Flavored Markdown (GFM) Tables

Use standard ASCII pipe tables:

| Feature | Markdown Syntax | Visual Result |
| :--- | :--- | :--- |
| **Wiki-Link** | `[[Note Title]]` | Clickable link + backlink indexed |
| **Code Block** | ```` ```java ... ``` ```` | Monospace token syntax box |
| **Blockquote** | `> Quote text here` | Left-accented callout container |
| **TOC** | `Auto-generated` | Sticky section navigation index |
| **Bold / Italic** | `**bold**`, `*italic*` | Strong emphasis / italicized |
| **Reading Time** | *Calculated automatically* | WPM based badge (words / 200) |
| **Read Aloud** | *Top bar audio player* | Natural speech narration without code noise |

---

## 5. Callouts, Blockquotes & Alerts

Use standard markdown blockquotes (`>`) to emphasize architectural principles, quotes, or trade-offs:

```markdown
> "Simplicity is prerequisite for reliability."  
> — *Edsger W. Dijkstra*
```

For important caveats or architectural warnings:

```markdown
> ⚠️ **Distributed Transaction Caution:**  
> Avoid two-phase commit (2PC) over cloud microservices due to blocking coordinator locks. Favor the Saga pattern with eventual consistency.
```

---

## 6. Maximizing Readability & Using the Read-Aloud (TTS) Engine

Vibe Notes includes a **Neural Text-to-Speech (TTS) voice player** and a **Silent Plain-Text Copy** engine.

#### Writing Tips for Exceptional Voice Playback:
1. **Use Explicit Headings (`##`, `###`):** The TTS engine naturally inserts pauses between headings, allowing you to listen to your notes like an audiobook while commuting.
2. **Avoid Raw URLs:** 
   - ❌ Bad: `Check out https://github.com/spring-projects/spring-boot for details.` (TTS will speak every slash and dot).
   - ✅ Good: `Check out the [Spring Boot GitHub repository](https://github.com/spring-projects/spring-boot) for details.`
3. **Keep Bullet Points Concise:** Short bullet points with clear bold prefixes read smoothly in audio mode:
   - **Atomicity:** All state changes occur or none do.
   - **Consistency:** Transactions preserve database invariants.
   - **Isolation:** Concurrent transactions execute without cross-talk.
   - **Durability:** Committed transactions survive crashes.
4. **Interactive Controls:**
   - Click the **Play** button in the top toolbar to start audio narration.
   - Use the **Speed selector** (`1.0x` to `3.0x`) with the number input box or presets to adjust listening pace.
   - Use **Copy Plain Text** from the export menu if you prefer pasting into external podcast or screen-reader apps.
