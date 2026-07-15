/**
 * /videos — public video center.
 *
 * Embeds YouTube videos grouped by category: Installation, Training, Troubleshooting.
 * No login required.
 */

import { db } from "@/lib/db";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { PublicVideosClient } from "@/components/qbit/public/PublicVideosClient";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  // Fetch videos from the existing MediaFile table (type='video') across all products
  const videoMedia = await db.productMedia.findMany({
    where: { type: "video" },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Also fetch any videos stored on the QbitProduct.videos JSON field
  const productsWithVideos = await db.qbitProduct.findMany({
    where: { isActive: true, videos: { not: null } },
    select: { id: true, name: true, slug: true, videos: true },
    take: 30,
  });

  // Merge: dedupe by URL
  const allVideos: Array<{
    title: string;
    url: string;
    provider: string | null;
    externalId: string | null;
    productSlug: string | null;
    productName: string | null;
  }> = [];

  for (const m of videoMedia) {
    allVideos.push({
      title: m.title,
      url: m.url,
      provider: m.provider,
      externalId: m.externalId,
      productSlug: m.product?.slug ?? null,
      productName: m.product?.name ?? null,
    });
  }

  for (const p of productsWithVideos) {
    if (!p.videos) continue;
    try {
      const parsed = JSON.parse(p.videos) as Array<{ title: string; url: string; provider?: string; externalId?: string }>;
      for (const v of parsed) {
        if (!allVideos.some((av) => av.url === v.url)) {
          allVideos.push({
            title: v.title,
            url: v.url,
            provider: v.provider ?? null,
            externalId: v.externalId ?? null,
            productSlug: p.slug,
            productName: p.name,
          });
        }
      }
    } catch { /* ignore malformed JSON */ }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-error/10 px-3 py-1 text-xs font-semibold text-qbit-error mb-3">
            <span className="material-symbols-outlined text-[14px]">videocam</span>
            Video Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">Videos</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Installation walkthroughs, training sessions, and troubleshooting guides.
          </p>
        </div>

        <PublicVideosClient videos={allVideos} />
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Videos — QBIT Hub",
    description: "Installation, training, and troubleshooting videos for QBIT hardware.",
  };
}
