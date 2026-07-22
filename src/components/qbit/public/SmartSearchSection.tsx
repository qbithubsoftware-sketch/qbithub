"use client";

/**
 * SmartSearchSection — Universal Smart Search Bar for the homepage.
 *
 * SINGLE SOURCE OF TRUTH RULE:
 *   The homepage search bar is ONLY a smart gateway. It collects user input
 *   and routes to the correct destination. It NEVER displays:
 *     - Warranty Card
 *     - Customer Information
 *     - Drivers / Manuals / Firmware / Installation Guide
 *     - Device Registration Information
 *
 *   All of that lives on /dr-qbit (Dr. QBIT Device Lookup page) — the ONLY
 *   page responsible for displaying device information.
 *
 * ROUTING BEHAVIOUR:
 *   Case 1 — Serial Number (SNQBT*, W55-250700152, etc.)
 *     → router.push('/dr-qbit?serial=XXX')
 *     → Dr. QBIT page reads the ?serial= query param, auto-fills the input,
 *       auto-calls the existing Device Lookup API, and displays the result.
 *     → No second search, no second button click, no retyping.
 *
 *   Case 2 — Product Name (e.g. "Windows POS W512")
 *     → Show a small Product Preview Card under the search bar (NOT auto-redirect)
 *     → User clicks "View Product" → /products/<slug>
 *
 *   Case 3 — Driver (e.g. "Windows POS Driver")
 *     → /drivers/<slug>
 *
 *   Case 4 — Manual (e.g. "W512 Manual")
 *     → /manuals/<slug>
 *
 *   Case 5 — Video (e.g. "POS Installation Video")
 *     → /videos?product=<slug>
 *
 *   Case 6 — Firmware
 *     → /downloads?type=firmware&product=<slug>
 *
 *   Case 7 — Knowledge Base / Error / FAQ / Category
 *     → /knowledge-base?article=<slug> | ?error=<code> | ?faq=<id>
 *     → /products?category=<slug>
 *
 * AUTOCOMPLETE:
 *   - 200ms debounce on input
 *   - Live dropdown with categorized suggestions (icon + label + sublabel + type badge)
 *   - Keyboard navigation: ↑↓ arrows, Enter, Escape
 *   - Mobile responsive
 *   - No page reload
 *
 * Inspired by HP Support Assistant, Dell SupportAssist, Lenovo Support,
 * Apple Support, Microsoft Docs.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ====================== Types ======================
interface SmartSuggestion {
  type: "serial" | "product" | "driver" | "manual" | "firmware" | "video" | "kb" | "error" | "category" | "faq";
  label: string;
  sublabel: string;
  icon: string;
  url: string;
  productSlug?: string;
  productId?: string;
}

interface SmartSearchResponse {
  suggestions: SmartSuggestion[];
  serial: boolean;
  totalFound?: number;
}

interface ProductPreview {
  id: string;
  name: string;
  model: string;
  slug: string;
  brand: string;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
  latestDriverVersion: string | null;
  latestFirmwareVersion: string | null;
}

// Serial patterns — kept in sync with backend
// DEMO pattern removed — no fake serial numbers in production
const SERIAL_PATTERNS = [
  /^SNQBT\d+/i,
  /^SN[-_]/i,
  /^SE[-_]/i,
  /^[A-Z0-9]{1,5}[-_]\d{4,}/i,
  /^[A-Z]{1,5}[-_]?\d{6,}/i,
  /^QBT[-_]?\d/i, // QBT-2026-001245 pattern
];

function looksLikeSerial(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 4) return false;
  return SERIAL_PATTERNS.some((re) => re.test(trimmed));
}

const POPULAR_SEARCHES = ["SNQBT000001", "Thermal Printer", "Windows POS", "W512", "Barcode Scanner"];

const SUGGESTION_ICON_COLORS: Record<string, string> = {
  serial: "text-qbit-primary",
  product: "text-qbit-primary",
  driver: "text-qbit-secondary",
  manual: "text-qbit-tertiary",
  firmware: "text-qbit-secondary",
  video: "text-qbit-error",
  kb: "text-qbit-primary",
  error: "text-qbit-error",
  category: "text-qbit-on-surface-variant",
  faq: "text-qbit-tertiary",
};

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  serial: "Device Lookup",
  product: "Product",
  driver: "Driver",
  manual: "Manual",
  firmware: "Firmware",
  video: "Video",
  kb: "Knowledge Base",
  error: "Error Code",
  category: "Category",
  faq: "FAQ",
};

// ====================== Component ======================
export function SmartSearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isSerialInput, setIsSerialInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [productPreview, setProductPreview] = useState<ProductPreview | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // ===== Debounced smart-search =====
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsSerialInput(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/public/smart-search?q=${encodeURIComponent(q)}&limit=8`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      const data: SmartSearchResponse = await res.json();
      setSuggestions(data.suggestions);
      setIsSerialInput(data.serial);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    setProductPreview(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSerialInput(false);
      return;
    }
    setLoading(true);
    setShowDropdown(true);
    setSelectedIndex(-1);
    // 200ms debounce per spec
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 200);
  };

  // ===== Form submit (Enter key or Search button click) =====
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // If a suggestion is highlighted via keyboard, select it instead
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      void selectSuggestion(suggestions[selectedIndex]);
      return;
    }

    // Priority 1: if input looks like serial → REDIRECT to /dr-qbit?serial=XXX
    // The Dr. QBIT page reads the ?serial= query param, auto-fills the input,
    // auto-calls the existing Device Lookup API, and displays the result.
    // No second search, no second button click, no retyping.
    if (looksLikeSerial(trimmed) || isSerialInput) {
      setRedirecting(true);
      setShowDropdown(false);
      router.push(`/dr-qbit?serial=${encodeURIComponent(trimmed)}`);
      return;
    }

    // Priority 2: if first suggestion is a product → show preview card
    const firstProduct = suggestions.find((s) => s.type === "product");
    if (firstProduct?.productSlug) {
      void fetchProductPreview(firstProduct.productSlug);
      return;
    }

    // Priority 3: if any suggestion exists → navigate to first
    if (suggestions.length > 0) {
      void selectSuggestion(suggestions[0]);
      return;
    }

    // No suggestions: fall back to treating as serial → redirect to Dr. QBIT
    setRedirecting(true);
    router.push(`/dr-qbit?serial=${encodeURIComponent(trimmed)}`);
  }

  // ===== Fetch full product detail for the preview card =====
  async function fetchProductPreview(slug: string) {
    setShowDropdown(false);
    setProductPreview(null);
    try {
      const res = await fetch(`/api/public/products/${slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const p = data.product ?? data;
      setProductPreview({
        id: p.id,
        name: p.name,
        model: p.model,
        slug: p.slug,
        brand: p.brand,
        category: p.category,
        imageUrl: p.imageUrl,
        description: p.description,
        latestDriverVersion: p.latestDriverVersion,
        latestFirmwareVersion: p.latestFirmwareVersion,
      });
    } catch {
      // Fallback: navigate to product page directly
      router.push(`/products/${slug}`);
    }
  }

  // ===== Select a suggestion from dropdown =====
  function selectSuggestion(s: SmartSuggestion) {
    setShowDropdown(false);
    setQuery(s.label);

    if (s.type === "serial") {
      // Serial suggestion → redirect to Dr. QBIT with ?serial= query param
      const serialMatch = s.label.match(/:\s*(.+)$/);
      const serial = serialMatch ? serialMatch[1] : s.label;
      setRedirecting(true);
      router.push(`/dr-qbit?serial=${encodeURIComponent(serial)}`);
      return;
    }

    if (s.type === "product" && s.productSlug) {
      // Show Product Preview Card below search (don't redirect immediately)
      void fetchProductPreview(s.productSlug);
      return;
    }

    // All other types → navigate to URL (driver/manual/firmware/video/kb/error/faq/category)
    router.push(s.url);
  }

  // ===== Keyboard navigation =====
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") handleSubmit(e);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  }

  // ===== Click outside to close dropdown =====
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ===== Smooth-scroll product preview into view =====
  useEffect(() => {
    if (!productPreview) return;
    if (!resultRef.current) return;
    const t = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [productPreview]);

  function handleReset() {
    setProductPreview(null);
    setQuery("");
    setRedirecting(false);
    inputRef.current?.focus();
  }

  function fillExample(s: string) {
    setQuery(s);
    setProductPreview(null);
    setRedirecting(false);
    inputRef.current?.focus();
    // Immediately fetch suggestions for the example
    void fetchSuggestions(s);
    setShowDropdown(true);
  }

  return (
    <div className="w-full">
      {/* ===== Search Bar (unchanged design) ===== */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl relative">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[24px] text-qbit-primary pointer-events-none">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search Serial Number, Product, Driver, Manual, Error Code…"
            aria-label="Smart Search"
            aria-expanded={showDropdown}
            aria-controls="smart-search-dropdown"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-qbit-outline-variant bg-white py-4 pl-14 pr-40 text-sm text-qbit-on-surface shadow-lg transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30 md:text-base"
          />
          <button
            type="submit"
            disabled={redirecting}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors disabled:opacity-60"
          >
            {redirecting ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">search</span>
            )}
            {redirecting ? "Redirecting…" : "Search"}
          </button>
        </div>

        {/* ===== Autocomplete Dropdown ===== */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            id="smart-search-dropdown"
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-2xl"
          >
            {loading ? (
              <div className="px-5 py-4 text-sm text-qbit-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin text-qbit-primary">progress_activity</span>
                Searching…
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-5 py-4 text-sm text-qbit-on-surface-variant">
                {query.trim().length < 2 ? "Type at least 2 characters…" : "No matches found. Press Enter to search anyway."}
              </div>
            ) : (
              <ul className="max-h-[400px] overflow-y-auto py-1">
                {suggestions.map((s, i) => (
                  <li key={`${s.type}-${s.label}-${i}`}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        i === selectedIndex ? "bg-qbit-primary/10" : "hover:bg-qbit-surface-container-low"
                      }`}
                      role="option"
                      aria-selected={i === selectedIndex}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${SUGGESTION_ICON_COLORS[s.type] ?? "text-qbit-on-surface-variant"}`}>
                        {s.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-qbit-on-surface">{s.label}</p>
                        <p className="truncate text-[11px] text-qbit-on-surface-variant">{s.sublabel}</p>
                      </div>
                      <span className="rounded-md bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                        {SUGGESTION_TYPE_LABELS[s.type] ?? s.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>

      {/* ===== Quick example chips (Popular searches) ===== */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-qbit-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">trending_up</span>
          Popular:
        </span>
        {POPULAR_SEARCHES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => fillExample(s)}
            className="rounded-md border border-dashed border-qbit-outline-variant bg-white/60 px-2.5 py-1 text-[11px] font-medium text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* ===== Result Area (ONLY Product Preview Card — no serial lookup here) ===== */}
      <div ref={resultRef} className="mx-auto mt-10 max-w-5xl scroll-mt-24">
        {/* Product Preview Card — only shown for product searches.
            Per spec: serial number searches redirect to /dr-qbit, never
            display device info on the homepage. */}
        {productPreview && (
          <ProductPreviewCard product={productPreview} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

// ====================== Product Preview Card ======================
function ProductPreviewCard({
  product,
  onReset,
}: {
  product: ProductPreview;
  onReset: () => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-qbit-primary/30 bg-qbit-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-qbit-primary/15 text-qbit-primary">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <p className="text-sm font-bold text-qbit-on-surface">Product Found</p>
            <p className="text-xs text-qbit-on-surface-variant">
              {product.brand} · Model: <span className="font-mono">{product.model}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          New Search
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-12">
          {/* Image */}
          <div className="sm:col-span-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] text-qbit-primary/40">inventory_2</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="sm:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">{product.brand}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-qbit-on-surface">{product.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Model</p>
                <p className="font-mono font-medium text-qbit-on-surface">{product.model}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Category</p>
                <p className="font-medium text-qbit-on-surface">{product.category?.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—"}</p>
              </div>
              {product.latestDriverVersion && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Latest Driver</p>
                  <p className="font-mono font-medium text-qbit-on-surface">{product.latestDriverVersion}</p>
                </div>
              )}
              {product.latestFirmwareVersion && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Latest Firmware</p>
                  <p className="font-mono font-medium text-qbit-on-surface">{product.latestFirmwareVersion}</p>
                </div>
              )}
            </div>

            {product.description && (
              <p className="mt-3 text-sm text-qbit-on-surface-variant line-clamp-3">{product.description}</p>
            )}

            {/* Quick action buttons — primary CTA is "View Product" */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-4 py-2 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                View Product
              </Link>
              <Link
                href={`/drivers/${product.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">memory</span>
                Download Drivers
              </Link>
              <Link
                href={`/manuals/${product.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Manuals
              </Link>
              <Link
                href={`/products/${product.slug}#specifications`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                Specifications
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
