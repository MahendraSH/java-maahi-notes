"use client";

import React, { useEffect } from "react";
import {
  parseMarkdownBlocks,
  slugify,
  type MarkdownBlock,
  type AudioSentence,
} from "@vibe-notes/notes-core";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { MarkdownTable } from "./markdown-table";

export interface SpeechMarkdownRendererProps {
  content: string;
  activeSentenceIndex?: number | null;
  activeWordIndex?: number | null;
  isReadingAloud?: boolean;
  onSeekSentence?: (index: number) => void;
  className?: string;
}

export function SpeechMarkdownRenderer({
  content,
  activeSentenceIndex = null,
  activeWordIndex = null,
  isReadingAloud = false,
  onSeekSentence,
  className = "",
}: SpeechMarkdownRendererProps) {
  const { blocks } = React.useMemo(() => parseMarkdownBlocks(content), [content]);

  // Smooth Auto-Scroll to Active Sentence
  useEffect(() => {
    if (activeSentenceIndex === null || !isReadingAloud) return;
    if (typeof document === "undefined") return;

    // Small delay to allow layout recalculation
    const timer = setTimeout(() => {
      const el = document.getElementById(`speech-sentence-${activeSentenceIndex}`);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [activeSentenceIndex, isReadingAloud]);

  return (
    <div className={`speech-article-content space-y-4 ${className}`}>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          activeSentenceIndex={activeSentenceIndex}
          activeWordIndex={activeWordIndex}
          isReadingAloud={isReadingAloud}
          onSeekSentence={onSeekSentence}
        />
      ))}
    </div>
  );
}

