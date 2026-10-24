/**
 * @vibe-notes/notes-core
 * Core types, frontmatter/Markdown serialization, path safety, and pure helpers.
 */

export type PublicationStatus = 'local' | 'staged' | 'published';

export interface NoteMetadata {
  id: string;
  title: string;
  slug: string;
  folder: string;
  tags: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publicationStatus: PublicationStatus;
  description?: string;
  readingTimeMinutes?: number;
}

export interface Note extends NoteMetadata {
  content: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentPath: string | null;
  depth: number;
  noteCount: number;
}

export interface Backlink {
  sourceId: string;
  sourceTitle: string;
  sourceSlug: string;
  targetSlug: string;
  snippet: string;
}

export interface SearchResult {
  note: NoteMetadata;
  matchScore: number;
  matchSnippet: string;
  matchedIn: ('title' | 'tag' | 'content')[];
}

export interface PublicationManifest {
  version: string;
  generatedAt: string;
  notes: NoteMetadata[];
}

export const DEFAULT_WORKSPACE_FOLDERS = [
  "Backend Mastery",
  "Frontend Mastery",
  "Architecture",
  "Books",
  "Certificates & Courses",
  "Complete Roadmaps",
  "Miscellaneous",
] as const;

export interface TocItem {
  id: string;
  text: string;
  level: number;
  slug: string;
}

/**
 * Validates path against directory traversal and dangerous characters.
 */
export function isSafePath(pathStr: string): boolean {
  if (!pathStr || typeof pathStr !== 'string') return false;
  if (pathStr.includes('\0')) return false;
  if (pathStr.startsWith('/') || pathStr.startsWith('\\')) return false;
  
  const segments = pathStr.split(/[\/\\]/);
  for (const seg of segments) {
    if (seg === '..' || seg === '.') return false;
    // Check forbidden Windows/Unix characters
    if (/[\<\>\:\"\\\|\?\*]/.test(seg)) return false;
  }
  return true;
}

/**
 * Normalizes title into a clean URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'untitled';
}

/**
 * Calculates estimated reading time in minutes based on 200 WPM.
 */
export function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Parses YAML-style frontmatter from Markdown string.
 */
export function parseFrontmatter(rawContent: string): { metadata: Partial<NoteMetadata>; content: string } {
  if (!rawContent.startsWith('---')) {
    return { metadata: {}, content: rawContent };
  }

  const endIdx = rawContent.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { metadata: {}, content: rawContent };
  }

  const frontmatterBlock = rawContent.slice(3, endIdx).trim();
  const content = rawContent.slice(endIdx + 4).trimStart();
  const metadata: Record<string, any> = {};

  const lines = frontmatterBlock.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (val.startsWith('[') && val.endsWith(']')) {
      // Inline array: [java, spring, interview]
      const items = val.slice(1, -1).split(',').map((item) => {
        let cleaned = item.trim();
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1);
        }
        return cleaned;
      }).filter(Boolean);
      metadata[key] = items;
    } else if (val === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
      // List format
      const items: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
        i++;
        let item = lines[i].trim().slice(1).trim();
        if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
          item = item.slice(1, -1);
        }
        items.push(item);
      }
      metadata[key] = items;
    } else {
      // Strip outer quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val === 'true') metadata[key] = true;
      else if (val === 'false') metadata[key] = false;
      else if (!isNaN(Number(val)) && val !== '') metadata[key] = Number(val);
      else metadata[key] = val;
    }
  }

  // Ensure tags is string[]
  if (!Array.isArray(metadata.tags)) {
    metadata.tags = typeof metadata.tags === 'string' ? [metadata.tags] : [];
  }

  return { metadata: metadata as Partial<NoteMetadata>, content };
}

/**
 * Serializes metadata and Markdown body into a Markdown string with frontmatter.
 */
