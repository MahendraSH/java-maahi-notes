import test from "node:test";
import assert from "node:assert";
import {
  isSafePath,
  slugify,
  calculateReadingTime,
  parseFrontmatter,
  serializeFrontmatter,
  searchNotes,
  buildFolderTree,
  extractBacklinks,
  findIncomingBacklinks,
  extractTableOfContents,
  isMarkdownTableStart,
  isMarkdownTableSeparator,
  parseMarkdownBlocks,
  type Note,
} from "../src/index.ts";

test("isSafePath prevents path traversal and unsafe filenames", () => {
  // Safe relative paths
  assert.strictEqual(isSafePath("notes/my-note.md"), true);
  assert.strictEqual(isSafePath("folder/subfolder/note.md"), true);
  assert.strictEqual(isSafePath("my-note.md"), true);

  // Unsafe paths
  assert.strictEqual(isSafePath("../secret.txt"), false);
  assert.strictEqual(isSafePath("folder/../../secret.txt"), false);
  assert.strictEqual(isSafePath("/etc/passwd"), false);
  assert.strictEqual(isSafePath("\\Windows\\System32"), false);
  assert.strictEqual(isSafePath("file\0name.md"), false);
  assert.strictEqual(isSafePath("folder/./note.md"), false);
  assert.strictEqual(isSafePath("file:name.md"), false);
  assert.strictEqual(isSafePath("file*name.md"), false);
  assert.strictEqual(isSafePath("file<name>.md"), false);
  assert.strictEqual(isSafePath(""), false);
});

test("slugify generates clean URL-safe slugs", () => {
  assert.strictEqual(slugify("Hello World!"), "hello-world");
  assert.strictEqual(slugify("Java Concurrency: Threads & Locks"), "java-concurrency-threads-locks");
  assert.strictEqual(slugify("   multiple   spaces   "), "multiple-spaces");
  assert.strictEqual(slugify("Special #$% Characters!"), "special-characters");
  assert.strictEqual(slugify(""), "untitled");
});

test("calculateReadingTime computes accurate estimates", () => {
  assert.strictEqual(calculateReadingTime("short note"), 1);
  const words250 = new Array(250).fill("word").join(" ");
  assert.strictEqual(calculateReadingTime(words250), 2);
});

test("parseFrontmatter and serializeFrontmatter roundtrip cleanly", () => {
  const metadata = {
    id: "note-123",
    title: "Java Memory Model",
    slug: "java-memory-model",
    folder: "Java/Core",
    tags: ["java", "jvm", "concurrency"],
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T12:00:00.000Z",
    publicationStatus: "published" as const,
    description: "Deep dive into JMM",
    readingTimeMinutes: 5,
  };
  const body = "# Java Memory Model\n\nContent goes here with **bold** text.";

  const serialized = serializeFrontmatter(metadata, body);
  assert.ok(serialized.startsWith("---\n"));
  assert.ok(serialized.includes('title: "Java Memory Model"'));
  assert.ok(serialized.includes('tags: ["java", "jvm", "concurrency"]'));

  const parsed = parseFrontmatter(serialized);
  assert.strictEqual(parsed.metadata.id, metadata.id);
  assert.strictEqual(parsed.metadata.title, metadata.title);
  assert.strictEqual(parsed.metadata.slug, metadata.slug);
  assert.strictEqual(parsed.metadata.folder, metadata.folder);
  assert.deepStrictEqual(parsed.metadata.tags, metadata.tags);
  assert.strictEqual(parsed.metadata.publicationStatus, metadata.publicationStatus);
  assert.strictEqual(parsed.content.trim(), body.trim());
});

test("extractBacklinks detects wiki-links to existing notes", () => {
  const note1: Note = {
    id: "n1",
    title: "Spring Boot Basics",
    slug: "spring-boot-basics",
    folder: "Spring",
    tags: ["spring"],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    publicationStatus: "local",
    content: "See also [[Java Concurrency]] for async handling.",
  };

  const note2: Note = {
    id: "n2",
    title: "Java Concurrency",
    slug: "java-concurrency",
    folder: "Java",
    tags: ["java"],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    publicationStatus: "local",
    content: "Covers threads and locks.",
  };

  const backlinks = extractBacklinks(note1, [note1, note2]);
  assert.strictEqual(backlinks.length, 1);
  assert.strictEqual(backlinks[0].targetSlug, "java-concurrency");
  assert.strictEqual(backlinks[0].sourceId, "n1");

  const incomingToNote2 = findIncomingBacklinks(note2, [note1, note2]);
  assert.strictEqual(incomingToNote2.length, 1);
  assert.strictEqual(incomingToNote2[0].sourceTitle, "Spring Boot Basics");
  assert.strictEqual(incomingToNote2[0].sourceSlug, "spring-boot-basics");
});

