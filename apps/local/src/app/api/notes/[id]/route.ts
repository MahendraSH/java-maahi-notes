import { NextResponse } from "next/server";
import { loadNoteById, saveNoteToDisk, deleteNoteFromDisk } from "@/lib/storage";
import { isSafePath, type Note } from "@vibe-notes/notes-core";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!id || !isSafePath(`${id}.md`)) {
    return NextResponse.json(
      { error: "Invalid or unsafe note ID." },
      { status: 400 }
    );
  }

  try {
    const note = await loadNoteById(id);
    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to read note", details: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!id || !isSafePath(`${id}.md`)) {
    return NextResponse.json(
      { error: "Invalid or unsafe note ID." },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json()) as Note;
    body.id = id;
    const saved = await saveNoteToDisk(body);
    return NextResponse.json({ note: saved, success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update note", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!id || !isSafePath(`${id}.md`)) {
    return NextResponse.json(
      { error: "Invalid or unsafe note ID." },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteNoteFromDisk(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete note", details: err?.message },
      { status: 500 }
    );
  }
}