export function serializeFrontmatter(metadata: Partial<NoteMetadata>, content: string): string {
  const lines = ['---'];
  if (metadata.id) lines.push(`id: "${metadata.id}"`);
  if (metadata.title) lines.push(`title: "${metadata.title.replace(/"/g, '\\"')}"`);
  if (metadata.slug) lines.push(`slug: "${metadata.slug}"`);
  if (metadata.folder !== undefined) lines.push(`folder: "${metadata.folder}"`);
  if (metadata.tags && metadata.tags.length > 0) {
    const formattedTags = metadata.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ');
    lines.push(`tags: [${formattedTags}]`);
  } else {
    lines.push('tags: []');
  }
  if (metadata.createdAt) lines.push(`createdAt: "${metadata.createdAt}"`);
  if (metadata.updatedAt) lines.push(`updatedAt: "${metadata.updatedAt}"`);
  if (metadata.publicationStatus) lines.push(`publicationStatus: "${metadata.publicationStatus}"`);
  if (metadata.description) lines.push(`description: "${metadata.description.replace(/"/g, '\\"')}"`);
  if (metadata.readingTimeMinutes) lines.push(`readingTimeMinutes: ${metadata.readingTimeMinutes}`);
  lines.push('---');
  lines.push('');
  lines.push(content.trim());
  lines.push('');
  return lines.join('\n');
}

/**
 * Extracts note-to-note backlinks (`[[Target Note Title]]` or `[text](/notes/target-slug)`).
 */
export function extractBacklinks(sourceNote: Note, allNotes: Note[]): Backlink[] {
  const backlinks: Backlink[] = [];
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  let match;

  while ((match = wikiLinkRegex.exec(sourceNote.content)) !== null) {
    const targetTitleOrSlug = match[1].trim().toLowerCase();
    const targetNote = allNotes.find(
      (n) => n.title.toLowerCase() === targetTitleOrSlug || n.slug.toLowerCase() === slugify(targetTitleOrSlug)
    );
    if (targetNote && targetNote.id !== sourceNote.id) {
      // Find snippet around match
      const start = Math.max(0, match.index - 30);
      const end = Math.min(sourceNote.content.length, match.index + match[0].length + 30);
      const snippet = '...' + sourceNote.content.slice(start, end).replace(/\n/g, ' ') + '...';

      backlinks.push({
        sourceId: sourceNote.id,
        sourceTitle: sourceNote.title,
        sourceSlug: sourceNote.slug,
        targetSlug: targetNote.slug,
        snippet,
      });
    }
  }

  return backlinks;
}

/**
 * Finds all incoming backlinks pointing to targetNote from other notes in the collection.
 */
export function findIncomingBacklinks(targetNote: Note, allNotes: Note[]): Backlink[] {
  const incoming: Backlink[] = [];
  const targetSlug = targetNote.slug.toLowerCase();

  for (const otherNote of allNotes) {
    if (otherNote.id === targetNote.id) continue;
    const links = extractBacklinks(otherNote, allNotes);
    for (const link of links) {
      if (link.targetSlug === targetSlug) {
        incoming.push(link);
      }
    }
  }

  return incoming;
}


export interface SearchOptions {
  scope?: 'all' | 'title' | 'content' | 'tags';
  folder?: string;
  tag?: string;
  status?: PublicationStatus;
  sortBy?: 'relevance' | 'updated' | 'title';
}

/**
 * Searches notes by title, tags, and markdown content with optional scopes, filters, and smart syntax.
 */
