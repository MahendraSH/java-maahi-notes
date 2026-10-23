/**
 * Published content source for the public website.
 *
 * IMPORTANT: This file provides ONLY content explicitly marked as "published".
 * It contains sample fixture data clearly labeled as such.
 * In a production setup, this would read from a published content manifest (e.g., content/published/).
 * Private and local notes are NEVER included here.
 */

import type { Note } from "@vibe-notes/notes-core";
import { createSampleNotes } from "@vibe-notes/notes-core";

/**
 * Returns only notes with publicationStatus === "published".
 * This is the ONLY content boundary for the public website.
 */
export function getPublishedNotes(): Note[] {
  // Sample data fixture — clearly identified.
  // In production, this would read from content/published/ directory or a manifest file.
  const allSampleNotes = createSampleNotes();
  return allSampleNotes.filter((note) => note.publicationStatus === "published");
}

export function getPublishedNoteBySlug(slug: string): Note | undefined {
  return getPublishedNotes().find((note) => note.slug === slug);
}

export function getPublishedNoteSlugs(): string[] {
  return getPublishedNotes().map((note) => note.slug);
}
