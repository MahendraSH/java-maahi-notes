"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Search, Plus, Folder, FolderOpen, FileText, Hash, ChevronRight, ChevronDown,
  Sun, Moon, Save, Clock, Tag, BookOpen, Menu, X, Trash2, Eye, Edit3, Copy,
  Globe, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, CornerDownRight,
  ExternalLink, LayoutDashboard, Sparkles, Filter, ArrowUpDown, History,
  Layers, Pin, Calendar, Check, Keyboard, HelpCircle
} from "lucide-react";
import {
  type Note, type NoteMetadata, type FolderItem, type PublicationStatus, type Backlink,
  createSampleNotes, slugify, calculateReadingTime, buildFolderTree, searchNotes,
  findIncomingBacklinks, type SearchOptions
} from "@vibe-notes/notes-core";

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
  const folders = useMemo(() => buildFolderTree(notes), [notes]);

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
  const [editMode, setEditMode] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Toggle theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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

      // ⌘E / Ctrl+E: Toggle Edit vs Preview Mode
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setEditMode((prev) => !prev);
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
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedFolder, searchOpen, publishModalOpen, shortcutsModalOpen, store]);

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
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-4" aria-label="Sidebar navigation">
          {/* FOLDERS HIERARCHY */}
          <div>
            <div className="mb-1 px-2 py-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Knowledge Folders</span>
              <div className="flex items-center gap-1.5">
                {selectedFolder && (
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsCreatingFolder((prev) => !prev)}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer p-0.5 rounded"
                  title="Create new folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isCreatingFolder && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const folder = newFolderName.trim();
                  if (folder) {
                    store.createNote(folder, `Untitled in ${folder.split("/").pop()}`);
                    setSelectedFolder(folder);
                    setNewFolderName("");
                    setIsCreatingFolder(false);
                  }
                }}
                className="px-2 mb-2"
              >
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name… (Enter to save)"
                  className="w-full text-xs px-2 py-1 rounded bg-background border border-primary outline-none text-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  onBlur={() => {
                    if (!newFolderName.trim()) setIsCreatingFolder(false);
                  }}
                />
              </form>
            )}

            {store.folders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                isSelected={selectedFolder === folder.path}
                onClick={() => {
                  setSelectedFolder(folder.path === selectedFolder ? null : folder.path);
                  setSelectedTag(null);
                }}
              />
            ))}
          </div>

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
        {/* Top Bar */}
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb / Location indicator */}
          <div className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => {
                store.setActiveNoteId(null);
                setSelectedFolder(null);
                setSelectedTag(null);
              }}
              className="hover:text-primary transition-colors flex items-center gap-1 text-muted-foreground text-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
            {selectedFolder && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{selectedFolder}</span>
              </>
            )}
            {selectedTag && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">#{selectedTag}</span>
              </>
            )}
            {store.activeNote && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground font-medium text-xs truncate max-w-[240px]">
                  {store.activeNote.title || "Untitled"}
                </span>
              </>
            )}
          </div>

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

          {/* Shortcuts Quick Button in Header */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
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

          {/* Edit/Preview Toggle if Note Open */}
          {store.activeNote && (
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setEditMode(true)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  editMode ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
                aria-label="Edit mode"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditMode(false)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  !editMode ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
                aria-label="Preview mode"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </header>

        {/* Main Body: Either Note Editor OR The Complete Index Dashboard */}
        <div className="flex-1 overflow-y-auto">
          {store.activeNote ? (
            <NoteEditor
              note={store.activeNote}
              allNotes={store.notes}
              editMode={editMode}
              onUpdate={(updates) => store.updateNote(store.activeNote!.id, updates)}
              onDelete={() => store.deleteNote(store.activeNote!.id)}
              onNavigateNote={(id) => store.setActiveNoteId(id)}
              onBackToIndex={() => store.setActiveNoteId(null)}
            />
          ) : (
            <WorkspaceIndexDashboard
              notes={store.notes}
              selectedFolder={selectedFolder}
              selectedTag={selectedTag}
              onSelectNote={(id) => store.setActiveNoteId(id)}
              onCreateNote={(folder, title, tags) => store.createNote(folder, title, tags)}
              onClearFilter={() => { setSelectedFolder(null); setSelectedTag(null); }}
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

      {/* ─── KEYBOARD SHORTCUTS CHEATSHEET MODAL ─── */}
      {shortcutsModalOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsModalOpen(false)} />
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
/*  Folder Tree Item Subcomponent                                      */
/* ------------------------------------------------------------------ */

function FolderTreeItem({
  folder,
  isSelected,
  onClick,
}: {
  folder: FolderItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full rounded-md text-sm transition-colors cursor-pointer ${
        isSelected
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
      style={{ paddingLeft: `${(folder.depth + 1) * 12 + 8}px`, paddingTop: "6px", paddingBottom: "6px", paddingRight: "8px" }}
    >
      <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
      <span className="truncate">{folder.name}</span>
      <span className="ml-auto text-xs text-muted-foreground">{folder.noteCount}</span>
    </button>
  );
}



/* ------------------------------------------------------------------ */
/*  Note Editor & Preview Component                                    */
/* ------------------------------------------------------------------ */

function NoteEditor({
  note,
  allNotes,
  editMode,
  onUpdate,
  onDelete,
  onNavigateNote,
  onBackToIndex,
}: {
  note: Note;
  allNotes: Note[];
  editMode: boolean;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onNavigateNote: (id: string) => void;
  onBackToIndex: () => void;
}) {
  const cycleStatus = () => {
    const order: PublicationStatus[] = ["local", "staged", "published"];
    const currentIdx = order.indexOf(note.publicationStatus);
    const next = order[(currentIdx + 1) % order.length];
    onUpdate({ publicationStatus: next });
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
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      {/* Back to index link */}
      <button
        onClick={onBackToIndex}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-4 cursor-pointer transition-colors"
      >
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        Back to Workspace Index
      </button>

      {/* Title */}
      <input
        type="text"
        value={note.title}
        onChange={(e) => onUpdate({ title: e.target.value, slug: slugify(e.target.value || "untitled") })}
        className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-3"
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
        <div className="flex-1 min-w-[220px] flex items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Tags:</span>
          <TagAutocompletePicker
            selectedTags={note.tags}
            allNotes={allNotes}
            onAddTag={(tag) => onUpdate({ tags: Array.from(new Set([...note.tags, tag])) })}
            onRemoveTag={(tag) => onUpdate({ tags: note.tags.filter((t) => t !== tag) })}
            placeholder="+ Add tag (type to search)…"
          />
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        {/* Publication Status & Meta Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-sm ${statusColor}`}
            title="Click to cycle: Local → Staged → Published"
          >
            {statusLabel}
          </button>

          <span className="text-muted-foreground flex items-center gap-1 text-xs px-1">
            <Clock className="w-3.5 h-3.5" />
            {note.readingTimeMinutes}m read
          </span>

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {editMode ? (
        <textarea
          value={note.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full min-h-[55vh] bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/40"
          placeholder="Start writing your Markdown notes here… Use [[Note Title]] for note-to-note links."
          aria-label="Note content"
          spellCheck={false}
        />
      ) : (
        <MarkdownPreview
          content={note.content}
          allNotes={allNotes}
          onNavigateNote={onNavigateNote}
        />
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
          <pre key={`code-${i}`} className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4 text-sm leading-relaxed font-mono">
            <code>{codeBlock.join("\n")}</code>
          </pre>
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

    // Headings
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-lg font-semibold mt-5 mb-2">{formatInline(line.slice(4), allNotes, onNavigateNote)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-semibold mt-7 mb-3 border-b border-border pb-2">{formatInline(line.slice(3), allNotes, onNavigateNote)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-3">{formatInline(line.slice(2), allNotes, onNavigateNote)}</h1>);
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
      <pre key="code-end" className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4 text-sm leading-relaxed font-mono">
        <code>{codeBlock.join("\n")}</code>
      </pre>
    );
  }

  return <div className="note-content">{elements}</div>;
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
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("vibe_notes_recent_searches") || "[]");
    } catch {
      return [];
    }
  });

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
              <strong>Deployment Notice:</strong> Publishing marks content ready for public display. A GitHub push triggers cloud deployment only if your repository&rsquo;s deployment workflow is configured.
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
/*  Keyboard Shortcuts Cheatsheet Modal                                */
/* ------------------------------------------------------------------ */

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcutGroups = [
    {
      category: "Navigation & Workspace",
      shortcuts: [
        { key: "⌘ K", alt: "Ctrl + K", desc: "Open Advanced Search" },
        { key: "⌘ I", alt: "Ctrl + I", desc: "Return to Workspace Index Dashboard" },
        { key: "⌘ B", alt: "Ctrl + B", desc: "Toggle Sidebar open / collapsed" },
        { key: "?", alt: "Shift + /", desc: "Open this keyboard shortcuts guide" },
        { key: "ESC", alt: "Escape", desc: "Close modals / Exit to Index" },
      ],
    },
    {
      category: "Note Actions & Editing",
      shortcuts: [
        { key: "⌘ N", alt: "Ctrl + N / Alt + N", desc: "Create a new note" },
        { key: "⌘ E", alt: "Ctrl + E", desc: "Toggle Markdown Edit mode vs Preview" },
        { key: "⌘ S", alt: "Ctrl + S", desc: "Save note to disk (auto-saved)" },
      ],
    },
    {
      category: "Search & List Navigation",
      shortcuts: [
        { key: "↓ / ↑", alt: "Down / Up Arrow", desc: "Navigate through search results" },
        { key: "Enter", alt: "Return", desc: "Open highlighted note" },
        { key: "#tag", alt: "tag:name", desc: "Filter search query by tag" },
        { key: "status:pub", alt: "status:published", desc: "Filter search query by status" },
      ],
    },
    {
      category: "Publishing & Safety",
      shortcuts: [
        { key: "⌘ P", alt: "Ctrl + P", desc: "Open Publishing Safety Boundary modal" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Keyboard Navigation Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.desc}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-card/60 border border-border/50 text-xs"
                  >
                    <span className="text-foreground">{s.desc}</span>
                    <kbd className="px-2 py-1 rounded bg-muted border border-border text-[11px] font-mono font-semibold text-primary">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">ESC</kbd> to dismiss</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