export function searchNotes(
  notes: Note[],
  rawQuery: string,
  options?: SearchOptions
): SearchResult[] {
  let queryText = (rawQuery || '').trim();
  let filterTag = options?.tag;
  let filterFolder = options?.folder;
  let filterStatus = options?.status;
  const scope = options?.scope || 'all';
  const sortBy = options?.sortBy || 'relevance';

  // Smart syntax parsing from search input: tag:xyz, #xyz, folder:xyz, status:xyz
  const tokens = queryText.split(/\s+/).filter(Boolean);
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('tag:')) {
      filterTag = token.slice(4).toLowerCase();
    } else if (token.startsWith('#') && token.length > 1) {
      filterTag = token.slice(1).toLowerCase();
    } else if (token.startsWith('folder:')) {
      filterFolder = token.slice(7);
    } else if (token.startsWith('status:')) {
      const s = token.slice(7).toLowerCase() as PublicationStatus;
      if (s === 'local' || s === 'staged' || s === 'published') {
        filterStatus = s;
      }
    } else {
      remainingTokens.push(token);
    }
  }

  const query = remainingTokens.join(' ').toLowerCase();

  // If no query and no filters, return empty
  if (!query && !filterTag && !filterFolder && !filterStatus) return [];

  const results: SearchResult[] = [];

  for (const note of notes) {
    // Check folder filter
    if (filterFolder) {
      const matchesFolder =
        note.folder.toLowerCase() === filterFolder.toLowerCase() ||
        note.folder.toLowerCase().startsWith(`${filterFolder.toLowerCase()}/`);
      if (!matchesFolder) continue;
    }

    // Check tag filter
    if (filterTag) {
      const hasTag = note.tags.some(
        (t) => t.toLowerCase() === filterTag!.toLowerCase()
      );
      if (!hasTag) continue;
    }

    // Check status filter
    if (filterStatus && note.publicationStatus !== filterStatus) {
      continue;
    }

    let score = 0;
    const matchedIn: ('title' | 'tag' | 'content')[] = [];
    const lowerTitle = note.title.toLowerCase();
    const lowerContent = note.content.toLowerCase();

    if (!query) {
      // Filter-only match
      score = 10;
      matchedIn.push('tag');
    } else {
      // Exact title match gets highest score
      if (scope === 'all' || scope === 'title') {
        if (lowerTitle === query) {
          score += 100;
          matchedIn.push('title');
        } else if (lowerTitle.includes(query)) {
          score += 50;
          matchedIn.push('title');
        }
      }

      // Tag matches
      if (scope === 'all' || scope === 'tags') {
        for (const tag of note.tags) {
          if (tag.toLowerCase() === query) {
            score += 30;
            if (!matchedIn.includes('tag')) matchedIn.push('tag');
          } else if (tag.toLowerCase().includes(query)) {
            score += 15;
            if (!matchedIn.includes('tag')) matchedIn.push('tag');
          }
        }
      }

      // Content match
      if (scope === 'all' || scope === 'content') {
        const contentIndex = lowerContent.indexOf(query);
        if (contentIndex !== -1) {
          score += 10;
          matchedIn.push('content');
        }
      }
    }

    let matchSnippet = '';
    const contentIndex = query ? lowerContent.indexOf(query) : -1;
    if (contentIndex !== -1) {
      const start = Math.max(0, contentIndex - 40);
      const end = Math.min(note.content.length, contentIndex + query.length + 40);
      matchSnippet =
        (start > 0 ? '...' : '') +
        note.content.slice(start, end).replace(/\n/g, ' ') +
        (end < note.content.length ? '...' : '');
    } else {
      matchSnippet =
        note.description || note.content.slice(0, 100).replace(/\n/g, ' ') + '...';
    }

    if (score > 0) {
      results.push({
        note: {
          id: note.id,
          title: note.title,
          slug: note.slug,
          folder: note.folder,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          publicationStatus: note.publicationStatus,
          description: note.description,
          readingTimeMinutes: note.readingTimeMinutes,
        },
        matchScore: score,
        matchSnippet,
        matchedIn,
      });
    }
  }

  // Sort
  if (sortBy === 'updated') {
    return results.sort(
      (a, b) =>
        new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime()
    );
  }
  if (sortBy === 'title') {
    return results.sort((a, b) => a.note.title.localeCompare(b.note.title));
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Builds a structured folder tree from note paths.
 */
export function buildFolderTree(
  notes: { folder: string }[],
  includeDefaults: readonly string[] = []
): FolderItem[] {
  const directCounts: Record<string, number> = {};

  // Seed default folders with 0 count so user can immediately see them
  for (const def of includeDefaults) {
    const rawDef = def ? def.trim().replace(/^\/+|\/+$/g, '') : '';
    if (rawDef) {
      directCounts[rawDef] = 0;
    }
  }

  for (const n of notes) {
    const rawFolder = n.folder ? n.folder.trim().replace(/^\/+|\/+$/g, '') : '';
    const folder = rawFolder || 'General';
    directCounts[folder] = (directCounts[folder] || 0) + 1;
  }

  // Include all ancestor folders
  const allFolderPaths = new Set<string>();
  for (const folder of Object.keys(directCounts)) {
    const segments = folder.split('/');
    let current = '';
    for (const seg of segments) {
      current = current ? `${current}/${seg}` : seg;
      allFolderPaths.add(current);
    }
  }

  const items: FolderItem[] = [];
  for (const path of allFolderPaths) {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;

    // Total note count includes direct notes plus any notes in subpaths
    let totalCount = 0;
    for (const [folder, count] of Object.entries(directCounts)) {
      if (folder === path || folder.startsWith(`${path}/`)) {
        totalCount += count;
      }
    }

    items.push({
      id: path,
      name,
      path,
      parentPath,
      depth: parts.length - 1,
      noteCount: totalCount,
    });
  }

  return items.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Extracts table of contents headings (h1, h2, h3) with clean slugs and anchor IDs.
 */
export function extractTableOfContents(markdown: string): TocItem[] {
  const cleanBody = markdown.replace(/^---[\s\S]*?---\n*/, "");
  const lines = cleanBody.split("\n");
  const toc: TocItem[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim();
      const cleanText = rawText
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[\[(.*?)\]\]/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
      const slug = slugify(cleanText);
      const id = `heading-${slug}`;

      toc.push({
        id,
        text: cleanText,
        level,
        slug,
      });
    }
  }

  return toc;
}

/**
 * Detects if a markdown line starts a table row (| col | col |).
 */
export function isMarkdownTableStart(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|");
}

/**
 * Detects if a markdown line is a table header separator (|---|---|).
 */
export function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  const parts = trimmed
    .slice(1, -1)
    .split("|")
    .map((p) => p.trim());
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p));
}


