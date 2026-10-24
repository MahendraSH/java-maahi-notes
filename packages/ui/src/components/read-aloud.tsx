"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  X, Gauge, Code2, Headphones, RotateCcw
} from "lucide-react";

export interface AudioSentence {
  id: number;
  text: string;
  cleanText: string;
  isCodeBlock: boolean;
  lang?: string;
}

/**
 * Parses markdown into clean speakable sentences.
 * Skips code block content, replacing them with a polite pause cue.
 */
export function parseMarkdownToSentences(markdown: string): AudioSentence[] {
  // Strip YAML frontmatter if present
  let text = markdown.replace(/^---[\s\S]*?---\n*/, "");

  const sentences: AudioSentence[] = [];
  let idCounter = 1;

  // Split by code blocks: ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      extractSentencesFromTextBlock(textBefore, sentences, idCounter);
      idCounter = sentences.length + 1;
    }

    // Code block found: DO NOT read the code syntax!
    // Instead, insert a polite pause cue so user can inspect the snippet
    const lang = match[1]?.trim() || "code";
    sentences.push({
      id: idCounter++,
      text: `[Code snippet in ${lang}. Pausing to review.]`,
      cleanText: `Code example in ${lang}. Pausing to review.`,
      isCodeBlock: true,
      lang: lang,
    });

    lastIndex = match.index + match[0].length;
  }

  // Any remaining text after the last code block
  const remainingText = text.slice(lastIndex);
  if (remainingText.trim()) {
    extractSentencesFromTextBlock(remainingText, sentences, idCounter);
  }

  return sentences;
}

function extractSentencesFromTextBlock(
  rawText: string,
  sentences: AudioSentence[],
  startId: number
) {
  // Split into lines/paragraphs
  const lines = rawText.split("\n");
  let buffer = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (buffer.trim()) {
        splitIntoSentences(buffer, sentences, startId);
        startId = sentences.length + 1;
        buffer = "";
      }
      continue;
    }

    // Clean markdown headings, blockquotes, list markers
    let cleanLine = trimmed
      .replace(/^#{1,6}\s+/, "") // remove headers
      .replace(/^>\s+/, "") // remove blockquote
      .replace(/^[-*+]\s+/, "") // remove unordered list
      .replace(/^\d+\.\s+/, ""); // remove ordered list

    // Clean inline markdown syntax
    cleanLine = cleanLine
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italic
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/\[\[(.*?)\]\]/g, "$1") // wiki-links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // standard links

    if (cleanLine.trim()) {
      buffer += " " + cleanLine.trim();
    }
  }

  if (buffer.trim()) {
    splitIntoSentences(buffer, sentences, startId);
  }
}

function splitIntoSentences(
  paragraph: string,
  sentences: AudioSentence[],
  startId: number
) {
  // Split by sentence terminators (. ! ?)
  const rawSentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  for (const s of rawSentences) {
    sentences.push({
      id: sentences.length + 1,
      text: s,
      cleanText: s,
      isCodeBlock: false,
    });
  }
}

interface ReadAloudPlayerProps {
  content: string;
  noteTitle: string;
  onClose?: () => void;
  className?: string;
}

