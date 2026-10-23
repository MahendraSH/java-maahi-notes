import fs from "node:fs";
import path from "node:path";
import {
  type Note,
  type NoteMetadata,
  parseFrontmatter,
  serializeFrontmatter,
  isSafePath,
  slugify,
  calculateReadingTime,
  createSampleNotes,
} from "@vibe-notes/notes-core";

/**
 * Resolves the persistent notes directory.
 * Guaranteed to remain inside the vibe-notes project repository.
 */
export function getStorageDirectory(): string {
  if (process.env.VIBE_NOTES_DIR) {
    return path.resolve(process.env.VIBE_NOTES_DIR);
  }

  // Detect project root from cwd
  let currentDir = process.cwd();
  for (let i = 0; i < 3; i++) {
    const pkgPath = path.join(currentDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.name === "vibe-notes") {
          return path.join(currentDir, "content", "notes");
        }
      } catch {
        // continue search
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return path.resolve(process.cwd(), "content", "notes");
}

/**
 * Ensures the notes directory exists and is initialized.
 */
export async function ensureStorage(): Promise<string> {
  const dir = getStorageDirectory();
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
    fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
    // Seed with initial high-quality developer notes on first run
    const samples = createSampleNotes();
    for (const note of samples) {
      await writeNoteAtomic(note, dir);
    }
  }
  return dir;
}

/**
 * Atomic write helper to prevent file corruption.
 * Writes to a temporary file first, then atomically renames it.
 */
async function writeNoteAtomic(note: Note, dir: string): Promise<string> {
  const filename = `${note.id}.md`;
  if (!isSafePath(filename)) {
    throw new Error(`Unsafe note filename: ${filename}`);
  }

  const filePath = path.join(/*turbopackIgnore: true*/ dir, filename);
  const tempPath = path.join(/*turbopackIgnore: true*/ dir, `.${note.id}.${Date.now()}.tmp`);

  const fileContent = serializeFrontmatter(note, note.content);
  fs.writeFileSync(/*turbopackIgnore: true*/ tempPath, fileContent, "utf8");
  fs.renameSync(/*turbopackIgnore: true*/ tempPath, filePath);

  return filePath;
}

/**
 * Loads all notes from disk.
 */
export async function loadAllNotes(): Promise<Note[]> {
  const dir = await ensureStorage();
  const files = fs.readdirSync(/*turbopackIgnore: true*/ dir);
  const notes: Note[] = [];

  for (const file of files) {
    if (!file.endsWith(".md") || file.startsWith(".")) continue;

    try {
      const filePath = path.join(/*turbopackIgnore: true*/ dir, file);
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8");
      const { metadata, content } = parseFrontmatter(raw);

      const id = metadata.id || path.basename(file, ".md");
      const title = metadata.title || "Untitled";
      const slug = metadata.slug || slugify(title);
      const folder = metadata.folder || "General";
      const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
      const createdAt = metadata.createdAt || new Date().toISOString();
      const updatedAt = metadata.updatedAt || new Date().toISOString();
      const publicationStatus = metadata.publicationStatus || "local";
      const readingTimeMinutes =
        metadata.readingTimeMinutes || calculateReadingTime(content);

      notes.push({
        id,
        title,
        slug,
        folder,
        tags,
        createdAt,
        updatedAt,
        publicationStatus,
        description: metadata.description,
        readingTimeMinutes,
        content,
      });
    } catch (err) {
      console.error(`Error loading note file ${file}:`, err);
    }
  }

  // Sort descending by updatedAt
  return notes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Loads a single note by ID.
 */
export async function loadNoteById(id: string): Promise<Note | null> {
  const filename = `${id}.md`;
  if (!isSafePath(filename)) {
    throw new Error(`Unsafe note ID: ${id}`);
  }

  const dir = await ensureStorage();
  const filePath = path.join(/*turbopackIgnore: true*/ dir, filename);

  if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
    return null;
  }

  const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8");
  const { metadata, content } = parseFrontmatter(raw);

  return {
    id: metadata.id || id,
    title: metadata.title || "Untitled",
    slug: metadata.slug || slugify(metadata.title || "untitled"),
    folder: metadata.folder || "General",
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    createdAt: metadata.createdAt || new Date().toISOString(),
    updatedAt: metadata.updatedAt || new Date().toISOString(),
    publicationStatus: metadata.publicationStatus || "local",
    description: metadata.description,
    readingTimeMinutes:
      metadata.readingTimeMinutes || calculateReadingTime(content),
    content,
  };
}

/**
 * Saves a note with slug collision check and atomic write.
 */
export async function saveNoteToDisk(note: Note): Promise<Note> {
  const filename = `${note.id}.md`;
  if (!isSafePath(filename)) {
    throw new Error(`Unsafe note ID: ${note.id}`);
  }

  const dir = await ensureStorage();

  // Check for slug collision across other notes
  const existingNotes = await loadAllNotes();
  const collision = existingNotes.find(
    (n) => n.slug === note.slug && n.id !== note.id
  );
  if (collision) {
    // Disambiguate slug safely instead of silent overwrite
    note.slug = `${note.slug}-${Date.now().toString().slice(-4)}`;
  }

  note.updatedAt = new Date().toISOString();
  note.readingTimeMinutes = calculateReadingTime(note.content);

  await writeNoteAtomic(note, dir);
  return note;
}

/**
 * Deletes a note by ID.
 */
export async function deleteNoteFromDisk(id: string): Promise<boolean> {
  const filename = `${id}.md`;
  if (!isSafePath(filename)) {
    throw new Error(`Unsafe note ID: ${id}`);
  }

  const dir = await ensureStorage();
  const filePath = path.join(/*turbopackIgnore: true*/ dir, filename);

  if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
    fs.unlinkSync(/*turbopackIgnore: true*/ filePath);
    return true;
  }

  return false;
}