/**
 * Universal starter onboarding notes for developers downloading Vibe Notes.
 */
export function createSampleNotes(): Note[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'getting-started-and-todo',
      title: 'Getting Started & TODO Checklist',
      slug: 'getting-started-and-todo',
      folder: 'General',
      tags: ['GettingStarted', 'Onboarding', 'Todo'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'published',
      readingTimeMinutes: 3,
      description: 'Quickstart checklist to set up your technical knowledge workspace, write your first notes, and publish to Vercel.',
      content: `# Getting Started & TODO Checklist

Welcome to **Vibe Notes** — your personal, local-first technical knowledge base.

Use this checklist to get familiar with the workspace and publish your first article:

## 🚀 Onboarding Tasks
- [ ] Explore the workspace dashboard using **⌘ I** (or click Back to Index)
- [ ] Create your first note using **⌘ N** or the **+ New Note** button
- [ ] Organize your thoughts into folders (e.g. \`Engineering/Backend\`, \`SystemDesign\`, \`DailyLog\`)
- [ ] Add tags with the real-time autocomplete picker
- [ ] Try bidirectional linking by typing \`[[Keyboard Shortcuts & Cheatsheet]]\`
- [ ] Mark this note or your new note as **Published** to make it visible on the public site
- [ ] Run \`yarn build:web\` or deploy to Vercel with \`vercel\` to publish your digital garden

## 💡 How Vibe Notes Works
1. **Local-First & Private:** All notes are saved as plain \`.md\` files directly to \`content/notes/\` on your disk.
2. **3-Tier Publishing:**
   - \`local\`: Private draft, never leaves your machine.
   - \`staged\`: Ready for your personal review.
   - \`published\`: Publicly visible in the web reader and exported to static HTML on Vercel.
3. **Multi-Format Export:** Need to read on other tools? Use 1-click **Copy Plain Text**, **Copy HTML**, or **Save PDF** from the top bar.
`,
    },
    {
      id: 'keyboard-shortcuts-and-cheatsheet',
      title: 'Keyboard Shortcuts & Cheatsheet',
      slug: 'keyboard-shortcuts-and-cheatsheet',
      folder: 'Guides',
      tags: ['Cheatsheet', 'Hotkeys', 'Markdown'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'published',
      readingTimeMinutes: 3,
      description: 'Master keyboard-first navigation with ⌘K fuzzy search, ⌘N new note, and complete markdown formatting reference.',
      content: `# Keyboard Shortcuts & Cheatsheet

Vibe Notes is designed keyboard-first so you can capture, search, and navigate your technical knowledge at terminal speed.

## ⌨️ Global Shortcuts
- **⌘ K** / **Ctrl + K** — Open Fuzzy Search command palette (search titles, folders, #tags, or content)
- **⌘ N** / **Ctrl + N** — Create a new note in the current folder
- **⌘ E** / **Ctrl + E** — Toggle between Markdown Editor and Rendered Preview
- **⌘ I** / **Ctrl + I** — Jump back to the Workspace Index Dashboard
- **⌘ B** / **Ctrl + B** — Toggle Sidebar open/collapsed
- **⌘ P** / **Ctrl + P** — Open Publishing Safety Boundary review hub
- **?** / **Shift + /** — Open Documentation & Video Walkthroughs modal
- **Esc** — Close modals or return to index

## 📝 Markdown Syntax Support
- **Bold text** with \`**bold**\` and *italic* with \`*italic*\`
- \`inline code\` for commands, classes, and variables
- Code blocks with syntax highlighting for any language:
\`\`\`typescript
const greeting = "Hello, Vibe Notes!";
console.log(greeting);
\`\`\`
- Wiki-links: Link other notes using \`[[Getting Started & TODO Checklist]]\`
- Blockquotes:
> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

## 📤 Silent Copy & Export
- **Copy Text:** Strips all markdown noise for external screen readers and personal speech tools.
- **Copy HTML:** Clean semantic HTML document with styles.
- **Print / PDF:** Clean paper-optimized print layout.
- **Download .md:** Download raw markdown file with YAML frontmatter.
`,
    },
    {
      id: 'my-first-note',
      title: 'My First Note',
      slug: 'my-first-note',
      folder: 'Drafts',
      tags: ['Draft', 'Ideas'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'local',
      readingTimeMinutes: 1,
      description: 'Your canvas to start writing technical notes, snippets, or system design thoughts.',
      content: `# My First Note

Start typing your notes, system architecture designs, or code snippets here...

## Key Ideas
- Add code examples for any programming language (Java, Go, Rust, Python, TypeScript)
- Use #tags or folders to organize your knowledge
- Link to [[Getting Started & TODO Checklist]]
`,
    },
    {
      id: 'authors-writing-guide',
      title: "Author's Writing Handbook & Documentation Standards",
      slug: 'authors-writing-guide',
      folder: 'Guides',
      tags: ['Guide', 'Markdown', 'WritingStandards', 'TTS'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'published',
      readingTimeMinutes: 4,
      description: 'How to craft clean notes with YAML frontmatter, wiki-links, code blocks with syntax highlighting, GFM tables, and voice player cues.',
      content: `# Author's Writing Handbook & Documentation Standards

Welcome to the **Author's Writing Guide** for Vibe Notes. This handbook details formatting standards for maximum readability, relational backlinks, and audio narration.

## 1. Structuring Notes with Frontmatter
Every note in \`content/notes/\` starts with YAML frontmatter:
\`\`\`yaml
---
id: "note-spring-boot-architecture"
title: "Spring Boot Architecture & Internals"
slug: "spring-boot-architecture"
folder: "Backend Mastery"
tags: ["java", "spring-boot", "architecture"]
publicationStatus: "published"
description: "In-depth guide to Spring Boot auto-configuration and bean lifecycles."
---
\`\`\`

## 2. Adding Bidirectional Wiki-Links
Vibe Notes supports native internal links:
\`\`\`markdown
Review [[Getting Started & TODO Checklist]] and [[Keyboard Shortcuts & Cheatsheet]].
\`\`\`
- Renders as interactive navigation button.
- Automatically indexed into incoming and outgoing backlinks.

## 3. Code Snippets with Syntax Highlighting
Specify the language identifier after triple backticks:
\`\`\`java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }
}
\`\`\`

## 4. GitHub-Flavored Markdown (GFM) Tables
Use ASCII pipe formatting with headers and separator:
| Feature | Syntax | Output |
| :--- | :--- | :--- |
| **Wiki-Link** | \`[[Note Title]]\` | Interactive link |
| **Code Block** | \`\`\`java ... \`\`\` | Token highlighted block |
| **Callout** | \`> Alert text\` | Left-accented quote |
| **TOC** | Auto-generated | Sticky section index |

## 5. Callouts & Blockquotes
> "Simplicity is prerequisite for reliability."  
> — *Edsger W. Dijkstra*

## 6. Read-Aloud (TTS) Optimization
1. Use clear \`##\` and \`###\` headings for natural breath pauses.
2. Avoid raw URLs; use descriptive anchor text like [Spring Boot](https://spring.io).
3. Code snippets are replaced with polite cues like: *"[Code snippet in Java. Pausing to review.]"*.
`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Export & Screen Reader Formatting Utilities                       */
/* ------------------------------------------------------------------ */

/**
 * Strips markdown syntax, frontmatter, and code blocks for clean plain-text
 * reading or pasting into external TTS/screen-reader tools.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---\n*/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Formats markdown specifically for Speech Synthesis / TTS tools,
 * inserting polite cues for code snippets instead of raw code syntax.
 */
export function markdownToTtsScript(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---\n*/, "")
    .replace(/```([a-zA-Z0-9_-]*)\n[\s\S]*?```/g, "\n[Code snippet in $1. Pausing to review.]\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Converts note markdown into clean semantic HTML with standalone CSS
 * for easy copying to clipboard or exporting as formatted HTML.
 */
export function markdownToHtml(markdown: string, title: string): string {
  const cleanBody = markdown.replace(/^---[\s\S]*?---\n*/, "");
  const lines = cleanBody.split("\n");
  const htmlParts: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        htmlParts.push(`<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;"><code>${codeLines.join("\n")}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    if (line.startsWith("### ")) {
      htmlParts.push(`<h3>${escapeAndFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      htmlParts.push(`<h2>${escapeAndFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      htmlParts.push(`<h1>${escapeAndFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith("> ")) {
      htmlParts.push(`<blockquote style="border-left:3px solid #f97316;padding-left:12px;color:#888;">${escapeAndFormat(line.slice(2))}</blockquote>`);
    } else if (line.trim()) {
      htmlParts.push(`<p>${escapeAndFormat(line)}</p>`);
    }
  }

  if (inCode) {
    htmlParts.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; }
h1, h2, h3 { color: #111; }
code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; font-family: monospace; }
pre code { background: none; padding: 0; }
</style>
</head>
<body>
<h1>${title}</h1>
${htmlParts.join("\n")}
</body>
</html>`;
}

function escapeAndFormat(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[\[(.*?)\]\]/g, "<u>$1</u>");
}