function BlockRenderer({
  block,
  activeSentenceIndex,
  activeWordIndex,
  isReadingAloud,
  onSeekSentence,
}: {
  block: MarkdownBlock;
  activeSentenceIndex: number | null;
  activeWordIndex: number | null;
  isReadingAloud: boolean;
  onSeekSentence?: (index: number) => void;
}) {
  switch (block.type) {
    case "heading": {
      const headingSentence = block.sentences[0];
      const isHeadingActive = headingSentence && headingSentence.index === activeSentenceIndex;
      const headingId = `heading-${slugify(block.text?.replace(/[*`_]/g, "") || "section")}`;
      const sentenceId = headingSentence ? `speech-sentence-${headingSentence.index}` : undefined;

      const inner = headingSentence ? (
        <SentenceSpan
          sentence={headingSentence}
          isActive={isHeadingActive}
          activeWordIndex={activeWordIndex}
          isReadingAloud={isReadingAloud}
          onSeek={onSeekSentence ? () => onSeekSentence(headingSentence.index) : undefined}
        />
      ) : (
        formatInline(block.text || "")
      );

      if (block.level === 1) {
        return (
          <h1 id={headingId} className="text-2xl md:text-3xl font-bold tracking-tight mt-8 mb-4 scroll-mt-20">
            {inner}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 id={headingId} className="text-xl md:text-2xl font-semibold tracking-tight mt-6 mb-3 scroll-mt-20">
            {inner}
          </h2>
        );
      }
      return (
        <h3 id={headingId} className="text-lg md:text-xl font-medium tracking-tight mt-4 mb-2 scroll-mt-20">
          {inner}
        </h3>
      );
    }

    case "paragraph": {
      return (
        <p className="leading-relaxed text-foreground/90 my-3">
          {block.sentences.map((sent) => (
            <SentenceSpan
              key={sent.index}
              sentence={sent}
              isActive={sent.index === activeSentenceIndex}
              activeWordIndex={activeWordIndex}
              isReadingAloud={isReadingAloud}
              onSeek={onSeekSentence ? () => onSeekSentence(sent.index) : undefined}
            />
          ))}
        </p>
      );
    }

    case "blockquote": {
      return (
        <blockquote className="border-l-4 border-primary/70 bg-card/40 pl-4 py-2 my-4 italic text-muted-foreground rounded-r-lg">
          {block.sentences.map((sent) => (
            <SentenceSpan
              key={sent.index}
              sentence={sent}
              isActive={sent.index === activeSentenceIndex}
              activeWordIndex={activeWordIndex}
              isReadingAloud={isReadingAloud}
              onSeek={onSeekSentence ? () => onSeekSentence(sent.index) : undefined}
            />
          ))}
        </blockquote>
      );
    }

    case "list-ul": {
      return (
        <ul className="list-disc pl-6 space-y-1 my-3 text-foreground/90">
          {block.items?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.sentences.map((sent) => (
                <SentenceSpan
                  key={sent.index}
                  sentence={sent}
                  isActive={sent.index === activeSentenceIndex}
                  activeWordIndex={activeWordIndex}
                  isReadingAloud={isReadingAloud}
                  onSeek={onSeekSentence ? () => onSeekSentence(sent.index) : undefined}
                />
              ))}
            </li>
          ))}
        </ul>
      );
    }

    case "list-ol": {
      return (
        <ol className="list-decimal pl-6 space-y-1 my-3 text-foreground/90">
          {block.items?.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item.sentences.map((sent) => (
                <SentenceSpan
                  key={sent.index}
                  sentence={sent}
                  isActive={sent.index === activeSentenceIndex}
                  activeWordIndex={activeWordIndex}
                  isReadingAloud={isReadingAloud}
                  onSeek={onSeekSentence ? () => onSeekSentence(sent.index) : undefined}
                />
              ))}
            </li>
          ))}
        </ol>
      );
    }

    case "code": {
      const codeSentence = block.sentences[0];
      const isCodeActive = codeSentence && codeSentence.index === activeSentenceIndex;
      return (
        <div
          id={codeSentence ? `speech-sentence-${codeSentence.index}` : undefined}
          className={`my-4 transition-all duration-300 rounded-xl overflow-hidden ${
            isCodeActive
              ? "ring-2 ring-primary shadow-lg ring-offset-2 ring-offset-background"
              : ""
          }`}
        >
          {isCodeActive && (
            <div className="bg-primary/15 border-b border-primary/30 px-3 py-1.5 text-xs font-mono font-medium text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>[Reviewing Code Snippet: Pausing 2.5s for inspection]</span>
            </div>
          )}
          <SyntaxHighlighter code={block.code || ""} language={block.lang || "typescript"} />
        </div>
      );
    }

    case "table": {
      return (
        <div className="my-4 overflow-x-auto">
          <MarkdownTable
            lines={block.lines || []}
            renderInline={(t) => formatInline(t)}
          />
        </div>
      );
    }

    case "hr": {
      return <hr className="border-border my-6" />;
    }

    default:
      return null;
  }
}

function SentenceSpan({
  sentence,
  isActive,
  activeWordIndex,
  isReadingAloud,
  onSeek,
}: {
  sentence: AudioSentence;
  isActive: boolean;
  activeWordIndex: number | null;
  isReadingAloud: boolean;
  onSeek?: () => void;
}) {
  if (sentence.isCodeBlock) return null;

  return (
    <span
      id={`speech-sentence-${sentence.index}`}
      data-sentence-index={sentence.index}
      onClick={isReadingAloud && onSeek ? onSeek : undefined}
      className={`inline transition-all duration-200 cursor-text ${
        isActive
          ? "bg-amber-400/25 dark:bg-amber-400/25 text-foreground ring-2 ring-primary/60 rounded-md px-1.5 py-0.5 -mx-0.5 border-l-2 border-primary shadow-xs font-normal"
          : isReadingAloud
          ? "hover:bg-muted/60 cursor-pointer rounded px-0.5"
          : ""
      }`}
      title={isReadingAloud ? "Click to jump speech reader here" : undefined}
    >
      {isActive ? (
        // Word-by-word active highlighting within active sentence
        sentence.words.map((word, wIdx) => {
          const isWordActive = wIdx === activeWordIndex;
          return (
            <React.Fragment key={wIdx}>
              <span
                className={`transition-all duration-100 ${
                  isWordActive
                    ? "bg-primary text-primary-foreground font-semibold px-1 rounded shadow-xs inline-block scale-[1.04]"
                    : "text-foreground"
                }`}
              >
                {word}
              </span>
              {wIdx < sentence.words.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })
      ) : (
        formatInline(sentence.text)
      )}
      {" "}
    </span>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[\[.*?\]\]|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith("**")) {
      parts.push(<strong key={match.index}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[[")) {
      const linkText = m.slice(2, -2);
      parts.push(
        <span key={match.index} className="text-info font-medium">
          {linkText}
        </span>
      );
    } else if (m.startsWith("[")) {
      const linkMatch = m.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            className="text-primary hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
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
