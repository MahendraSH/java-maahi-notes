"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search, Plus, Folder, FolderOpen, FileText, Hash, ChevronRight, ChevronDown,
  Sun, Moon, Save, Clock, Tag, BookOpen, Menu, X, Trash2, Eye, Edit3, Copy,
  Globe, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, CornerDownRight,
  ExternalLink, LayoutDashboard, Sparkles, Filter, ArrowUpDown, History,
  Layers, Pin, Calendar, Check, Keyboard, HelpCircle, Play, Video, Headphones,
  Columns, GitBranch
} from "lucide-react";
import {
  type Note, type NoteMetadata, type FolderItem, type PublicationStatus, type Backlink,
  createSampleNotes, slugify, calculateReadingTime, buildFolderTree, searchNotes,
  findIncomingBacklinks, type SearchOptions, markdownToPlainText,
  DEFAULT_WORKSPACE_FOLDERS, extractTableOfContents
} from "@vibe-notes/notes-core";
import {
  ReadAloudPlayer, ExportMenu, SyntaxHighlighter,
  MarkdownTable, isMarkdownTableStart, isMarkdownTableSeparator,
  TableOfContents, DisclaimerBanner, SpeechMarkdownRenderer
} from "@vibe-notes/ui";
import { VSCodeExplorer } from "@/components/vscode-explorer";


/* ------------------------------------------------------------------ */
/*  Notes Store                                                       */
/* ------------------------------------------------------------------ */

