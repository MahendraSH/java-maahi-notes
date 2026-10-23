"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles, Search, Copy, Check, Terminal, ExternalLink, Bot, ArrowRight,
  BookOpen, Code2, Cpu, FileText, Layers, ShieldCheck, HelpCircle, CheckCircle2
} from "lucide-react";

interface HelpTopic {
  id: string;
  queryMatch: string[];
  title: string;
  category: "Writing" | "Deployment" | "Organization" | "AI & Prompts" | "Export & Audio";
  summary: string;
  steps: string[];
  commands?: string[];
  llmPrompt: string;
}

export default function LLMsHelperPage() {
  const [userQuery, setUserQuery] = useState("");
  const [activeTopicId, setActiveTopicId] = useState<string>("write-note");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = async (type: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const helpTopics: HelpTopic[] = useMemo(
    () => [
      {
        id: "write-note",
        queryMatch: ["write", "create", "new note", "markdown", "draft", "format"],
        title: "Write a New Note in Vibe Notes Format",
        category: "Writing",
        summary: "How to draft technical notes locally with frontmatter, code blocks, and bidirectional wiki-links.",
        steps: [
          "In the local editor (http://localhost:3000), press ⌘N (Ctrl+N) or click '+ New Note'.",
          "Set the title, nested folder (e.g. 'Engineering/Backend'), and select or create tags.",
          "Use ```language code blocks with syntax highlighting for Java, TypeScript, Go, Rust, or Python.",
          "Link to other notes using double brackets like [[Getting Started & TODO Checklist]].",
          "Switch status from 'Local' to 'Published' when you want it visible on your public website."
        ],
        commands: ["yarn dev:local # starts local editor on port 3000"],
        llmPrompt: `You are an expert technical writer and software architect assisting with Vibe Notes.
Please write a comprehensive technical note formatted according to the Vibe Notes standard:

---
id: <kebab-case-slug>
title: <Note Title>
slug: <kebab-case-slug>
folder: <Category/Subcategory>
tags: [<Tag1>, <Tag2>, <Tag3>]
publicationStatus: published
readingTimeMinutes: 4
description: <Concise 1-2 sentence overview of the topic>
---

# <Note Title>

<Provide a high-quality, practical technical deep dive with clear headings, real-world code snippets with language syntax, and cross-reference links formatted as [[Related Note Title]].>`
      },
      {
        id: "deploy-vercel",
        queryMatch: ["deploy", "vercel", "publish", "website", "online", "git", "cloud"],
        title: "Deploy Your Digital Garden to Vercel",
        category: "Deployment",
        summary: "Publish your static public web reader to a custom domain on Vercel with zero server maintenance.",
        steps: [
          "Fork or push your repository to GitHub: https://github.com/MahendraSH/vibe-note.",
          "Go to vercel.com/new and import your repository.",
          "Vercel detects the included vercel.json automatically (Framework: Next.js, Build: yarn build:web, Output: apps/web/.next).",
          "Hit 'Deploy'. In 30 seconds, your published notes are live at https://your-project.vercel.app/.",
          "Only notes marked with publicationStatus: 'published' are rendered; private notes remain strictly local."
        ],
        commands: [
          "git clone https://github.com/MahendraSH/vibe-note.git",
          "yarn install",
          "yarn build:web # validates static SSG build locally",
          "vercel # optional: deploy directly via Vercel CLI"
        ],
        llmPrompt: `Help me deploy my Vibe Notes repository to Vercel.
Here is the project setup:
- Monorepo using Yarn 4
- The public static reader app is located in 'apps/web'
- Build command: 'yarn build:web'
- Output directory: 'apps/web/.next'
- Root vercel.json is already configured

Please guide me step by step on connecting my GitHub repository to Vercel, adding a custom domain, and ensuring private notes are never leaked.`
      },
      {
        id: "organize-tags-folders",
        queryMatch: ["tag", "folder", "hierarchy", "organize", "hashtag", "search"],
        title: "Organize with Folders & Real-Time Tag Autocomplete",
        category: "Organization",
        summary: "Structure deep engineering knowledge with instant tag autocomplete and folder comboboxes.",
        steps: [
          "Folder Combobox: Click the folder badge in the top bar to select an existing path or type a new nested path like 'Architecture/Microservices'.",
          "Tag Autocomplete: Start typing in the tag field to filter existing workspace tags with note count pills.",
          "Create On The Fly: If a tag does not exist, hit Enter on '+ Create tag' to add it immediately.",
          "Quick Capture Hashtags: Type #tags directly in the Quick Capture title (e.g. 'Kafka Streams #distributed #jvm') to auto-attach tags.",
          "Global Fuzzy Search: Press ⌘K anywhere to search by #tag, folder:, or keywords."
        ],
        commands: ["⌘K: Open global fuzzy search command palette"],
        llmPrompt: `I have a collection of software engineering notes.
Please analyze my list of topics and recommend an optimal folder hierarchy and tagging taxonomy for Vibe Notes (e.g., separating language internals, architecture patterns, and interview guides).`
      },
      {
        id: "silent-export-pdf",
        queryMatch: ["export", "copy", "pdf", "html", "audio", "sound", "screen reader", "text", "print"],
        title: "Silent Multi-Format Export (Text, HTML, PDF)",
        category: "Export & Audio",
        summary: "1-click export for developers who keep their speakers off and use external screen readers or personal tools.",
        steps: [
          "Open any note in the reader or local editor.",
          "Click 'Copy Text' for clean, markdown-stripped plain text ideal for your own TTS or screen reader.",
          "Click 'Copy HTML' for complete semantic HTML document with styles.",
          "Click 'Save PDF' (or Print) for a clean, paper-optimized print layout.",
          "Click 'Export & Copy' dropdown to download the raw .md file with frontmatter.",
          "Optional Sound Reader: If you want to listen, click 'Sound Reader' to launch the player with code-block pause and speed controls."
        ],
        commands: ["window.print() # triggers print-to-PDF"],
        llmPrompt: `Convert the following technical markdown note into clean, spoken-friendly text suitable for text-to-speech reading.
Replace all code blocks with a brief polite audio cue (e.g., '[Code snippet in TypeScript. Pausing to review.]') and remove markdown noise like hashtags, asterisks, and brackets.`
      },
      {
        id: "convert-notes",
        queryMatch: ["convert", "obsidian", "notion", "import", "migrate", "notes"],
        title: "Convert Obsidian or Notion Notes into Vibe Notes",
        category: "AI & Prompts",
        summary: "Prompt an LLM to convert existing raw notes or export folders into Vibe Notes Markdown format.",
        steps: [
          "Copy your existing raw note or article text.",
          "Paste it into ChatGPT, Claude, or Cursor using the prompt below.",
          "Save the output file as a .md file inside content/notes/.",
          "The local editor automatically detects and loads the note on the next refresh."
        ],
        commands: ["ls content/notes/ # list local markdown notes"],
        llmPrompt: `Please convert my existing note into a valid Vibe Notes file.
Requirements:
1. Include YAML frontmatter with id, title, slug, folder, tags, createdAt, updatedAt, readingTimeMinutes, and publicationStatus.
2. Standardize headings, code blocks with explicit language tags, and cross-references using [[Note Title]].
3. Ensure publicationStatus is set to 'local' for private notes or 'published' for public notes.

Here is the raw content to convert:`
      }
    ],
    []
  );

  // Filter topics based on user query
  const filteredTopics = useMemo(() => {
    if (!userQuery.trim()) return helpTopics;
    const q = userQuery.toLowerCase().trim();
    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.category.toLowerCase().includes(q) ||
        topic.queryMatch.some((m) => m.includes(q))
    );
  }, [helpTopics, userQuery]);

  const activeTopic = useMemo(
    () => helpTopics.find((t) => t.id === activeTopicId) || helpTopics[0],
    [helpTopics, activeTopicId]
  );

  const fullLlmContext = `# LLMS.md — AI Agent Context for Vibe Notes
Repository: https://github.com/MahendraSH/vibe-note
Author: Mahendra S H (https://mahendrash.vercel.app/)
Demo: https://vibe-notes-demo.vercel.app/

## Project Overview
Vibe Notes is a local-first notes workspace and static public web reader for engineers.
- apps/local: Port 3000 (Local Markdown editor with local disk storage in content/notes/*.md)
- apps/web: Port 3001 (Static SSG public knowledge base deployed on Vercel)
- packages/notes-core: Pure TypeScript core logic (parsing, search, backlinks, safety)
- packages/ui: Design system and shared components (ReadAloud, ExportMenu)

## Note Schema
- id: string
- title: string
- slug: string
- folder: string (e.g. "Architecture/Backend")
- tags: string[]
- publicationStatus: "local" | "staged" | "published"
- readingTimeMinutes: number
- content: string (Markdown with frontmatter)

## Safety Rule
Only notes with publicationStatus: "published" are rendered in apps/web. Notes with "local" or "staged" never leave the user's machine.`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 shadow-xs">
          <Bot className="w-3.5 h-3.5" />
          <span>AI Copilot & LLM Assistant</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          How Can We Help You Build?
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Tell us what you want to achieve with <strong>Vibe Notes</strong>. Get instant step-by-step guidance, copy pre-built prompts for <strong>ChatGPT</strong> or <strong>Claude</strong>, or pull machine-readable LLM context.
        </p>
      </div>

      {/* Interactive Goal Search Input */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-border/80 bg-card shadow-lg focus-within:border-primary transition-colors">
          <Search className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Type your goal (e.g. 'write a note', 'deploy to vercel', 'export to pdf', 'convert notes')..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 text-foreground"
          />
          {userQuery && (
            <button
              onClick={() => setUserQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded bg-muted"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium mr-1">Suggestions:</span>
          {[
            { label: "Write a Note", id: "write-note" },
            { label: "Deploy to Vercel", id: "deploy-vercel" },
            { label: "Folders & Tags", id: "organize-tags-folders" },
            { label: "Silent PDF / Export", id: "silent-export-pdf" },
            { label: "Convert Notes", id: "convert-notes" }
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                setUserQuery("");
                setActiveTopicId(chip.id);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                activeTopicId === chip.id && !userQuery
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "border-border/70 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Assistant Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
        {/* Left: Topic Selector List */}
        <div className="md:col-span-5 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2 block">
            Select Your Goal ({filteredTopics.length})
          </span>
          {filteredTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopicId(topic.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                activeTopicId === topic.id
                  ? "bg-card border-primary shadow-md"
                  : "bg-card/40 border-border hover:bg-card/80 hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {topic.category}
                </span>
                {activeTopicId === topic.id && (
                  <span className="text-primary text-xs font-semibold flex items-center gap-1">
                    Active <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">
                {topic.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {topic.summary}
              </p>
            </button>
          ))}
        </div>

        {/* Right: Detailed Guide & Ready-to-Copy LLM Prompt */}
        <div className="md:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-lg space-y-5">
            <div className="border-b border-border/60 pb-4">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {activeTopic.category}
              </span>
              <h2 className="text-xl font-bold text-foreground mt-2 mb-1">
                {activeTopic.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeTopic.summary}
              </p>
            </div>

            {/* Step-by-step guidance */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Actionable Steps</span>
              </h3>
              <ol className="space-y-2 text-xs sm:text-sm text-foreground/90 pl-1">
                {activeTopic.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Terminal Command if any */}
            {activeTopic.commands && activeTopic.commands.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Shell / Key Command:
                </span>
                <div className="p-3 rounded-xl bg-muted/60 border border-border/80 font-mono text-xs text-foreground overflow-x-auto flex items-center justify-between gap-3">
                  <code>{activeTopic.commands.join("\n")}</code>
                  <button
                    onClick={() => copyToClipboard("cmd", activeTopic.commands!.join("\n"))}
                    className="p-1.5 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
                    title="Copy command"
                  >
                    {copiedType === "cmd" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* 1-Click Ready Prompt for ChatGPT / Claude */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready-to-Paste Prompt for ChatGPT / Claude</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`prompt-${activeTopic.id}`, activeTopic.llmPrompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copiedType === `prompt-${activeTopic.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/70 font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto selection:bg-primary/20">
                {activeTopic.llmPrompt}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Machine-Readable LLM Context Section */}
      <section className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Machine-Readable Specification</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Full Repository Context for AI Coding Agents
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste into Claude Projects, ChatGPT Custom Instructions, Cursor, or Antigravity.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <span>Raw llms.txt</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>

            <button
              type="button"
              onClick={() => copyToClipboard("full-llm", fullLlmContext)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {copiedType === "full-llm" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Full Context Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full AI Context</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-muted/40 border border-border/60 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
          {fullLlmContext}
        </pre>
      </section>
    </div>
  );
}
