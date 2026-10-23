import React from "react";
import { getPublishedNotes } from "@/lib/published-content";
import { NotesExplorer } from "@/components/notes-explorer";

export default function WebHomePage() {
  const allNotes = getPublishedNotes();
  return <NotesExplorer allNotes={allNotes} />;
}
