"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Menu, X, Sparkles, HelpCircle, ExternalLink } from "lucide-react";
import { siteConfig } from "@/site.config";

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
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Home">
          <div className="w-8 h-8 rounded-lg bg-[#111317] border border-border/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs p-1">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <path d="M26 15c2-3 5-3 5 0s-3 3-1 6" fill="none" stroke="#E76F00" strokeWidth="3" strokeLinecap="round"/>
              <path d="M34 13c2.5-3 6-3 6 0s-3.5 3-1.5 6" fill="none" stroke="#F89820" strokeWidth="3" strokeLinecap="round"/>
              <path d="M19 28h22c0 9-4.5 15-11 15s-11-6-11-15z" fill="#F3F4F6"/>
              <path d="M41 31h4a5 5 0 0 1 0 10h-5" fill="none" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round"/>
              <path d="M16 48c7 3 21 3 28 0" fill="none" stroke="#5382A1" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="49" cy="48" r="3.5" fill="#E76F00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-sm tracking-wide">{siteConfig.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              {siteConfig.author.name ? `by ${siteConfig.author.name}` : "Digital Garden"}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <Link href="/#notes" className="hover:text-foreground transition-colors">
            Notes
          </Link>
          <Link href="/#how-to-use" className="hover:text-primary transition-colors flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>How to Use</span>
          </Link>
          <Link href="/llms" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Copilot</span>
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
          {siteConfig.author.githubUrl && (
            <a
              href={siteConfig.author.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
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
            </Link>
            <Link
              href="/#how-to-use"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg text-sm font-medium hover:bg-muted text-foreground"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>How to Use</span>
              </div>
            </Link>
            <Link
              href="/llms"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg text-sm font-semibold hover:bg-primary/10 text-primary"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>AI Copilot & Prompts</span>
              </div>
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

          {siteConfig.author.githubUrl && (
            <div className="pt-2 border-t border-border/60">
              <a
                href={siteConfig.author.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground shadow-xs"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
