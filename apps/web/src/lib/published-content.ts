/**
 * Published content source for the public website.
 *
 * Automatically reads markdown notes directly from content/notes/*.md on disk.
 * Falls back to fixture data if running in an environment without filesystem access.
 */

import fs from "fs";
import path from "path";
import type { Note } from "@vibe-notes/notes-core";
import { createSampleNotes } from "@vibe-notes/notes-core";

function findContentNotesDir(): string | null {
  const candidates = [
    // 1. First check tracked published notes (for Vercel production deployment)
    path.join(process.cwd(), "content/published"),
    path.join(process.cwd(), "../../content/published"),
    path.join(process.cwd(), "../content/published"),
    // 2. Fall back to local notes directory if running in local monorepo
    path.join(process.cwd(), "content/notes"),
    path.join(process.cwd(), "../../content/notes"),
    path.join(process.cwd(), "../content/notes"),
  ];
  for (const c of candidates) {
    // @ts-ignore
    if (fs.existsSync(/*turbopackIgnore: true*/ c)) return c;
  }
  return null;
}

function parseMarkdownNote(raw: string, filename: string): Note | null {
  const slug = filename.replace(/\.md$/, "");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let metadata: Record<string, any> = {};
  let content = raw;

  if (match) {
    const yaml = match[1];
    content = match[2];
    for (const line of yaml.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if (val.startsWith("[") && val.endsWith("]")) {
          metadata[key] = val
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
        } else {
          metadata[key] = val.replace(/^["']|["']$/g, "");
        }
      }
    }
  }

  // Publication status check: default to "published" if not specified
  const status = metadata.publicationStatus || "published";
  if (status !== "published") {
    return null;
  }

  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    id: metadata.id || slug,
    slug: slug,
    title: metadata.title || slug.replace(/-/g, " "),
    folder: metadata.folder || "General",
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    publicationStatus: "published",
    content: content,
    readingTimeMinutes: readingTime,
    description: metadata.description || "",
    createdAt: metadata.createdAt || new Date().toISOString(),
    updatedAt: metadata.updatedAt || new Date().toISOString(),
  };
}

/**
 * Returns all notes with publicationStatus === "published" directly from content/notes/.
 */
export function getPublishedNotes(): Note[] {
  const notesDir = findContentNotesDir();
  // @ts-ignore
  if (notesDir && fs.existsSync(/*turbopackIgnore: true*/ notesDir)) {
    try {
      // @ts-ignore
      const files = fs.readdirSync(/*turbopackIgnore: true*/ notesDir).filter((f) => f.endsWith(".md"));
      const notes: Note[] = [];
      for (const file of files) {
        // @ts-ignore
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ notesDir, file), "utf8");
        const note = parseMarkdownNote(raw, file);
        if (note) notes.push(note);
      }
      if (notes.length > 0) {
        return notes;
      }
    } catch (err) {
      console.warn("Could not read notes from disk, falling back to fixtures:", err);
    }
  }

  // Fallback to sample notes fixture
  const allSampleNotes = createSampleNotes();
  return allSampleNotes.filter((note) => note.publicationStatus === "published");
}

export function getPublishedNoteBySlug(slug: string): Note | undefined {
  return getPublishedNotes().find((note) => note.slug === slug);
}

export function getPublishedNoteSlugs(): string[] {
  return getPublishedNotes().map((note) => note.slug);
}