function useNotesStore() {
  const [notes, setNotes] = useState<Note[]>(() => createSampleNotes());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectNote = useCallback((id: string | null) => {
    setActiveNoteId(id);
    if (id && typeof window !== "undefined") {
      try {
        localStorage.setItem("vibe_notes_last_active_id", id);
      } catch {}
    } else if (id === null && typeof window !== "undefined") {
      try {
        localStorage.removeItem("vibe_notes_last_active_id");
      } catch {}
    }
  }, []);

  // Load notes from server on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchNotes() {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.notes) && data.notes.length > 0) {
            setNotes(data.notes);
            const savedActiveId = typeof window !== "undefined"
              ? localStorage.getItem("vibe_notes_last_active_id")
              : null;
            if (savedActiveId && data.notes.some((n: Note) => n.id === savedActiveId)) {
              setActiveNoteId(savedActiveId);
            }
          }
        }
      } catch (err) {
        console.warn("Using offline / fallback notes:", err);
      }
    }
    fetchNotes();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;
  const folders = useMemo(() => buildFolderTree(notes, DEFAULT_WORKSPACE_FOLDERS), [notes]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setSaveStatus("saving");
    let noteToSave: Note | null = null;

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          noteToSave = {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString(),
            readingTimeMinutes: updates.content !== undefined
              ? calculateReadingTime(updates.content)
              : n.readingTimeMinutes,
          };
          return noteToSave;
        }
        return n;
      })
    );

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!noteToSave) return;
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteToSave),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    }, 400);
  }, []);

  const createNote = useCallback(async (
    initialFolder: string = "General",
    initialTitle: string = "Untitled Note",
    initialTags: string[] = []
  ) => {
    const now = new Date().toISOString();
    const id = `note-${Date.now()}`;
    const newNote: Note = {
      id,
      title: initialTitle,
      slug: slugify(initialTitle + "-" + id.slice(-4)),
      folder: initialFolder,
      tags: initialTags,
      createdAt: now,
      updatedAt: now,
      publicationStatus: "local",
      readingTimeMinutes: 1,
      content: `# ${initialTitle}\n\nStart writing your thoughts or architecture notes here...`,
    };

    setNotes((prev) => [newNote, ...prev]);
    selectNote(id);
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }

    return newNote;
  }, [selectNote]);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete note file:", err);
    }
  }, []);

  return {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId: selectNote,
    updateNote,
    createNote,
    deleteNote,
    folders,
    saveStatus,
  };
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function LocalEditorPage() {
  const store = useNotesStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState("");
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("edit");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(DEFAULT_WORKSPACE_FOLDERS)
  );
  const [customFolders, setCustomFolders] = useState<string[]>(() => [...DEFAULT_WORKSPACE_FOLDERS]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vibe_notes_custom_folders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomFolders(parsed);
        }
      }
    } catch {}
  }, []);

  const handleAddFolder = useCallback((folderPath: string) => {
    setCustomFolders((prev) => {
      if (prev.includes(folderPath)) return prev;
      const next = [...prev, folderPath];
      try {
        localStorage.setItem("vibe_notes_custom_folders", JSON.stringify(next));
      } catch {}
      return next;
    });
    setExpandedFolders((prev) => new Set([...prev, folderPath]));
  }, []);

  const handleRenameFolder = useCallback((oldPath: string, newPath: string) => {
    setCustomFolders((prev) => {
      const next = prev.map((f) => (f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f));
      try {
        localStorage.setItem("vibe_notes_custom_folders", JSON.stringify(next));
      } catch {}
      return next;
    });

    store.notes.forEach((n) => {
      if (n.folder === oldPath) {
        store.updateNote(n.id, { folder: newPath });
      } else if (n.folder.startsWith(`${oldPath}/`)) {
        store.updateNote(n.id, { folder: n.folder.replace(oldPath, newPath) });
      }
    });

    setExpandedFolders((prev) => {
      const next = new Set<string>();
      for (const f of prev) {
        if (f === oldPath) next.add(newPath);
        else if (f.startsWith(`${oldPath}/`)) next.add(f.replace(oldPath, newPath));
        else next.add(f);
      }
      return next;
    });

    if (selectedFolder === oldPath) {
      setSelectedFolder(newPath);
    }
  }, [store, selectedFolder]);

  const handleDeleteFolder = useCallback((folderPath: string, deleteNotes: boolean) => {
    if (deleteNotes) {
      store.notes.forEach((n) => {
        if (n.folder === folderPath || n.folder.startsWith(`${folderPath}/`)) {
          store.deleteNote(n.id);
        }
      });
    } else {
      store.notes.forEach((n) => {
        if (n.folder === folderPath || n.folder.startsWith(`${folderPath}/`)) {
          store.updateNote(n.id, { folder: "General" });
        }
      });
    }

    setCustomFolders((prev) => {
      const next = prev.filter((f) => f !== folderPath && !f.startsWith(`${folderPath}/`));
      try {
        localStorage.setItem("vibe_notes_custom_folders", JSON.stringify(next));
      } catch {}
      return next;
    });

    if (selectedFolder === folderPath) {
      setSelectedFolder(null);
    }
  }, [store, selectedFolder]);

  // Toggle theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Synchronize URL parameters with browser history
  const updateUrl = useCallback((noteId: string | null, folder: string | null, tag: string | null, replace = false) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (noteId) {
      const note = store.notes.find((n) => n.id === noteId);
      params.set("note", note?.slug || noteId);
    } else {
      if (folder) params.set("folder", folder);
      if (tag) params.set("tag", tag);
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/?${newQuery}` : window.location.pathname;
    const currentUrl = window.location.pathname + window.location.search;

    if (newUrl !== currentUrl) {
      if (replace) {
        window.history.replaceState({ noteId, folder, tag }, "", newUrl);
      } else {
        window.history.pushState({ noteId, folder, tag }, "", newUrl);
      }
    }
  }, [store.notes]);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const noteParam = params.get("note");
      const folderParam = params.get("folder");
      const tagParam = params.get("tag");

      if (noteParam) {
        const match = store.notes.find((n) => n.slug === noteParam || n.id === noteParam);
        if (match) {
          store.setActiveNoteId(match.id);
          setSelectedFolder(match.folder);
          setSelectedTag(null);
          return;
        }
      }

      store.setActiveNoteId(null);
      setSelectedFolder(folderParam || null);
      setSelectedTag(tagParam || null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [store.notes, store.setActiveNoteId]);

  // On initial mount or when notes load, restore from URL if present
  const initializedFromUrlRef = useRef(false);
  useEffect(() => {
    if (initializedFromUrlRef.current || store.notes.length === 0) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const noteParam = params.get("note");
    const folderParam = params.get("folder");
    const tagParam = params.get("tag");

    if (noteParam) {
      const match = store.notes.find((n) => n.slug === noteParam || n.id === noteParam);
      if (match) {
        store.setActiveNoteId(match.id);
        setSelectedFolder(match.folder);
        initializedFromUrlRef.current = true;
        return;
      }
    }
    if (folderParam) {
      setSelectedFolder(folderParam);
      initializedFromUrlRef.current = true;
    }
    if (tagParam) {
      setSelectedTag(tagParam);
      initializedFromUrlRef.current = true;
    }
  }, [store.notes, store.setActiveNoteId]);

  // Global Keyboard-First Navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // ⌘K / Ctrl+K: Global search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setPublishModalOpen(false);
        setShortcutsModalOpen(false);
        return;
      }

      // ⌘N / Ctrl+N or Alt+N: New Note from anywhere
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") || (e.altKey && e.key.toLowerCase() === "n")) {
        e.preventDefault();
        store.createNote(selectedFolder || "General");
        return;
      }

      // ⌘E / Ctrl+E: Cycle Edit -> Split -> Preview
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setViewMode((prev) => (prev === "edit" ? "split" : prev === "split" ? "preview" : "edit"));
        return;
      }

      // ⌘B / Ctrl+B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      // ⌘I / Ctrl+I: Return to Workspace Index Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        store.setActiveNoteId(null);
        setSelectedFolder(null);
        setSelectedTag(null);
        updateUrl(null, null, null);
        return;
      }

      // ⌘P / Ctrl+P: Publishing Safety Boundary Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPublishModalOpen((prev) => !prev);
        setSearchOpen(false);
        setShortcutsModalOpen(false);
        return;
      }

      // ⌘S / Ctrl+S: Prevent browser default save dialog
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return;
      }

      // '?' key: Show Keyboard Shortcuts Cheatsheet (when not typing in text field)
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // ESC: Close open modals, or blur active element, or return to index
      if (e.key === "Escape") {
        if (searchOpen || publishModalOpen || shortcutsModalOpen) {
          setSearchOpen(false);
          setPublishModalOpen(false);
          setShortcutsModalOpen(false);
          return;
        }
        if (isInput) {
          (activeEl as HTMLElement)?.blur();
          return;
        }
        if (store.activeNoteId) {
          store.setActiveNoteId(null);
          updateUrl(null, selectedFolder, selectedTag);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedFolder, selectedTag, searchOpen, publishModalOpen, shortcutsModalOpen, store, updateUrl]);

  // Compute all unique tags with note counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of store.notes) {
      for (const t of n.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return counts;
  }, [store.notes]);

  // Compute publication counts
  const publicationCounts = useMemo(() => {
    let local = 0;
    let staged = 0;
    let published = 0;
    for (const n of store.notes) {
      if (n.publicationStatus === "published") published++;
      else if (n.publicationStatus === "staged") staged++;
      else local++;
    }
    return { local, staged, published };
  }, [store.notes]);

  const openSearchWithQuery = (query: string = "") => {
    setInitialSearchQuery(query);
    setSearchOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* ─── SIDEBAR ─── */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } flex-shrink-0 transition-all duration-200 overflow-hidden bg-sidebar border-r border-sidebar-border flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#17191C] flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-5 h-5">
              <path d="M12 46V18h8.2L32 33.1 43.8 18H52v28h-9V31.2L32 43 21 31.2V46z" fill="#F3F4F6"/>
              <circle cx="51" cy="49" r="4.5" fill="#F89820"/>
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sidebar-foreground text-sm tracking-wide">Vibe Notes</span>
            <span className="text-[10px] text-muted-foreground font-mono">Developer Workspace</span>
          </div>
        </div>

        {/* Global Search Trigger */}
        <div className="px-3 mb-2">
          <button
            onClick={() => openSearchWithQuery("")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer"
            aria-label="Search notes"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Advanced Search…</span>
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-3 mb-3 space-y-1">
          <button
            onClick={() => store.createNote(selectedFolder || "General")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            aria-label="Create new note"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>

          {/* Index Page Link */}
          <button
            onClick={() => {
              store.setActiveNoteId(null);
              setSelectedFolder(null);
              setSelectedTag(null);
            }}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              store.activeNoteId === null && selectedFolder === null && selectedTag === null
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>Workspace Index</span>
          </button>

          {/* Documentation & Video Guides Link */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="flex-1 text-left">Docs & Video Guides</span>
            <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded font-mono">HD</span>
          </button>
        </div>

        {/* VS Code Hierarchical Explorer */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t border-sidebar-border">
          <VSCodeExplorer
            notes={store.notes}
            activeNoteId={store.activeNoteId}
            selectedFolder={selectedFolder}
            expandedFolders={expandedFolders}
            onToggleExpand={(path) => {
              setExpandedFolders((prev) => {
                const next = new Set(prev);
                if (next.has(path)) next.delete(path);
                else next.add(path);
                return next;
              });
            }}
            onExpandAll={() => {
              const all = new Set<string>();
              store.notes.forEach((n) => all.add(n.folder));
              customFolders.forEach((f) => all.add(f));
              setExpandedFolders(all);
            }}
            onCollapseAll={() => setExpandedFolders(new Set())}
            onSelectNote={(noteId) => {
              store.setActiveNoteId(noteId);
              updateUrl(noteId, null, null);
            }}
            onSelectFolder={(folderPath) => {
              setSelectedFolder(folderPath);
              setSelectedTag(null);
              store.setActiveNoteId(null);
              updateUrl(null, folderPath, null);
            }}
            onCreateNote={async (folder, title) => {
              const newNote = await store.createNote(folder || "General", title || "Untitled Note");
              updateUrl(newNote.id, null, null);
              return newNote;
            }}
            onDeleteNote={async (id) => {
              await store.deleteNote(id);
              if (store.activeNoteId === id) {
                updateUrl(null, selectedFolder, selectedTag);
              }
            }}
            onUpdateNote={(id, updates) => {
              store.updateNote(id, updates);
            }}
            onRefresh={() => {
              window.location.reload();
            }}
            customFolders={customFolders}
            onAddFolder={handleAddFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        {/* Sidebar Tags Navigation */}
        <nav className="overflow-y-auto px-2 py-2 border-t border-sidebar-border max-h-40" aria-label="Tags navigation">

          {/* TAGS */}
          {Object.keys(tagCounts).length > 0 && (
            <div>
              <div className="mb-1 px-2 py-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? null : tag);
                      setSelectedFolder(null);
                    }}
                    className={`flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      selectedTag === tag
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{tag}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer controls */}
        <div className="border-t border-sidebar-border px-3 py-3 flex items-center justify-between">
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            aria-label={`Switch to ${darkMode ? "light" : "dark"} theme`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-primary" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="text-[10px] font-mono bg-muted px-1 rounded">?</kbd>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Testing Phase Disclaimer */}
        <DisclaimerBanner />

        {/* Top Bar */}
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Multi-Segment Clickable Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap min-w-0">
            {/* Workspace Root */}
            <button
              onClick={() => {
                store.setActiveNoteId(null);
                setSelectedFolder(null);
                setSelectedTag(null);
                updateUrl(null, null, null);
              }}
              className="hover:text-primary transition-colors flex items-center gap-1 text-xs cursor-pointer font-medium"
              title="Return to Workspace Index"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>

            {/* Folder Segments */}
            {(() => {
              const currentFolder = store.activeNote?.folder || selectedFolder;
              if (!currentFolder) return null;
              const segments = currentFolder.split("/").filter(Boolean);
              return segments.map((seg, idx) => {
                const segPath = segments.slice(0, idx + 1).join("/");
                const isLast = idx === segments.length - 1 && !store.activeNote;
                return (
                  <React.Fragment key={segPath}>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                    <button
                      onClick={() => {
                        setSelectedFolder(segPath);
                        setSelectedTag(null);
                        store.setActiveNoteId(null);
                        updateUrl(null, segPath, null);
                      }}
                      className={`font-mono text-xs cursor-pointer transition-colors truncate max-w-[150px] ${
                        isLast
                          ? "text-foreground font-semibold"
                          : "hover:text-primary hover:underline underline-offset-2"
                      }`}
                      title={`Jump to directory index: ${segPath}`}
                    >
                      {seg}
                    </button>
                  </React.Fragment>
                );
              });
            })()}

            {/* Tag Segment if active */}
            {selectedTag && !store.activeNote && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-xs text-foreground font-medium">#{selectedTag}</span>
              </>
            )}

            {/* Active Note Segment */}
            {store.activeNote && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-foreground font-semibold text-xs truncate max-w-[260px]">
                  {store.activeNote.title || "Untitled"}
                </span>
              </>
            )}
          </nav>

          <div className="flex-1" />

          {/* Save Status */}
          {store.saveStatus !== "idle" && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
              store.saveStatus === "saving" ? "text-warning bg-warning/10" :
              store.saveStatus === "saved" ? "text-success bg-success/10" :
              "text-destructive bg-destructive/10"
            }`}>
              <Save className="w-3 h-3" />
              {store.saveStatus === "saving" ? "Saving…" :
               store.saveStatus === "saved" ? "Saved" : "Error"}
            </div>
          )}

          {/* Search Quick Button in Header */}
          <button
            onClick={() => openSearchWithQuery("")}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Search notes (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Docs & Video Guides Quick Button in Header */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border hover:bg-muted text-xs text-foreground font-medium transition-colors cursor-pointer shadow-xs"
            title="Docs, Video Demos & Keyboard Cheatsheet (?)"
          >
            <Video className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Docs & Videos</span>
            <kbd className="text-[10px] font-mono bg-muted px-1 rounded text-muted-foreground">?</kbd>
          </button>

          {/* Publishing Hub Button */}
          <button
            onClick={() => setPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors cursor-pointer"
            aria-label="Open publishing workflow"
            title="Publishing boundary (⌘P)"
          >
            <Globe className="w-3.5 h-3.5 text-info" />
            <span>Publish</span>
            {publicationCounts.staged > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warning/20 text-warning font-semibold">
                {publicationCounts.staged}
              </span>
            )}
          </button>

          {/* 3-State Edit / Split / Preview View Mode Selector if Note Open */}
          {store.activeNote && (
            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted/40 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("edit")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "edit" ? "bg-background text-foreground shadow-xs" : "hover:bg-muted text-muted-foreground"
                }`}
                aria-label="Edit mode"
                title="Edit raw Markdown (⌘E)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "split" ? "bg-background text-foreground shadow-xs" : "hover:bg-muted text-muted-foreground"
                }`}
                aria-label="Split mode"
                title="Side-by-side split screen (⌘E)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "preview" ? "bg-background text-foreground shadow-xs" : "hover:bg-muted text-muted-foreground"
                }`}
                aria-label="Preview mode"
                title="Rendered preview (⌘E)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Body: Note Editor OR Folder File Index OR The Complete Workspace Index Dashboard */}
        <div className="flex-1 overflow-y-auto">
          {store.activeNote ? (
            <NoteEditor
              note={store.activeNote}
              allNotes={store.notes}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onUpdate={(updates) => store.updateNote(store.activeNote!.id, updates)}
              onDelete={() => {
                store.deleteNote(store.activeNote!.id);
                updateUrl(null, selectedFolder, selectedTag);
              }}
              onNavigateNote={(id) => {
                store.setActiveNoteId(id);
                updateUrl(id, null, null);
              }}
              onBackToIndex={() => {
                store.setActiveNoteId(null);
                updateUrl(null, selectedFolder, selectedTag);
              }}
              onCreateNote={async (folder) => {
                const newNote = await store.createNote(folder || store.activeNote?.folder || "General");
                updateUrl(newNote.id, null, null);
                return newNote;
              }}
              onDuplicateNote={async (id) => {
                const orig = store.notes.find((n) => n.id === id);
                if (!orig) return;
                const copy = await store.createNote(orig.folder, `${orig.title} (Copy)`);
                store.updateNote(copy.id, {
                  content: orig.content,
                  tags: [...orig.tags],
                  description: orig.description,
                  publicationStatus: "local",
                });
                updateUrl(copy.id, null, null);
              }}
            />
          ) : selectedFolder ? (
            <FolderFileIndex
              folderPath={selectedFolder}
              allNotes={store.notes}
              onSelectNote={(id) => {
                store.setActiveNoteId(id);
                updateUrl(id, selectedFolder, null);
              }}
              onCreateNote={(folder) => store.createNote(folder)}
              onBackToIndex={() => {
                setSelectedFolder(null);
                updateUrl(null, null, null);
              }}
            />
          ) : (
            <WorkspaceIndexDashboard
              notes={store.notes}
              selectedFolder={selectedFolder}
              selectedTag={selectedTag}
              onSelectNote={(id) => {
                store.setActiveNoteId(id);
                updateUrl(id, null, null);
              }}
              onCreateNote={(folder, title, tags) => store.createNote(folder, title, tags)}
              onClearFilter={() => {
                setSelectedFolder(null);
                setSelectedTag(null);
                updateUrl(null, null, null);
              }}
              onOpenSearch={openSearchWithQuery}
            />
          )}
        </div>
      </main>

      {/* ─── ADVANCED SEARCH MODAL ─── */}
      {searchOpen && (
        <AdvancedSearchModal
          notes={store.notes}
          initialQuery={initialSearchQuery}
          onSelect={(id) => {
            store.setActiveNoteId(id);
            setSearchOpen(false);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* ─── PUBLISHING SAFETY MODAL ─── */}
      {publishModalOpen && (
        <PublishingSafetyModal
          notes={store.notes}
          onClose={() => setPublishModalOpen(false)}
          onUpdateStatus={(id, status) => store.updateNote(id, { publicationStatus: status })}
        />
      )}

      {/* ─── DOCUMENTATION & VIDEO GUIDES MODAL ─── */}
      {shortcutsModalOpen && (
        <DocsAndHelpModal onClose={() => setShortcutsModalOpen(false)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tag Autocomplete Picker Component (Search Existing + Create New)   */
/* ------------------------------------------------------------------ */

function TagAutocompletePicker({
  selectedTags,
  allNotes,
  onAddTag,
  onRemoveTag,
  placeholder = "+ Add tag…",
}: {
  selectedTags: string[];
  allNotes: Note[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute tag frequencies across all workspace notes
  const tagFrequency = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of allNotes) {
      for (const t of n.tags || []) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return map;
  }, [allNotes]);

  // Extract all unique existing tags not already selected
  const availableExistingTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNotes) {
      for (const t of n.tags || []) {
        if (!selectedTags.includes(t)) {
          set.add(t);
        }
      }
    }
    return Array.from(set).sort((a, b) => {
      const countDiff = (tagFrequency.get(b) || 0) - (tagFrequency.get(a) || 0);
      if (countDiff !== 0) return countDiff;
      return a.localeCompare(b);
    });
  }, [allNotes, selectedTags, tagFrequency]);

  const cleanInput = inputVal.trim().replace(/^#/, "");

  const filteredSuggestions = useMemo(() => {
    if (!cleanInput) return availableExistingTags.slice(0, 8);
    const q = cleanInput.toLowerCase();
    return availableExistingTags.filter((t) => t.toLowerCase().includes(q)).slice(0, 10);
  }, [availableExistingTags, cleanInput]);

  const isExactMatch = availableExistingTags.some(
    (t) => t.toLowerCase() === cleanInput.toLowerCase()
  );
  const isAlreadySelected = selectedTags.some(
    (t) => t.toLowerCase() === cleanInput.toLowerCase()
  );
  const canCreateNew = cleanInput.length > 0 && !isExactMatch && !isAlreadySelected;

  const totalItems = filteredSuggestions.length + (canCreateNew ? 1 : 0);

  // Reset activeIndex when query or list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [cleanInput, filteredSuggestions.length]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTag = (tag: string) => {
    const formatted = tag.trim().replace(/^#/, "").toLowerCase();
    if (formatted && !selectedTags.includes(formatted)) {
      onAddTag(formatted);
    }
    setInputVal("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (!isOpen && !cleanInput) return;
      e.preventDefault();
      if (activeIndex < filteredSuggestions.length) {
        handleSelectTag(filteredSuggestions[activeIndex]);
      } else if (canCreateNew) {
        handleSelectTag(cleanInput);
      } else if (cleanInput) {
        handleSelectTag(cleanInput);
      }
    } else if (e.key === "Backspace" && inputVal === "" && selectedTags.length > 0) {
      onRemoveTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-1.5">
      {selectedTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground font-medium group hover:bg-secondary/80 transition-colors"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Input container */}
      <div className="relative inline-flex items-center">
        <Tag className="w-3 h-3 text-muted-foreground/70 mr-1 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60 min-w-[70px] w-28 px-1 py-0.5"
        />

        {/* Autocomplete Dropdown */}
        {isOpen && (filteredSuggestions.length > 0 || canCreateNew) && (
          <div
            className="absolute left-0 top-full mt-1.5 w-56 bg-popover border border-border rounded-xl shadow-2xl p-1 z-40 max-h-56 overflow-y-auto"
          >
            {filteredSuggestions.length > 0 && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>{cleanInput ? "Matching Tags" : "Workspace Tags"}</span>
                <span className="text-[9px] lowercase opacity-60">↑↓ to navigate</span>
              </div>
            )}

            {filteredSuggestions.map((tag, idx) => {
              const isItemActive = idx === activeIndex;
              const count = tagFrequency.get(tag) || 0;
              return (
                <button
                  key={tag}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectTag(tag)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isItemActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="opacity-70">#</span>
                    <span className="truncate">{tag}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isItemActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "text-muted-foreground bg-muted"
                      }`}
                    >
                      {count}
                    </span>
                    {isItemActive && <span className="text-[10px] opacity-75">↵</span>}
                  </div>
                </button>
              );
            })}

            {canCreateNew && (
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(filteredSuggestions.length)}
                onClick={() => handleSelectTag(cleanInput)}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors mt-1 ${
                  filteredSuggestions.length > 0 ? "border-t border-border/40" : ""
                } ${
                  activeIndex === filteredSuggestions.length
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Create &ldquo;#{cleanInput}&rdquo;</span>
                </span>
                <kbd
                  className={`text-[10px] font-mono px-1 rounded ${
                    activeIndex === filteredSuggestions.length
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ↵ enter
                </kbd>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Folder Combobox Picker Component (Search Existing + Create New)    */
/* ------------------------------------------------------------------ */

function FolderComboboxPicker({
  currentFolder,
  allNotes,
  onChangeFolder,
}: {
  currentFolder: string;
  allNotes: Note[];
  onChangeFolder: (folder: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute folder note counts
  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of DEFAULT_WORKSPACE_FOLDERS) {
      map.set(f, 0);
    }
    for (const n of allNotes) {
      if (n.folder && n.folder.trim()) {
        const f = n.folder.trim();
        map.set(f, (map.get(f) || 0) + 1);
      }
    }
    if (!map.has("General")) map.set("General", 0);
    return map;
  }, [allNotes]);

  // Extract all existing unique folder paths
  const existingFolders = useMemo(() => {
    const list = Array.from(folderCounts.keys()).sort();
    return list;
  }, [folderCounts]);

  const cleanSearch = search.trim();

  const filteredFolders = useMemo(() => {
    if (!cleanSearch) return existingFolders;
    const q = cleanSearch.toLowerCase();
    return existingFolders.filter((f) => f.toLowerCase().includes(q));
  }, [existingFolders, cleanSearch]);

  const isExactMatch = existingFolders.some(
    (f) => f.toLowerCase() === cleanSearch.toLowerCase()
  );
  const canCreateNew = cleanSearch.length > 0 && !isExactMatch;

  const totalItems = filteredFolders.length + (canCreateNew ? 1 : 0);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [cleanSearch, filteredFolders.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (folder: string) => {
    const trimmed = folder.trim();
    if (trimmed) {
      onChangeFolder(trimmed);
    }
    setSearch("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < filteredFolders.length) {
        handleSelect(filteredFolders[activeIndex]);
      } else if (canCreateNew) {
        handleSelect(cleanSearch);
      } else if (cleanSearch) {
        handleSelect(cleanSearch);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-primary/50 text-xs text-foreground transition-colors cursor-pointer group shadow-sm"
        title="Select or create folder location"
        aria-label="Select folder"
      >
        <FolderOpen className="w-3.5 h-3.5 text-primary group-hover:scale-105 transition-transform" />
        <span className="font-medium max-w-[140px] truncate">{currentFolder || "General"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-popover border border-border rounded-xl shadow-2xl p-2 z-40">
          {/* Search or create input */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-background border border-border rounded-lg mb-2 focus-within:border-primary transition-colors">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or type new folder…"
              className="w-full bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Header */}
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Folders ({filteredFolders.length})</span>
            <span className="text-[9px] lowercase opacity-60">↑↓ to navigate</span>
          </div>

          {/* Folder list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredFolders.map((f, idx) => {
              const isSelected = f === currentFolder;
              const isItemActive = idx === activeIndex;
              const count = folderCounts.get(f) || 0;
              return (
                <button
                  key={f}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(f)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isItemActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isItemActive ? "text-primary-foreground" : "text-primary"}`} />
                    <span className="truncate">{f}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isItemActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "text-muted-foreground bg-muted"
                      }`}
                    >
                      {count}
                    </span>
                    {isItemActive && <span className="text-[10px] opacity-75">↵</span>}
                  </div>
                </button>
              );
            })}

            {canCreateNew && (
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(filteredFolders.length)}
                onClick={() => handleSelect(cleanSearch)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border-t border-border/40 mt-1 cursor-pointer font-medium transition-colors ${
                  activeIndex === filteredFolders.length
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Create folder &ldquo;{cleanSearch}&rdquo;</span>
                </div>
                <kbd
                  className={`text-[10px] font-mono px-1 rounded ${
                    activeIndex === filteredFolders.length
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ↵ enter
                </kbd>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Complete Workspace Index Dashboard                                 */
/* ------------------------------------------------------------------ */

function WorkspaceIndexDashboard({
  notes,
  selectedFolder,
  selectedTag,
  onSelectNote,
  onCreateNote,
  onClearFilter,
  onOpenSearch,
}: {
  notes: Note[];
  selectedFolder: string | null;
  selectedTag: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (folder?: string, title?: string, tags?: string[]) => void;
  onClearFilter: () => void;
  onOpenSearch: (q?: string) => void;
}) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickFolder, setQuickFolder] = useState("General");
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "published" | "staged" | "local">("all");

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (selectedFolder && n.folder !== selectedFolder && !n.folder.startsWith(`${selectedFolder}/`)) {
        return false;
      }
      if (selectedTag && !n.tags.includes(selectedTag)) {
        return false;
      }
      if (filterTab !== "all" && n.publicationStatus !== filterTab) {
        return false;
      }
      return true;
    });
  }, [notes, selectedFolder, selectedTag, filterTab]);

  const stats = useMemo(() => {
    const published = notes.filter((n) => n.publicationStatus === "published").length;
    const staged = notes.filter((n) => n.publicationStatus === "staged").length;
    const local = notes.filter((n) => n.publicationStatus === "local").length;
    const totalReadingTime = notes.reduce((acc, curr) => acc + (curr.readingTimeMinutes || 1), 0);
    return { total: notes.length, published, staged, local, totalReadingTime };
  }, [notes]);

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Automatically parse any inline #hashtags from the title input
    const hashtagMatches = quickTitle.match(/#([\w-]+)/g) || [];
    const extractedTags = hashtagMatches.map((h) => h.slice(1).toLowerCase());
    const cleanTitle = quickTitle.replace(/#([\w-]+)/g, "").trim() || "Untitled Note";

    const allCapturedTags = Array.from(new Set([...quickTags, ...extractedTags]));

    onCreateNote(quickFolder, cleanTitle, allCapturedTags);
    setQuickTitle("");
    setQuickTags([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {selectedFolder ? `Folder: ${selectedFolder}` : selectedTag ? `Tag: #${selectedTag}` : "Knowledge Workspace Index"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedFolder || selectedTag
              ? `Filtered view (${filtered.length} notes)`
              : "Overview of your notes, topics, and published developer documentation."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(selectedFolder || selectedTag) && (
            <button
              onClick={onClearFilter}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={() => onOpenSearch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="text-[10px] bg-muted px-1 rounded">⌘K</kbd>
          </button>
          <button
            onClick={() => onCreateNote(selectedFolder || "General")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total Notes</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Published</span>
            <Globe className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{stats.published}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Staged Review</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning">{stats.staged}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Est. Reading</span>
            <BookOpen className="w-4 h-4 text-info" />
          </div>
          <p className="text-2xl font-bold">{stats.totalReadingTime}m</p>
        </div>
      </div>

      {/* Quick Capture Bar with Modern Folder and Tag Pickers */}
      <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Quick Capture</span>
          </div>
          <span className="text-[11px] opacity-70 hidden sm:inline">
            Tip: type <code className="bg-muted px-1 py-0.5 rounded text-[10px]">#tag</code> in title to auto-tag
          </span>
        </div>

        <form onSubmit={handleQuickCapture} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 focus-within:border-primary transition-colors shadow-sm">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick note title (e.g. Distributed Lock Patterns #redis #architecture)..."
                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Folder Combobox Picker (Search existing or create new folder) */}
            <FolderComboboxPicker
              currentFolder={quickFolder}
              allNotes={notes}
              onChangeFolder={setQuickFolder}
            />

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Note</span>
            </button>
          </div>

          {/* Tag Autocomplete Picker (Search existing or create new tag) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
            <span className="text-muted-foreground text-xs flex-shrink-0">Tags:</span>
            <TagAutocompletePicker
              selectedTags={quickTags}
              allNotes={notes}
              onAddTag={(tag) => setQuickTags((prev) => [...prev, tag])}
              onRemoveTag={(tag) => setQuickTags((prev) => prev.filter((t) => t !== tag))}
              placeholder="+ Add tag (type to search)…"
            />
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {(["all", "published", "staged", "local"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
              filterTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab === "all" ? "All Notes" : tab === "local" ? "Local (Private)" : tab}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          Showing {filtered.length} of {notes.length}
        </span>
      </div>

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h3 className="text-base font-semibold mb-1">No notes found</h3>
          <p className="text-xs text-muted-foreground mb-4">Try clearing filters or create a new note.</p>
          <button
            onClick={() => onCreateNote(selectedFolder || "General")}
            className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground cursor-pointer"
          >
            Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const statusBadge =
              note.publicationStatus === "published"
                ? "text-success bg-success/10 border-success/30"
                : note.publicationStatus === "staged"
                ? "text-warning bg-warning/10 border-warning/30"
                : "text-muted-foreground bg-muted border-border";

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="group p-5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <FolderOpen className="w-3 h-3 text-primary" />
                      {note.folder}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusBadge}`}>
                      {note.publicationStatus}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {note.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {note.description || note.content.slice(0, 140).replace(/^#+\s+/g, "") || "No content yet..."}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {note.readingTimeMinutes}m read
                  </span>
                  <div className="flex items-center gap-1">
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Folder Tree Item Subcomponent (Code Editor-Style)                 */
/* ------------------------------------------------------------------ */

function FolderTreeItem({
  folder,
  isSelected,
  isExpanded,
  notesInFolder,
  activeNoteId,
  onToggleExpand,
  onSelectFolder,
  onSelectNote,
}: {
  folder: FolderItem;
  isSelected: boolean;
  isExpanded: boolean;
  notesInFolder: Note[];
  activeNoteId: string | null;
  onToggleExpand: () => void;
  onSelectFolder: () => void;
  onSelectNote: (id: string) => void;
}) {
  return (
    <div className="w-full">
      <div
        className={`group flex items-center gap-1.5 w-full rounded-md text-xs transition-colors cursor-pointer py-1.5 pr-2 ${
          isSelected
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
        }`}
        style={{ paddingLeft: `${folder.depth * 14 + 6}px` }}
      >
        {/* Accordion Chevron Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer transition-transform"
          title={isExpanded ? "Collapse folder" : "Expand folder"}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Folder Title */}
        <div
          onClick={onSelectFolder}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>

        <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto">
          {folder.noteCount}
        </span>
      </div>

      {/* Expanded Child Files */}
      {isExpanded && notesInFolder.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {notesInFolder.map((note) => {
            const isActive = activeNoteId === note.id;
            return (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`flex items-center gap-1.5 w-full text-left rounded-md py-1 pr-2 text-xs transition-colors cursor-pointer truncate ${
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40"
                }`}
                style={{ paddingLeft: `${(folder.depth + 1) * 14 + 16}px` }}
                title={note.title}
              >
                <FileText className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="truncate">{note.title || "Untitled"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Folder File Index View (Main Panel Directory Index)               */
/* ------------------------------------------------------------------ */

function FolderFileIndex({
  folderPath,
  allNotes,
  onSelectNote,
  onCreateNote,
  onBackToIndex,
}: {
  folderPath: string;
  allNotes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: (folder: string) => void;
  onBackToIndex: () => void;
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const folderNotes = allNotes.filter(
    (n) => n.folder === folderPath || n.folder.startsWith(`${folderPath}/`)
  );

  const filteredNotes = folderNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(filterQuery.toLowerCase())) ||
      n.tags.some((t) => t.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <button
              onClick={onBackToIndex}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace Index</span>
            </button>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="font-mono text-foreground font-semibold">{folderPath}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{folderPath}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-muted text-muted-foreground">
              {folderNotes.length} {folderNotes.length === 1 ? "document" : "documents"}
            </span>
          </div>
        </div>

        <button
          onClick={() => onCreateNote(folderPath)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Note in {folderPath.split("/").pop()}</span>
        </button>
      </div>

      {/* Filter inside folder */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={`Filter documents in ${folderPath}…`}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 shadow-xs"
        />
      </div>

      {/* Documents Grid / List */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/40">
          <Folder className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No documents found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {filterQuery ? `No notes matching "${filterQuery}" in this folder.` : "This folder is currently empty."}
          </p>
          <button
            onClick={() => onCreateNote(folderPath)}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="group p-4 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {note.title || "Untitled"}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-medium ${
                      note.publicationStatus === "published"
                        ? "bg-success/15 text-success"
                        : note.publicationStatus === "staged"
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {note.publicationStatus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {note.description || note.content.slice(0, 140).replace(/[#*`\n]/g, " ") || "No description."}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-1.5 py-0.2 rounded bg-muted text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[10px]">
                  {note.readingTimeMinutes || 1} min read
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



/* ------------------------------------------------------------------ */
/*  Note Editor & Preview Component                                    */
/* ------------------------------------------------------------------ */

function NoteEditor({
  note,
  allNotes,
  viewMode,
  onViewModeChange,
  onUpdate,
  onDelete,
  onNavigateNote,
  onBackToIndex,
  onCreateNote,
  onDuplicateNote,
}: {
  note: Note;
  allNotes: Note[];
  viewMode: "edit" | "split" | "preview";
  onViewModeChange: (mode: "edit" | "split" | "preview") => void;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onNavigateNote: (id: string) => void;
  onBackToIndex: () => void;
  onCreateNote?: (folder?: string) => Promise<Note>;
  onDuplicateNote?: (id: string) => Promise<void>;
}) {
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editorContextMenu, setEditorContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = () => setEditorContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditorContextMenu(null);
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleCopyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(markdownToPlainText(note.content));
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const cycleStatus = () => {
    const order: PublicationStatus[] = ["local", "staged", "published"];
    const currentIdx = order.indexOf(note.publicationStatus);
    const next = order[(currentIdx + 1) % order.length];
    onUpdate({ publicationStatus: next });
  };

  const handleQuickPublish = () => {
    const nextStatus = note.publicationStatus === "published" ? "local" : "published";
    onUpdate({ publicationStatus: nextStatus });
    setPublishFeedback(nextStatus === "published" ? "Published to Web!" : "Reverted to Local Draft");
    setTimeout(() => setPublishFeedback(null), 2500);
  };

  const statusLabel =
    note.publicationStatus === "published" ? "Published" :
    note.publicationStatus === "staged" ? "Staged" : "Local (Private)";
  const statusColor =
    note.publicationStatus === "published" ? "text-success bg-success/10 border-success/30" :
    note.publicationStatus === "staged" ? "text-warning bg-warning/10 border-warning/30" :
    "text-muted-foreground bg-muted border-border";

  const incomingBacklinks = useMemo(() => {
    return findIncomingBacklinks(note, allNotes);
  }, [note, allNotes]);

  return (
    <div
      className={viewMode === "split" ? "w-full max-w-7xl mx-auto p-4 md:p-8" : "max-w-4xl mx-auto p-6 md:p-10"}
      onContextMenu={(e) => {
        // Only trigger editor context menu if not in input/textarea
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        if (tag !== "input") {
          e.preventDefault();
          e.stopPropagation();
          setEditorContextMenu({
            x: Math.min(e.clientX, window.innerWidth - 220),
            y: Math.min(e.clientY, window.innerHeight - 300),
          });
        }
      }}
    >
      {/* Top Embedded Action Bar */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        {/* Back to index link */}
        <button
          onClick={onBackToIndex}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          Back to Workspace Index
        </button>

        {/* Embedded Document Actions (VS Code Style) */}
        <div className="flex items-center gap-1.5">
          {onCreateNote && (
            <button
              onClick={() => onCreateNote(note.folder)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Create new note in this folder"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          )}

          {onDuplicateNote && (
            <button
              onClick={() => onDuplicateNote(note.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
              title="Duplicate this note"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-destructive/30 hover:bg-destructive/15 text-destructive transition-all cursor-pointer shadow-xs active:scale-95"
            title="Delete this note"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={note.title}
        onChange={(e) => onUpdate({ title: e.target.value, slug: slugify(e.target.value || "untitled") })}
        className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-3 text-foreground"
        placeholder="Note title…"
        aria-label="Note title"
      />

      {/* Document Properties Panel */}
      <div className="flex flex-wrap items-center gap-3 p-3 mb-6 rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm">
        {/* Folder Combobox Picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Folder:</span>
          <FolderComboboxPicker
            currentFolder={note.folder}
            allNotes={allNotes}
            onChangeFolder={(folder) => onUpdate({ folder })}
          />
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        {/* Tags Autocomplete Picker */}
        <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Tags:</span>
          <TagAutocompletePicker
            selectedTags={note.tags}
            allNotes={allNotes}
            onAddTag={(tag) => onUpdate({ tags: Array.from(new Set([...note.tags, tag])) })}
            onRemoveTag={(tag) => onUpdate({ tags: note.tags.filter((t) => t !== tag) })}
            placeholder="+ Add tag…"
          />
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        {/* Publication Status & 1-Click Publish Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1-Click Publish/Unpublish Action */}
          <button
            onClick={handleQuickPublish}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
              note.publicationStatus === "published"
                ? "bg-success/15 border-success/40 text-success hover:bg-success/20"
                : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
            }`}
            title="1-Click Publish to Web / Revert to Local"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{note.publicationStatus === "published" ? "Published to Web" : "Publish to Web"}</span>
            {publishFeedback && (
              <span className="text-[10px] font-mono animate-in fade-in-50 ml-1">
                ({publishFeedback})
              </span>
            )}
          </button>

          {/* Cycle Status pill */}
          <button
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-sm ${statusColor}`}
            title="Click to cycle status: Local → Staged → Published"
          >
            {statusLabel}
          </button>

          <span className="text-muted-foreground flex items-center gap-1 text-xs px-1">
            <Clock className="w-3.5 h-3.5" />
            {note.readingTimeMinutes}m read
          </span>

          {/* 1-Click Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopyPlainText}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card/60 hover:bg-card text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            title="Copy clean plain text (markdown stripped)"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* 1-Click Read Aloud (TTS) with auto-scroll and word highlight */}
          <button
            type="button"
            onClick={() => {
              setIsReadingAloud((prev) => !prev);
              if (!isReadingAloud && activeSentenceIndex === null) {
                setActiveSentenceIndex(0);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95 ${
              isReadingAloud
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(248,152,32,0.4)]"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
            title="Listen to note with Read-Aloud TTS player and auto-scroll"
          >
            <Headphones className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{isReadingAloud ? "Reader Active" : "Read Aloud"}</span>
          </button>

          {/* Export & Copy Menu */}
          <ExportMenu note={note} onTriggerReadAloud={() => setIsReadingAloud(true)} />

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "edit" ? (
        <textarea
          value={note.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full min-h-[55vh] bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40 text-foreground"
          placeholder="Start writing your Markdown notes here… Use [[Note Title]] for note-to-note links."
          aria-label="Note content"
          spellCheck={false}
        />
      ) : viewMode === "preview" ? (
        isReadingAloud ? (
          <SpeechMarkdownRenderer
            content={note.content}
            activeSentenceIndex={activeSentenceIndex}
            activeWordIndex={activeWordIndex}
            isReadingAloud={isReadingAloud}
            onSeekSentence={(idx) => {
              setActiveSentenceIndex(idx);
              setIsReadingAloud(true);
            }}
          />
        ) : (
          <MarkdownPreview
            content={note.content}
            allNotes={allNotes}
            onNavigateNote={onNavigateNote}
          />
        )
      ) : (
        /* Split-Pane Side-by-Side */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[60vh]">
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Markdown Source</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">Live Sync</span>
            </div>
            <textarea
              value={note.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full flex-1 min-h-[60vh] p-4 rounded-xl border border-border/80 bg-background/50 focus:bg-background focus:border-primary/50 outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40 transition-colors shadow-inner text-foreground"
              placeholder="Start writing your Markdown notes here… Use [[Note Title]] for note-to-note links."
              aria-label="Note content source"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Live Preview</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">Rendered Output</span>
            </div>
            <div className="flex-1 p-5 rounded-xl border border-border/80 bg-card/30 overflow-y-auto max-h-[75vh]">
              {isReadingAloud ? (
                <SpeechMarkdownRenderer
                  content={note.content}
                  activeSentenceIndex={activeSentenceIndex}
                  activeWordIndex={activeWordIndex}
                  isReadingAloud={isReadingAloud}
                  onSeekSentence={(idx) => {
                    setActiveSentenceIndex(idx);
                    setIsReadingAloud(true);
                  }}
                />
              ) : (
                <MarkdownPreview
                  content={note.content}
                  allNotes={allNotes}
                  onNavigateNote={onNavigateNote}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backlinks & Linked References Section */}
      {incomingBacklinks.length > 0 && (
        <div className="mt-12 pt-6 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-primary" />
            Linked References ({incomingBacklinks.length})
          </h3>
          <div className="space-y-2">
            {incomingBacklinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => onNavigateNote(link.sourceId)}
                className="w-full text-left p-3 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {link.sourceTitle}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  &ldquo;{link.snippet}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Read Aloud Player with auto-scroll */}
      {isReadingAloud && (
        <ReadAloudPlayer
          content={note.content}
          noteTitle={note.title}
          activeSentenceIndex={activeSentenceIndex}
          onSentenceChange={(idx) => setActiveSentenceIndex(idx)}
          onWordChange={(wIdx) => setActiveWordIndex(wIdx)}
          onClose={() => {
            setIsReadingAloud(false);
            setActiveSentenceIndex(null);
            setActiveWordIndex(null);
          }}
          autoScroll={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-popover border border-border rounded-xl shadow-2xl p-5 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete &ldquo;{note.title}&rdquo;?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to permanently delete this note file? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Note
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Editor Canvas Right-Click Context Menu */}
      {editorContextMenu && typeof document !== "undefined" && createPortal(
        <div
          style={{ top: editorContextMenu.y, left: editorContextMenu.x }}
          className="fixed z-[9999] w-52 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl py-1 text-xs text-foreground animate-in fade-in-50 zoom-in-95 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 border-b border-border/50 text-[10px] font-mono text-muted-foreground truncate">
            {note.title}
          </div>

          {onCreateNote && (
            <button
              onClick={() => {
                setEditorContextMenu(null);
                onCreateNote(note.folder);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>New Note</span>
            </button>
          )}

          {onDuplicateNote && (
            <button
              onClick={() => {
                setEditorContextMenu(null);
                onDuplicateNote(note.id);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Duplicate Note</span>
            </button>
          )}

          <div className="my-1 border-t border-border/50" />

          {/* Publishing Actions */}
          <button
            onClick={() => {
              setEditorContextMenu(null);
              handleQuickPublish();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-success" />
            <span>{note.publicationStatus === "published" ? "Unpublish (Set to Local)" : "Publish to Web"}</span>
          </button>

          <button
            onClick={() => {
              setEditorContextMenu(null);
              onUpdate({ publicationStatus: "staged" });
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-warning" />
            <span>Stage for Review</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          <button
            onClick={() => {
              setEditorContextMenu(null);
              handleCopyPlainText();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Copy Plain Text</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          <button
            onClick={() => {
              setEditorContextMenu(null);
              setShowDeleteConfirm(true);
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-destructive/15 text-destructive text-left cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Note…</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Markdown Preview Renderer                                          */
/* ------------------------------------------------------------------ */

function MarkdownPreview({
  content,
  allNotes,
  onNavigateNote,
}: {
  content: string;
  allNotes: Note[];
  onNavigateNote: (id: string) => void;
}) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let codeBlock: string[] | null = null;
  let codeBlockLang = "";

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (codeBlock !== null) {
        elements.push(
          <div key={`code-${i}`} className="my-4">
            <SyntaxHighlighter
              code={codeBlock.join("\n")}
              language={codeBlockLang}
            />
          </div>
        );
        codeBlock = null;
      } else {
        codeBlock = [];
        codeBlockLang = line.slice(3).trim();
      }
      i++;
      continue;
    }
    if (codeBlock !== null) {
      codeBlock.push(line);
      i++;
      continue;
    }

    // GFM Table
    if (isMarkdownTableStart(line) && i + 1 < lines.length && isMarkdownTableSeparator(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && isMarkdownTableStart(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(
        <MarkdownTable
          key={`table-${i}`}
          lines={tableLines}
          renderInline={(t) => formatInline(t, allNotes, onNavigateNote)}
        />
      );
      continue;
    }

    // Headings with anchor IDs for Table of Contents
    if (line.startsWith("### ")) {
      const text = line.slice(4);
      const id = `heading-${slugify(text.replace(/[*`_]/g, ""))}`;
      elements.push(
        <h3 key={i} id={id} className="text-lg font-semibold mt-5 mb-2 scroll-mt-20">
          {formatInline(text, allNotes, onNavigateNote)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      const text = line.slice(3);
      const id = `heading-${slugify(text.replace(/[*`_]/g, ""))}`;
      elements.push(
        <h2 key={i} id={id} className="text-xl font-semibold mt-7 mb-3 border-b border-border pb-2 scroll-mt-20">
          {formatInline(text, allNotes, onNavigateNote)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      const text = line.slice(2);
      const id = `heading-${slugify(text.replace(/[*`_]/g, ""))}`;
      elements.push(
        <h1 key={i} id={id} className="text-2xl font-bold mt-4 mb-3 scroll-mt-20">
          {formatInline(text, allNotes, onNavigateNote)}
        </h1>
      );
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-3 border-primary pl-4 my-3 text-muted-foreground italic">
          {formatInline(line.slice(2), allNotes, onNavigateNote)}
        </blockquote>
      );
    }
    // Horizontal rule
    else if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-border my-6" />);
    }
    // Unordered list
    else if (line.match(/^[-*]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        listItems.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-6 mb-3 space-y-1">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{formatInline(item, allNotes, onNavigateNote)}</li>
          ))}
        </ul>
      );
      continue;
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-6 mb-3 space-y-1">
          {listItems.map((item, j) => (
            <li key={j} className="leading-relaxed">{formatInline(item, allNotes, onNavigateNote)}</li>
          ))}
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
      elements.push(<p key={i} className="leading-relaxed mb-3">{formatInline(line, allNotes, onNavigateNote)}</p>);
    }

    i++;
  }

  // Close unclosed code block
  if (codeBlock !== null) {
    elements.push(
      <div key="code-end" className="my-4">
        <SyntaxHighlighter
          code={codeBlock.join("\n")}
          language={codeBlockLang}
        />
      </div>
    );
  }

  return (
    <div className="note-content">
      <TableOfContents markdown={content} className="mb-6" />
      {elements}
    </div>
  );
}

function formatInline(
  text: string,
  allNotes: Note[],
  onNavigateNote: (id: string) => void
): React.ReactNode {
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
      parts.push(<strong key={match.index} className="font-semibold">{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-muted text-accent-foreground px-1.5 py-0.5 rounded text-[0.875em] font-mono">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[[")) {
      const linkText = m.slice(2, -2).trim();
      const targetNote = allNotes.find(
        (n) =>
          n.title.toLowerCase() === linkText.toLowerCase() ||
          n.slug.toLowerCase() === slugify(linkText)
      );

      if (targetNote) {
        parts.push(
          <button
            key={match.index}
            onClick={() => onNavigateNote(targetNote.id)}
            className="text-info hover:underline underline-offset-2 cursor-pointer font-medium"
            title={`Jump to note: ${targetNote.title}`}
          >
            {targetNote.title}
          </button>
        );
      } else {
        parts.push(
          <span
            key={match.index}
            className="text-muted-foreground/60 line-through decoration-destructive cursor-help"
            title={`Broken link: "${linkText}" note not found`}
          >
            {linkText}
          </span>
        );
      }
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/*  Advanced Developer Search Modal with Filters, Highlighting & Keys */
/* ------------------------------------------------------------------ */

function AdvancedSearchModal({
  notes,
  initialQuery,
  onSelect,
  onClose,
}: {
  notes: Note[];
  initialQuery: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<"all" | "title" | "content" | "tags">("all");
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"relevance" | "updated" | "title">("relevance");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecentSearches(JSON.parse(localStorage.getItem("vibe_notes_recent_searches") || "[]"));
    } catch {}
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchOptions: SearchOptions = useMemo(() => {
    return {
      scope,
      status: statusFilter,
      sortBy,
    };
  }, [scope, statusFilter, sortBy]);

  const results = useMemo(() => {
    return searchNotes(notes, query, searchOptions);
  }, [notes, query, searchOptions]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, scope, statusFilter, sortBy]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex].note.id, query);
    }
  };

  const handleSelectResult = (id: string, q: string) => {
    if (q.trim()) {
      const updated = [q.trim(), ...recentSearches.filter((s) => s !== q.trim())].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem("vibe_notes_recent_searches", JSON.stringify(updated));
      } catch {}
    }
    onSelect(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60"
            placeholder="Search titles, tags, or content... (try 'tag:Java' or 'status:published')"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Filter Controls Row */}
        <div className="px-4 py-2 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Scope selection */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground mr-1 text-[11px]">Scope:</span>
            {(["all", "title", "content", "tags"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-2 py-0.5 rounded capitalize cursor-pointer transition-colors ${
                  scope === s ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground mr-1 text-[11px]">Status:</span>
            {[
              { label: "All", val: undefined },
              { label: "Published", val: "published" as const },
              { label: "Local", val: "local" as const },
            ].map((st) => (
              <button
                key={st.label}
                onClick={() => setStatusFilter(st.val)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  statusFilter === st.val ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] text-muted-foreground border-none outline-none cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="updated">Recently Updated</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results / Empty / History List */}
        <div className="flex-1 overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="p-4 border-b border-border/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                <History className="w-3 h-3" />
                Recent Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
              <p className="font-medium text-foreground">No notes matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1 text-muted-foreground">Try clearing scopes or searching with partial words.</p>
            </div>
          )}

          {results.map((result, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={result.note.id}
                onClick={() => handleSelectResult(result.note.id, query)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-start gap-3 w-full px-5 py-3.5 text-left border-b border-border/40 last:border-b-0 transition-colors cursor-pointer ${
                  isSelected ? "bg-accent/80" : "hover:bg-muted/40"
                }`}
              >
                <FileText className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold truncate text-foreground">
                      <HighlightedText text={result.note.title} query={query} />
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(result.note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    <HighlightedText text={result.matchSnippet} query={query} />
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                      {result.note.folder}
                    </span>
                    {result.matchedIn.map((m) => (
                      <span key={m} className="text-[10px] px-1 py-0.2 rounded bg-primary/15 text-primary">
                        matched {m}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {result.note.publicationStatus}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {!query && (
            <div className="px-6 py-8 text-center text-xs text-muted-foreground">
              <p>Type keywords to search through titles, body content, and tags.</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Use <kbd className="px-1 bg-muted rounded font-mono">↑</kbd> <kbd className="px-1 bg-muted rounded font-mono">↓</kbd> to navigate and <kbd className="px-1 bg-muted rounded font-mono">Enter</kbd> to select.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Found {results.length} {results.length === 1 ? "result" : "results"}</span>
          <div className="flex items-center gap-3">
            <span><code>#tag</code> filter</span>
            <span><code>status:published</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const regex = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded-xs px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Publishing Safety Modal                                           */
/* ------------------------------------------------------------------ */

function PublishingSafetyModal({
  notes,
  onClose,
  onUpdateStatus,
}: {
  notes: Note[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: PublicationStatus) => void;
}) {
  const publishedNotes = notes.filter((n) => n.publicationStatus === "published");
  const stagedNotes = notes.filter((n) => n.publicationStatus === "staged");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportToGit = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const res = await fetch("/api/publish/export", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setExportMessage(`Successfully exported ${data.count} note(s) to content/published/ for Git commit & Vercel deployment!`);
      } else {
        alert(data.error || "Export failed");
      }
    } catch (err: any) {
      alert("Export request failed: " + err?.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            <h2 className="text-base font-semibold">Publishing Safety Boundary</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-foreground">Strict Privacy Boundary Active</p>
              <p className="text-muted-foreground leading-relaxed">
                Local notes are private by default, saved in <code>content/notes/</code>, and excluded from Git commits by <code>.gitignore</code>. The public website (port 3001) serves <strong>only</strong> notes explicitly marked as &ldquo;Published&rdquo;.
              </p>
            </div>
          </div>

          {/* Git & Vercel Export Panel */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">Export Published Notes to Git</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Vercel Pipeline</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Copies all notes currently marked as <strong>Published</strong> ({publishedNotes.length}) into the tracked <code>content/published/</code> directory. Push your Git repo to trigger automatic static cloud deployments on Vercel or Netlify.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportToGit}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                {isExporting ? "Exporting…" : "Export to Git"}
              </button>
            </div>
            {exportMessage && (
              <div className="p-2.5 rounded-lg bg-success/15 border border-success/30 text-xs text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{exportMessage}</span>
              </div>
            )}
          </div>

          {/* Staged Notes Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-warning" />
              Staged for Publication ({stagedNotes.length})
            </h3>
            {stagedNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-md">
                No notes currently staged. Set a note&rsquo;s status to &ldquo;Staged&rdquo; to prepare it for publishing.
              </p>
            ) : (
              <div className="space-y-2">
                {stagedNotes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground">{n.folder} • /{n.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateStatus(n.id, "published")}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-success text-success-foreground hover:bg-success/90 transition-colors cursor-pointer"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => onUpdateStatus(n.id, "local")}
                        className="px-2 py-1 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                      >
                        Keep Private
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Notes Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-success" />
              Published Notes on Public Site ({publishedNotes.length})
            </h3>
            {publishedNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-md">
                No notes published yet.
              </p>
            ) : (
              <div className="space-y-2">
                {publishedNotes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground">Public path: <code>/notes/{n.slug}</code></p>
                    </div>
                    <button
                      onClick={() => onUpdateStatus(n.id, "local")}
                      className="px-2.5 py-1 text-xs rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                    >
                      Unpublish (Make Private)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <strong>Deployment Notice:</strong> Publishing marks content ready for public display. Clicking &ldquo;Export to Git&rdquo; writes files to <code>content/published/</code> ready to commit and push to Vercel.
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive Documentation & Video Guides Modal                     */
/* ------------------------------------------------------------------ */

function DocsAndHelpModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"videos" | "shortcuts" | "syntax" | "publishing">("videos");
  const [selectedVideoIdx, setSelectedVideoIdx] = useState<number>(0);

  const videoDemos = [
    {
      id: "tag-folder",
      title: "Tag Autocomplete & Folder Hierarchy",
      badge: "Tags & Folders",
      src: "/videos/tag-folder-demo.webp",
      desc: "Instant autocomplete search for workspace tags, on-the-fly tag & folder creation, and inline #hashtag extraction.",
      steps: [
        {
          title: "Search Existing Workspace Tags",
          detail: "Type in any tag picker or Quick Capture bar. Existing tags with note counts appear in real time.",
        },
        {
          title: "Create New Tags On The Fly",
          detail: "Type any new tag name and press Enter on \"Create #tag\". It is automatically added as an interactive badge.",
        },
        {
          title: "Search & Create Folders with Combobox",
          detail: "Click the folder picker to view all existing hierarchy paths or type a new nested folder like \"Engineering/Distributed\".",
        },
        {
          title: "Inline Hashtags in Quick Capture",
          detail: "Type \"Kafka Streams #streaming #kafka\" in the note title. Hashtags are extracted automatically into tags upon creation!",
        },
        {
          title: "Keyboard Ergonomics",
          detail: "Use ↑ / ↓ arrow keys to navigate suggestions, Enter / Tab / Comma to select, and Backspace on empty input to delete tags.",
        },
      ],
    },
    {
      id: "keyboard-nav",
      title: "Keyboard-First Speed Navigation",
      badge: "Hotkeys & Search",
      src: "/videos/keyboard-nav-demo.webp",
      desc: "Fly through your entire knowledge workspace using fast hotkeys and the global fuzzy command palette.",
      steps: [
        {
          title: "⌘K / Ctrl+K — Advanced Fuzzy Search",
          detail: "Open the fuzzy search palette from anywhere. Type queries or use syntax like #tag, folder:xyz, or status:pub.",
        },
        {
          title: "Arrow Keys & Enter Navigation",
          detail: "Use Down/Up arrows to highlight search results and press Enter to instantly jump into the note.",
        },
        {
          title: "⌘E / Ctrl+E — Toggle Edit vs Preview",
          detail: "Switch instantaneously between raw Markdown editor and rendered preview mode.",
        },
        {
          title: "⌘I / Ctrl+I — Return to Workspace Index",
          detail: "Return directly to the master workspace index dashboard from any note view.",
        },
        {
          title: "⌘B / Ctrl+B — Toggle Sidebar",
          detail: "Collapse the left sidebar to enter distraction-free full-width writing mode.",
        },
      ],
    },
    {
      id: "workspace-overview",
      title: "Workspace Dashboard & Quick Capture",
      badge: "Dashboard & Capture",
      src: "/videos/workspace-overview-demo.webp",
      desc: "Live workspace metrics, publication filtering tabs, and lightning-fast thought capture.",
      steps: [
        {
          title: "Live Workspace Analytics",
          detail: "Track total notes, published documentation count, staged review items, and estimated reading time.",
        },
        {
          title: "Publication Status Filters",
          detail: "Switch between All, Published, Staged for Review, and Local Only with 1-click filter tabs.",
        },
        {
          title: "Quick Capture Bar",
          detail: "Capture thoughts, architecture snippets, or meeting notes in 2 seconds with custom folder and tags.",
        },
        {
          title: "Wiki-Links & Backlinks Explorer",
          detail: "Link notes together using [[Note Title]]. View incoming backlinks automatically at the bottom of notes.",
        },
      ],
    },
  ];

  const shortcutGroups = [
    {
      category: "Navigation & Command Palette",
      shortcuts: [
        { key: "⌘ K", alt: "Ctrl + K", desc: "Open Advanced Fuzzy Search" },
        { key: "⌘ I", alt: "Ctrl + I", desc: "Return to Workspace Index Dashboard" },
        { key: "⌘ B", alt: "Ctrl + B", desc: "Toggle Sidebar open / collapsed" },
        { key: "?", alt: "Shift + /", desc: "Open this Docs & Video Guides modal" },
        { key: "ESC", alt: "Escape", desc: "Close modals / Exit to Index" },
      ],
    },
    {
      category: "Note Actions & Editing",
      shortcuts: [
        { key: "⌘ N", alt: "Ctrl + N", desc: "Create a new note in current folder" },
        { key: "⌘ E", alt: "Ctrl + E", desc: "Toggle Markdown Edit mode vs Preview" },
        { key: "⌘ S", alt: "Ctrl + S", desc: "Save note to disk (auto-saved)" },
        { key: "Backspace", alt: "Delete", desc: "Remove last tag badge when input is empty" },
      ],
    },
    {
      category: "Combobox & Autocomplete",
      shortcuts: [
        { key: "↓ / ↑", alt: "Down / Up", desc: "Navigate suggestions or create button" },
        { key: "Enter", alt: "Return", desc: "Confirm selection or create tag/folder" },
        { key: "Tab / ,", alt: "Tab or Comma", desc: "Accept tag suggestion" },
      ],
    },
    {
      category: "Publishing Safety Boundary",
      shortcuts: [
        { key: "⌘ P", alt: "Ctrl + P", desc: "Open Publishing Safety Boundary review hub" },
      ],
    },
  ];

  const currentVideo = videoDemos[selectedVideoIdx];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Documentation & Video Guides</h2>
              <p className="text-xs text-muted-foreground">Interactive walkthroughs, keyboard shortcuts, and power-user tips.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close documentation modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-background">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "videos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Walkthroughs ({videoDemos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "shortcuts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Hotkeys</span>
          </button>
          <button
            onClick={() => setActiveTab("syntax")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "syntax"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Wiki-Links</span>
          </button>
          <button
            onClick={() => setActiveTab("publishing")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "publishing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publishing Boundary</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: VIDEO WALKTHROUGHS */}
          {activeTab === "videos" && (
            <div className="space-y-6">
              {/* Video Selector Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {videoDemos.map((demo, idx) => (
                  <button
                    key={demo.id}
                    onClick={() => setSelectedVideoIdx(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedVideoIdx === idx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>{demo.title}</span>
                  </button>
                ))}
              </div>

              {/* Video Showcase Card */}
              <div className="rounded-xl border border-border bg-card/50 overflow-hidden shadow-lg">
                {/* Browser Mockup Chrome Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground ml-2">
                      vibe-notes://walkthrough/{currentVideo.id}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {currentVideo.badge}
                  </span>
                </div>

                {/* Looping Demo Player */}
                <div className="p-3 bg-black/40 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentVideo.src}
                    alt={currentVideo.title}
                    className="w-full rounded-lg border border-border/80 object-contain max-h-[360px] bg-card/60 shadow-md"
                  />
                </div>

                {/* Video Info & Step-by-Step Guide */}
                <div className="p-5 border-t border-border space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{currentVideo.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{currentVideo.desc}</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Step-by-Step Feature Guide
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {currentVideo.steps.map((st, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border/50 bg-background text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono">
                              {i + 1}
                            </span>
                            <span>{st.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{st.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYBOARD SHORTCUTS */}
          {activeTab === "shortcuts" && (
            <div className="space-y-6">
              {shortcutGroups.map((group) => (
                <div key={group.category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.shortcuts.map((s) => (
                      <div
                        key={s.desc}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-card/60 border border-border/50 text-xs"
                      >
                        <span className="text-foreground">{s.desc}</span>
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-semibold text-primary">
                            {s.key}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SEARCH SYNTAX & WIKI-LINKS */}
          {activeTab === "syntax" && (
            <div className="space-y-6 text-xs leading-relaxed">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Advanced Search Operators
                </h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-card border border-border/60 flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-muted rounded font-mono text-primary font-semibold">#tag</kbd>
                    <div>
                      <p className="font-semibold text-foreground">Filter by Tag</p>
                      <p className="text-muted-foreground">Type <code className="bg-muted px-1 rounded">#redis</code> or <code className="bg-muted px-1 rounded">#architecture</code> in the search bar or title input to filter or tag notes.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/60 flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-muted rounded font-mono text-primary font-semibold">folder:name</kbd>
                    <div>
                      <p className="font-semibold text-foreground">Filter by Folder Hierarchy</p>
                      <p className="text-muted-foreground">Type <code className="bg-muted px-1 rounded">folder:Java</code> to find all notes inside the Java directory and subdirectories.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/60 flex items-start gap-3">
                    <kbd className="px-2 py-1 bg-muted rounded font-mono text-primary font-semibold">status:pub</kbd>
                    <div>
                      <p className="font-semibold text-foreground">Filter by Publication Boundary</p>
                      <p className="text-muted-foreground">Filter notes by lifecycle status using <code className="bg-muted px-1 rounded">status:published</code>, <code className="bg-muted px-1 rounded">status:staged</code>, or <code className="bg-muted px-1 rounded">status:local</code>.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Bidirectional Wiki-Links & Backlinks
                </h3>
                <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
                  <p className="text-foreground">
                    Connect your notes like a personal wiki using double brackets:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-muted/60 font-mono text-[11px] text-primary">
                    {`Review the architecture decisions in [[Java Concurrency & Memory Model (JMM)]] 
before implementing [[Spring Boot Architecture & Lifecycle]].`}
                  </pre>
                  <p className="text-muted-foreground">
                    Vibe Notes automatically indexes incoming references and displays an interactive <strong>Incoming Backlinks</strong> card at the bottom of the note in Preview mode.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISHING SAFETY BOUNDARY */}
          {activeTab === "publishing" && (
            <div className="space-y-6 text-xs leading-relaxed">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  The 3-Tier Publishing Boundary
                </h3>
                <p className="text-muted-foreground mb-4">
                  Vibe Notes keeps your private notes completely secure on your machine while allowing you to cleanly publish selected technical guides to the public web reader on port 3001.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-muted bg-card space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                      <span>1. Local Only</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Private by default. Saved strictly to your local filesystem in <code className="bg-muted px-1 rounded">content/notes/</code> and git-ignored.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-warning/40 bg-warning/5 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-warning">
                      <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                      <span>2. Staged for Review</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Staged for pre-publication audit. Accessible via the <kbd className="px-1 bg-muted rounded font-mono">⌘P</kbd> hub to verify formatting before going live.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-success/40 bg-success/5 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-success">
                      <span className="w-2.5 h-2.5 rounded-full bg-success" />
                      <span>3. Published</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Live public technical documentation visible to readers on <code className="bg-muted px-1 rounded">http://localhost:3001</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">?</kbd> anytime to open this guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
