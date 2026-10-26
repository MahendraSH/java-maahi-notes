---
id: "authors-writing-guide"
title: "Author's Writing Handbook & Documentation Standards"
slug: "authors-writing-guide"
folder: "Guides"
tags: ["Guide", "WritingStandards"]
createdAt: "2026-10-24T09:17:33.184Z"
updatedAt: "2026-10-24T09:19:04.501Z"
publicationStatus: "published"
description: "How to craft clean notes with YAML frontmatter, wiki-links, code blocks with syntax highlighting, GFM tables, and voice player cues."
readingTimeMinutes: 2
---

# Author's Writing Handbook & Documentation Standards

Welcome to the **Author's Writing Guide** for Vibe Notes. This handbook details formatting standards for maximum readability, relational backlinks, and audio narration.

## 1. Structuring Notes with Frontmatter
Every note in `content/notes/` starts with YAML frontmatter:
```yaml
---
id: "note-spring-boot-architecture"
title: "Spring Boot Architecture & Internals"
slug: "spring-boot-architecture"
folder: "Backend Mastery"
tags: ["java", "spring-boot", "architecture"]
publicationStatus: "published"
description: "In-depth guide to Spring Boot auto-configuration and bean lifecycles."
---
```

## 2. Adding Bidirectional Wiki-Links
Vibe Notes supports native internal links:
```markdown
Review [[Getting Started & TODO Checklist]] and [[Keyboard Shortcuts & Cheatsheet]].
```
- Renders as interactive navigation button.
- Automatically indexed into incoming and outgoing backlinks.

## 3. Code Snippets with Syntax Highlighting
Specify the language identifier after triple backticks:
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

## 4. GitHub-Flavored Markdown (GFM) Tables
Use ASCII pipe formatting with headers and separator:
| Feature | Syntax | Output |
| :--- | :--- | :--- |
| **Wiki-Link** | `[[Note Title]]` | Interactive link |
| **Code Block** | ```java ... ``` | Token highlighted block |
| **Callout** | `> Alert text` | Left-accented quote |
| **TOC** | Auto-generated | Sticky section index |

## 5. Callouts & Blockquotes
> "Simplicity is prerequisite for reliability."  
> — *Edsger W. Dijkstra*

## 6. Read-Aloud (TTS) Optimization
1. Use clear `##` and `###` headings for natural breath pauses.
2. Avoid raw URLs; use descriptive anchor text like [Spring Boot](https://spring.io).
3. Code snippets are replaced with polite cues like: *"[Code snippet in Java. Pausing to review.]"*.
