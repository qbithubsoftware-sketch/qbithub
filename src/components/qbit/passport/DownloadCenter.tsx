"use client";

/**
 * DownloadCenter — download buttons for driver, manual, firmware, SDK, utility.
 *
 * Reuses SurfaceCard, Icon, QbitButton.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { type PassportDTO } from "@/lib/passport/types";
import { useNavigation } from "@/lib/navigation/store";

interface DownloadCenterProps {
  passport: PassportDTO;
}

export function DownloadCenter({ passport }: DownloadCenterProps) {
  const navigate = useNavigation((s) => s.navigate);
  const product = passport.product;

  const downloads = [
    {
      label: "Download Driver",
      icon: "settings_input_component",
      url: passport.driverInfo?.latestDriverDownloadUrl ?? product?.driverDownloadUrl,
      screen: "driver-download-center",
      highlight: passport.driverInfo?.driverStatus === "update_available" || passport.driverInfo?.driverStatus === "missing",
    },
    {
      label: "Download Manual",
      icon: "menu_book",
      url: product?.manualUrl,
      screen: "driver-download-center",
    },
    {
      label: "Download Firmware",
      icon: "system_update",
      url: null,
      screen: "driver-download-center",
    },
    {
      label: "Download SDK",
      icon: "code",
      url: null,
      screen: "driver-download-center",
    },
    {
      label: "Download Utility",
      icon: "build",
      url: null,
      screen: "driver-download-center",
    },
  ];

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="cloud_download" className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">Download Center</h3>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {downloads.map((dl) => (
          <button
            key={dl.label}
            type="button"
            onClick={() => {
              if (dl.url) {
                window.open(dl.url, "_blank");
              } else if (dl.screen) {
                navigate(dl.screen as never);
              }
            }}
            className={
              "flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm " +
              (dl.highlight
                ? "border-qbit-primary/30 bg-qbit-primary/5"
                : "border-qbit-outline-variant/50 bg-white hover:bg-qbit-surface-container-low")
            }
          >
            <div className={
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
              (dl.highlight ? "bg-qbit-primary text-qbit-on-primary" : "bg-qbit-primary/10 text-qbit-primary")
            }>
              <Icon name={dl.icon} className="text-[18px]" filled={dl.highlight} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-qbit-on-surface">{dl.label}</p>
              {dl.highlight && (
                <p className="text-[10px] text-qbit-primary">Update available</p>
              )}
            </div>
            <Icon name="download" className="text-[16px] text-qbit-on-surface-variant" />
          </button>
        ))}
      </div>
    </SurfaceCard>
  );
}
