"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { Pill } from "@/components/qbit/primitives/GlassCard";
import { useNavigation } from "@/lib/navigation/store";
import { INSTALCORE_NAV } from "@/lib/navigation/nav-config";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Difficulty = "Beginner" | "Expert";

interface CategoryChip {
  id: string;
  label: string;
  icon?: string;
}

interface VideoCardData {
  id: string;
  category: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  icon: string;
  /** Tailwind gradient classes for the thumbnail cover. */
  gradient: string;
  /** Foreground tint for the decorative Material icon. */
  iconTint: string;
}

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */

const CATEGORIES: CategoryChip[] = [
  { id: "all", label: "All Videos" },
  { id: "installation", label: "Installation", icon: "construction" },
  { id: "setup", label: "Setup", icon: "settings_suggest" },
  { id: "troubleshooting", label: "Troubleshooting", icon: "build" },
  { id: "maintenance", label: "Maintenance", icon: "verified" },
];

const VIDEOS: VideoCardData[] = [
  {
    id: "v1",
    category: "QBIT Hub Pro",
    title: "Physical Hardware Installation",
    duration: "12:45",
    difficulty: "Beginner",
    icon: "router",
    gradient: "from-qbit-primary to-qbit-primary-container",
    iconTint: "text-white/90",
  },
  {
    id: "v2",
    category: "Core Gateway",
    title: "SSH Protocol Troubleshooting",
    duration: "08:20",
    difficulty: "Expert",
    icon: "dns",
    gradient: "from-qbit-tertiary to-qbit-tertiary-container",
    iconTint: "text-white/90",
  },
  {
    id: "v3",
    category: "QBIT Mini",
    title: "Initial Device Pairing",
    duration: "05:15",
    difficulty: "Beginner",
    icon: "sensors",
    gradient: "from-qbit-secondary to-qbit-secondary-container",
    iconTint: "text-white/90",
  },
  {
    id: "v4",
    category: "Cooling Units",
    title: "Quarterly Filter Replacement",
    duration: "15:50",
    difficulty: "Beginner",
    icon: "ac_unit",
    gradient: "from-sky-500 to-qbit-primary",
    iconTint: "text-white/90",
  },
  {
    id: "v5",
    category: "Security Edge",
    title: "Firewall Rule Orchestration",
    duration: "22:10",
    difficulty: "Expert",
    icon: "security",
    gradient: "from-qbit-error to-qbit-primary-container",
    iconTint: "text-white/90",
  },
  {
    id: "v6",
    category: "Mobile App",
    title: "Field Technician App Setup",
    duration: "06:30",
    difficulty: "Beginner",
    icon: "phone_android",
    gradient: "from-emerald-500 to-qbit-secondary",
    iconTint: "text-white/90",
  },
];

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function FeaturedHero() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-qbit-primary-container min-h-[420px] flex items-center group">
      {/* Decorative background shader */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.18), transparent 50%)",
        }}
      />

      <div className="relative z-10 grid md:grid-cols-2 gap-8 p-6 md:p-8 lg:p-12 w-full">
        {/* Left column — copy */}
        <div className="flex flex-col justify-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md w-fit mb-4">
            <Icon name="star" filled className="text-[16px]" />
            <span className="text-[12px] font-semibold uppercase tracking-widest">
              Featured Training
            </span>
          </div>

          <h2 className="text-[36px] leading-[44px] font-bold tracking-tight mb-4">
            Advanced Network Configuration 2.0
          </h2>

          <p className="text-[18px] leading-[28px] text-qbit-on-primary-container mb-6 max-w-md">
            Master complex VLAN tagging, priority queuing, and edge security
            protocols for the newest QBIT Hub enterprise firmware.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-qbit-primary rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Icon name="play_circle" filled className="text-[20px]" />
              Start Learning
            </button>
            <div className="inline-flex items-center gap-2 text-white/80 text-[14px] font-medium">
              <Icon name="schedule" className="text-[18px]" />
              48m Duration
            </div>
          </div>
        </div>

        {/* Right column — video thumbnail */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 group-hover:scale-[1.02] transition-transform duration-500">
            {/* Thumbnail gradient cover */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-qbit-primary via-qbit-secondary to-qbit-primary-container"
            />
            {/* Decorative Material icon */}
            <Icon
              name="settings_ethernet"
              filled
              className="absolute right-6 bottom-4 text-[120px] text-white/15 leading-none select-none"
            />
            <Icon
              name="hub"
              filled
              className="absolute left-6 top-4 text-[64px] text-white/25 leading-none select-none"
            />

            {/* Dark scrim */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                type="button"
                aria-label="Play featured video"
                className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-xl border border-white/50 flex items-center justify-center cursor-pointer hover:bg-white/50 hover:scale-105 transition-all"
              >
                <Icon
                  name="play_arrow"
                  filled
                  className="text-white text-[40px]"
                />
              </button>
            </div>

            {/* Duration chip */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
              48:00
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryFilter({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="mb-8">
      <div className="hide-scrollbar overflow-x-auto pb-3">
        <div className="flex items-center gap-3 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={
                  "inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all " +
                  (isActive
                    ? "bg-qbit-primary text-qbit-on-primary shadow-md shadow-qbit-primary/20"
                    : "bg-qbit-surface-container hover:bg-qbit-surface-container-high text-qbit-on-surface-variant")
                }
              >
                {cat.icon && (
                  <Icon
                    name={cat.icon}
                    className="text-[18px]"
                    filled={isActive}
                  />
                )}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VideoCard({ data }: { data: VideoCardData }) {
  const difficultyClass =
    data.difficulty === "Beginner"
      ? "bg-green-500/90 text-white"
      : "bg-amber-500/90 text-white";

  return (
    <article className="group bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-qbit-primary/5 hover:-translate-y-0.5 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {/* Gradient cover */}
        <div
          aria-hidden
          className={`absolute inset-0 bg-gradient-to-br ${data.gradient}`}
        />
        {/* Decorative Material icon */}
        <Icon
          name={data.icon}
          filled
          className="absolute inset-0 m-auto text-[72px] text-white/25 leading-none select-none transition-transform duration-500 group-hover:scale-110"
        />

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
          {data.duration}
        </div>

        {/* Difficulty badge */}
        <div
          className={`absolute top-2 left-2 px-3 py-1 ${difficultyClass} text-[10px] font-bold rounded-full uppercase tracking-tight`}
        >
          {data.difficulty}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-qbit-primary text-[12px] font-semibold uppercase tracking-wide mb-1">
          {data.category}
        </p>
        <h3 className="text-[20px] leading-7 font-semibold line-clamp-1 mb-3 group-hover:text-qbit-primary transition-colors">
          {data.title}
        </h3>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <ActionIcon icon="bookmark" label="Bookmark" />
            <ActionIcon icon="share" label="Share" />
            <ActionIcon icon="download" label="Download Offline" />
          </div>
          <Icon
            name="arrow_forward"
            className="text-[20px] text-qbit-outline group-hover:text-qbit-primary transition-all translate-x-0 group-hover:translate-x-1"
          />
        </div>
      </div>
    </article>
  );
}

function ActionIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-qbit-surface hover:bg-qbit-primary-container hover:text-qbit-on-primary-container text-qbit-on-surface-variant flex items-center justify-center transition-all"
    >
      <Icon name={icon} className="text-[20px]" />
    </button>
  );
}

function UploadFab() {
  return (
    <button
      type="button"
      title="Upload Training Video"
      aria-label="Upload Training Video"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-qbit-primary text-qbit-on-primary rounded-full shadow-2xl shadow-qbit-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
    >
      <Icon name="add" className="text-[28px]" filled />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export function VideoTrainingCenterPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  return (
    <AppShell
      variant="instalcore"
      brand={{ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }}
      navItems={INSTALCORE_NAV}
      activeScreen="video-training-center"
      user={{
        name: "Engineer Alpha",
        role: "Tier 3 Certified",
        initials: "EA",
      }}
      topBar={{
        searchPlaceholder: "Search training, products, or videos...",
        user: {
          name: "Engineer Alpha",
          role: "Tier 3 Certified",
          initials: "EA",
        },
        onSearchFocus: () => navigate("universal-search-command-center"),
      }}
    >
      {/* Featured Hero */}
      <FeaturedHero />

      {/* Category Filter */}
      <CategoryFilter
        activeId={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Section heading */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <Pill icon="video_library" className="mb-2">
            Training Library
          </Pill>
          <h2 className="text-[24px] leading-8 font-semibold text-qbit-on-surface">
            All Training Videos
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-qbit-on-surface-variant">
          {VIDEOS.length} videos available
        </p>
      </div>

      {/* Video Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {VIDEOS.map((video) => (
          <VideoCard key={video.id} data={video} />
        ))}
      </section>

      {/* Floating Action Button */}
      <UploadFab />
    </AppShell>
  );
}
