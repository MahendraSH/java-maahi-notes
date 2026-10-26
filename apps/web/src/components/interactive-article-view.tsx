"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderOpen, Clock, BookOpen, Tag, ArrowLeft, Headphones,
  FileText, FileCode, Printer, Check, Volume2
} from "lucide-react";
import {
  ReadAloudPlayer,
  SpeechMarkdownRenderer,
  TableOfContents,
  ExportMenu,
  type AudioSentence,
} from "@vibe-notes/ui";
import { markdownToPlainText, markdownToHtml } from "@vibe-notes/notes-core";

interface InteractiveArticleViewProps {
  note: {
    id: string;
    title: string;
    content: string;
    folder: string;
    slug: string;
    tags: string[];
    description?: string;
    readingTimeMinutes?: number;
    updatedAt: string;
  };
}

export function InteractiveArticleView({ note }: InteractiveArticleViewProps) {
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
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

  const toggleReadAloud = () => {
    if (isReadingAloud) {
      setIsReadingAloud(false);
      setActiveSentenceIndex(null);
      setActiveWordIndex(null);
    } else {
      setIsReadingAloud(true);
      if (activeSentenceIndex === null) {
        setActiveSentenceIndex(0);
      }
    }
  };

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{note.folder}</span>
          <span className="mx-1">·</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{note.readingTimeMinutes} min read</span>
          <span className="mx-1">·</span>
          <BookOpen className="w-3.5 h-3.5" />
          <span>Published</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-foreground">
          {note.title}
        </h1>

        {note.description && (
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            {note.description}
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
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
        )}

        {/* Action Toolbar with Sound Reader & Export */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-y border-border/40 py-2.5 my-6 bg-card/30 px-3 rounded-xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Export / Read:
          </span>

          {/* 1-Click Copy Plain Text */}
          <button
            type="button"
            onClick={() => handleCopy("text", markdownToPlainText(note.content))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            title="Copy clean plain text to clipboard"
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
            title="Copy semantic HTML document"
          >
            {copiedType === "html" ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-semibold">HTML Copied!</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-info" />
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
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Save PDF</span>
          </button>

          {/* Multi-Format Export Dropdown */}
          <ExportMenu
            note={note}
            onTriggerReadAloud={() => {
              setIsReadingAloud(true);
              setActiveSentenceIndex(0);
            }}
          />

          {/* Read Aloud (Sound Reader) Primary Toggle */}
          <button
            type="button"
            id="read-aloud-toggle-btn"
            data-testid="read-aloud-toggle-btn"
            onClick={toggleReadAloud}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ml-auto active:scale-95 ${
              isReadingAloud
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(248,152,32,0.4)]"
                : "border-border/80 bg-primary/10 hover:bg-primary/20 text-primary hover:border-primary/50"
            }`}
            title="Listen to this note with synced sentence & word highlighting and auto-scroll"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{isReadingAloud ? "Reader Active" : "Read Aloud (TTS)"}</span>
            {isReadingAloud && <span className="w-2 h-2 rounded-full bg-white animate-ping ml-1" />}
          </button>
        </div>
      </header>

      {/* Auto-Generated Table of Contents */}
      <TableOfContents markdown={note.content} className="mb-8" />

      <hr className="border-border mb-8" />

      {/* Article Content with Dynamic Word & Sentence Highlighting + Auto-Scroll */}
      <article className="article-content">
        <SpeechMarkdownRenderer
          content={note.content}
          activeSentenceIndex={activeSentenceIndex}
          activeWordIndex={activeWordIndex}
          isReadingAloud={isReadingAloud}
          onSeekSentence={(index) => {
            setActiveSentenceIndex(index);
            setIsReadingAloud(true);
          }}
        />
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

      {/* Synced Floating Read Aloud Player */}
      {isReadingAloud && (
        <ReadAloudPlayer
          content={note.content}
          noteTitle={note.title}
          activeSentenceIndex={activeSentenceIndex}
          onSentenceChange={(idx) => {
            setActiveSentenceIndex(idx);
          }}
          onWordChange={(wIdx) => {
            setActiveWordIndex(wIdx);
          }}
          onClose={() => {
            setIsReadingAloud(false);
            setActiveSentenceIndex(null);
            setActiveWordIndex(null);
          }}
          autoScroll={true}
        />
      )}
    </div>
  );
}
