"use client";

/**
 * EngineerCard — displays assigned engineer with photo, name, phone, ETA.
 *
 * Reuses SurfaceCard + Icon primitives.
 * Shows masked phone for privacy — customer can call via the action button.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";

interface EngineerCardProps {
  name: string | null;
  initials: string | null;
  photoUrl: string | null;
  phone: string | null;
  scheduledTime: string | null;
  scheduledDate: string;
  status: string;
}

export function EngineerCard({
  name,
  initials,
  photoUrl,
  phone,
  scheduledTime,
  scheduledDate,
  status,
}: EngineerCardProps) {
  if (!name) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-3 text-qbit-on-surface-variant">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qbit-surface-container-high">
            <Icon name="person_off" className="text-[24px]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Engineer not yet assigned</p>
            <p className="text-xs">You'll be notified once an engineer is assigned.</p>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  const isOnTheWay = status === "on_the_way";
  const hasArrived = status === "arrived" || status === "installing" || status === "testing";

  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
          Your Engineer
        </p>
        {isOnTheWay && (
          <StatusBadge variant="primary" dot>
            On the way
          </StatusBadge>
        )}
        {hasArrived && (
          <StatusBadge variant="success" dot>
            Arrived
          </StatusBadge>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="h-16 w-16 rounded-full border-2 border-qbit-primary/30 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-qbit-primary-container text-lg font-bold text-qbit-on-primary-container">
            {initials ?? "?"}
          </div>
        )}

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-qbit-on-surface">{name}</p>
          <p className="text-xs text-qbit-on-surface-variant">QBIT Installation Engineer</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-qbit-on-surface-variant">
            <Icon name="schedule" className="text-[14px]" />
            <span>
              {hasArrived
                ? "On site"
                : isOnTheWay
                  ? "ETA shortly"
                  : `Scheduled: ${new Date(scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at ${scheduledTime ?? "TBD"}`}
            </span>
          </div>
        </div>
      </div>

      {/* Call + WhatsApp actions */}
      {phone && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-qbit-primary px-3 py-2 text-sm font-semibold text-qbit-on-primary transition-colors hover:bg-qbit-primary/90"
          >
            <Icon name="call" className="text-[16px]" />
            Call
          </a>
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello ${name}, I have a question about my QBIT installation.`,
            )}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Icon name="chat" className="text-[16px]" />
            WhatsApp
          </a>
        </div>
      )}
    </SurfaceCard>
  );
}
