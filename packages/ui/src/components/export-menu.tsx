"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Share2, Printer, Copy, Check, Download, FileText, Code2, Headphones, Sparkles, FileCode
} from "lucide-react";
import { markdownToPlainText, markdownToTtsScript, markdownToHtml } from "@vibe-notes/notes-core";

interface ExportMenuProps {
  note: {
    id: string;
    title: string;
    content: string;
    slug?: string;
  };
  onTriggerReadAloud?: () => void;
  className?: string;
}

export function ExportMenu({
  note,
  onTriggerReadAloud,
  className = "",
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const copyToClipboard = async (type: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePrintPdf = () => {
    setIsOpen(false);
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.slug || note.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card/60 hover:bg-card hover:border-primary/50 text-foreground transition-colors cursor-pointer shadow-xs"
        title="Export, Print PDF, or Copy formatted text for screen readers"
        aria-label="Export options"
      >
        <Share2 className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline">Export & Copy</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-popover border border-border rounded-xl shadow-2xl p-1.5 z-40 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1.5 mb-1 flex items-center justify-between">
            <span>Read, Copy & Export</span>
            {copiedType && (
              <span className="text-[10px] text-success font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Copied!
              </span>
            )}
          </div>

          {/* Read Aloud trigger */}
          {onTriggerReadAloud && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onTriggerReadAloud();
              }}
              className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/10 text-primary font-medium cursor-pointer transition-colors"
            >
              <Headphones className="w-4 h-4 flex-shrink-0" />
              <div>
                <div className="font-semibold">Read Aloud (TTS)</div>
                <div className="text-[10px] text-muted-foreground">Listen with speed control & code pause</div>
              </div>
            </button>
          )}

          {/* Copy Plain Text for External Screen Readers */}
          <button
            type="button"
            onClick={() => copyToClipboard("text", markdownToPlainText(note.content))}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-muted text-foreground cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-foreground">Copy Plain Text</div>
                <div className="text-[10px] text-muted-foreground">Markdown stripped (for screen readers)</div>
              </div>
            </div>
            {copiedType === "text" ? <Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </button>

          {/* Copy Clean Speech / TTS Transcript */}
          <button
            type="button"
            onClick={() => copyToClipboard("tts", markdownToTtsScript(note.content))}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-muted text-foreground cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Code2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-foreground">Copy Clean TTS Script</div>
                <div className="text-[10px] text-muted-foreground">Code blocks replaced with pause cues</div>
              </div>
            </div>
            {copiedType === "tts" ? <Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </button>

          {/* Copy Rendered HTML */}
          <button
            type="button"
            onClick={() => copyToClipboard("html", markdownToHtml(note.content, note.title))}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-muted text-foreground cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium text-foreground">Copy HTML Format</div>
                <div className="text-[10px] text-muted-foreground">Full HTML document with styling</div>
              </div>
            </div>
            {copiedType === "html" ? <Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          </button>

          <div className="border-t border-border/50 my-1" />

          {/* Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-muted text-foreground cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">Print or Export to PDF</div>
              <div className="text-[10px] text-muted-foreground">Optimized paper / PDF layout</div>
            </div>
          </button>

          {/* Download Raw Markdown */}
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-muted text-foreground cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">Download .md File</div>
              <div className="text-[10px] text-muted-foreground">Raw markdown with frontmatter</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
