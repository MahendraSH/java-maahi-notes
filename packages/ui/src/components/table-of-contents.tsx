"use client";

import React, { useState } from "react";
import { ListTree, ChevronDown, ChevronRight, Hash } from "lucide-react";
import { type TocItem, extractTableOfContents } from "@vibe-notes/notes-core";

interface TableOfContentsProps {
  items?: TocItem[];
  markdown?: string;
  activeId?: string;
  onSelectHeading?: (id: string) => void;
  className?: string;
}

export function TableOfContents({
  items,
  markdown,
  activeId,
  onSelectHeading,
  className = "",
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const tocItems = items || (markdown ? extractTableOfContents(markdown) : []);

  // Only render if 2 or more headings exist
  if (tocItems.length < 2) return null;

  const handleScroll = (id: string) => {
    if (onSelectHeading) {
      onSelectHeading(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className={`rounded-xl border border-border bg-card/80 backdrop-blur-md p-3 text-xs shadow-xs ${className}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left font-semibold text-foreground/90 hover:text-primary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <ListTree className="w-3.5 h-3.5 text-primary" />
          <span className="uppercase tracking-wider text-[11px] font-mono">
            Table of Contents
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            ({tocItems.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Item list */}
      {isOpen && (
        <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2 max-h-[360px] overflow-y-auto">
          {tocItems.map((item, idx) => {
            const isActive = activeId === item.id;
            const indent =
              item.level === 1 ? "pl-1 font-medium" : item.level === 2 ? "pl-3 text-muted-foreground" : "pl-6 text-muted-foreground/80 text-[11px]";

            return (
              <li key={`${item.id}-${idx}`}>
                <button
                  type="button"
                  onClick={() => handleScroll(item.id)}
                  className={`flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded-md hover:bg-muted/60 transition-colors cursor-pointer truncate ${indent} ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"
                  }`}
                  title={item.text}
                >
                  <Hash className="w-2.5 h-2.5 opacity-40 flex-shrink-0" />
                  <span className="truncate">{item.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
