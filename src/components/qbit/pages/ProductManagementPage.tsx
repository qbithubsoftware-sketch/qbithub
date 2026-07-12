"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { BulkActionToolbar } from "@/components/qbit/admin/BulkActionToolbar";
import { AssetManager } from "@/components/qbit/admin/AssetManager";
import { ADMIN_ASSETS } from "@/lib/admin/placeholder-data";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type CategoryVariant = "secondary-fixed" | "tertiary-fixed" | "neutral";
type StatusVariant = "active" | "archived";

interface ProductRow {
  id: string;
  name: string;
  subtitle: string;
  model: string;
  category: string;
  categoryVariant: CategoryVariant;
  status: StatusVariant;
  lastUpdated: string;
  imageGradient: string;
  imageIcon: string;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from product_management design HTML       */
/* ------------------------------------------------------------------ */

const PRODUCTS: ProductRow[] = [
  {
    id: "qbit-t800",
    name: "QBIT T-800",
    subtitle: "Flagship Enterprise POS",
    model: "T800-ENT-2024",
    category: "Windows POS",
    categoryVariant: "secondary-fixed",
    status: "active",
    lastUpdated: "Oct 24, 2023",
    imageGradient: "from-qbit-primary to-qbit-secondary",
    imageIcon: "point_of_sale",
  },
  {
    id: "scanpro-m10",
    name: "ScanPro M-10",
    subtitle: "Industrial Handheld",
    model: "SPM-10-MOB",
    category: "Android Device",
    categoryVariant: "tertiary-fixed",
    status: "active",
    lastUpdated: "Nov 02, 2023",
    imageGradient: "from-emerald-500 to-emerald-700",
    imageIcon: "barcode_scanner",
  },
  {
    id: "printx-g5",
    name: "PrintX G-5",
    subtitle: "Legacy Thermal Printer",
    model: "PXG5-LEGACY",
    category: "Accessories",
    categoryVariant: "neutral",
    status: "archived",
    lastUpdated: "Aug 12, 2023",
    imageGradient: "from-qbit-tertiary to-qbit-tertiary-container",
    imageIcon: "print",
  },
];

const CATEGORY_CLASS: Record<CategoryVariant, string> = {
  "secondary-fixed": "bg-qbit-secondary-fixed text-qbit-on-secondary-fixed-variant",
  "tertiary-fixed": "bg-qbit-tertiary-fixed text-qbit-on-tertiary-fixed-variant",
  neutral: "bg-qbit-surface-container-highest text-qbit-outline",
};

const STATUS_LABEL: Record<StatusVariant, string> = {
  active: "Active",
  archived: "Archived",
};

const STATUS_TEXT_BG: Record<StatusVariant, string> = {
  active: "text-emerald-600 bg-emerald-600/10",
  archived: "text-qbit-outline bg-qbit-outline/10",
};

const STATUS_DOT_BG: Record<StatusVariant, string> = {
  active: "bg-emerald-600",
  archived: "bg-qbit-outline",
};

const PAGE_TOKENS: ReadonlyArray<number | "ellipsis"> = [1, 2, 3, "ellipsis", 52];
const LAST_PAGE = 52;

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function ProductManagementPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const allSelected = PRODUCTS.length > 0 && selected.size === PRODUCTS.length;
  const someSelected = selected.size > 0 && !allSelected;
  const selectedCount = selected.size;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(PRODUCTS.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="product-management"
      user={{ name: "Admin User", role: "Super Administrator", initials: "AU" }}
      topBar={{
        searchPlaceholder: "Search catalog, serials, or models...",
        user: { name: "Admin User", role: "Super Administrator", initials: "AU" },
      }}
    >
      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------------------ */}
        {/* 1. Page Header with Primary Action                           */}
        {/* ------------------------------------------------------------ */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="mb-2 flex items-center text-xs text-qbit-on-surface-variant"
            >
              <span>Inventory</span>
              <Icon name="chevron_right" className="mx-1 text-[14px]" />
              <span className="font-bold text-qbit-primary">Products</span>
            </nav>
            <h2 className="text-2xl font-semibold tracking-tight text-qbit-on-surface">
              Product Management
            </h2>
          </div>
          <QbitButton variant="primary" icon="add" size="lg">
            Add Product
          </QbitButton>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* 2. Stats Overview (4-col desktop / 2-col tablet)             */}
        {/* ------------------------------------------------------------ */}
        <section
          aria-label="Catalog statistics"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <KpiCard
            label="Total SKU"
            value="1,284"
            icon="trending_up"
            delta="+12% vs last month"
            deltaVariant="up"
          />
          <KpiCard
            label="Active Items"
            value="1,042"
            icon="check_circle"
            delta="81% operation rate"
            deltaVariant="neutral"
            iconBg="bg-emerald-100 text-emerald-700"
          />
          <KpiCard
            label="Archived"
            value="242"
            icon="archive"
            delta="14 new this week"
            deltaVariant="neutral"
            iconBg="bg-amber-100 text-amber-700"
          />
          <KpiCard
            label="System Health"
            value="99.9%"
            icon="health_and_safety"
            delta="Synchronized"
            deltaVariant="up"
            iconBg="bg-qbit-primary/10 text-qbit-primary"
          />
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 3. Bulk Actions Bar (slides in on selection)                 */}
        {/* ------------------------------------------------------------ */}
        <div
          aria-hidden={selectedCount === 0}
          className={cn(
            "glass-card flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 transition-all duration-300",
            selectedCount > 0
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <div className="flex items-center text-sm font-bold text-qbit-primary">
            <span className="mr-2 rounded bg-qbit-primary px-1.5 py-0.5 text-xs text-qbit-on-primary">
              {selectedCount}
            </span>
            <span>items selected</span>
          </div>
          <div className="flex items-center gap-2">
            <QbitButton
              variant="outline"
              size="sm"
              icon="delete"
              className="border-qbit-error text-qbit-error hover:bg-qbit-error-container/20"
            >
              Bulk Delete
            </QbitButton>
            <QbitButton
              variant="surface"
              size="sm"
              icon="file_download"
              className="bg-qbit-surface-container-high hover:bg-qbit-surface-variant"
            >
              Export CSV
            </QbitButton>
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear selection"
              className="flex h-8 w-8 items-center justify-center rounded-full text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 4. Products Table                                            */}
        {/* ------------------------------------------------------------ */}
        <div className="overflow-hidden rounded-xl border border-qbit-outline-variant bg-white shadow-sm">
          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-qbit-outline-variant bg-qbit-surface-container-low hover:bg-qbit-surface-container-low">
                  <TableHead className="w-12 pl-4">
                    <Checkbox
                      checked={
                        allSelected ? true : someSelected ? "indeterminate" : false
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Select all products"
                      className="border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
                    />
                  </TableHead>
                  <TableHead className="w-16 px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Image
                  </TableHead>
                  <TableHead className="px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Product Name
                  </TableHead>
                  <TableHead className="px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Model Number
                  </TableHead>
                  <TableHead className="px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Category
                  </TableHead>
                  <TableHead className="px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Status
                  </TableHead>
                  <TableHead className="px-2 py-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Last Updated
                  </TableHead>
                  <TableHead className="px-2 py-4 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRODUCTS.map((product) => {
                  const isSelected = selected.has(product.id);
                  return (
                    <TableRow
                      key={product.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "group h-[72px] border-b border-qbit-surface-container-low transition-colors hover:bg-qbit-surface-container-lowest",
                        isSelected && "bg-qbit-surface-container-lowest",
                      )}
                    >
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(product.id)}
                          aria-label={`Select ${product.name}`}
                          className="border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br",
                            product.imageGradient,
                          )}
                        >
                          <Icon
                            name={product.imageIcon}
                            className="text-[22px] text-white"
                            filled
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <div className="font-bold text-qbit-on-surface">
                          {product.name}
                        </div>
                        <div className="text-xs text-qbit-on-surface-variant">
                          {product.subtitle}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 font-mono text-sm text-qbit-on-surface-variant">
                        {product.model}
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            CATEGORY_CLASS[product.categoryVariant],
                          )}
                        >
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest",
                            STATUS_TEXT_BG[product.status],
                          )}
                        >
                          <span
                            className={cn(
                              "mr-1.5 h-1.5 w-1.5 rounded-full",
                              STATUS_DOT_BG[product.status],
                            )}
                          />
                          {STATUS_LABEL[product.status]}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-sm text-qbit-on-surface-variant">
                        {product.lastUpdated}
                      </TableCell>
                      <TableCell className="px-2 py-3 pr-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label={`View ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-primary transition-colors hover:bg-qbit-primary-container/10"
                          >
                            <Icon name="visibility" className="text-[20px]" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
                          >
                            <Icon name="edit" className="text-[20px]" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-error transition-colors hover:bg-qbit-error-container/20"
                          >
                            <Icon name="delete" className="text-[20px]" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* 5. Pagination                                              */}
          {/* ---------------------------------------------------------- */}
          <div className="flex flex-col gap-3 border-t border-qbit-outline-variant bg-qbit-surface-container-low px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-qbit-on-surface-variant">
              Showing{" "}
              <span className="font-bold text-qbit-on-surface">1 - 25</span> of{" "}
              <span className="font-bold text-qbit-on-surface">1,284</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-all hover:bg-qbit-surface-container-high disabled:opacity-30 disabled:pointer-events-none"
              >
                <Icon name="first_page" className="text-[20px]" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-all hover:bg-qbit-surface-container-high disabled:opacity-30 disabled:pointer-events-none"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              <div className="flex items-center gap-1">
                {PAGE_TOKENS.map((token, idx) =>
                  token === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex h-8 items-center px-1 text-sm text-qbit-on-surface-variant"
                      aria-hidden="true"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${token}`}
                      type="button"
                      onClick={() => setCurrentPage(token)}
                      aria-label={`Page ${token}`}
                      aria-current={currentPage === token ? "page" : undefined}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all",
                        currentPage === token
                          ? "bg-qbit-primary font-bold text-qbit-on-primary shadow-sm"
                          : "font-medium text-qbit-on-surface hover:bg-qbit-surface-container-high",
                      )}
                    >
                      {token}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(LAST_PAGE, p + 1))}
                disabled={currentPage === LAST_PAGE}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-all hover:bg-qbit-surface-container-high disabled:opacity-30 disabled:pointer-events-none"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(LAST_PAGE)}
                disabled={currentPage === LAST_PAGE}
                aria-label="Last page"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-all hover:bg-qbit-surface-container-high disabled:opacity-30 disabled:pointer-events-none"
              >
                <Icon name="last_page" className="text-[20px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Extended: Unified Asset Manager                              */}
        {/* ------------------------------------------------------------ */}
        <AssetManager assets={ADMIN_ASSETS} />
      </div>
    </AppShell>
  );
}
