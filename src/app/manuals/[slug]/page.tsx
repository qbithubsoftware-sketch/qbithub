/**
 * /manuals/[slug] — public product-specific manuals page.
 *
 * Shows all public manuals + installation guides + quick start guides for a
 * specific product (matched by slug). Reached from the homepage Smart Search
 * when user types "<product> manual" or clicks the "Manual for <model>"
 * suggestion.
 *
 * No login required. Only public resources (visibility = "public") shown.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";

export const dynamic = "force-dynamic";

export default async function ProductManualsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await db.qbitProduct.findUnique({
    where: { slug },
    select: {
      id: true, name: true, brand: true, model: true, slug: true,
      category: true, imageUrl: true, description: true,
      manualUrl: true, installationGuideUrl: true,
      installationInstructions: true, installationTime: true, difficultyLevel: true,
      mediaFiles: {
        where: {
          visibility: "public",
          type: { in: ["manual"] },
        },
        orderBy: { sortIndex: "asc" },
      },
    },
  });

  if (!product) notFound();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-qbit-on-surface-variant">
          <Link href="/downloads" className="hover:text-qbit-primary">Downloads</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-qbit-on-surface">{product.name} Manuals</span>
        </div>

        {/* Product header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-qbit-primary/40">menu_book</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">{product.brand}</p>
            <h1 className="text-2xl font-bold tracking-tight text-qbit-on-surface md:text-3xl">
              Manuals for {product.name}
            </h1>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Model: <span className="font-mono">{product.model}</span>
            </p>
          </div>
        </div>

        {/* Manuals list */}
        <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
          <div className="border-b border-qbit-outline-variant/50 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">Available Documents</h2>
            <p className="text-[11px] text-qbit-on-surface-variant">User manuals, installation guides, quick start guides</p>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {/* Primary user manual */}
              {product.manualUrl && (
                <a
                  href={product.manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-qbit-primary/30 bg-qbit-primary/5 p-4 transition-all hover:border-qbit-primary hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                    <span className="material-symbols-outlined text-[24px]">menu_book</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-qbit-on-surface">User Manual</p>
                    <p className="text-xs text-qbit-on-surface-variant">Complete user guide (PDF)</p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-qbit-primary">download</span>
                </a>
              )}

              {/* Installation guide */}
              {product.installationGuideUrl && (
                <a
                  href={product.installationGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/30 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-qbit-tertiary/10 text-qbit-tertiary">
                    <span className="material-symbols-outlined text-[24px]">build</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-qbit-on-surface">Installation Guide</p>
                    <p className="text-xs text-qbit-on-surface-variant">
                      Step-by-step installation instructions
                      {product.installationTime && ` · ${product.installationTime}`}
                      {product.difficultyLevel && ` · ${product.difficultyLevel}`}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-qbit-on-surface-variant">download</span>
                </a>
              )}

              {/* Media-file manuals (Installation Guide, Quick Start Guide, etc.) */}
              {product.mediaFiles.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/30 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-tertiary/10 text-qbit-tertiary">
                    <span className="material-symbols-outlined text-[20px]">article</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-qbit-on-surface">{m.title}</p>
                    <p className="text-xs text-qbit-on-surface-variant">PDF document</p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-qbit-on-surface-variant">download</span>
                </a>
              ))}
            </div>

            {/* Empty state */}
            {!product.manualUrl && !product.installationGuideUrl && product.mediaFiles.length === 0 && (
              <div className="rounded-xl border border-dashed border-qbit-outline-variant p-8 text-center">
                <span className="material-symbols-outlined mx-auto text-[40px] text-qbit-on-surface-variant/40">menu_book</span>
                <p className="mt-2 text-sm font-medium text-qbit-on-surface">No manuals available yet.</p>
                <p className="mt-1 text-xs text-qbit-on-surface-variant">
                  Please check back later or <Link href="/support" className="text-qbit-primary hover:underline">contact QBIT Support</Link>.
                </p>
              </div>
            )}

            {/* Installation instructions inline */}
            {product.installationInstructions && (
              <div className="mt-6 rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Quick Installation Notes</p>
                <p className="whitespace-pre-line text-xs text-qbit-on-surface-variant">{product.installationInstructions}</p>
              </div>
            )}
          </div>
        </section>

        {/* Related links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            View Product Details
          </Link>
          <Link
            href={`/drivers/${product.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">memory</span>
            Drivers
          </Link>
          <Link
            href="/downloads"
            className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            All Downloads
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.qbitProduct.findUnique({ where: { slug }, select: { name: true, model: true } });
  if (!product) return { title: "Manuals — QBIT Hub" };
  return {
    title: `Manuals for ${product.name} — QBIT Hub`,
    description: `Download user manuals and installation guides for ${product.name} (Model: ${product.model}).`,
  };
}
