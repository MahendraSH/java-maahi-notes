import React from "react";

interface MarkdownTableProps {
  lines: string[];
  renderInline?: (text: string) => React.ReactNode;
  className?: string;
}

export function isMarkdownTableStart(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|");
}

export function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  const parts = trimmed
    .slice(1, -1)
    .split("|")
    .map((p) => p.trim());
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p));
}

export function MarkdownTable({
  lines,
  renderInline = (t) => t,
  className = "",
}: MarkdownTableProps) {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const separatorLine = lines[1];
  const dataLines = lines.slice(2);

  // Parse headers
  const headers = headerLine
    .trim()
    .slice(1, -1)
    .split("|")
    .map((h) => h.trim());

  // Parse alignments
  const alignments = separatorLine
    .trim()
    .slice(1, -1)
    .split("|")
    .map((s) => {
      const trimmed = s.trim();
      const left = trimmed.startsWith(":");
      const right = trimmed.endsWith(":");
      if (left && right) return "center";
      if (right) return "right";
      return "left";
    });

  // Parse rows
  const rows = dataLines
    .filter((l) => l.trim().startsWith("|"))
    .map((line) => {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      // Pad or trim cells to match header count
      while (cells.length < headers.length) cells.push("");
      return cells.slice(0, headers.length);
    });

  const getAlignClass = (align: string) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div className={`overflow-x-auto my-4 rounded-xl border border-border shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={`px-4 py-2.5 font-semibold text-foreground tracking-wide ${getAlignClass(
                  alignments[idx] || "left"
                )}`}
              >
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-muted/30 even:bg-muted/15 transition-colors"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`px-4 py-2.5 text-foreground/90 leading-relaxed ${getAlignClass(
                    alignments[cellIdx] || "left"
                  )}`}
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
