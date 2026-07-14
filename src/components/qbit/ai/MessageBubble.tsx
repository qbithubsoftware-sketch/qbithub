"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: { sourceType: string; title: string; url?: string; excerpt: string }[];
  timestamp?: string;
  loading?: boolean;
};

/**
 * MessageBubble — renders a single chat message (user or assistant).
 *
 * Supports Markdown rendering for assistant messages (headings, bold,
 * lists, tables, code blocks).  User messages render as plain text.
 */
export function MessageBubble({
  message,
  onCopy,
  onFeedback,
}: {
  message: ChatMessage;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: string, rating: "helpful" | "not_helpful") => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 max-w-3xl", isUser ? "flex-row-reverse ml-auto" : "")}>
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-qbit-primary text-xs font-bold text-qbit-on-primary" : "bg-qbit-primary-container",
      )}>
        {isUser ? (
          "You"
        ) : (
          <Icon name="smart_toy" className="text-[18px] text-qbit-on-primary" filled />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl p-4 text-sm",
          isUser
            ? "bg-qbit-primary text-qbit-on-primary rounded-tr-none"
            : "bg-qbit-surface-container-low text-qbit-on-surface border border-qbit-outline-variant/30 rounded-tl-none",
        )}>
          {message.loading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline" />
              <span className="ml-1 text-sm italic text-qbit-on-surface-variant">thinking...</span>
            </div>
          ) : (
            <RenderMarkdown content={message.content} isUser={isUser} />
          )}
        </div>

        {/* Actions (assistant only) */}
        {!isUser && !message.loading && (
          <div className="flex items-center gap-1 mt-1.5 ml-1">
            <button
              onClick={() => onCopy?.(message.content)}
              aria-label="Copy response"
              className="flex items-center gap-1 text-[11px] font-medium text-qbit-on-surface-variant hover:text-qbit-primary px-1.5 py-0.5 rounded transition-colors"
            >
              <Icon name="content_copy" className="text-[14px]" />
              Copy
            </button>
            <button
              onClick={() => onFeedback?.(message.id, "helpful")}
              aria-label="Helpful"
              className="flex items-center gap-1 text-[11px] font-medium text-qbit-on-surface-variant hover:text-emerald-600 px-1.5 py-0.5 rounded transition-colors"
            >
              <Icon name="thumb_up" className="text-[14px]" />
            </button>
            <button
              onClick={() => onFeedback?.(message.id, "not_helpful")}
              aria-label="Not helpful"
              className="flex items-center gap-1 text-[11px] font-medium text-qbit-on-surface-variant hover:text-red-600 px-1.5 py-0.5 rounded transition-colors"
            >
              <Icon name="thumb_down" className="text-[14px]" />
            </button>
            {message.timestamp && (
              <span className="text-[10px] text-qbit-outline ml-1">{message.timestamp}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple Markdown renderer — handles headings, bold, lists, tables, code blocks. */
function RenderMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) return <p className="leading-relaxed">{content}</p>;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-2 rounded-lg bg-qbit-inverse-surface p-3 overflow-x-auto custom-scrollbar">
            <code className="text-sm text-qbit-inverse-on-surface font-mono">{codeContent}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Table
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      // Skip separator row (|---|---|)
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      if (!inTable) {
        inTable = true;
        tableRows = [cells];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Render table
      elements.push(<RenderTable key={`table-${i}`} rows={tableRows} />);
      tableRows = [];
      inTable = false;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h4-${i}`} className="text-sm font-semibold text-qbit-on-surface mt-2 mb-1">{line.slice(4)}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={`h3-${i}`} className="text-base font-semibold text-qbit-on-surface mt-3 mb-1">{line.slice(3)}</h3>);
      continue;
    }

    // List items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<div key={`li-${i}`} className="flex items-start gap-1.5 my-0.5"><span className="text-qbit-primary mt-0.5">•</span><span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} /></div>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(<div key={`ol-${i}`} className="flex items-start gap-1.5 my-0.5"><span className="text-qbit-primary font-bold text-xs mt-0.5">{match[1]}.</span><span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(match[2]) }} /></div>);
        continue;
      }
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-1.5" />);
      continue;
    }

    // Paragraph
    elements.push(<p key={`p-${i}`} className="my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(<RenderTable key="table-final" rows={tableRows} />);
  }

  return <div>{elements}</div>;
}

/** Renders a Markdown table from parsed rows. */
function RenderTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-qbit-outline-variant/30">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-qbit-outline-variant bg-qbit-surface-container-high">
            {header.map((cell, i) => (
              <th key={i} className="px-2 py-1 text-left font-bold text-qbit-on-surface-variant">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-qbit-outline-variant/20">
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 text-qbit-on-surface-variant" dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Formats inline Markdown: **bold**, *italic*, `code`. */
function formatInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-qbit-surface-container-high px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/⚠️/g, '<span class="text-amber-600">⚠️</span>');
}
