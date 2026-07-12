"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { TroubleshootingCard } from "@/components/qbit/knowledge/TroubleshootingCard";
import { ErrorCodeCard } from "@/components/qbit/knowledge/ErrorCodeCard";
import { FAQAccordion } from "@/components/qbit/knowledge/FAQAccordion";
import { AI_SUPPORT_NAV } from "@/lib/navigation/nav-config";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import {
  TROUBLESHOOTING_ISSUES,
  COMMON_ERRORS,
  FAQS,
  KNOWLEDGE_CATEGORIES,
} from "@/lib/knowledge/placeholder-data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type AssistantMessageType = "greeting" | "diagnostic" | "text";

interface AssistantMessageBase {
  id: string;
  role: "assistant";
}

interface AssistantTextMessage extends AssistantMessageBase {
  type: "greeting" | "text";
  content: string;
}

interface AssistantDiagnosticMessage extends AssistantMessageBase {
  type: "diagnostic";
  title: string;
  intro: string;
  steps: string[];
  closing: string;
  code: string;
  links: { label: string; icon: string }[];
}

type AssistantMessage = AssistantTextMessage | AssistantDiagnosticMessage;

interface UserMessage {
  id: string;
  role: "user";
  content: string;
}

type ChatMessage = AssistantMessage | UserMessage;

interface QuickResource {
  label: string;
  icon: string;
  screen?: ScreenId;
}

interface TicketCard {
  id: string;
  priority: { label: string; variant: "error" | "info" };
  priorityIcon: string;
  priorityFilled?: boolean;
  title: string;
  assignee: string;
  initials: string;
  status: { label: string; tone: "warning" | "success" };
}

interface TroubleshootCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: { label: string; tone: "error" | "info" };
  ctaLabel: string;
  surface: string;
  iconWrap: string;
  titleClass: string;
  descriptionClass: string;
  ctaClass: string;
}

interface KbArticle {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  views: string;
  icon: string;
  bookmarked?: boolean;
}

/* ------------------------------------------------------------------ */
/* Static content (verbatim from Stitch design)                        */
/* ------------------------------------------------------------------ */

const SUGGESTION_CHIPS = [
  "How do I install Windows POS?",
  "Printer not detected",
  "Barcode scanner setup",
] as const;

const QUICK_RESOURCES: QuickResource[] = [
  { label: "Driver Downloads", icon: "download", screen: "driver-download-center" },
  { label: "Installation Guides", icon: "menu_book", screen: "installation-center" },
  { label: "Firmware Updates", icon: "system_update", screen: "driver-download-center" },
  { label: "Manual Library", icon: "library_books", screen: "installation-center" },
  { label: "Training Videos", icon: "videocam", screen: "video-training-center" },
  { label: "Warranty", icon: "verified_user", screen: "ai-support-center" },
  { label: "Support Tickets", icon: "confirmation_number", screen: "ai-support-center" },
  { label: "Troubleshooting", icon: "construction", screen: "ai-support-center" },
];

const TROUBLESHOOT_CARDS: TroubleshootCard[] = [
  {
    id: "printer",
    title: "Printer not printing",
    description: "3 identical issues reported in Sector 4. Likely firmware mismatch.",
    icon: "print_disabled",
    badge: { label: "Action Required", tone: "error" },
    ctaLabel: "Start Wizard",
    surface: "bg-qbit-error-container/30 border-qbit-error/20 hover:shadow-md",
    iconWrap: "bg-qbit-error/10 text-qbit-error",
    titleClass: "text-qbit-on-error-container",
    descriptionClass: "text-qbit-on-error-container/80",
    ctaClass: "text-qbit-error",
  },
  {
    id: "scanner",
    title: "Scanner not scanning",
    description: "Occasional beam timeout during high-frequency operation.",
    icon: "barcode_scanner",
    badge: { label: "Common Issue", tone: "info" },
    ctaLabel: "Run Calibration",
    surface: "bg-qbit-surface-container-low border-qbit-outline-variant hover:shadow-md",
    iconWrap: "bg-qbit-primary/10 text-qbit-primary",
    titleClass: "text-qbit-on-surface",
    descriptionClass: "text-qbit-on-surface-variant",
    ctaClass: "text-qbit-primary",
  },
];

