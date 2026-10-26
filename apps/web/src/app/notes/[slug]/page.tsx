import { getPublishedNoteBySlug, getPublishedNoteSlugs } from "@/lib/published-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InteractiveArticleView } from "@/components/interactive-article-view";

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPublishedNoteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = getPublishedNoteBySlug(slug);
  if (!note) return { title: "Note Not Found — Vibe Notes" };
  return {
    title: `${note.title} — Vibe Notes`,
    description: note.description || `Read ${note.title} on Vibe Notes Knowledge Base`,
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getPublishedNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return <InteractiveArticleView note={note} />;
}
