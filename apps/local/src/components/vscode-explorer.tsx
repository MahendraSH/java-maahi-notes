"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Folder, FolderOpen, FolderPlus, FilePlus, FileText,
  ChevronRight, ChevronDown, Trash2, Edit3, Copy, Globe,
  ShieldCheck, RotateCw, ChevronsDownUp, MoreVertical,
  Check, ArrowRight, CornerDownRight, ExternalLink,
  Plus, X, AlertCircle
} from "lucide-react";
import {
  type Note,
  type PublicationStatus,
  DEFAULT_WORKSPACE_FOLDERS,
  slugify,
} from "@vibe-notes/notes-core";

export interface ContextMenuState {
  x: number;
  y: number;
  type: "note" | "folder" | "background";
  noteId?: string;
  folderPath?: string;
}

export interface InlineCreatingState {
  parentPath: string; // empty string for root, or folder path
  type: "file" | "folder";
}

export interface InlineRenamingState {
  type: "file" | "folder";
  id: string; // noteId or folderPath
  currentName: string;
}

export interface VSCodeExplorerProps {
  notes: Note[];
  activeNoteId: string | null;
  selectedFolder: string | null;
  expandedFolders: Set<string>;
  onToggleExpand: (folderPath: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectNote: (id: string) => void;
  onSelectFolder: (folderPath: string | null) => void;
  onCreateNote: (folder: string, title?: string) => Promise<Note>;
  onDeleteNote: (id: string) => Promise<void>;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onRefresh?: () => void;
  customFolders: string[];
  onAddFolder: (folderPath: string) => void;
  onRenameFolder: (oldPath: string, newPath: string) => void;
  onDeleteFolder: (folderPath: string, deleteNotes: boolean) => void;
}

export function VSCodeExplorer({
  notes,
  activeNoteId,
  selectedFolder,
  expandedFolders,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onRefresh,
  customFolders,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: VSCodeExplorerProps) {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Inline Creation State
  const [inlineCreating, setInlineCreating] = useState<InlineCreatingState | null>(null);
  const [inlineName, setInlineName] = useState("");

  // Inline Rename State
  const [inlineRenaming, setInlineRenaming] = useState<InlineRenamingState | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "note" | "folder";
    id: string;
    title: string;
    noteCount?: number;
  } | null>(null);

  // Move Folder Modal State
  const [moveFolderNoteId, setMoveFolderNoteId] = useState<string | null>(null);

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      setContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setInlineCreating(null);
        setInlineRenaming(null);
        setDeleteConfirm(null);
        setMoveFolderNoteId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Compute all unique folder paths
  const allFolderPaths = useMemo(() => {
    const set = new Set<string>();
    for (const def of DEFAULT_WORKSPACE_FOLDERS) {
      if (def) set.add(def.trim());
    }
    for (const cust of customFolders) {
      if (cust) set.add(cust.trim());
    }
    for (const n of notes) {
      if (n.folder) set.add(n.folder.trim());
    }

    // Add all ancestor segments
    const finalSet = new Set<string>();
    for (const f of set) {
      const parts = f.split("/").filter(Boolean);
      let curr = "";
      for (const p of parts) {
        curr = curr ? `${curr}/${p}` : p;
        finalSet.add(curr);
      }
    }
    return Array.from(finalSet).sort();
  }, [notes, customFolders]);

  // Compute folder hierarchy tree
  const folderTree = useMemo(() => {
    interface FolderNode {
      path: string;
      name: string;
      parentPath: string | null;
      depth: number;
      subfolders: FolderNode[];
      notes: Note[];
    }

    const nodeMap = new Map<string, FolderNode>();

    for (const path of allFolderPaths) {
      const parts = path.split("/");
      const name = parts[parts.length - 1];
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : null;
      const depth = parts.length - 1;
      const folderNotes = notes.filter((n) => n.folder === path);

      nodeMap.set(path, {
        path,
        name,
        parentPath,
        depth,
        subfolders: [],
        notes: folderNotes,
      });
    }

    const rootFolders: FolderNode[] = [];
    for (const [path, node] of nodeMap) {
      if (node.parentPath && nodeMap.has(node.parentPath)) {
        nodeMap.get(node.parentPath)!.subfolders.push(node);
      } else {
        rootFolders.push(node);
      }
    }

    // Sort subfolders and notes alphabetically
    const sortNode = (node: FolderNode) => {
      node.subfolders.sort((a, b) => a.name.localeCompare(b.name));
      node.notes.sort((a, b) => a.title.localeCompare(b.title));
      node.subfolders.forEach(sortNode);
    };
    rootFolders.sort((a, b) => a.name.localeCompare(b.name));
    rootFolders.forEach(sortNode);

    return rootFolders;
  }, [allFolderPaths, notes]);

  // Handle right-click on tree item
  const handleContextMenu = (
    e: React.MouseEvent,
    type: "note" | "folder" | "background",
    id?: string,
    folderPath?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 320);

    setContextMenu({
      x,
      y,
      type,
      noteId: id,
      folderPath,
    });
  };

