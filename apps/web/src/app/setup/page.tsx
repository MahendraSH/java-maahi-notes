import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Terminal, Laptop, Globe, ShieldCheck, ExternalLink, Sparkles, Folder, Tag, Keyboard } from "lucide-react";

export const metadata = {
  title: "Setup & Deployment Guide — Vibe Notes",
  description: "Learn how to fork, install, run locally for daily notes, and deploy the public website to Vercel.",
};

export default function SetupPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Knowledge Base</span>
      </Link>

      {/* Header */}
      <div className="mb-10 pb-6 border-b border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>Quickstart & Setup</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Setup & Deployment Guide
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          How to fork Vibe Notes, run the local-first editor on your machine for daily notes, and deploy your public documentation to Vercel.
        </p>

        {/* Live Demo Banner */}
        <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>Official Live Demo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore the public reading site in production.
            </p>
          </div>
          <a
            href="https://vibe-notes-demo.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>vibe-notes-demo.vercel.app</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Steps */}
      <div className="space-y-10">
        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            <h2 className="text-xl font-bold text-foreground">Fork & Clone the Repository</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            Start by forking the project on GitHub to your personal account, then clone it to your development machine:
          </p>
          <div className="pl-8">
            <pre className="p-4 rounded-xl bg-card border border-border font-mono text-xs text-foreground overflow-x-auto">
{`# Clone the repository
git clone https://github.com/MahendraSH/vibe-note.git my-notes
cd my-notes

# Install monorepo dependencies
yarn install`}
            </pre>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
              2
            </span>
            <h2 className="text-xl font-bold text-foreground">Run the Daily Local Editor</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            Launch the local editor app. All notes are saved directly to your local file system in <code className="bg-muted px-1.5 py-0.5 rounded text-primary">content/notes/</code> as raw Markdown (.md) files.
          </p>
          <div className="pl-8 space-y-3">
            <pre className="p-4 rounded-xl bg-card border border-border font-mono text-xs text-foreground overflow-x-auto">
{`# Start local Markdown editor on http://localhost:3000
yarn dev:local`}
            </pre>

            <div className="p-3.5 rounded-xl border border-success/30 bg-success/5 text-xs text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span>
                <strong>100% Local & Private:</strong> Notes in <code className="text-foreground font-mono">content/notes/</code> are git-ignored by default. They stay on your machine unless you explicitly mark them as &ldquo;published&rdquo;.
              </span>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
              3
            </span>
            <h2 className="text-xl font-bold text-foreground">Deploy the Public Web Reader to Vercel</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            The public reader (<code className="bg-muted px-1.5 py-0.5 rounded text-primary">apps/web</code>) compiles into 100% static HTML (SSG) for fast, free hosting on Vercel:
          </p>
          <div className="pl-8 space-y-3">
            <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
              <p className="font-semibold text-foreground">Vercel Deployment Settings:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Framework Preset:</strong> Next.js</li>
                <li><strong>Build Command:</strong> <code className="bg-muted px-1 rounded font-mono">yarn build:web</code></li>
                <li><strong>Output Directory:</strong> <code className="bg-muted px-1 rounded font-mono">apps/web/.next</code></li>
                <li><strong>Install Command:</strong> <code className="bg-muted px-1 rounded font-mono">yarn install</code></li>
              </ul>
            </div>
            <pre className="p-4 rounded-xl bg-card border border-border font-mono text-xs text-foreground overflow-x-auto">
{`# Test static website build locally
yarn build:web

# Preview the production web server
yarn workspace web start`}
            </pre>
          </div>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
              4
            </span>
            <h2 className="text-xl font-bold text-foreground">Power-User Features</h2>
          </div>
          <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>Tag Autocomplete</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Type in tag inputs to search existing tags with usage counts or press Enter to create a new tag on the fly.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Folder className="w-3.5 h-3.5 text-primary" />
                <span>Folder Combobox</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Select existing folders or type a new nested path like <code className="bg-muted px-1 rounded font-mono">Java/Internals</code> to organize notes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Keyboard className="w-3.5 h-3.5 text-primary" />
                <span>Speed Hotkeys</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Use <kbd className="px-1 bg-muted rounded font-mono text-[10px]">⌘K</kbd> for fuzzy search, <kbd className="px-1 bg-muted rounded font-mono text-[10px]">⌘N</kbd> for new notes, and <kbd className="px-1 bg-muted rounded font-mono text-[10px]">⌘E</kbd> for preview.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Wiki-Links & Backlinks</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Use <code className="bg-muted px-1 rounded font-mono text-[10px]">[[Note Title]]</code> to link documents with bidirectional backlink discovery.
              </p>
            </div>
          </div>
        </section>

        {/* AI & LLM Agents */}
        <section className="p-5 rounded-2xl border border-border bg-card/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Coding Assistants & LLMs</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Building features with Claude, ChatGPT, or Cursor? We provide a concise <code className="bg-muted px-1.5 py-0.5 rounded text-primary">LLMS.md</code> file summarizing the entire monorepo architecture and conventions:
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/llms.txt"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>View llms.txt</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Creator & Contact Section */}
        <section className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Project Maintainer
              </div>
              <h3 className="text-lg font-bold text-foreground">Created by Mahendra S H</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Software Engineer • Hyderabad, India • Available for contracts & full-stack roles
              </p>
            </div>
            <a
              href="https://mahendrash.vercel.app/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
            >
              <span>Get in Touch</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Open to discussing microservice backend architectures (Java, Spring Boot, Go), React dashboards, full-stack contracts, or enterprise software engineering roles.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <a
              href="https://mahendrash.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors font-medium inline-flex items-center gap-1"
            >
              <span>Portfolio (mahendrash.vercel.app)</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <a
              href="https://github.com/MahendraSH/vibe-note"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>GitHub (vibe-note)</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <a
              href="https://www.linkedin.com/in/mahendra-s-h-14a74721a/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <a
              href="mailto:mahendrashongunti@gmail.com"
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              mahendrashongunti@gmail.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
