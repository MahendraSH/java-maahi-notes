"use client";

import React, { useState, useMemo } from "react";
import { getPublishedNotes } from "@/lib/published-content";
import { FileText, Tag, Clock, FolderOpen, BookOpen, ArrowRight, Search, Sparkles, Video, Play, X, Keyboard, Globe } from "lucide-react";
import Link from "next/link";

export default function WebHomePage() {
  const allNotes = useMemo(() => getPublishedNotes(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const videoDemos = [
    {
      id: "tag-folder",
      title: "Tag Autocomplete & Folder Hierarchy",
      badge: "Tags & Folders",
      src: "/videos/tag-folder-demo.webp",
      desc: "Real-time tag search autocomplete, on-the-fly tag & folder creation, and inline #hashtag auto-capture.",
      bullets: [
        "Instant search across existing workspace tags with note count pills",
        "Create new tags on the fly by pressing Enter",
        "Search or create folder hierarchies with the combobox picker",
        "Auto-extract inline #hashtags typed inside Quick Capture titles"
      ]
    },
    {
      id: "keyboard-nav",
      title: "Keyboard-First Speed Navigation",
      badge: "Hotkeys & Search",
      src: "/videos/keyboard-nav-demo.webp",
      desc: "Fuzzy search command palette with ⌘K, instant preview toggle with ⌘E, and index navigation with ⌘I.",
      bullets: [
        "⌘K / Ctrl+K opens global fuzzy search from anywhere",
        "Navigate notes with Down/Up arrow keys and hit Enter",
        "⌘E toggles raw Markdown editor vs rendered preview",
        "⌘I jumps directly back to Workspace Index Dashboard"
      ]
    },
    {
      id: "workspace-overview",
      title: "Workspace Dashboard & Quick Capture",
      badge: "Dashboard & Capture",
      src: "/videos/workspace-overview-demo.webp",
      desc: "Live workspace metrics, publication filtering tabs, and lightning-fast thought capture.",
      bullets: [
        "Real-time analytics for total, published, and staged notes",
        "Publication status tabs (All, Published, Staged, Local)",
        "Quick Capture bar to jot down ideas in 2 seconds",
        "Bidirectional [[Wiki-Links]] with incoming backlinks explorer"
      ]
    },
  ];

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

        {/* Video Walkthroughs Action Button */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setShowDocsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>How It Works & Video Walkthroughs</span>
          </button>
        </div>
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

      {/* Docs & Video Walkthrough Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowDocsModal(false)}>
          <div
            className="w-full max-w-4xl bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">How Vibe Notes Works — Video Walkthroughs</h2>
                  <p className="text-xs text-muted-foreground">Local-first editing, fast keyboard hotkeys, and safe publishing.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Pills */}
            <div className="flex flex-wrap items-center gap-2 px-6 pt-4 pb-2 border-b border-border/60 bg-background">
              {videoDemos.map((demo, idx) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeVideoIdx === idx
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{demo.title}</span>
                </button>
              ))}
            </div>

            {/* Video Player & Guide */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-xl border border-border bg-card/50 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground ml-2">
                      vibe-notes://demo/{videoDemos[activeVideoIdx].id}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {videoDemos[activeVideoIdx].badge}
                  </span>
                </div>

                {/* Looping WebP Animation */}
                <div className="p-3 bg-black/40 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoDemos[activeVideoIdx].src}
                    alt={videoDemos[activeVideoIdx].title}
                    className="w-full rounded-lg border border-border/80 object-contain max-h-[360px] bg-card/60 shadow-md"
                  />
                </div>

                <div className="p-5 border-t border-border space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{videoDemos[activeVideoIdx].title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{videoDemos[activeVideoIdx].desc}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {videoDemos[activeVideoIdx].bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border/50 text-xs">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="text-muted-foreground">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>All notes are stored in local Markdown and selectively published to this public reader.</span>
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
