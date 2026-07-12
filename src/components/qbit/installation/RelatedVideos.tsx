"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RelatedVideo } from "@/lib/installation/types";

/**
 * RelatedVideos — grid of YouTube video thumbnails.  Clicking a thumbnail
 * opens a modal with the embedded YouTube player.
 *
 * Videos are hosted on YouTube only — never uploaded.  This component
 * only stores YouTube IDs and embeds the official YouTube IFrame player.
 */
export function RelatedVideos({ videos }: { videos: RelatedVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<RelatedVideo | null>(null);

  if (videos.length === 0) return null;

  return (
    <>
      <section>
        <SectionHeader title="Related Videos" accentDot />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="group text-left rounded-xl overflow-hidden border border-qbit-outline-variant bg-qbit-surface-container-lowest hover:shadow-lg transition-all"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-qbit-surface-container-low flex items-center justify-center">
                <Icon name="play_circle" className="text-[48px] text-qbit-primary/60 group-hover:scale-110 transition-transform" filled />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>
              {/* Title */}
              <div className="p-3">
                <p className="text-sm font-semibold text-qbit-on-surface line-clamp-2">{video.title}</p>
                <p className="text-[10px] text-qbit-on-surface-variant mt-1 flex items-center gap-1">
                  <Icon name="play_circle" className="text-[12px]" />
                  YouTube
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* YouTube player modal */}
      <Dialog open={!!activeVideo} onOpenChange={(o) => !o && setActiveVideo(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 bg-qbit-surface-container-lowest overflow-hidden">
          {activeVideo && (
            <>
              <DialogTitle className="sr-only">{activeVideo.title}</DialogTitle>
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-qbit-on-surface">{activeVideo.title}</p>
                  <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                    Duration: {activeVideo.duration}
                  </p>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-qbit-primary hover:underline"
                >
                  <Icon name="open_in_new" className="text-[14px]" />
                  Open on YouTube
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
