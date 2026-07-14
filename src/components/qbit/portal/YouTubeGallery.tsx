"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicYouTubeVideo } from "@/lib/portal/types";

/**
 * YouTubeGallery — featured video + related videos grid for a product page.
 *
 * REUSES the existing YouTube IFrame embed pattern from the installation
 * module's RelatedVideos component.  Videos are hosted on YouTube only —
 * never uploaded.  Clicking a video opens a modal with the embedded player.
 */
export function YouTubeGallery({ videos }: { videos: PublicYouTubeVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<PublicYouTubeVideo | null>(null);
  const featured = videos.find((v) => v.featured) ?? videos[0];
  const related = videos.filter((v) => v.id !== featured?.id);

  if (videos.length === 0) return null;

  return (
    <>
      <section className="space-y-4">
        <SectionHeader title="Videos" accentDot />

        {/* Featured video */}
        {featured && (
          <button
            onClick={() => setActiveVideo(featured)}
            className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-qbit-outline-variant bg-qbit-surface-container-low text-left"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="play_circle" className="text-[64px] text-white/80 group-hover:scale-110 transition-transform drop-shadow-lg" filled />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-qbit-primary px-2 py-0.5 rounded mb-2">
                Featured
              </span>
              <h4 className="text-lg font-semibold">{featured.title}</h4>
              <span className="text-xs opacity-80 flex items-center gap-1 mt-1">
                <Icon name="schedule" className="text-[14px]" />
                {featured.duration}
              </span>
            </div>
          </button>
        )}

        {/* Related videos */}
        {related.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group text-left rounded-xl overflow-hidden border border-qbit-outline-variant bg-white hover:shadow-md transition-all"
              >
                <div className="relative aspect-video bg-qbit-surface-container-low flex items-center justify-center">
                  <Icon name="play_circle" className="text-[36px] text-qbit-primary/60 group-hover:scale-110 transition-transform" filled />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-qbit-on-surface line-clamp-2">{video.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Open on YouTube link */}
        <a
          href={`https://www.youtube.com/watch?v=${featured?.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-qbit-primary hover:underline"
        >
          <Icon name="open_in_new" className="text-[14px]" />
          Open on YouTube
        </a>
      </section>

      {/* YouTube player modal */}
      <Dialog open={!!activeVideo} onOpenChange={(o) => !o && setActiveVideo(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 bg-black overflow-hidden">
          {activeVideo && (
            <>
              <DialogTitle className="sr-only">{activeVideo.title}</DialogTitle>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
