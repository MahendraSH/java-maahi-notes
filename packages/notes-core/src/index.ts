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
export function buildFolderTree(notes: { folder: string }[]): FolderItem[] {
  const directCounts: Record<string, number> = {};

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
 * High-quality seed notes for Java & Full-Stack engineering, Interview prep, and Markdown guides.
 */
export function createSampleNotes(): Note[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'java-concurrency-deep-dive',
      title: 'Java Concurrency & Memory Model (JMM)',
      slug: 'java-concurrency-deep-dive',
      folder: 'Java/Internals',
      tags: ['Java', 'Concurrency', 'JVM', 'MultiThreading', 'Interview'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'published',
      readingTimeMinutes: 5,
      description: 'Key principles of the Java Memory Model, happens-before relationship, volatile semantics, and CAS atomics.',
      content: `# Java Concurrency & Memory Model (JMM)

Understanding the **Java Memory Model (JMM)** is essential for high-performance backend systems and senior Java technical interviews.

## 1. Happens-Before Guarantee
The JMM defines when writes to a shared variable by one thread become visible to reads by another thread.

- **Program Order Rule**: Each action in a single thread happens-before every action that comes later in program order.
- **Monitor Lock Rule**: An unlock on a monitor lock happens-before every subsequent lock on that same monitor.
- **Volatile Variable Rule**: A write to a \`volatile\` field happens-before every subsequent read of that field.
- **Thread Start & Join Rules**: \`Thread.start()\` happens-before any action in the started thread; any action in a thread happens-before \`Thread.join()\` returns.

## 2. Volatile Semantics
\`volatile\` guarantees:
1. **Visibility**: Any thread reading a volatile variable sees the most recent write.
2. **Instruction Reordering Prevention**: Memory barriers (LoadLoad, LoadStore, StoreStore, StoreLoad) prevent the JIT/CPU from reordering instructions across the boundary.

\`\`\`java
public class DoubleCheckedLocking {
    // Crucial: volatile prevents partially initialized object publication
    private static volatile DoubleCheckedLocking instance;

    private DoubleCheckedLocking() {}

    public static DoubleCheckedLocking getInstance() {
        if (instance == null) {
            synchronized (DoubleCheckedLocking.class) {
                if (instance == null) {
                    instance = new DoubleCheckedLocking();
                }
            }
        }
        return instance;
    }
}
\`\`\`

## 3. Compare-And-Swap (CAS) & Atomic Operations
Lock-free concurrency utilizes CPU atomic primitives like \`CMPXCHG\`. Classes like \`AtomicInteger\` and \`ConcurrentHashMap\` rely on \`VarHandle\` / \`Unsafe\` for non-blocking state transitions.

See related notes: [[Spring Boot Architecture & Lifecycle]] and [[Fullstack System Design Patterns]].
`,
    },
    {
      id: 'spring-boot-architecture',
      title: 'Spring Boot Architecture & Lifecycle',
      slug: 'spring-boot-architecture',
      folder: 'Java/Spring',
      tags: ['Spring Boot', 'Architecture', 'DependencyInjection', 'Java'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'published',
      readingTimeMinutes: 4,
      description: 'ApplicationContext initialization, Bean post-processors, and production-grade REST design.',
      content: `# Spring Boot Architecture & Lifecycle

Spring Boot streamlines production Java microservices by wrapping the **Spring ApplicationContext** with opinionated auto-configuration.

## ApplicationContext Startup Sequence
1. **Environment Preparation**: Resolves \`application.yml\`, system properties, and active profiles.
2. **Context Creation**: Instantiates \`AnnotationConfigServletWebServerApplicationContext\`.
3. **BeanFactoryPostProcessors**: Scans component packages, parses \`@Configuration\` and \`@Bean\` definitions.
4. **Bean Post Processing**: Applies AOP proxies, transaction interceptors (\`@Transactional\`), and validation decorators.
5. **Embedded Servlet WebServer**: Bootstraps Tomcat / Jetty / Netty on the configured port.

## Code Example: Safe Service Boundary
\`\`\`java
@Service
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;

    public NoteService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @Transactional
    public NoteDto createNote(CreateNoteCommand command) {
        var entity = Note.builder()
            .title(command.title())
            .content(command.content())
            .folder(command.folder())
            .build();
        return NoteDto.fromEntity(noteRepository.save(entity));
    }
}
\`\`\`

Refer back to [[Java Concurrency & Memory Model (JMM)]] for thread safety inside singleton Spring beans.
`,
    },
    {
      id: 'fullstack-system-design',
      title: 'Fullstack System Design Patterns',
      slug: 'fullstack-system-design',
      folder: 'SystemDesign',
      tags: ['SystemDesign', 'Architecture', 'Microservices', 'Caching'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'staged',
      readingTimeMinutes: 4,
      description: 'Distributed caching, event-driven decoupled systems, and data consistency models.',
      content: `# Fullstack System Design Patterns

Key architectural blueprints for resilient, scalable fullstack applications.

## 1. Cache-Aside Pattern
- Application checks Redis/Memcached first.
- On cache miss, fetch from PostgreSQL/MySQL, populate cache with TTL, and return.
- On updates, invalidate cache key rather than eager rewrite to prevent race conditions.

## 2. CQRS (Command Query Responsibility Segregation)
- Separate read queries from write mutations.
- Enables optimized read projections (ElasticSearch or materialized views) while keeping write transactions lean and ACID-compliant.

## 3. Local-First Architecture
Applications like **Vibe Notes** prioritize:
- **Zero latency**: Instant UI updates against local storage or embedded SQLite/Markdown files.
- **Resilience**: Operates without network connectivity.
- **Explicit sync**: Separates local drafting from public publishing.
`,
    },
    {
      id: 'vibe-notes-markdown-guide',
      title: 'Vibe Notes Markdown & Cheatsheet',
      slug: 'vibe-notes-markdown-guide',
      folder: 'Guides',
      tags: ['Markdown', 'Guides', 'VibeNotes'],
      createdAt: now,
      updatedAt: now,
      publicationStatus: 'local',
      readingTimeMinutes: 3,
      description: 'Interactive guide to Markdown syntax, code snippets, and cross-note linking in Vibe Notes.',
      content: `# Vibe Notes Markdown & Cheatsheet

Welcome to **Vibe Notes**, your developer-focused knowledge workspace!

## Rich Markdown Formatting
- **Bold text** and *italicized emphasis*
- \`inline code\` for identifiers and CLI commands
- Blockquotes for important callouts

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

## Code Blocks with Java and TypeScript
\`\`\`typescript
interface VibeNote {
  title: string;
  tags: string[];
  status: 'local' | 'staged' | 'published';
}
\`\`\`

## Note-to-Note Wiki Links
You can link notes using double brackets like:
- [[Java Concurrency & Memory Model (JMM)]]
- [[Spring Boot Architecture & Lifecycle]]

All private notes remain local by default. Click **Publish** only when ready to push to your public web knowledge site!
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