  // Submit inline creation (file or folder)
  const submitInlineCreation = async () => {
    if (!inlineCreating) return;
    const name = inlineName.trim();
    if (!name) {
      setInlineCreating(null);
      setInlineName("");
      return;
    }

    if (inlineCreating.type === "folder") {
      const targetFolder = inlineCreating.parentPath
        ? `${inlineCreating.parentPath}/${name}`
        : name;
      onAddFolder(targetFolder);
      onToggleExpand(targetFolder);
    } else {
      // File creation
      const cleanTitle = name.endsWith(".md") ? name.slice(0, -3) : name;
      const targetFolder = inlineCreating.parentPath || "General";
      await onCreateNote(targetFolder, cleanTitle);
      if (inlineCreating.parentPath) {
        onToggleExpand(inlineCreating.parentPath);
      }
    }

    setInlineCreating(null);
    setInlineName("");
  };

  // Submit inline rename
  const submitInlineRename = () => {
    if (!inlineRenaming) return;
    const newName = renameValue.trim();
    if (!newName || newName === inlineRenaming.currentName) {
      setInlineRenaming(null);
      setRenameValue("");
      return;
    }

    if (inlineRenaming.type === "folder") {
      const parts = inlineRenaming.id.split("/");
      parts[parts.length - 1] = newName;
      const newPath = parts.join("/");
      onRenameFolder(inlineRenaming.id, newPath);
    } else {
      const cleanTitle = newName.endsWith(".md") ? newName.slice(0, -3) : newName;
      onUpdateNote(inlineRenaming.id, {
        title: cleanTitle,
        slug: slugify(cleanTitle),
      });
    }

    setInlineRenaming(null);
    setRenameValue("");
  };

  // Duplicate a note
  const duplicateNote = async (noteId: string) => {
    const original = notes.find((n) => n.id === noteId);
    if (!original) return;
    const newTitle = `${original.title} (Copy)`;
    const newNote = await onCreateNote(original.folder, newTitle);
    onUpdateNote(newNote.id, {
      content: original.content,
      tags: [...original.tags],
      description: original.description,
      publicationStatus: "local",
    });
  };