test("searchNotes scores title, tag, and content matches", () => {
  const notes: Note[] = [
    {
      id: "n1",
      title: "Kafka Architecture",
      slug: "kafka-architecture",
      folder: "Distributed Systems",
      tags: ["messaging", "streaming"],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      publicationStatus: "published",
      content: "Apache Kafka uses consumer groups and partitions.",
    },
    {
      id: "n2",
      title: "Spring Security OAuth2",
      slug: "spring-security-oauth2",
      folder: "Spring",
      tags: ["security", "auth"],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      publicationStatus: "local",
      content: "Authentication using JWT tokens.",
    },
  ];

  const titleResults = searchNotes(notes, "Kafka");
  assert.strictEqual(titleResults.length, 1);
  assert.strictEqual(titleResults[0].note.title, "Kafka Architecture");
  assert.ok(titleResults[0].matchedIn.includes("title"));

  const tagResults = searchNotes(notes, "security");
  assert.strictEqual(tagResults.length, 1);
  assert.strictEqual(tagResults[0].note.title, "Spring Security OAuth2");
  assert.ok(tagResults[0].matchedIn.includes("tag"));

  const contentResults = searchNotes(notes, "consumer groups");
  assert.strictEqual(contentResults.length, 1);
  assert.strictEqual(contentResults[0].note.title, "Kafka Architecture");
  assert.ok(contentResults[0].matchedIn.includes("content"));
});

test("buildFolderTree creates nested structure and counts notes", () => {
  const notes = [
    { folder: "Java/Core" },
    { folder: "Java/Core" },
    { folder: "Java/Concurrency" },
    { folder: "Spring/Boot" },
    { folder: "General" },
  ];

  const tree = buildFolderTree(notes);
  const javaFolder = tree.find((f) => f.path === "Java");
  assert.ok(javaFolder, "Java root folder exists");
  assert.strictEqual(javaFolder?.noteCount, 3);

  const springFolder = tree.find((f) => f.path === "Spring");
  assert.ok(springFolder, "Spring root folder exists");
  assert.strictEqual(springFolder?.noteCount, 1);
});

test("buildFolderTree incorporates includeDefaults properly", () => {
  const notes = [{ folder: "Backend Mastery" }];
  const defaults = ["Backend Mastery", "Frontend Mastery", "Architecture"] as const;

  const tree = buildFolderTree(notes, defaults);
  assert.strictEqual(tree.length, 3);
  const backend = tree.find((f) => f.path === "Backend Mastery");
  assert.strictEqual(backend?.noteCount, 1);
  const frontend = tree.find((f) => f.path === "Frontend Mastery");
  assert.strictEqual(frontend?.noteCount, 0);
  const arch = tree.find((f) => f.path === "Architecture");
  assert.strictEqual(arch?.noteCount, 0);
});

test("extractTableOfContents extracts headings and creates valid IDs", () => {
  const md = `# Title\n\nSome text.\n\n## Subheading 1\n\nParagraph\n\n### Nested Deep\n\n\`\`\`ts\n## Not a heading\n\`\`\`\n\n## Subheading 2\n`;
  const toc = extractTableOfContents(md);
  assert.strictEqual(toc.length, 4);
  assert.strictEqual(toc[0].text, "Title");
  assert.strictEqual(toc[0].level, 1);
  assert.strictEqual(toc[1].text, "Subheading 1");
  assert.strictEqual(toc[1].level, 2);
  assert.strictEqual(toc[1].id, "heading-subheading-1");
  assert.strictEqual(toc[2].text, "Nested Deep");
  assert.strictEqual(toc[2].level, 3);
  assert.strictEqual(toc[3].text, "Subheading 2");
});

test("isMarkdownTableStart and isMarkdownTableSeparator accurately identify tables", () => {
  assert.strictEqual(isMarkdownTableStart("| Header 1 | Header 2 |"), true);
  assert.strictEqual(isMarkdownTableStart("| col |"), true);
  assert.strictEqual(isMarkdownTableStart("Not a table"), false);
  assert.strictEqual(isMarkdownTableStart("| unclosed"), false);

  assert.strictEqual(isMarkdownTableSeparator("|---|---|"), true);
  assert.strictEqual(isMarkdownTableSeparator("| :--- | :---: | ---: |"), true);
  assert.strictEqual(isMarkdownTableSeparator("| row 1 | row 2 |"), false);
});

test("parseMarkdownBlocks extracts structured blocks and sentences with words", () => {
  const md = `---
title: Test Note
---

# Introduction to Vibe

This is the first sentence. Here is another sentence with **bold text**!

\`\`\`typescript
const x = 42;
\`\`\`

> A wise quote. Another line.

- Item number one.
- Item number two.

| Col A | Col B |
|---|---|
| Val 1 | Val 2 |
`;

  const { blocks, sentences } = parseMarkdownBlocks(md);

  assert.strictEqual(blocks.length > 0, true);
  assert.strictEqual(sentences.length >= 6, true);

  // Check heading sentence
  assert.strictEqual(sentences[0].index, 0);
  assert.strictEqual(sentences[0].text, "Introduction to Vibe");
  assert.strictEqual(sentences[0].cleanText, "Introduction to Vibe");
  assert.deepStrictEqual(sentences[0].words, ["Introduction", "to", "Vibe"]);

  // Check paragraph sentences
  assert.strictEqual(sentences[1].index, 1);
  assert.strictEqual(sentences[1].cleanText, "This is the first sentence.");
  assert.strictEqual(sentences[2].index, 2);
  assert.strictEqual(sentences[2].cleanText, "Here is another sentence with bold text!");

  // Check code block pause cue
  const codeSent = sentences.find((s) => s.isCodeBlock);
  assert.ok(codeSent);
  assert.strictEqual(codeSent.lang, "typescript");
  assert.strictEqual(codeSent.cleanText, "Code example in typescript. Pausing to review.");
});



