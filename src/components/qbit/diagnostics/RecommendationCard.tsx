"use client";

/**
 * RecommendationCard — displays a single recommendation with action button.
 *
 * Reuses SurfaceCard, Icon, QbitButton.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type DiagnosticRecommendationDTO,
  ACTION_ICONS,
} from "@/lib/diagnostics/types";
import { useNavigation } from "@/lib/navigation/store";

interface RecommendationCardProps {
  recommendation: DiagnosticRecommendationDTO;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const navigate = useNavigation((s) => s.navigate);
  const icon = ACTION_ICONS[recommendation.actionType] ?? "recommend";

  const handleClick = () => {
    if (recommendation.resourceUrl) {
      window.open(recommendation.resourceUrl, "_blank");
    } else if (recommendation.resourceScreen) {
      navigate(recommendation.resourceScreen as never);
    }
  };

  return (
    <SurfaceCard className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
          <Icon name={icon} className="text-[16px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-qbit-on-surface">{recommendation.title}</p>
          {recommendation.description && (
            <p className="text-xs text-qbit-on-surface-variant">{recommendation.description}</p>
          )}
        </div>
        <TagBadge variant={
          recommendation.priority === "urgent" ? "error"
          : recommendation.priority === "high" ? "neutral"
          : "primary"
        }>
          {recommendation.priority}
        </TagBadge>
      </div>
      {(recommendation.resourceUrl || recommendation.resourceScreen) && (
        <QbitButton
          variant="outline"
          size="sm"
          icon="arrow_forward"
          className="mt-2"
          onClick={handleClick}
        >
          Open
        </QbitButton>
      )}
    </SurfaceCard>
  );
}
