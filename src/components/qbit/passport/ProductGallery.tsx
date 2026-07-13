"use client";

/**
 * ProductGallery — product images + media (future: 360, exploded view).
 *
 * Reuses SurfaceCard, Icon.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { type PassportDTO } from "@/lib/passport/types";
import { DEVICE_TYPE_ICONS } from "@/lib/drqbit/types";

interface ProductGalleryProps {
  passport: PassportDTO;
}

export function ProductGallery({ passport }: ProductGalleryProps) {
  const deviceType = passport.product?.deviceType ?? "unknown";
  const deviceIcon = DEVICE_TYPE_ICONS[deviceType as never] ?? "inventory_2";

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="photo_library" className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">Product Gallery</h3>
      </div>

      {/* Main image placeholder (product image would come from MediaFile in production) */}
      <div className="flex aspect-video items-center justify-center rounded-lg bg-qbit-surface-container-low">
        <div className="text-center">
          <Icon name={deviceIcon} className="mx-auto text-[64px] text-qbit-primary/30" filled />
          <p className="mt-2 text-xs text-qbit-on-surface-variant">
            {passport.product?.name ?? passport.deviceName ?? "Product Image"}
          </p>
        </div>
      </div>

      {/* Thumbnail row (placeholder — in production, would show actual product images) */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-md bg-qbit-surface-container-low"
          >
            <Icon name="image" className="text-[20px] text-qbit-on-surface-variant/30" />
          </div>
        ))}
      </div>

      {/* Future-ready features */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-qbit-outline-variant/50 pt-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-medium text-qbit-on-surface-variant">
          <Icon name="3d_rotation" className="text-[12px]" />
          360° Images (Coming Soon)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-medium text-qbit-on-surface-variant">
          <Icon name="view_in_ar" className="text-[12px]" />
          Exploded View (Coming Soon)
        </span>
      </div>
    </SurfaceCard>
  );
}