const TICKETS: TicketCard[] = [
  {
    id: "TIC-9042",
    priority: { label: "High Priority", variant: "error" },
    priorityIcon: "priority_high",
    priorityFilled: true,
    title: "Kernel Error on POS-X10",
    assignee: "Eng. Sarah J.",
    initials: "SJ",
    status: { label: "In Progress", tone: "warning" },
  },
  {
    id: "TIC-8812",
    priority: { label: "Normal", variant: "info" },
    priorityIcon: "check_circle",
    priorityFilled: false,
    title: "Scanner Firmware Update",
    assignee: "Eng. David K.",
    initials: "DK",
    status: { label: "Resolved", tone: "success" },
  },
];

const KB_CATEGORIES = [
  "All Categories",
  "POS Machines",
  "Printers",
  "Scanners",
] as const;

const KB_ARTICLES: KbArticle[] = [
  {
    id: "kb1",
    category: "POS Machines",
    title: "Optimizing Windows 11 for InstalCore POS-X10 Series",
    excerpt:
      "Complete guide on power settings, driver isolation, and peripheral mapping for the latest enterprise OS.",
    readTime: "8 min read",
    views: "2.4k views",
    icon: "menu_book",
  },
  {
    id: "kb2",
    category: "Printers",
    title: "Troubleshooting Thermal Head Overheating Issues",
    excerpt:
      "Maintain print quality and hardware longevity by adjusting duty cycles and voltage inputs via the QBIT CLI.",
    readTime: "12 min read",
    views: "1.8k views",
    icon: "build",
  },
  {
    id: "kb3",
    category: "Networking",
    title: "Configuring Static IP on Mobile Wireless Hubs",
    excerpt:
      "Step-by-step instructions for manual network allocation on QBIT Hub 4G/5G deployment kits.",
    readTime: "5 min read",
    views: "3.1k views",
    icon: "router",
    bookmarked: true,
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "greeting",
    role: "assistant",
    type: "greeting",
    content:
      "Hi Alex! I'm your QBIT Technical Assistant. I have analyzed your previous support logs and current fleet status. How can I help you today?",
  },
  {
    id: "diagnostic",
    role: "assistant",
    type: "diagnostic",
    title: "Thermal Printer (QBIT-P20) Connection Issue",
    intro: "To resolve the Thermal Printer (QBIT-P20) Connection Issue, please follow these steps:",
    steps: [
      "Power cycle the printer",
      "Verify USB cable",
      "Reset port via CLI",
      "Reinstall driver",
    ],
    closing: "If the port reset fails, you may need to update your kernel drivers.",
    code: "qbit-cli device --reset-port /dev/usb/lp0 --verbose",
    links: [
      { label: "V2.4 Driver", icon: "download" },
      { label: "Service Manual", icon: "description" },
    ],
  },
];

