import { getPublishedNoteBySlug, getPublishedNoteSlugs } from "@/lib/published-content";
import { notFound } from "next/navigation";
import { FileText, Clock, FolderOpen, Tag, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import React from "react";
import { ArticleReaderToolbar } from "@/components/article-reader-toolbar";

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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to all notes
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{note.folder}</span>
          <span className="mx-1">·</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{note.readingTimeMinutes} min read</span>
          <span className="mx-1">·</span>
          <BookOpen className="w-3.5 h-3.5" />
          <span>Published</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
          {note.title}
        </h1>

        {note.description && (
          <p className="text-muted-foreground leading-relaxed text-lg">
            {note.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-4">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Read Aloud & Multi-Format Export Toolbar */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <ArticleReaderToolbar note={note} />
        </div>
      </header>

      <hr className="border-border mb-8" />

      {/* Article Content */}
      <article className="article-content">
        <MarkdownRenderer content={note.content} />
      </article>

      {/* Footer */}
      <hr className="border-border mt-12 mb-6" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Last updated: {new Date(note.updatedAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          More notes
        </Link>
      </div>
    </div>
  );
}

/* Simple Markdown → React renderer (safe: no dangerouslySetInnerHTML) */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let codeBlock: string[] | null = null;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (codeBlock !== null) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="overflow-x-auto my-4 max-w-full rounded-xl bg-card border border-border/80 p-4 text-xs font-mono text-foreground shadow-xs"
          >
            <code>{codeBlock.join("\n")}</code>
          </pre>
        );
        codeBlock = null;
      } else {
        codeBlock = [];
      }
      i++;
      continue;
    }
    if (codeBlock !== null) {
      codeBlock.push(line);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i}>{formatInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i}>{formatInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i}>{formatInline(line.slice(2))}</h1>);
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      elements.push(<blockquote key={i}>{formatInline(line.slice(2))}</blockquote>);
    }
    // HR
    else if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} />);
    }
    // Unordered list
    else if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`}>
          {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
        </ul>
      );
      continue;
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`}>
          {items.map((item, j) => <li key={j}>{formatInline(item)}</li>)}
        </ol>
      );
      continue;
    }
    // Empty line
    else if (line.trim() === "") {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i}>{formatInline(line)}</p>);
    }

    i++;
  }

  if (codeBlock !== null) {
    elements.push(
      <pre
        key="code-end"
        className="overflow-x-auto my-4 max-w-full rounded-xl bg-card border border-border/80 p-4 text-xs font-mono text-foreground shadow-xs"
      >
        <code>{codeBlock.join("\n")}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[\[.*?\]\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith("**")) {
      parts.push(<strong key={match.index}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("`")) {
      parts.push(<code key={match.index}>{m.slice(1, -1)}</code>);
    } else if (m.startsWith("[[")) {
      const linkText = m.slice(2, -2);
      parts.push(<span key={match.index} className="text-info">{linkText}</span>);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
