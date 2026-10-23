"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Menu, X, Sparkles, Video, HelpCircle, FileText, ArrowRight, ExternalLink } from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Vibe Notes Home">
          <div className="w-8 h-8 rounded-lg bg-[#17191C] border border-border/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <svg viewBox="0 0 64 64" className="w-5 h-5">
              <path d="M12 46V18h8.2L32 33.1 43.8 18H52v28h-9V31.2L32 43 21 31.2V46z" fill="#F3F4F6"/>
              <circle cx="51" cy="49" r="4.5" fill="#F89820"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-sm tracking-wide">Vibe Notes</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">Developer Knowledge Workspace</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <Link href="/#notes" className="hover:text-foreground transition-colors">
            Browse Notes
          </Link>
          <Link href="/#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/setup" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-foreground">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Docs & Setup</span>
          </Link>
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1 font-mono text-[11px]"
            title="Machine-readable context for AI coding agents"
          >
            <span>llms.txt</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/70" />
          </a>
          <a
            href="https://github.com/MahendraSH/vibe-note"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/setup"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20"
          >
            Setup
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <Link
              href="/#notes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg text-sm font-medium hover:bg-muted text-foreground"
            >
              <span>Browse Notes</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg text-sm font-medium hover:bg-muted text-foreground"
            >
              <span>Why Vibe Notes</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/setup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg text-sm font-semibold hover:bg-primary/10 text-primary"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>How to Setup & Build Your Own</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-lg text-sm font-medium hover:bg-muted text-foreground font-mono"
            >
              <span>/llms.txt (AI Prompts)</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          <div className="pt-2 border-t border-border/60">
            <a
              href="https://github.com/MahendraSH/vibe-note"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground shadow-xs"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Fork on GitHub</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
