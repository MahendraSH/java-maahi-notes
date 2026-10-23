"use client";

import React, { useState, useMemo } from "react";
import { getPublishedNotes } from "@/lib/published-content";
import { FileText, Tag, Clock, FolderOpen, BookOpen, ArrowRight, Search, Sparkles } from "lucide-react";
import Link from "next/link";

export default function WebHomePage() {
  const allNotes = useMemo(() => getPublishedNotes(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const note of allNotes) {
      for (const tag of note.tags) {
        set.add(tag);
      }
    }
    return Array.from(set);
  }, [allNotes]);

  // Filter notes based on search & tag
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allNotes.filter((note) => {
      if (selectedTag && !note.tags.includes(selectedTag)) {
        return false;
      }
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) ||
        note.folder.toLowerCase().includes(q) ||
        (note.description && note.description.toLowerCase().includes(q)) ||
        note.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allNotes, searchQuery, selectedTag]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Developer Knowledge Base</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Vibe Notes
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Curated engineering notes, Java internals, architecture patterns, and technical references.
        </p>
      </section>

      {/* Search & Topic Filters */}
      <div className="mb-8 space-y-4 max-w-2xl mx-auto">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-xs focus-within:border-primary transition-colors">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search published notes, concepts, tags..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                selectedTag === null
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Published Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground opacity-40 mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">No matching notes found</h2>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto">
            Try adjusting your search query or topic filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.slug}`}
              className="group block p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderOpen className="w-3.5 h-3.5 text-primary" />
                  <span>{note.folder}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {note.title}
              </h2>

              {note.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {note.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {note.readingTimeMinutes} min read
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{note.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