const ASSISTANT_REPLIES: string[] = [
  "Thanks for the details. Let me scan the knowledge base for a matching solution...",
  "Got it. I'm cross-referencing your fleet logs against the InstalCore driver registry now.",
  "Understood. Based on similar support cases, I recommend running the diagnostic wizard first.",
  "Analyzing your input. I'll need the device serial number to proceed, but you can also start with the troubleshooting wizard.",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function pickReply(seed: string): string {
  const idx = seed.length % ASSISTANT_REPLIES.length;
  return ASSISTANT_REPLIES[idx];
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AISupportCenterPage() {
  const navigate = useNavigation((s) => s.navigate);

  /* Chat state */
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Hero search */
  const [heroQuery, setHeroQuery] = useState("");

  /* KB filter */
  const [kbFilter, setKbFilter] = useState<(typeof KB_CATEGORIES)[number]>("All Categories");

  /* Auto-scroll chat */
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: UserMessage = {
      id: makeId("u"),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    const reply = pickReply(trimmed);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId("a"),
          role: "assistant",
          type: "text",
          content: reply,
        },
      ]);
      setIsTyping(false);
    }, 1100);
  }, []);

  const handleSend = () => sendMessage(input);
  const handleSuggestion = (suggestion: string) => sendMessage(suggestion);

  const handleHeroSearch = () => {
    if (heroQuery.trim()) {
      navigate("universal-search-command-center", { q: heroQuery.trim() });
    }
  };

  const handleCopyCode = () => {
    const codeEl = document.getElementById("qbit-diagnostic-code");
    if (codeEl?.textContent) {
      void navigator.clipboard?.writeText(codeEl.textContent);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AppShell
      variant="ai-support"
      brand={{ title: "QBIT Hub", tagline: "InstalCore Enterprise", icon: "smart_toy" }}
      navItems={AI_SUPPORT_NAV}
      activeScreen="ai-support-center"
      user={{ name: "Alex Mercer", role: "Lead Engineer", initials: "AM" }}
      cta={{ label: "New Support Case", icon: "add", onClick: () => navigate("ai-support-center") }}
      footerItems={[
        { label: "Settings", icon: "settings", screen: "system-settings" },
        { label: "Help Center", icon: "help", screen: "ai-support-center" },
      ]}
      topBar={{
        title: "Technical Installation Support",
        navItems: [
          { label: "Status" },
          { label: "Documentation", active: true },
          { label: "Remote Assistance" },
        ],
        user: { name: "Alex Mercer", role: "Lead Engineer", initials: "AM" },
        rightExtras: (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-qbit-secondary-container px-3 py-1.5 text-xs font-semibold text-qbit-on-secondary-container transition-opacity hover:opacity-90"
          >
            <Icon name="smart_toy" className="text-[16px]" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        ),
      }}
      mainMaxWidth="max-w-[1600px]"
    >
      <div className="space-y-10">
        {/* ================================================================ */}
        {/* Hero — AI Search                                                 */}
        {/* ================================================================ */}
        <section className="flex flex-col items-center space-y-6 py-6 text-center md:py-10">
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold leading-tight text-qbit-on-surface md:text-[30px] md:leading-[38px]">
              AI Support Center
            </h1>
            <p className="text-base text-qbit-on-surface-variant md:text-lg">
              Intelligent diagnostic and resolution tools for InstalCore hardware.
            </p>
          </div>
          <div className="group relative w-full max-w-2xl">
            <Icon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-outline transition-colors group-focus-within:text-qbit-primary"
            />
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleHeroSearch();
              }}
              placeholder="Ask anything... e.g. 'Thermal printer not printing'"
              className="w-full rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-low py-4 pl-12 pr-32 text-base text-qbit-on-surface shadow-sm outline-none transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:ring-2 focus:ring-qbit-primary/20"
            />
            <button
              type="button"
              onClick={handleHeroSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-bold text-qbit-on-primary transition-all hover:bg-qbit-primary-container active:scale-95"
            >
              Search
            </button>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Main 8/4 grid                                                    */}
        {/* ================================================================ */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* ---------- LEFT: col-span-8 ---------- */}
          <div className="col-span-12 space-y-8 lg:col-span-8">
            {/* AI Assistant Chat Interface */}
            <div className="overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-qbit-outline-variant bg-qbit-surface-container-high px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-primary-container">
                    <Icon name="smart_toy" className="text-[22px] text-qbit-on-primary" filled />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-qbit-on-surface">
                      QBIT Technical Assistant
                    </h3>
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-qbit-outline">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span>Online • Powered by CoreAI</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-qbit-on-surface-variant transition-colors hover:text-qbit-on-surface"
                  aria-label="More options"
                >
                  <Icon name="more_vert" className="text-[20px]" />
                </button>
              </div>

              {/* Chat body */}
              <div
                ref={chatScrollRef}
                className="custom-scrollbar max-h-[520px] min-h-[400px] space-y-6 overflow-y-auto p-6"
              >
                {messages.map((msg) =>
                  msg.role === "assistant" ? (
                    <AssistantBubble
                      key={msg.id}
                      message={msg}
                      onCopy={handleCopyCode}
                      copied={copied}
                      onSuggestion={handleSuggestion}
                    />
                  ) : (
                    <UserBubble key={msg.id} message={msg} />
                  ),
                )}

                {isTyping && <TypingBubble />}
              </div>

              {/* Input */}
              <div className="border-t border-qbit-outline-variant bg-qbit-surface-container-lowest p-6">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                    placeholder="Type your technical question..."
                    className="flex-1 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low px-4 py-3 text-sm text-qbit-on-surface outline-none transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:ring-2 focus:ring-qbit-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary text-qbit-on-primary transition-all hover:bg-qbit-primary-container active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Icon name="send" className="text-[20px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Troubleshooting Center */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-qbit-on-surface">Troubleshooting Center</h2>
                <button
                  type="button"
                  className="text-sm font-bold text-qbit-primary hover:underline"
                >
                  View All Diagnostics
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {TROUBLESHOOT_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className={cn(
                      "group flex cursor-pointer items-start gap-4 rounded-2xl border p-6 transition-all",
                      card.surface,
                    )}
                  >
                    <div className={cn("rounded-xl p-2", card.iconWrap)}>
                      <Icon name={card.icon} className="text-[24px]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn("text-base font-bold", card.titleClass)}>{card.title}</h4>
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wider",
                            card.badge.tone === "error" ? "text-qbit-error" : "text-qbit-outline",
                          )}
                        >
                          {card.badge.label}
                        </span>
                      </div>
                      <p className={cn("mt-1 text-sm", card.descriptionClass)}>
                        {card.description}
                      </p>
                      <button
                        type="button"
                        className={cn(
                          "mt-4 flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2",
                          card.ctaClass,
                        )}
                      >
                        {card.ctaLabel}
                        <Icon name="chevron_right" className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ---------- RIGHT: col-span-4 ---------- */}
          <div className="col-span-12 space-y-8 lg:col-span-4">
            {/* Quick Resources */}
            <section className="space-y-5">
              <h3 className="text-xl font-semibold text-qbit-on-surface">Quick Resources</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_RESOURCES.map((res) => (
                  <button
                    key={res.label}
                    type="button"
                    onClick={() => res.screen && navigate(res.screen, {})}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-4 text-center transition-all hover:border-qbit-primary hover:shadow-sm active:scale-95"
                  >
                    <Icon name={res.icon} className="text-[26px] text-qbit-primary" filled />
                    <span className="text-sm font-medium text-qbit-on-surface transition-colors group-hover:text-qbit-primary">
                      {res.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Tickets */}
            <section className="rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-qbit-on-surface">Recent Tickets</h3>
                <span className="rounded-full bg-qbit-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-qbit-primary">
                  2 Open
                </span>
              </div>
              <div className="space-y-3">
                {TICKETS.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="cursor-pointer rounded-xl border border-transparent p-4 transition-all hover:border-qbit-outline-variant hover:bg-qbit-surface-container-low"
                  >
                    <div className="mb-1.5 flex items-start justify-between">
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide",
                          ticket.priority.variant === "error"
                            ? "text-qbit-error"
                            : "text-qbit-primary",
                        )}
                      >
                        <Icon
                          name={ticket.priorityIcon}
                          className="text-[14px]"
                          filled={ticket.priorityFilled}
                        />
                        {ticket.priority.label}
                      </span>
                      <span className="text-[11px] font-semibold text-qbit-outline">
                        #{ticket.id}
                      </span>
                    </div>
                    <h4 className="mb-2 text-base font-bold text-qbit-on-surface">
                      {ticket.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-qbit-surface-dim text-[10px] font-bold text-qbit-on-surface-variant ring-1 ring-qbit-outline-variant/60">
                          {ticket.initials}
                        </div>
                        <span className="text-[11px] text-qbit-on-surface-variant">
                          {ticket.assignee}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-bold",
                          ticket.status.tone === "warning"
                            ? "bg-qbit-surface-container-highest text-qbit-on-surface-variant"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {ticket.status.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Knowledge Base                                                   */}
        {/* ================================================================ */}
        <section className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-qbit-on-surface">Knowledge Base</h2>
              <p className="text-base text-qbit-on-surface-variant">
                Explore thousands of verified technical articles and community guides.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Icon
                  name="filter_list"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-outline"
                />
                <select
                  value={kbFilter}
                  onChange={(e) =>
                    setKbFilter(e.target.value as (typeof KB_CATEGORIES)[number])
                  }
                  className="cursor-pointer appearance-none rounded-full border border-qbit-outline-variant bg-qbit-surface-container-lowest py-2 pl-11 pr-9 text-sm font-medium text-qbit-on-surface outline-none transition-all hover:border-qbit-primary focus:border-qbit-primary focus:ring-2 focus:ring-qbit-primary/20"
                >
                  {KB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-outline"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {KB_ARTICLES.map((article) => (
              <article
                key={article.id}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-6 transition-all hover:shadow-lg"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <span className="flex items-center gap-1.5 rounded bg-qbit-surface-container-high px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-qbit-on-surface-variant">
                      <Icon name={article.icon} className="text-[14px]" />
                      {article.category}
                    </span>
                    <button
                      type="button"
                      className="text-qbit-outline transition-colors hover:text-qbit-primary"
                      aria-label={article.bookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                      <Icon
                        name="bookmark"
                        className="text-[22px]"
                        filled={article.bookmarked}
                      />
                    </button>
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-qbit-on-surface transition-colors group-hover:text-qbit-primary">
                    {article.title}
                  </h4>
                  <p className="line-clamp-2 text-sm text-qbit-on-surface-variant">
                    {article.excerpt}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4 border-t border-qbit-outline-variant/30 pt-4 text-[11px] font-medium text-qbit-outline">
                  <span className="flex items-center gap-1">
                    <Icon name="schedule" className="text-[16px]" />
                    {article.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="visibility" className="text-[16px]" />
                    {article.views}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <QbitButton
              size="lg"
              iconRight="arrow_forward"
              onClick={() => navigate("ai-support-center")}
            >
              Explore All Articles
            </QbitButton>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Troubleshooting Center                                           */}
        {/* ================================================================ */}
        <TroubleshootingCenterSection />

        {/* ================================================================ */}
        {/* Common Error Codes                                               */}
        {/* ================================================================ */}
        <CommonErrorCodesSection />

        {/* ================================================================ */}
        {/* FAQ Section                                                      */}
        {/* ================================================================ */}
        <FAQSection />

        {/* ================================================================ */}
        {/* Categories Grid                                                  */}
        {/* ================================================================ */}
        <CategoriesGridSection />
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qbit-primary-container">
      <Icon name="smart_toy" className="text-[18px] text-qbit-on-primary" filled />
    </div>
  );
}

function AssistantBubble({
  message,
  onCopy,
  copied,
  onSuggestion,
}: {
  message: AssistantMessage;
  onCopy: () => void;
  copied: boolean;
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex max-w-3xl gap-4">
      <AssistantAvatar />
      <div className="space-y-4">
        {message.type === "greeting" || message.type === "text" ? (
          <div className="rounded-2xl rounded-tl-none border border-qbit-outline-variant/30 bg-qbit-surface-container-low p-4 text-base text-qbit-on-surface">
            {message.content}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl rounded-tl-none border border-qbit-outline-variant/30 bg-qbit-surface-container-low p-4 text-base text-qbit-on-surface shadow-sm">
            <p>
              To resolve the{" "}
              <strong className="font-semibold">{message.title}</strong>, please follow these
              steps:
            </p>
            <ol className="list-inside list-decimal space-y-1 font-medium">
              {message.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="group relative rounded-lg bg-qbit-inverse-surface p-4 font-mono text-sm text-qbit-inverse-on-surface">
              <code id="qbit-diagnostic-code" className="block break-all">
                {message.code}
              </code>
              <button
                type="button"
                onClick={onCopy}
                className="absolute right-3 top-3 flex items-center gap-1 rounded bg-white/10 px-1.5 py-1 text-xs text-qbit-inverse-on-surface opacity-0 backdrop-blur transition-opacity hover:bg-white/20 group-hover:opacity-100"
                aria-label="Copy command"
              >
                <Icon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm">{message.closing}</p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {message.links.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-bold text-qbit-primary hover:underline"
                >
                  <Icon name={link.icon} className="text-[18px]" />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {message.type === "greeting" && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onSuggestion(chip)}
                className="rounded-full border border-qbit-primary bg-qbit-surface-container-lowest px-4 py-1.5 text-sm font-medium text-qbit-primary transition-all hover:bg-qbit-primary hover:text-qbit-on-primary active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="flex max-w-3xl flex-row-reverse gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qbit-primary text-xs font-bold text-qbit-on-primary">
        AM
      </div>
      <div className="rounded-2xl rounded-tr-none bg-qbit-primary px-4 py-3 text-base text-qbit-on-primary shadow-sm">
        {message.content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex max-w-3xl gap-4">
      <AssistantAvatar />
      <div className="rounded-2xl rounded-tl-none border border-qbit-outline-variant/30 bg-qbit-surface-container-low p-4 text-base text-qbit-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-qbit-outline" />
          <span className="ml-1 text-sm italic">typing...</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge Base & Troubleshooting Sections                           */
/* ------------------------------------------------------------------ */

function TroubleshootingCenterSection() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Troubleshooting Center" accentDot />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TROUBLESHOOTING_ISSUES.map((issue) => (
          <TroubleshootingCard key={issue.id} issue={issue} />
        ))}
      </div>
    </section>
  );
}

function CommonErrorCodesSection() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Common Error Codes" accentDot />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMMON_ERRORS.map((error) => (
          <ErrorCodeCard key={error.id} error={error} />
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  return <FAQAccordion faqs={FAQS} searchable />;
}

function CategoriesGridSection() {
  const navigate = useNavigation();
  return (
    <section className="space-y-6">
      <SectionHeader title="Browse by Category" accentDot />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate("installation-center")}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white`}>
              <Icon name={cat.icon} className="text-[20px]" filled />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-qbit-on-surface truncate">{cat.name}</p>
              <p className="text-[10px] text-qbit-on-surface-variant">{cat.articleCount} articles</p>
            </div>
            <Icon name="arrow_forward" className="text-[16px] text-qbit-on-surface-variant group-hover:text-qbit-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </section>
  );
}
