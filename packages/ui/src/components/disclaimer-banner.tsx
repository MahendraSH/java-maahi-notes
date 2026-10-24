"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DisclaimerBannerProps {
  className?: string;
  storageKey?: string;
}

export function DisclaimerBanner({
  className = "",
  storageKey = "vibe_notes_testing_disclaimer_dismissed",
}: DisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(true); // default true to avoid SSR flash

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(storageKey);
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // ignore
    }
  };

  return (
    <aside
      aria-label="Testing Phase Disclaimer"
      className={`relative z-20 flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="truncate">
          <strong className="font-semibold mr-1.5 uppercase tracking-wide text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
            Testing Phase
          </strong>
          <span>
            Vibe Notes is in active preview & developer testing. Notes are saved directly to your local file system as plain Markdown.
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer flex-shrink-0"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
}
