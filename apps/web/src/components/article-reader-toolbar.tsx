"use client";

import React, { useState } from "react";
import { Headphones, Copy, Check, FileText, FileCode, Printer } from "lucide-react";
import { ReadAloudPlayer, ExportMenu } from "@vibe-notes/ui";
import { markdownToPlainText, markdownToHtml } from "@vibe-notes/notes-core";

interface ArticleReaderToolbarProps {
  note: {
    id: string;
    title: string;
    content: string;
    slug?: string;
  };
}

export function ArticleReaderToolbar({ note }: ArticleReaderToolbarProps) {
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = async (type: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-y border-border/40 py-2.5 my-4 bg-card/30 px-3 rounded-xl">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Export / Read:
        </span>

        {/* 1-Click Copy Plain Text (For external screen readers / TTS / clean reading) */}
        <button
          type="button"
          onClick={() => handleCopy("text", markdownToPlainText(note.content))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy clean plain text (markdown stripped) to read in your own external screen reader or tool"
          aria-label="Copy plain text"
        >
          {copiedType === "text" ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-semibold">Text Copied!</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Copy Text</span>
            </>
          )}
        </button>

        {/* 1-Click Copy HTML */}
        <button
          type="button"
          onClick={() => handleCopy("html", markdownToHtml(note.content, note.title))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy formatted semantic HTML document with styles"
          aria-label="Copy HTML"
        >
          {copiedType === "html" ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-semibold">HTML Copied!</span>
            </>
          ) : (
            <>
              <FileCode className="w-3.5 h-3.5 text-accent-blue" />
              <span>Copy HTML</span>
            </>
          )}
        </button>

        {/* 1-Click Print / PDF */}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
          title="Print or Save as PDF"
          aria-label="Print or save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Save PDF</span>
        </button>

        {/* Multi-Format Export Dropdown (.md, TTS script, etc.) */}
        <ExportMenu
          note={note}
          onTriggerReadAloud={() => setIsReadingAloud(true)}
        />

        {/* Optional Sound TTS Reader */}
        <button
          type="button"
          onClick={() => setIsReadingAloud((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-xs ml-auto ${
            isReadingAloud
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground"
          }`}
          title="Built-in browser sound reader (turn on only if speakers are on)"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isReadingAloud ? "Reader Active" : "Sound Reader"}</span>
        </button>
      </div>

      {/* Floating Read Aloud Player (only shown if user explicitly turned Sound Reader on) */}
      {isReadingAloud && (
        <ReadAloudPlayer
          content={note.content}
          noteTitle={note.title}
          onClose={() => setIsReadingAloud(false)}
        />
      )}
    </>
  );
}

