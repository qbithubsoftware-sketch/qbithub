"use client";

/**
 * WarrantyCard — displays warranty status + remaining days.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, ProgressTracker.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import {
  type PassportDTO,
  WARRANTY_STATUS_VARIANTS,
} from "@/lib/passport/types";

interface WarrantyCardProps {
  passport: PassportDTO;
}

export function WarrantyCard({ passport }: WarrantyCardProps) {
  const warranty = passport.warranty;
  if (!warranty) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-3 text-qbit-on-surface-variant">
          <Icon name="info" className="text-[20px]" />
          <p className="text-sm">Warranty information not available.</p>
        </div>
      </SurfaceCard>
    );
  }

  const isActive = warranty.warrantyStatus === "active";
  const daysRemaining = warranty.warrantyDaysRemaining ?? 0;
  const totalDays = 365; // standard 1-year warranty
  const usedDays = Math.max(0, totalDays - daysRemaining);
  const percent = isActive ? Math.round((daysRemaining / totalDays) * 100) : 0;

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="verified_user" className="text-[20px] text-qbit-primary" filled />
          <h3 className="text-sm font-semibold text-qbit-on-surface">Warranty</h3>
        </div>
        <StatusBadge variant={WARRANTY_STATUS_VARIANTS[warranty.warrantyStatus]} dot>
          {warranty.warrantyStatus.charAt(0).toUpperCase() + warranty.warrantyStatus.slice(1)}
        </StatusBadge>
      </div>

      {/* Days remaining (big display) */}
      {isActive && daysRemaining > 0 && (
        <div className="mb-4 text-center">
          <p className="text-3xl font-bold text-qbit-primary">{daysRemaining}</p>
          <p className="text-xs text-qbit-on-surface-variant">days remaining</p>
        </div>
      )}

      {/* Progress bar (active warranty only) */}
      {isActive && (
        <ProgressTracker
          value={percent}
          variant={percent > 30 ? "success" : "warning"}
          showPercentage={false}
          label={`${usedDays} days used of ${totalDays}`}
        />
      )}

      {/* Warranty details */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-qbit-outline-variant/50 pt-3 text-sm">
        {warranty.purchaseDate && (
          <Detail label="Purchase Date" value={new Date(warranty.purchaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
        )}
        {warranty.warrantyStartDate && (
          <Detail label="Start Date" value={new Date(warranty.warrantyStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
        )}
        {warranty.warrantyExpiryDate && (
          <Detail label="Expiry Date" value={new Date(warranty.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
        )}
        {warranty.warrantyProvider && (
          <Detail label="Provider" value={warranty.warrantyProvider} />
        )}
      </div>

      {/* Extended warranty */}
      {warranty.extendedWarranty && warranty.extendedExpiryDate && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-qbit-primary/5 px-3 py-2">
          <Icon name="shield" className="text-[16px] text-qbit-primary" filled />
          <span className="text-xs font-medium text-qbit-primary">
            Extended warranty until {new Date(warranty.extendedExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      )}

      {/* Out of warranty */}
      {warranty.warrantyStatus === "expired" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-qbit-error/5 px-3 py-2">
          <Icon name="error" className="text-[16px] text-qbit-error" filled />
          <span className="text-xs font-medium text-qbit-error">
            Out of warranty — expired {Math.abs(daysRemaining)} days ago
          </span>
        </div>
      )}
    </SurfaceCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
      <p className="text-sm font-medium text-qbit-on-surface">{value}</p>
    </div>
  );
}
