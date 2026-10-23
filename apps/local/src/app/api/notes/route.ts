import { NextResponse } from "next/server";
import { loadAllNotes, saveNoteToDisk } from "@/lib/storage";
import { isSafePath, type Note } from "@vibe-notes/notes-core";

export async function GET() {
  try {
    const notes = await loadAllNotes();
    return NextResponse.json({ notes, total: notes.length });
  } catch (err: any) {
    console.error("API GET /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to load notes", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Note;
    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Invalid note payload. 'id' is required." },
        { status: 400 }
      );
    }

    if (!isSafePath(`${body.id}.md`)) {
      return NextResponse.json(
        { error: "Unsafe note ID or path traversal detected." },
        { status: 400 }
      );
    }

    const saved = await saveNoteToDisk(body);
    return NextResponse.json({ note: saved, success: true });
  } catch (err: any) {
    console.error("API POST /api/notes error:", err);
    return NextResponse.json(
      { error: "Failed to save note", details: err?.message },
      { status: 500 }
    );
  }
}