export function ReadAloudPlayer({
  content,
  noteTitle,
  onClose,
  className = "",
}: ReadAloudPlayerProps) {
  const sentences = useMemo(() => parseMarkdownToSentences(content), [content]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load available voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Prioritize natural sounding English voices
        const preferred =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Siri"))) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
        setSelectedVoice(preferred || null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak a specific sentence index
  const speakSentence = useCallback(
    (index: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (index < 0 || index >= sentences.length) {
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }

      const item = sentences[index];
      setCurrentIndex(index);

      // If code block pause
      if (item.isCodeBlock) {
        // Speak brief cue, then give a 2.5s pause to read code
        const cueUtterance = new SpeechSynthesisUtterance(item.cleanText);
        cueUtterance.rate = speed;
        if (selectedVoice) cueUtterance.voice = selectedVoice;

        cueUtterance.onend = () => {
          // Pause for 2.5 seconds to let user view the code snippet
          pauseTimerRef.current = setTimeout(() => {
            if (index + 1 < sentences.length) {
              speakSentence(index + 1);
            } else {
              setIsPlaying(false);
            }
          }, 2500);
        };

        cueUtterance.onerror = () => {
          if (index + 1 < sentences.length) {
            speakSentence(index + 1);
          } else {
            setIsPlaying(false);
          }
        };

        utteranceRef.current = cueUtterance;
        window.speechSynthesis.speak(cueUtterance);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(item.cleanText);
      utterance.rate = speed;
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => {
        if (index + 1 < sentences.length) {
          speakSentence(index + 1);
        } else {
          setIsPlaying(false);
          setCurrentIndex(0);
        }
      };

      utterance.onerror = (e) => {
        // Only advance if not intentionally canceled
        if (e.error !== "canceled" && e.error !== "interrupted") {
          if (index + 1 < sentences.length) {
            speakSentence(index + 1);
          } else {
            setIsPlaying(false);
          }
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [sentences, speed, selectedVoice]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakSentence(currentIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < sentences.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (isPlaying) {
        speakSentence(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (isPlaying) {
        speakSentence(prevIdx);
      }
    }
  };

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const handleSetSpeed = (newSpeed: number) => {
    const clamped = Math.min(3.0, Math.max(1.0, parseFloat(newSpeed.toFixed(1))));
    setSpeed(clamped);
    if (isPlaying) {
      speakSentence(currentIndex);
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0];
    const nextIdx = (speeds.findIndex((s) => Math.abs(s - speed) < 0.05) + 1) % speeds.length;
    handleSetSpeed(speeds[nextIdx]);
  };

  const handleStopAndClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPlaying(false);
    if (onClose) onClose();
  };

  const currentSentence = sentences[currentIndex];
  const progressPercent = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0;

  if (sentences.length === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-white/95 dark:bg-[#181b1f]/95 backdrop-blur-2xl border-2 border-border/80 dark:border-[#383e46] rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.65)] p-4 text-foreground transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-6 ${className}`}
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Progress Line */}
      <div className="w-full bg-muted dark:bg-muted/60 h-1.5 rounded-full mb-3 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(248,152,32,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Indicator & Sentence Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`p-1.5 rounded-lg ${isPlaying ? "bg-primary text-primary-foreground animate-pulse shadow-xs" : "bg-muted text-muted-foreground"}`}>
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate text-foreground">
              {noteTitle}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted dark:bg-[#252a30] text-foreground/80 font-medium ml-auto sm:ml-0 flex-shrink-0 border border-border/50">
              Sentence {currentIndex + 1} of {sentences.length}
            </span>
          </div>

          {/* Current Sentence Live Text Box with solid readable surface */}
          <div className="text-xs text-foreground/90 font-normal line-clamp-2 italic bg-muted/70 dark:bg-[#21252b] px-3 py-2 rounded-xl border border-border/60 dark:border-[#333942] min-h-[42px] flex items-center shadow-inner">
            {currentSentence?.isCodeBlock ? (
              <span className="flex items-center gap-1.5 text-warning font-semibold not-italic">
                <Code2 className="w-4 h-4" />
                <span>[Code Snippet: Pausing 2.5s to review snippet]</span>
              </span>
            ) : (
              <span>&ldquo;{currentSentence?.text}&rdquo;</span>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center justify-end gap-1.5 flex-shrink-0 pt-1 sm:pt-0">
          {/* Previous sentence */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous sentence (⏮)"
            aria-label="Previous sentence"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? "Pause (⏸)" : "Play (▶)"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Next sentence */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= sentences.length - 1}
            className="p-2 rounded-lg hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next sentence (⏭)"
            aria-label="Next sentence"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector with Popover & Number Input */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-mono font-medium transition-colors cursor-pointer"
              title="Adjust reading speed (1.0x - 3.0x)"
              aria-label="Speed"
            >
              <Gauge className="w-3 h-3 text-primary" />
              <span>{speed.toFixed(1)}x</span>
            </button>

            {showSpeedMenu && (
              <div
                className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-popover/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 text-xs animate-in fade-in-50 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider font-mono">
                    Speed (1.0 - 3.0x)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleSetSpeed(val);
                      }}
                      className="w-14 text-center font-mono font-bold px-1.5 py-0.5 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <span className="font-mono text-muted-foreground text-xs">x</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => handleSetSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mb-3"
                />

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1">
                  {[1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2.0, 2.5, 3.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        handleSetSpeed(preset);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                        Math.abs(speed - preset) < 0.05
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {preset.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleStopAndClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
            title="Stop and close reader"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
