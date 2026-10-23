"use client";

import React, { useState, useMemo } from "react";
import { getPublishedNotes } from "@/lib/published-content";
import {
  FileText, Tag, Clock, FolderOpen, BookOpen, ArrowRight, Search, Sparkles,
  Video, Play, X, Keyboard, Globe, Code2, Copy, Check, Terminal, ExternalLink,
  ShieldCheck, Layers, Cpu, HelpCircle, Download, FileCode, Printer, Headphones
} from "lucide-react";
import Link from "next/link";

export default function WebHomePage() {
  const allNotes = useMemo(() => getPublishedNotes(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const quickstartCmd = "git clone https://github.com/MahendraSH/vibe-note.git my-notes && cd my-notes && yarn install && yarn dev:local";

  const handleCopyCmd = async () => {
    try {
      await navigator.clipboard.writeText(quickstartCmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch (err) {
      console.error("Failed to copy command:", err);
    }
  };

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      {/* ----------------------------------------------------------- */}
      {/* 1. HERO SECTION                                              */}
      {/* ----------------------------------------------------------- */}
      <section className="text-center mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open Source • Local-First • Free for Any Developer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 leading-[1.15]">
          Your Personal Technical Knowledge Base,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary">
            Built in Pure Markdown.
          </span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed mb-8">
          The local-first notes workspace engineered for developers taking deep dives in <strong>Java</strong>, <strong>Go</strong>, <strong>Rust</strong>, <strong>Python</strong>, <strong>TypeScript</strong>, and <strong>Distributed Systems</strong>. Own your files locally, write at terminal speed, and selectively publish your digital garden to Vercel.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <a
            href="#notes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Demo Notes</span>
          </a>

          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-all shadow-xs active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Build Your Own System (Docs)</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-medium transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Watch Demos</span>
          </button>
        </div>

        {/* Interactive Quickstart Terminal Box */}
        <div className="max-w-2xl mx-auto rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-3 sm:p-4 text-left shadow-lg">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>Clone & Start in 30 Seconds</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCmd}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
              title="Copy shell command"
            >
              {copiedCmd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-xs sm:text-xs overflow-x-auto text-foreground/90 whitespace-pre py-1 px-1 selection:bg-primary/20">
            <span className="text-muted-foreground">$ </span>{quickstartCmd}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 2. WHY VIBE NOTES (FEATURES FOR DEVELOPERS)                  */}
      {/* ----------------------------------------------------------- */}
      <section id="features" className="mb-20 pt-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Engineered for Deep Technical Note Taking
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Everything you need to capture, structure, review, and export your engineering knowledge without proprietary locks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">Any Language or Tech Stack</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tailored for deep technical dives: Java Memory Models, Go concurrency, Rust ownership, Spring Boot architecture, Python internals, or System Design.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">100% Local-First Markdown</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every note is stored as a clean <code>.md</code> file with frontmatter in <code>content/notes/</code>. Tracked with Git. Zero vendor lock-in.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">Multi-Format & Silent Copy</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Keep your speakers off! 1-click Copy Plain Text (markdown-stripped for external screen readers / TTS tools), Copy HTML, Save PDF, or download raw <code>.md</code>.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">Private vs Public Pipeline</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Keep work drafts private with <code>local</code> status, review drafts with <code>staged</code>, and sync selected notes to your public web reader with <code>published</code>.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">Keyboard-First Productivity</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              ⌘K fuzzy command palette, on-the-fly tag search autocomplete, folder hierarchy picker, and Quick Capture bar to jot down ideas in 2 seconds.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base mb-2">Instant Vercel Deployment</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Zero-config Next.js SSG build. Deploy your own notes website to <code>your-notes.vercel.app</code> in under 30 seconds for free.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 3. 3-STEP GUIDE TO BUILD YOUR OWN SYSTEM                     */}
      {/* ----------------------------------------------------------- */}
      <section className="mb-20 p-6 sm:p-8 rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-border/50">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Developer Workflow
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Build Your Own Notes System in 3 Steps
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Fork the template, customize your folders and topics, and start writing.
            </p>
          </div>

          <Link
            href="/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          >
            <span>Read Step-by-Step Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-semibold text-sm text-foreground">Fork or Clone Template</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fork <code>MahendraSH/vibe-note</code> on GitHub or clone locally. All notes live in <code>content/notes/*.md</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-semibold text-sm text-foreground">Write Daily Locally</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Run <code>yarn dev:local</code> and open <code>http://localhost:3000</code>. Tag notes, nest in folders, and set status to <code>published</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-semibold text-sm text-foreground">Deploy to Vercel</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Run <code>vercel</code> from your terminal or link to Vercel dashboard. Your public notes are generated as static HTML pages.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 4. LIVE NOTES / DIGITAL GARDEN (id="notes")                  */}
      {/* ----------------------------------------------------------- */}
      <section id="notes" className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Digital Garden</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Curated Engineering Notes
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Explore live published notes on Java, JVM internals, Spring Boot, and architecture patterns.
            </p>
          </div>

          {/* Quick export tip */}
          <div className="text-xs text-muted-foreground bg-card/60 border border-border/70 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start sm:self-auto">
            <Copy className="w-3.5 h-3.5 text-primary" />
            <span>1-click copy clean text or PDF inside any note</span>
          </div>
        </div>

        {/* Search & Topic Filters */}
        <div className="mb-8 space-y-4 max-w-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-xs focus-within:border-primary transition-colors">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search published notes, concepts, tags, or folders..."
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
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/20">
            <FileText className="w-8 h-8 text-muted-foreground opacity-40 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">No matching notes found</h3>
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
                className="group block p-6 rounded-2xl border border-border bg-card/70 hover:border-primary/50 hover:bg-card hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{note.folder}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
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

                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {note.readingTimeMinutes} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- */}
      {/* 5. INTERACTIVE VIDEO DEMOS MODAL                             */}
      {/* ----------------------------------------------------------- */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div
            className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Interactive Feature Demos</h3>
                  <p className="text-xs text-muted-foreground">See how Vibe Notes works in daily practice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close walkthrough"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border/60 overflow-x-auto gap-2 pt-3 pb-2 flex-shrink-0">
              {videoDemos.map((demo, idx) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeVideoIdx === idx
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {demo.badge}
                </button>
              ))}
            </div>

            {/* Active Video & Details */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <h4 className="font-bold text-base text-foreground mb-1">
                  {videoDemos[activeVideoIdx].title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {videoDemos[activeVideoIdx].desc}
                </p>
              </div>

              {/* Video Player Display */}
              <div className="rounded-xl overflow-hidden border border-border/70 bg-black/40 aspect-video flex items-center justify-center relative shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoDemos[activeVideoIdx].src}
                  alt={videoDemos[activeVideoIdx].title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bullets */}
              <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key Capabilities:</span>
                <ul className="text-xs space-y-1.5 text-foreground/90">
                  {videoDemos[activeVideoIdx].bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Demo {activeVideoIdx + 1} of {videoDemos.length}</span>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
