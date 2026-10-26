"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  X, Gauge, Code2, Headphones, RotateCcw, Settings, Sparkles,
  ArrowDownCircle, Sliders, Check
} from "lucide-react";
import {
  parseMarkdownBlocks,
  type AudioSentence,
} from "@vibe-notes/notes-core";

export type { AudioSentence };

/**
 * Parses markdown into clean speakable sentences.
 * Uses unified sentence tokenization from @vibe-notes/notes-core.
 */
export function parseMarkdownToSentences(markdown: string): AudioSentence[] {
  return parseMarkdownBlocks(markdown).sentences;
}

export interface ReaderPreferences {
  volume: number; // 0.0 - 1.0
  speed: number; // 0.5 - 3.0
  pitch: number; // 0.5 - 2.0
  voiceURI: string | null;
  autoScroll: boolean;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  volume: 1.0,
  speed: 1.0,
  pitch: 1.0,
  voiceURI: null,
  autoScroll: true,
};

export const READER_PREFERENCES_KEY = "vibe_notes_reader_preferences";

export interface ReadAloudPlayerProps {
  content: string;
  noteTitle: string;
  onClose?: () => void;
  className?: string;
  activeSentenceIndex?: number | null;
  onSentenceChange?: (sentenceIndex: number, sentence: AudioSentence) => void;
  onWordChange?: (wordIndex: number, word: string, charIndex: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onSeekSentence?: (index: number) => void;
  autoScroll?: boolean;
  autoPlay?: boolean;
}

export function ReadAloudPlayer({
  content,
  noteTitle,
  onClose,
  className = "",
  activeSentenceIndex = null,
  onSentenceChange,
  onWordChange,
  onPlayStateChange,
  onSeekSentence,
  autoScroll: initialAutoScroll = true,
  autoPlay = true,
}: ReadAloudPlayerProps) {
  const sentences = useMemo(() => parseMarkdownToSentences(content), [content]);
  const [currentIndex, setCurrentIndex] = useState(activeSentenceIndex ?? 0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // User Preferences (hydrated from localStorage)
  const [volume, setVolume] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [autoScroll, setAutoScroll] = useState<boolean>(initialAutoScroll);
  const [savedVoiceURI, setSavedVoiceURI] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Popover menus
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakSentenceRef = useRef<(idx: number) => void>(() => {});
  const hasAutoPlayedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // 1. Hydrate user preferences from localStorage on mount (prevents SSR mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(READER_PREFERENCES_KEY);
      if (stored) {
        const parsed: Partial<ReaderPreferences> = JSON.parse(stored);
        if (typeof parsed.volume === "number") setVolume(Math.max(0, Math.min(1, parsed.volume)));
        if (typeof parsed.speed === "number") setSpeed(Math.max(0.5, Math.min(3.0, parsed.speed)));
        if (typeof parsed.pitch === "number") setPitch(Math.max(0.5, Math.min(2.0, parsed.pitch)));
        if (typeof parsed.autoScroll === "boolean") setAutoScroll(parsed.autoScroll);
        if (typeof parsed.voiceURI === "string") setSavedVoiceURI(parsed.voiceURI);
      }
    } catch (err) {
      console.warn("[ReadAloud] Error loading saved preferences:", err);
    }
  }, []);

  // Helper to persist updated preferences to localStorage
  const savePreferences = useCallback(
    (updates: Partial<ReaderPreferences>) => {
      try {
        const current: ReaderPreferences = {
          volume,
          speed,
          pitch,
          autoScroll,
          voiceURI: selectedVoice ? selectedVoice.voiceURI : savedVoiceURI,
          ...updates,
        };
        localStorage.setItem(READER_PREFERENCES_KEY, JSON.stringify(current));
      } catch (err) {
        console.warn("[ReadAloud] Error saving preferences:", err);
      }
    },
    [volume, speed, pitch, autoScroll, selectedVoice, savedVoiceURI]
  );

  // 2. Load available voices and match saved preference or sensible English default
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);

        // Find saved voice by URI if stored
        if (savedVoiceURI) {
          const match = voices.find((v) => v.voiceURI === savedVoiceURI);
          if (match) {
            setSelectedVoice(match);
            return;
          }
        }

        // Otherwise pick the best natural English voice available
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Natural") ||
                v.name.includes("Google") ||
                v.name.includes("Samantha") ||
                v.name.includes("Daniel") ||
                v.name.includes("Alex") ||
                v.name.includes("Siri"))
          ) ||
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
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    };
  }, [savedVoiceURI]);

  // 3. Keep-alive heartbeat: Chromium pauses speech on long utterances unless periodically resumed
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 4. External seek sync
  useEffect(() => {
    if (
      activeSentenceIndex !== null &&
      activeSentenceIndex !== undefined &&
      activeSentenceIndex >= 0 &&
      activeSentenceIndex < sentences.length
    ) {
      if (activeSentenceIndex !== currentIndex) {
        setCurrentIndex(activeSentenceIndex);
        setCurrentWordIndex(0);
        setIsPlaying(true);
        onPlayStateChange?.(true);
        speakSentenceRef.current(activeSentenceIndex);
      }
    }
  }, [activeSentenceIndex, sentences.length]);

  // 5. Speak a specific sentence index with full preferences applied
  const speakSentence = useCallback(
    (index: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (index < 0 || index >= sentences.length) {
        setIsPlaying(false);
        onPlayStateChange?.(false);
        return;
      }

      // Stop previous utterance and unpause audio engine
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }

      const item = sentences[index];
      setCurrentIndex(index);
      setCurrentWordIndex(0);

      onSentenceChange?.(index, item);
      const words = item.words || item.cleanText.trim().split(/\s+/).filter(Boolean);
      onWordChange?.(0, words[0] || "", 0);

      // Auto-scroll the page to center the sentence
      if (autoScroll && typeof document !== "undefined") {
        setTimeout(() => {
          const el = document.getElementById(`speech-sentence-${index}`);
          if (el) {
            el.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        }, 30);
      }

      // If code block pause
      if (item.isCodeBlock) {
        const cueUtterance = new SpeechSynthesisUtterance(item.cleanText);
        cueUtterance.rate = speed;
        cueUtterance.volume = volume;
        cueUtterance.pitch = pitch;
        if (selectedVoice) cueUtterance.voice = selectedVoice;

        cueUtterance.onend = () => {
          // Pause for 2.5 seconds to let user view the code snippet
          pauseTimerRef.current = setTimeout(() => {
            if (index + 1 < sentences.length) {
              speakSentence(index + 1);
            } else {
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }
          }, 2500);
        };

        cueUtterance.onerror = (e) => {
          if (e.error !== "canceled" && e.error !== "interrupted") {
            if (index + 1 < sentences.length) {
              speakSentence(index + 1);
            } else {
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }
          }
        };

        utteranceRef.current = cueUtterance;
        (window as any).__vibe_active_utterance = cueUtterance;
        window.speechSynthesis.speak(cueUtterance);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(item.cleanText);
      utterance.rate = speed;
      utterance.volume = volume;
      utterance.pitch = pitch;
      if (selectedVoice) utterance.voice = selectedVoice;

      let boundaryFired = false;

      // Word boundary event listener (Chrome, Safari, Edge, Firefox)
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === "word") {
          boundaryFired = true;
          if (wordTimerRef.current) {
            clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
          }

          // Locate which word matches the character offset
          let foundIdx = 0;
          let runningIndex = 0;
          for (let w = 0; w < words.length; w++) {
            const wordStr = words[w];
            const pos = item.cleanText.indexOf(wordStr, runningIndex);
            if (pos !== -1) {
              if (e.charIndex >= pos && e.charIndex < pos + wordStr.length) {
                foundIdx = w;
                break;
              } else if (e.charIndex >= pos) {
                foundIdx = w;
              }
              runningIndex = pos + wordStr.length;
            }
          }

          setCurrentWordIndex(foundIdx);
          onWordChange?.(foundIdx, words[foundIdx] || "", e.charIndex);
        }
      };

      // Word pacing fallback ticker (in case OS voice doesn't emit onboundary events)
      const msPerWord = Math.max(90, Math.round(60000 / (175 * speed)));
      let fallbackWordIdx = 0;
      wordTimerRef.current = setInterval(() => {
        if (boundaryFired) {
          if (wordTimerRef.current) clearInterval(wordTimerRef.current);
          return;
        }
        fallbackWordIdx++;
        if (fallbackWordIdx < words.length) {
          setCurrentWordIndex(fallbackWordIdx);
          onWordChange?.(fallbackWordIdx, words[fallbackWordIdx] || "", 0);
        } else {
          if (wordTimerRef.current) clearInterval(wordTimerRef.current);
        }
      }, msPerWord);

      utterance.onstart = () => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
      };

      utterance.onend = () => {
        if (wordTimerRef.current) clearInterval(wordTimerRef.current);
        if (index + 1 < sentences.length) {
          speakSentence(index + 1);
        } else {
          setIsPlaying(false);
          onPlayStateChange?.(false);
          setCurrentIndex(0);
          setCurrentWordIndex(0);
        }
      };

      utterance.onerror = (e) => {
        if (wordTimerRef.current) clearInterval(wordTimerRef.current);
        // Only advance if not intentionally canceled
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("[ReadAloud] Utterance error:", e.error);
          if (index + 1 < sentences.length) {
            speakSentence(index + 1);
          } else {
            setIsPlaying(false);
            onPlayStateChange?.(false);
          }
        }
      };

      utteranceRef.current = utterance;
      // Retain global reference to avoid V8 GC abruptly halting speech
      (window as any).__vibe_active_utterance = utterance;

      // Small 15ms dispatch delay allows previous cancel() in browser audio thread to settle
      speakTimerRef.current = setTimeout(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        }
      }, 15);
    },
    [sentences, speed, volume, pitch, selectedVoice, onSentenceChange, onWordChange, onPlayStateChange, autoScroll]
  );

  speakSentenceRef.current = speakSentence;

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current && sentences.length > 0) {
      hasAutoPlayedRef.current = true;
      const startIdx =
        activeSentenceIndex !== null &&
        activeSentenceIndex !== undefined &&
        activeSentenceIndex >= 0 &&
        activeSentenceIndex < sentences.length
          ? activeSentenceIndex
          : 0;
      setIsPlaying(true);
      onPlayStateChange?.(true);
      speakSentenceRef.current(startIdx);
    }
  }, [autoPlay, sentences.length, activeSentenceIndex, onPlayStateChange]);

  const handlePlayPause = () => {
    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
      setIsPlaying(true);
      onPlayStateChange?.(true);
      speakSentence(currentIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < sentences.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentWordIndex(0);
      if (isPlaying) {
        speakSentence(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setCurrentWordIndex(0);
      if (isPlaying) {
        speakSentence(prevIdx);
      }
    }
  };

  // Preference Handlers (Immediate state update + Local Storage save)
  const handleSetSpeed = (newSpeed: number) => {
    const clamped = Math.min(3.0, Math.max(0.5, parseFloat(newSpeed.toFixed(1))));
    setSpeed(clamped);
    savePreferences({ speed: clamped });
    if (isPlaying) {
      speakSentence(currentIndex);
    }
  };

  const handleSetVolume = (newVolume: number) => {
    const clamped = Math.min(1.0, Math.max(0.0, parseFloat(newVolume.toFixed(2))));
    setVolume(clamped);
    savePreferences({ volume: clamped });
    if (isPlaying) {
      speakSentence(currentIndex);
    }
  };

  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    setSavedVoiceURI(voice.voiceURI);
    savePreferences({ voiceURI: voice.voiceURI });
    setShowVoiceMenu(false);
    if (isPlaying) {
      speakSentence(currentIndex);
    }
  };

  const handleToggleAutoScroll = () => {
    const nextVal = !autoScroll;
    setAutoScroll(nextVal);
    savePreferences({ autoScroll: nextVal });
  };

  const handleStopAndClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setIsPlaying(false);
    onPlayStateChange?.(false);
    if (onClose) onClose();
  };

  const currentSentence = sentences[currentIndex];
  const currentWords =
    currentSentence?.words || currentSentence?.cleanText.trim().split(/\s+/).filter(Boolean) || [];
  const progressPercent = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0;

  if (sentences.length === 0) return null;

  // Filter English or popular voices for cleaner dropdown presentation
  const displayedVoices = availableVoices.length > 0
    ? [...availableVoices].sort((a, b) => {
        const aIsEn = a.lang.startsWith("en");
        const bIsEn = b.lang.startsWith("en");
        if (aIsEn && !bIsEn) return -1;
        if (!aIsEn && bIsEn) return 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  const playerMarkup = (
    <div
      id="read-aloud-player-bar"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-2xl bg-white/95 dark:bg-[#181b1f]/95 backdrop-blur-2xl border-2 border-border/80 dark:border-[#383e46] rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.65)] p-4 text-foreground transition-all duration-200 ${className}`}
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
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
        {/* Left: Indicator, Note Title & Animated Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div
              className={`p-1.5 rounded-lg flex items-center gap-1.5 ${
                isPlaying
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Headphones className="w-4 h-4" />
              {/* Dynamic Bouncing Audio Waveform Bars */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3.5 px-0.5">
                  <span className="w-0.5 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
                  <span className="w-0.5 bg-white rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.15s] h-3.5" />
                  <span className="w-0.5 bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.3s] h-2.5" />
                  <span className="w-0.5 bg-white rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s] h-3" />
                </div>
              )}
            </div>

            <span className="text-xs font-bold truncate text-foreground max-w-[200px]">
              {noteTitle}
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted dark:bg-[#252a30] text-foreground/80 font-medium ml-auto sm:ml-0 flex-shrink-0 border border-border/50">
              Sentence {currentIndex + 1} of {sentences.length}
            </span>

            {/* Voice label pill */}
            {selectedVoice && (
              <button
                type="button"
                onClick={() => {
                  setShowVoiceMenu(!showVoiceMenu);
                  setShowSpeedMenu(false);
                  setShowVolumeMenu(false);
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors cursor-pointer hidden md:inline-flex items-center gap-1"
                title="Change voice (saved to your preferences)"
              >
                <span>Voice: {selectedVoice.name.replace(/^(Microsoft|Google|Apple)\s*/i, "").slice(0, 14)}</span>
              </button>
            )}
          </div>

          {/* Current Sentence Live Text Box with active word highlighting */}
          <div className="text-xs text-foreground/90 font-normal line-clamp-2 italic bg-muted/70 dark:bg-[#21252b] px-3 py-2 rounded-xl border border-border/60 dark:border-[#333942] min-h-[42px] flex items-center shadow-inner overflow-hidden">
            {currentSentence?.isCodeBlock ? (
              <span className="flex items-center gap-1.5 text-warning font-semibold not-italic">
                <Code2 className="w-4 h-4" />
                <span>[Code Snippet: Pausing 2.5s to inspect code]</span>
              </span>
            ) : (
              <span className="flex flex-wrap gap-x-1 items-center not-italic">
                {currentWords.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    className={`inline-block mr-1 transition-all duration-100 ${
                      isPlaying && wIdx === currentWordIndex
                        ? "bg-primary text-primary-foreground font-semibold px-1 rounded shadow-xs scale-105"
                        : "text-foreground/90"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Preference Popovers */}
        <div className="flex items-center justify-end gap-1 flex-shrink-0 pt-1 sm:pt-0">
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

          {/* Volume Control Button & Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVolumeMenu(!showVolumeMenu);
                setShowSpeedMenu(false);
                setShowVoiceMenu(false);
              }}
              className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer"
              title={`Volume: ${Math.round(volume * 100)}% (saved locally)`}
              aria-label="Volume settings"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-primary" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
            </button>

            {showVolumeMenu && (
              <div
                className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-popover/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 text-xs animate-in fade-in-50 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider font-mono">
                    Volume
                  </span>
                  <span className="font-mono text-primary font-bold text-xs">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => handleSetVolume(volume === 0 ? 1.0 : 0)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title={volume === 0 ? "Unmute" : "Mute"}
                  >
                    {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-destructive" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleSetVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                  <span>Saved to preferences</span>
                  <button
                    onClick={() => handleSetVolume(1.0)}
                    className="text-primary hover:underline"
                  >
                    Reset (100%)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Speed Selector with Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowVolumeMenu(false);
                setShowVoiceMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-mono font-medium transition-colors cursor-pointer"
              title={`Reading speed: ${speed.toFixed(1)}x (saved locally)`}
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
                    Speed (0.5x - 3.0x)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
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
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => handleSetSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mb-3"
                />

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {[0.8, 1.0, 1.2, 1.3, 1.5, 1.7, 2.0, 2.5].map((preset) => (
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

                <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                  <span>Saved to preferences</span>
                  <button
                    onClick={() => handleSetSpeed(1.0)}
                    className="text-primary hover:underline"
                  >
                    Reset (1.0x)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Voice Selector Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVoiceMenu(!showVoiceMenu);
                setShowSpeedMenu(false);
                setShowVolumeMenu(false);
              }}
              className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer"
              title="Select Voice (saved locally)"
              aria-label="Voice settings"
            >
              <Sliders className="w-4 h-4 text-foreground/80 hover:text-primary transition-colors" />
            </button>

            {showVoiceMenu && (
              <div
                className="absolute right-0 bottom-full mb-2 w-72 max-h-72 p-3 bg-popover/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 text-xs overflow-y-auto animate-in fade-in-50 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider font-mono">
                    Voice ({displayedVoices.length})
                  </span>
                  <span className="text-[10px] text-primary font-mono">Saved locally</span>
                </div>

                {displayedVoices.length === 0 ? (
                  <p className="text-muted-foreground text-xs py-2 italic">
                    Loading voices from browser...
                  </p>
                ) : (
                  <div className="space-y-1">
                    {displayedVoices.map((voice) => {
                      const isSelected = selectedVoice?.voiceURI === voice.voiceURI;
                      return (
                        <button
                          key={voice.voiceURI}
                          onClick={() => handleSelectVoice(voice)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted text-foreground/90"
                          }`}
                        >
                          <div className="truncate flex-1">
                            <span className="block truncate">{voice.name}</span>
                            <span className={`text-[10px] font-mono ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              {voice.lang} {voice.localService ? "· Local" : "· Online"}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={handleToggleAutoScroll}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              autoScroll
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted opacity-50"
            }`}
            title={
              autoScroll
                ? "Auto-scroll is ON (centers active sentence automatically)"
                : "Auto-scroll is OFF"
            }
            aria-label="Toggle auto-scroll"
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>

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

  if (!mounted || typeof document === "undefined" || !document.body) {
    return playerMarkup;
  }

  return createPortal(playerMarkup, document.body);
}
