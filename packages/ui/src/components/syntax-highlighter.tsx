"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  className?: string;
}

const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new", "package",
  "private", "protected", "public", "return", "short", "static", "strictfp",
  "super", "switch", "synchronized", "this", "throw", "throws", "transient",
  "try", "void", "volatile", "while", "record", "sealed", "permits", "var"
]);

const JS_TS_KEYWORDS = new Set([
  "as", "async", "await", "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
  "false", "finally", "for", "from", "function", "get", "if", "implements",
  "import", "in", "instanceof", "interface", "let", "new", "null", "of", "package",
  "private", "protected", "public", "return", "set", "static", "super", "switch",
  "this", "throw", "true", "try", "type", "typeof", "undefined", "var", "void",
  "while", "with", "yield"
]);

const PYTHON_KEYWORDS = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
  "del", "elif", "else", "except", "False", "finally", "for", "from", "global",
  "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass",
  "raise", "return", "True", "try", "while", "with", "yield"
]);

const SQL_KEYWORDS = new Set([
  "select", "from", "where", "insert", "into", "values", "update", "set",
  "delete", "create", "table", "drop", "alter", "add", "column", "join",
  "inner", "left", "right", "full", "outer", "on", "group", "by", "order",
  "having", "limit", "offset", "as", "distinct", "and", "or", "not", "in",
  "between", "like", "is", "null", "primary", "key", "foreign", "references",
  "cascade", "index", "unique", "union", "all", "case", "when", "then", "end"
]);

const BASH_COMMANDS = new Set([
  "cd", "ls", "pwd", "mkdir", "rm", "cp", "mv", "touch", "cat", "grep",
  "find", "chmod", "chown", "curl", "wget", "git", "docker", "npm", "yarn",
  "npx", "echo", "export", "source", "sudo", "ps", "kill", "ssh", "tar"
]);

function highlightTokens(code: string, lang: string): React.ReactNode[] {
  const normalizedLang = lang.toLowerCase().trim();
  const lines = code.split("\n");

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
      // 1. Comments
      if (
        (line.slice(i, i + 2) === "//" && normalizedLang !== "python") ||
        (line[i] === "#" && (normalizedLang === "python" || normalizedLang === "bash" || normalizedLang === "sh" || normalizedLang === "yaml")) ||
        (line.slice(i, i + 2) === "--" && normalizedLang === "sql")
      ) {
        tokens.push(
          <span key={`${lineIdx}-${i}`} className="text-zinc-500 dark:text-zinc-400 italic">
            {line.slice(i)}
          </span>
        );
        break;
      }

      // 2. Strings
      if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
        const quote = line[i];
        let end = i + 1;
        while (end < len && line[end] !== quote) {
          if (line[end] === "\\" && end + 1 < len) {
            end += 2;
          } else {
            end++;
          }
        }
        if (end < len) end++; // include closing quote
        const strVal = line.slice(i, end);
        tokens.push(
          <span key={`${lineIdx}-${i}`} className="text-emerald-600 dark:text-emerald-400">
            {strVal}
          </span>
        );
        i = end;
        continue;
      }

      // 3. Annotations / Decorators (e.g. @RestController, @Override, @param)
      if (line[i] === "@" && /[a-zA-Z]/.test(line[i + 1] || "")) {
        let end = i + 1;
        while (end < len && /[a-zA-Z0-9_]/.test(line[end])) {
          end++;
        }
        tokens.push(
          <span key={`${lineIdx}-${i}`} className="text-amber-600 dark:text-amber-400 font-semibold">
            {line.slice(i, end)}
          </span>
        );
        i = end;
        continue;
      }

      // 4. Numbers
      if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
        let end = i;
        while (end < len && /[0-9a-fA-FxX_.]/.test(line[end])) {
          end++;
        }
        tokens.push(
          <span key={`${lineIdx}-${i}`} className="text-cyan-600 dark:text-cyan-400">
            {line.slice(i, end)}
          </span>
        );
        i = end;
        continue;
      }

      // 5. Words (Identifiers, keywords, types)
      if (/[a-zA-Z_$]/.test(line[i])) {
        let end = i;
        while (end < len && /[a-zA-Z0-9_$]/.test(line[end])) {
          end++;
        }
        const word = line.slice(i, end);
        const lowerWord = word.toLowerCase();

        let tokenClass = "text-zinc-800 dark:text-zinc-200";

        if (
          JAVA_KEYWORDS.has(word) ||
          (normalizedLang.includes("java") && JAVA_KEYWORDS.has(word)) ||
          JS_TS_KEYWORDS.has(word) ||
          PYTHON_KEYWORDS.has(word) ||
          SQL_KEYWORDS.has(lowerWord)
        ) {
          tokenClass = "text-purple-600 dark:text-purple-400 font-semibold";
        } else if (BASH_COMMANDS.has(word) && (normalizedLang === "bash" || normalizedLang === "sh")) {
          tokenClass = "text-sky-600 dark:text-sky-400 font-semibold";
        } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(word)) {
          // Type or Class Name (e.g. UserService, ResponseEntity, UUID, String)
          tokenClass = "text-amber-600 dark:text-amber-300 font-medium";
        } else if (end < len && line[end] === "(") {
          // Function or method call
          tokenClass = "text-blue-600 dark:text-blue-400";
        }

        tokens.push(
          <span key={`${lineIdx}-${i}`} className={tokenClass}>
            {word}
          </span>
        );
        i = end;
        continue;
      }

      // 6. Symbols / Punctuation
      tokens.push(
        <span key={`${lineIdx}-${i}`} className="text-zinc-500 dark:text-zinc-400">
          {line[i]}
        </span>
      );
      i++;
    }

    return (
      <div key={lineIdx} className="table-row">
        <span className="table-cell select-none pr-4 text-right text-xs text-zinc-400 dark:text-zinc-600 font-mono w-8">
          {lineIdx + 1}
        </span>
        <span className="table-cell font-mono whitespace-pre">
          {tokens.length > 0 ? tokens : " "}
        </span>
      </div>
    );
  });
}

export function SyntaxHighlighter({
  code,
  language = "text",
  className = "",
}: SyntaxHighlighterProps) {
  const [copied, setCopied] = useState(false);
  const cleanCode = code.replace(/\r\n/g, "\n");
  const displayLang = (language || "text").toUpperCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet:", err);
    }
  };

  return (
    <div
      className={`relative my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121417] overflow-hidden shadow-xs text-xs sm:text-sm ${className}`}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/60 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold uppercase tracking-wider text-primary">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Container */}
      <div className="p-3 overflow-x-auto text-xs leading-relaxed font-mono">
        <div className="table w-full">
          {highlightTokens(cleanCode, language)}
        </div>
      </div>
    </div>
  );
}
