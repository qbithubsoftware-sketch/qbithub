"use client";

/**
 * ActionCenter — engineer action buttons for diagnostics.
 *
 * Reuses SurfaceCard, Icon, QbitButton.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";

interface ActionCenterProps {
  hardwareId?: string | null;
}

export function ActionCenter({ hardwareId }: ActionCenterProps) {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const actions = [
    { label: "Download Driver", icon: "settings_input_component", screen: "driver-download-center" },
    { label: "Download Firmware", icon: "system_update", screen: "dr-qbit-firmware" },
    { label: "Open Manual", icon: "menu_book", screen: "driver-download-center" },
    { label: "Watch Video", icon: "play_circle", screen: "video-training-center" },
    { label: "Open Troubleshooting", icon: "build", screen: "support-tickets" },
    { label: "Run Test Print", icon: "print", action: () => toast({ title: "Test Print", description: "In production, sends test print via Desktop Agent." }) },
    { label: "Generate Report", icon: "picture_as_pdf", action: () => toast({ title: "Diagnostic Report", description: "In production, generates a PDF diagnostic report." }) },
    {
      label: "Copy Hardware ID",
      icon: "content_copy",
      action: () => {
        if (hardwareId) {
          navigator.clipboard.writeText(hardwareId);
          toast({ title: "Copied", description: "Hardware ID copied to clipboard." });
        } else {
          toast({ title: "No Hardware ID", description: "Hardware ID not available for this device.", variant: "destructive" });
        }
      },
    },
  ];

  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="bolt" className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">Action Center</h3>
      </div>
      <div className="space-y-2">
        {actions.map((a) => (
          <QbitButton
            key={a.label}
            variant="outline"
            size="sm"
            icon={a.icon}
            fullWidth
            onClick={() => {
              if (a.action) a.action();
              else if (a.screen) navigate(a.screen as never);
            }}
          >
            {a.label}
          </QbitButton>
        ))}
      </div>
    </SurfaceCard>
  );
}
