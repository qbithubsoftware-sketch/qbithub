"use client";

/**
 * CustomerActions — quick-action buttons for the customer.
 *
 * Actions:
 *   - Call Engineer
 *   - WhatsApp Engineer
 *   - Contact Support
 *   - Download Manual
 *   - Watch Installation Video
 *   - View Warranty
 *
 * Reuses QbitButton + Icon.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

interface CustomerActionsProps {
  engineerPhone?: string | null;
  engineerName?: string | null;
  supportPhone: string;
  supportEmail: string;
  manualUrl: string | null;
  videoUrl: string | null;
  warrantyStatus: string | null;
  warrantyExpiry: string | null;
  onViewWarranty?: () => void;
}

export function CustomerActions({
  engineerPhone,
  engineerName,
  supportPhone,
  supportEmail,
  manualUrl,
  videoUrl,
  warrantyStatus,
  warrantyExpiry,
  onViewWarranty,
}: CustomerActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {engineerPhone && (
        <>
          <a href={`tel:${engineerPhone.replace(/\s/g, "")}`} className="inline-flex">
            <QbitButton variant="outline" size="sm" icon="call" fullWidth>
              Call Engineer
            </QbitButton>
          </a>
          <a
            href={`https://wa.me/${engineerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello ${engineerName ?? "engineer"}, I have a question about my QBIT installation.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <QbitButton variant="outline" size="sm" icon="chat" fullWidth>
              WhatsApp
            </QbitButton>
          </a>
        </>
      )}

      <a href={`tel:${supportPhone.replace(/[^0-9]/g, "")}`} className="inline-flex">
        <QbitButton variant="outline" size="sm" icon="support_agent" fullWidth>
          Support
        </QbitButton>
      </a>

      {manualUrl && (
        <a href={manualUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
          <QbitButton variant="outline" size="sm" icon="menu_book" fullWidth>
            Manual
          </QbitButton>
        </a>
      )}

      {videoUrl && (
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
          <QbitButton variant="outline" size="sm" icon="play_circle" fullWidth>
            Video
          </QbitButton>
        </a>
      )}

      {warrantyStatus && (
        <QbitButton
          variant="outline"
          size="sm"
          icon="verified_user"
          fullWidth
          onClick={onViewWarranty}
        >
          Warranty
        </QbitButton>
      )}

      <a href={`mailto:${supportEmail}`} className="inline-flex">
        <QbitButton variant="outline" size="sm" icon="mail" fullWidth>
          Email
        </QbitButton>
      </a>
    </div>
  );
}

export { Icon };
