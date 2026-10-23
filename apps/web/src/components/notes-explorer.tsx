"use client";

import React, { useState, useMemo } from "react";
import type { Note } from "@vibe-notes/notes-core";
import { siteConfig } from "@/site.config";
import {
  FileText, Clock, FolderOpen, BookOpen, ArrowRight, Search, Sparkles,
  Copy, ExternalLink, HelpCircle, Printer
} from "lucide-react";
import Link from "next/link";

interface NotesExplorerProps {
  allNotes: Note[];
}

export function NotesExplorer({ allNotes }: NotesExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract unique top-level categories dynamically from note folders
  const categories = useMemo(() => {
    const set = new Set<string>();
    allNotes.forEach((n) => {
      const topFolder = n.folder.split("/")[0] || n.folder;
      if (topFolder) set.add(topFolder);
    });
    return Array.from(set).sort();
  }, [allNotes]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allNotes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [allNotes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allNotes.length };
    categories.forEach((cat) => {
      counts[cat] = allNotes.filter((n) => n.folder.startsWith(cat)).length;
    });
    return counts;
  }, [allNotes, categories]);

  // Filter notes by search query, category, and selected tag
  const filteredNotes = useMemo(() => {
    return allNotes.filter((note) => {
      // Category filter
      if (selectedCategory !== "all" && !note.folder.startsWith(selectedCategory)) {
        return false;
      }

      // Tag filter
      if (selectedTag && !note.tags.includes(selectedTag)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesDesc = (note.description || "").toLowerCase().includes(query);
        const matchesFolder = note.folder.toLowerCase().includes(query);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(query));
        const matchesContent = note.content.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesFolder || matchesTags || matchesContent;
      }

      return true;
    });
  }, [allNotes, searchQuery, selectedCategory, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      {/* ----------------------------------------------------------- */}
      {/* 1. DIGITAL GARDEN HERO SECTION                               */}
      {/* ----------------------------------------------------------- */}
      <section className="mb-16 md:mb-20 text-center max-w-3xl mx-auto">
        {/* Author / Topic Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{siteConfig.title} • {allNotes.length} Published Notes</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
          {siteConfig.tagline}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
          {siteConfig.description}{" "}
          {siteConfig.author.portfolioUrl && (
            <span>
              Curated by{" "}
              <a
                href={siteConfig.author.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-semibold underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
              >
                {siteConfig.author.name}
              </a>
              .
            </span>
          )}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <a
            href="#notes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore {allNotes.length} Notes</span>
          </a>

          <a
            href="#how-to-use"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 text-foreground text-sm font-medium hover:bg-card hover:border-primary/40 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>How to Use This Site</span>
          </a>

          <Link
            href="/llms"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Study Copilot</span>
          </Link>
        </div>

        {/* Key Highlights Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/50 text-left">
          <div className="p-3 rounded-xl bg-card/40 border border-border/40">
            <div className="text-xs text-muted-foreground mb-0.5">Technical Notes</div>
            <div className="text-lg font-bold text-foreground">{allNotes.length} Articles</div>
          </div>
          <div className="p-3 rounded-xl bg-card/40 border border-border/40">
            <div className="text-xs text-muted-foreground mb-0.5">Topic Areas</div>
            <div className="text-lg font-bold text-foreground">{categories.length || 1} Categories</div>
          </div>
          <div className="p-3 rounded-xl bg-card/40 border border-border/40">
            <div className="text-xs text-muted-foreground mb-0.5">Reader Tools</div>
            <div className="text-lg font-bold text-foreground">Silent Copy & PDF</div>
          </div>
          <div className="p-3 rounded-xl bg-card/40 border border-border/40">
            <div className="text-xs text-muted-foreground mb-0.5">Performance</div>
            <div className="text-lg font-bold text-foreground">100% Static & Fast</div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 2. SEARCH & TOPIC CATEGORY SELECTOR                         */}
      {/* ----------------------------------------------------------- */}
      <section id="notes" className="mb-12 scroll-mt-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Browse Technical Notes</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Search across titles, descriptions, code snippets, and tags in real time.
            </p>
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes, concepts, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-card border border-border focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Category Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-border/60 text-xs">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedTag(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>All Notes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {categoryCounts.all}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTag(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Tags:
            </span>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="px-2 py-0.5 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 cursor-pointer transition-colors"
              >
                Reset Tag ✕
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-0.5 text-xs rounded-full cursor-pointer transition-colors ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* 3. NOTES CATALOG GRID                                       */}
        {/* ----------------------------------------------------------- */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/20">
            <FileText className="w-8 h-8 text-muted-foreground opacity-40 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">No matching notes found</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-4">
              Try clearing your search query or switching to another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedTag(null);
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.slug}`}
                className="group block p-5 sm:p-6 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono font-medium text-foreground/80">{note.folder}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-base sm:text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 text-foreground">
                  {note.title}
                </h3>

                {note.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {note.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono">
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{note.tags.length - 3}</span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 flex-shrink-0 text-muted-foreground font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    {note.readingTimeMinutes}m read
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 4. HOW TO USE THIS KNOWLEDGE BASE SECTION                    */}
      {/* ----------------------------------------------------------- */}
      <section id="how-to-use" className="mb-20 pt-8 border-t border-border/80 scroll-mt-20">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Reader & Study Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            How to Use This Knowledge Base
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Designed specifically for engineering reading, interview preparation, code reviews, and distraction-free study.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Guide Card 1 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground">Instant Search & Topic Filters</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Find any technical concept in milliseconds. Type into the search bar or click topic pills to instantly filter related notes across all folders.
            </p>
          </div>

          {/* Guide Card 2 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground">1-Click Silent & Multi-Format Copy</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Inside each note, use the reader toolbar to copy <strong>Plain Text</strong> (stripped of markdown headers and stars, ideal for screen readers, TTS, or Notion), <strong>Semantic HTML</strong>, or raw <strong>Markdown (.md)</strong>.
            </p>
          </div>

          {/* Guide Card 3 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground">Distraction-Free PDF & Print Mode</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Need offline study sheets or printed interview cheat sheets? Click the <strong>Save PDF</strong> button on any note to generate a clean, paginated, print-optimized document with code formatting intact.
            </p>
          </div>

          {/* Guide Card 4 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground">AI Study Copilot & LLMs Hub</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Visit the <Link href="/llms" className="text-primary font-semibold underline">/llms</Link> hub for curated prompt templates. Copy context-ready prompts to quiz yourself on technical topics, review code architectures, or debug code with ChatGPT, Claude, or Gemini.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 5. ABOUT THE AUTHOR & CONNECT CARD                          */}
      {/* ----------------------------------------------------------- */}
      {siteConfig.author.name && (
        <section className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span>Author & Maintainer</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                {siteConfig.author.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                {siteConfig.author.bio}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              {siteConfig.author.portfolioUrl && (
                <a
                  href={siteConfig.author.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <span>Portfolio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {siteConfig.author.contactUrl && (
                <a
                  href={siteConfig.author.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors"
                >
                  <span>Contact</span>
                </a>
              )}

              {siteConfig.author.githubUrl && (
                <a
                  href={siteConfig.author.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