  return (
    <div
      className="flex flex-col h-full select-none text-sidebar-foreground"
      onContextMenu={(e) => handleContextMenu(e, "background")}
    >
      {/* VS Code Explorer Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border bg-sidebar/50">
        <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground font-mono flex items-center gap-1.5">
          <span>Explorer</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-semibold">
            {notes.length}
          </span>
        </span>

        {/* Action icons like VS Code */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={() => {
              setInlineCreating({
                parentPath: selectedFolder || "",
                type: "file",
              });
              setInlineName("");
            }}
            className="p-1 rounded hover:bg-sidebar-accent hover:text-foreground cursor-pointer transition-colors"
            title="New Note (creates in selected folder)"
            aria-label="New Note"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setInlineCreating({
                parentPath: selectedFolder || "",
                type: "folder",
              });
              setInlineName("");
            }}
            className="p-1 rounded hover:bg-sidebar-accent hover:text-foreground cursor-pointer transition-colors"
            title="New Folder"
            aria-label="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-sidebar-accent hover:text-foreground cursor-pointer transition-colors"
              title="Refresh Explorer"
              aria-label="Refresh Explorer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onCollapseAll}
            className="p-1 rounded hover:bg-sidebar-accent hover:text-foreground cursor-pointer transition-colors"
            title="Collapse All Folders"
            aria-label="Collapse All Folders"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Root Inline Creation Input (when creating at root) */}
      {inlineCreating && inlineCreating.parentPath === "" && (
        <div className="px-3 py-1.5 border-b border-sidebar-border bg-sidebar-accent/50 animate-in fade-in-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitInlineCreation();
            }}
            className="flex items-center gap-1.5"
          >
            {inlineCreating.type === "folder" ? (
              <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-info shrink-0" />
            )}
            <input
              type="text"
              autoFocus
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              placeholder={inlineCreating.type === "folder" ? "folder-name" : "note-title.md"}
              className="flex-1 bg-background border border-primary text-xs px-1.5 py-0.5 rounded outline-none text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Escape") setInlineCreating(null);
              }}
              onBlur={() => {
                if (!inlineName.trim()) setInlineCreating(null);
                else submitInlineCreation();
              }}
            />
          </form>
        </div>
      )}

      {/* Hierarchical Folder & File Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5 text-xs">
        {folderTree.map((folderNode) => (
          <FolderRow
            key={folderNode.path}
            node={folderNode}
            selectedFolder={selectedFolder}
            activeNoteId={activeNoteId}
            expandedFolders={expandedFolders}
            inlineCreating={inlineCreating}
            inlineName={inlineName}
            onInlineNameChange={setInlineName}
            onSubmitInlineCreation={submitInlineCreation}
            onCancelInlineCreation={() => setInlineCreating(null)}
            inlineRenaming={inlineRenaming}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onSubmitInlineRename={submitInlineRename}
            onCancelInlineRename={() => setInlineRenaming(null)}
            onToggleExpand={onToggleExpand}
            onSelectFolder={onSelectFolder}
            onSelectNote={onSelectNote}
            onContextMenu={handleContextMenu}
            onStartInlineCreate={(path, type) => {
              setInlineCreating({ parentPath: path, type });
              setInlineName("");
              if (!expandedFolders.has(path)) {
                onToggleExpand(path);
              }
            }}
            onStartInlineRename={(type, id, currentName) => {
              setInlineRenaming({ type, id, currentName });
              setRenameValue(currentName);
            }}
            onRequestDeleteFolder={(path, name, count) => {
              setDeleteConfirm({
                type: "folder",
                id: path,
                title: name,
                noteCount: count,
              });
            }}
            onRequestDeleteNote={(id, title) => {
              setDeleteConfirm({
                type: "note",
                id,
                title,
              });
            }}
          />
        ))}
      </div>

      {/* Floating VS Code-Style Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenuOverlay
          contextMenu={contextMenu}
          notes={notes}
          onClose={() => setContextMenu(null)}
          onSelectNote={onSelectNote}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          onUpdateNote={onUpdateNote}
          onDuplicateNote={duplicateNote}
          onStartInlineRename={(type, id, currentName) => {
            setInlineRenaming({ type, id, currentName });
            setRenameValue(currentName);
          }}
          onStartInlineCreate={(parentPath, type) => {
            setInlineCreating({ parentPath, type });
            setInlineName("");
            if (parentPath && !expandedFolders.has(parentPath)) {
              onToggleExpand(parentPath);
            }
          }}
          onRequestDeleteNote={(id, title) => {
            setDeleteConfirm({ type: "note", id, title });
          }}
          onRequestDeleteFolder={(path, name, count) => {
            setDeleteConfirm({ type: "folder", id: path, title: name, noteCount: count });
          }}
          onOpenMoveFolder={(noteId) => setMoveFolderNoteId(noteId)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl p-5 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {deleteConfirm.type === "folder"
                    ? `Delete Folder: ${deleteConfirm.title}?`
                    : `Delete Note: ${deleteConfirm.title}?`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deleteConfirm.type === "folder"
                    ? `This folder contains ${deleteConfirm.noteCount || 0} note(s).`
                    : "This action will permanently remove this note file."}
                </p>
              </div>
            </div>

            {deleteConfirm.type === "folder" ? (
              <div className="space-y-2 mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => {
                    onDeleteFolder(deleteConfirm.id, true);
                    setDeleteConfirm(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Folder and All {deleteConfirm.noteCount} Notes
                </button>
                <button
                  onClick={() => {
                    onDeleteFolder(deleteConfirm.id, false);
                    setDeleteConfirm(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Delete Folder, Keep Notes (Move to General)
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full py-1.5 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteNote(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Note
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Move Folder Dialog */}
      {moveFolderNoteId && (
        <MoveFolderModal
          note={notes.find((n) => n.id === moveFolderNoteId)!}
          allFolderPaths={allFolderPaths}
          onClose={() => setMoveFolderNoteId(null)}
          onMove={(targetFolder) => {
            onUpdateNote(moveFolderNoteId, { folder: targetFolder });
            setMoveFolderNoteId(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Folder Row Component (Recursive Tree Node)                        */
/* ------------------------------------------------------------------ */

interface FolderNode {
  path: string;
  name: string;
  parentPath: string | null;
  depth: number;
  subfolders: FolderNode[];
  notes: Note[];
}

function FolderRow({
  node,
  selectedFolder,
  activeNoteId,
  expandedFolders,
  inlineCreating,
  inlineName,
  onInlineNameChange,
  onSubmitInlineCreation,
  onCancelInlineCreation,
  inlineRenaming,
  renameValue,
  onRenameValueChange,
  onSubmitInlineRename,
  onCancelInlineRename,
  onToggleExpand,
  onSelectFolder,
  onSelectNote,
  onContextMenu,
  onStartInlineCreate,
  onStartInlineRename,
  onRequestDeleteFolder,
  onRequestDeleteNote,
}: {
  node: FolderNode;
  selectedFolder: string | null;
  activeNoteId: string | null;
  expandedFolders: Set<string>;
  inlineCreating: InlineCreatingState | null;
  inlineName: string;
  onInlineNameChange: (val: string) => void;
  onSubmitInlineCreation: () => void;
  onCancelInlineCreation: () => void;
  inlineRenaming: InlineRenamingState | null;
  renameValue: string;
  onRenameValueChange: (val: string) => void;
  onSubmitInlineRename: () => void;
  onCancelInlineRename: () => void;
  onToggleExpand: (path: string) => void;
  onSelectFolder: (path: string | null) => void;
  onSelectNote: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, type: "note" | "folder" | "background", id?: string, folderPath?: string) => void;
  onStartInlineCreate: (path: string, type: "file" | "folder") => void;
  onStartInlineRename: (type: "file" | "folder", id: string, currentName: string) => void;
  onRequestDeleteFolder: (path: string, name: string, count: number) => void;
  onRequestDeleteNote: (id: string, title: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFolder === node.path;
  const isRenamingThis = inlineRenaming?.type === "folder" && inlineRenaming.id === node.path;
  const isCreatingInside = inlineCreating && inlineCreating.parentPath === node.path;

  const totalNoteCount = useMemo(() => {
    let count = node.notes.length;
    const countSub = (sub: FolderNode) => {
      count += sub.notes.length;
      sub.subfolders.forEach(countSub);
    };
    node.subfolders.forEach(countSub);
    return count;
  }, [node]);

  return (
    <div className="w-full">
      {/* Folder Header Item */}
      <div
        onClick={() => {
          onSelectFolder(isSelected ? null : node.path);
          onToggleExpand(node.path);
        }}
        onContextMenu={(e) => onContextMenu(e, "folder", undefined, node.path)}
        className={`group flex items-center gap-1.5 w-full rounded-md text-xs py-1 pr-2 transition-colors cursor-pointer hover:bg-sidebar-accent/60 ${
          isSelected
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            : "text-sidebar-foreground"
        }`}
        style={{ paddingLeft: `${node.depth * 14 + 6}px` }}
      >
        {/* Accordion Toggle Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.path);
          }}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
        )}

        {/* Title or Inline Rename input */}
        {isRenamingThis ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitInlineRename();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1"
          >
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameValueChange(e.target.value)}
              className="w-full bg-background border border-primary text-xs px-1 rounded outline-none text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelInlineRename();
              }}
              onBlur={onSubmitInlineRename}
            />
          </form>
        ) : (
          <span className="truncate flex-1 min-w-0">{node.name}</span>
        )}

        {/* Note Count Badge */}
        {!isRenamingThis && (
          <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto group-hover:hidden">
            {totalNoteCount}
          </span>
        )}

        {/* Hover Quick Action Buttons (VS Code style) */}
        {!isRenamingThis && (
          <div
            className="hidden group-hover:flex items-center gap-0.5 ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onStartInlineCreate(node.path, "file")}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer"
              title="New Note in folder"
            >
              <FilePlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onStartInlineCreate(node.path, "folder")}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer"
              title="New Subfolder"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onStartInlineRename("folder", node.path, node.name)}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer"
              title="Rename folder"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRequestDeleteFolder(node.path, node.name, totalNoteCount)}
              className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive cursor-pointer"
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Folder Content with Indent Guide Line */}
      {isExpanded && (
        <div
          className="border-l border-border/30 dark:border-[#383e46]/60 ml-3 my-0.5 space-y-0.5"
          style={{ marginLeft: `${node.depth * 14 + 12}px` }}
        >
          {/* Inline creation input inside this folder */}
          {isCreatingInside && (
            <div className="py-1 pl-3 pr-2 animate-in fade-in-50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitInlineCreation();
                }}
                className="flex items-center gap-1.5"
              >
                {inlineCreating.type === "folder" ? (
                  <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-info flex-shrink-0" />
                )}
                <input
                  type="text"
                  autoFocus
                  value={inlineName}
                  onChange={(e) => onInlineNameChange(e.target.value)}
                  placeholder={inlineCreating.type === "folder" ? "subfolder-name" : "note-name.md"}
                  className="flex-1 bg-background border border-primary text-xs px-1.5 py-0.5 rounded outline-none text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onCancelInlineCreation();
                  }}
                  onBlur={() => {
                    if (!inlineName.trim()) onCancelInlineCreation();
                    else onSubmitInlineCreation();
                  }}
                />
              </form>
            </div>
          )}

          {/* Subfolders */}
          {node.subfolders.map((sub) => (
            <FolderRow
              key={sub.path}
              node={sub}
              selectedFolder={selectedFolder}
              activeNoteId={activeNoteId}
              expandedFolders={expandedFolders}
              inlineCreating={inlineCreating}
              inlineName={inlineName}
              onInlineNameChange={onInlineNameChange}
              onSubmitInlineCreation={onSubmitInlineCreation}
              onCancelInlineCreation={onCancelInlineCreation}
              inlineRenaming={inlineRenaming}
              renameValue={renameValue}
              onRenameValueChange={onRenameValueChange}
              onSubmitInlineRename={onSubmitInlineRename}
              onCancelInlineRename={onCancelInlineRename}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onContextMenu={onContextMenu}
              onStartInlineCreate={onStartInlineCreate}
              onStartInlineRename={onStartInlineRename}
              onRequestDeleteFolder={onRequestDeleteFolder}
              onRequestDeleteNote={onRequestDeleteNote}
            />
          ))}

          {/* Notes inside this folder */}
          {node.notes.map((note) => {
            const isActive = activeNoteId === note.id;
            const isRenamingNote = inlineRenaming?.type === "file" && inlineRenaming.id === note.id;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                onContextMenu={(e) => onContextMenu(e, "note", note.id, node.path)}
                className={`group flex items-center gap-1.5 w-full text-left rounded-md py-1 pl-3 pr-2 text-xs transition-colors cursor-pointer truncate ${
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                }`}
                title={note.title}
              >
                {/* Note Icon */}
                <FileText className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />

                {/* Inline Rename or Title */}
                {isRenamingNote ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onSubmitInlineRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={renameValue}
                      onChange={(e) => onRenameValueChange(e.target.value)}
                      className="w-full bg-background border border-primary text-xs px-1 rounded outline-none text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") onCancelInlineRename();
                      }}
                      onBlur={onSubmitInlineRename}
                    />
                  </form>
                ) : (
                  <span className="truncate flex-1 min-w-0">
                    {note.title || "Untitled Note"}
                  </span>
                )}

                {/* Status Dot */}
                {!isRenamingNote && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 group-hover:hidden ${
                      note.publicationStatus === "published"
                        ? "bg-success"
                        : note.publicationStatus === "staged"
                        ? "bg-warning"
                        : "bg-muted-foreground/40"
                    }`}
                    title={`Status: ${note.publicationStatus}`}
                  />
                )}

                {/* Hover Action Buttons */}
                {!isRenamingNote && (
                  <div
                    className="hidden group-hover:flex items-center gap-0.5 ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onStartInlineRename("file", note.id, note.title)}
                      className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Rename Note (F2)"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRequestDeleteNote(note.id, note.title)}
                      className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state hint */}
          {node.notes.length === 0 && node.subfolders.length === 0 && !isCreatingInside && (
            <div className="py-1 pl-3 text-[10px] text-muted-foreground/50 italic flex items-center justify-between pr-2">
              <span>(empty folder)</span>
              <button
                onClick={() => onStartInlineCreate(node.path, "file")}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                + New note
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Context Menu Component (VS Code Style)                   */
/* ------------------------------------------------------------------ */

function ContextMenuOverlay({
  contextMenu,
  notes,
  onClose,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onDuplicateNote,
  onStartInlineRename,
  onStartInlineCreate,
  onRequestDeleteNote,
  onRequestDeleteFolder,
  onOpenMoveFolder,
}: {
  contextMenu: ContextMenuState;
  notes: Note[];
  onClose: () => void;
  onSelectNote: (id: string) => void;
  onCreateNote: (folder: string, title?: string) => Promise<Note>;
  onDeleteNote: (id: string) => Promise<void>;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDuplicateNote: (id: string) => Promise<void>;
  onStartInlineRename: (type: "file" | "folder", id: string, currentName: string) => void;
  onStartInlineCreate: (parentPath: string, type: "file" | "folder") => void;
  onRequestDeleteNote: (id: string, title: string) => void;
  onRequestDeleteFolder: (path: string, name: string, count: number) => void;
  onOpenMoveFolder: (noteId: string) => void;
}) {
  const note = contextMenu.noteId
    ? notes.find((n) => n.id === contextMenu.noteId)
    : undefined;

  const notesInFolder = contextMenu.folderPath
    ? notes.filter(
        (n) =>
          n.folder === contextMenu.folderPath ||
          n.folder.startsWith(`${contextMenu.folderPath}/`)
      )
    : [];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed z-[9999] w-56 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl py-1 text-xs text-foreground animate-in fade-in-50 zoom-in-95 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── NOTE CONTEXT MENU ─── */}
      {contextMenu.type === "note" && note && (
        <>
          <div className="px-3 py-1.5 border-b border-border/50 text-[10px] font-mono text-muted-foreground truncate">
            {note.title}
          </div>

          <button
            onClick={() => {
              onSelectNote(note.id);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Open Note</span>
          </button>

          <button
            onClick={() => {
              onStartInlineRename("file", note.id, note.title);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Rename</span>
            <kbd className="text-[10px] font-mono text-muted-foreground ml-auto">F2</kbd>
          </button>

          <button
            onClick={async () => {
              await onDuplicateNote(note.id);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Duplicate Note</span>
          </button>

          <button
            onClick={() => {
              onOpenMoveFolder(note.id);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Move to Folder…</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          {/* PUBLICATION ACTIONS (Requested by User) */}
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Publication Status
          </div>

          <button
            onClick={() => {
              onUpdateNote(note.id, { publicationStatus: "published" });
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-success" />
            <span>Publish to Web</span>
            {note.publicationStatus === "published" && (
              <Check className="w-3 h-3 text-success ml-auto" />
            )}
          </button>

          <button
            onClick={() => {
              onUpdateNote(note.id, { publicationStatus: "staged" });
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-warning" />
            <span>Stage for Review</span>
            {note.publicationStatus === "staged" && (
              <Check className="w-3 h-3 text-warning ml-auto" />
            )}
          </button>

          <button
            onClick={() => {
              onUpdateNote(note.id, { publicationStatus: "local" });
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">🔒</span>
            <span>Set as Local Draft</span>
            {note.publicationStatus === "local" && (
              <Check className="w-3 h-3 text-muted-foreground ml-auto" />
            )}
          </button>

          <div className="my-1 border-t border-border/50" />

          {/* Delete Action */}
          <button
            onClick={() => {
              onRequestDeleteNote(note.id, note.title);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-destructive/15 text-destructive text-left cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Note</span>
          </button>
        </>
      )}

      {/* ─── FOLDER CONTEXT MENU ─── */}
      {contextMenu.type === "folder" && contextMenu.folderPath && (
        <>
          <div className="px-3 py-1.5 border-b border-border/50 text-[10px] font-mono text-muted-foreground truncate">
            {contextMenu.folderPath}
          </div>

          <button
            onClick={() => {
              onStartInlineCreate(contextMenu.folderPath!, "file");
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-primary" />
            <span>New Note in Folder</span>
          </button>

          <button
            onClick={() => {
              onStartInlineCreate(contextMenu.folderPath!, "folder");
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-primary" />
            <span>New Subfolder</span>
          </button>

          <button
            onClick={() => {
              const name = contextMenu.folderPath!.split("/").pop() || "";
              onStartInlineRename("folder", contextMenu.folderPath!, name);
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Rename Folder</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          {/* Bulk Publish / Unpublish Folder Notes */}
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Batch Publishing
          </div>

          <button
            onClick={() => {
              notesInFolder.forEach((n) =>
                onUpdateNote(n.id, { publicationStatus: "published" })
              );
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-success" />
            <span>Publish All in Folder ({notesInFolder.length})</span>
          </button>

          <button
            onClick={() => {
              notesInFolder.forEach((n) =>
                onUpdateNote(n.id, { publicationStatus: "local" })
              );
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">🔒</span>
            <span>Unpublish All in Folder</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          <button
            onClick={() => {
              const name = contextMenu.folderPath!.split("/").pop() || "";
              onRequestDeleteFolder(
                contextMenu.folderPath!,
                name,
                notesInFolder.length
              );
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-destructive/15 text-destructive text-left cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Folder…</span>
          </button>
        </>
      )}

      {/* ─── BACKGROUND CONTEXT MENU ─── */}
      {contextMenu.type === "background" && (
        <>
          <button
            onClick={() => {
              onStartInlineCreate("", "file");
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-primary" />
            <span>New Note</span>
          </button>

          <button
            onClick={() => {
              onStartInlineCreate("", "folder");
              onClose();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted text-left cursor-pointer transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-primary" />
            <span>New Folder</span>
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Move Folder Modal Picker                                          */
/* ------------------------------------------------------------------ */

function MoveFolderModal({
  note,
  allFolderPaths,
  onClose,
  onMove,
}: {
  note: Note;
  allFolderPaths: string[];
  onClose: () => void;
  onMove: (folder: string) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-popover border border-border rounded-xl shadow-2xl p-4 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Move Note: {note.title}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Current folder: <span className="text-foreground font-mono font-medium">{note.folder}</span>
        </p>

        {/* Existing folder list */}
        <div className="max-h-48 overflow-y-auto space-y-1 mb-3 border border-border/60 rounded-lg p-1">
          {allFolderPaths.map((f) => (
            <button
              key={f}
              onClick={() => onMove(f)}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                note.folder === f
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{f}</span>
            </button>
          ))}
        </div>

        {/* Or create new folder and move */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customInput.trim()) onMove(customInput.trim());
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Or type new folder name…"
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            Move
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
