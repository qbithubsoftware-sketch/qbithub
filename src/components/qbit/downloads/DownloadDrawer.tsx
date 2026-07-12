"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VersionTimeline } from "./VersionTimeline";
import { ReleaseNotes } from "./ReleaseNotes";
import type { DownloadItem } from "@/lib/downloads/types";

/**
 * DownloadDrawer — right-side slide-in drawer showing full details for a
 * single download.  Displays description, supported products, supported
 * OS, installation instructions, release notes, known issues, previous
 * versions (VersionTimeline), and a Download button.
 */
export function DownloadDrawer({
  download,
  open,
  onOpenChange,
  onDownload,
}: {
  download: DownloadItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (download: DownloadItem) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto custom-scrollbar p-0 bg-qbit-surface-container-lowest"
      >
        {download && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 border-b border-qbit-outline-variant space-y-0">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container-low",
                    download.deviceColor,
                  )}
                >
                  <Icon name={download.deviceIcon} className="text-[28px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-[20px] font-semibold text-qbit-on-surface">
                    {download.name}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm text-qbit-on-surface-variant">
                      {download.version}
                    </span>
                    {download.badge && (
                      <StatusBadge variant={download.badge.variant}>
                        {download.badge.label}
                      </StatusBadge>
                    )}
                    {download.latest && <StatusBadge variant="success">Latest</StatusBadge>}
                    {download.featured && <StatusBadge variant="primary">Featured</StatusBadge>}
                  </div>
                </div>
              </div>

              {/* Quick meta row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-qbit-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar_today" className="text-[14px]" />
                  {download.releaseDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="save" className="text-[14px]" />
                  {download.fileSize}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="download" className="text-[14px]" />
                  {download.downloadCountLabel} downloads
                </span>
                {download.checksum && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Icon name="fingerprint" className="text-[14px]" />
                    SHA-256 verified
                  </span>
                )}
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {download.description && (
                <Section title="Description" icon="description">
                  <p className="text-sm text-qbit-on-surface-variant leading-relaxed">
                    {download.description}
                  </p>
                </Section>
              )}

              {/* Supported Products */}
              {download.supportedProducts && download.supportedProducts.length > 0 && (
                <Section title="Supported Products" icon="devices">
                  <div className="flex flex-wrap gap-2">
                    {download.supportedProducts.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1 text-xs font-semibold text-qbit-on-surface-variant rounded-full bg-qbit-surface-container-high"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Supported OS */}
              {download.operatingSystems.length > 0 && (
                <Section title="Supported Operating Systems" icon="desktop_windows">
                  <div className="flex flex-wrap gap-2">
                    {download.operatingSystems.map((os) => (
                      <span
                        key={os.id}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-qbit-on-surface-variant rounded-full bg-qbit-surface-container-high"
                      >
                        {os.icon && <Icon name={os.icon} className="text-[14px]" />}
                        {os.name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Installation Instructions */}
              {download.installInstructions && (
                <Section title="Installation Instructions" icon="build">
                  <pre className="text-sm text-qbit-on-surface-variant whitespace-pre-wrap font-sans leading-relaxed">
                    {download.installInstructions}
                  </pre>
                </Section>
              )}

              {/* Release Notes */}
              {download.previousVersions && download.previousVersions.length > 0 && (
                <Section title="Release Notes" icon="article">
                  <ReleaseNotes
                    currentVersion={download.version}
                    changes={download.previousVersions.find((v) => v.isCurrent)?.changes ?? []}
                    bugFixes={download.previousVersions.find((v) => v.isCurrent)?.bugFixes}
                    securityUpdates={download.previousVersions.find((v) => v.isCurrent)?.securityUpdates}
                  />
                </Section>
              )}

              {/* Known Issues */}
              {download.knownIssues && (
                <Section title="Known Issues" icon="warning">
                  <p className="text-sm text-qbit-on-surface-variant leading-relaxed">
                    {download.knownIssues}
                  </p>
                </Section>
              )}

              {/* Previous Versions timeline */}
              {download.previousVersions && download.previousVersions.length > 0 && (
                <Section title="Version History" icon="history">
                  <VersionTimeline
                    currentVersion={download.version}
                    versions={[
                      {
                        version: download.version,
                        releaseDate: download.releaseDate,
                        changes:
                          download.previousVersions.find((v) => v.isCurrent)?.changes ?? [
                            "Current release",
                          ],
                        isCurrent: true,
                      },
                      ...download.previousVersions.filter((v) => !v.isCurrent),
                    ]}
                  />
                </Section>
              )}
            </div>

            {/* Footer — Download button */}
            <div className="sticky bottom-0 p-4 border-t border-qbit-outline-variant bg-qbit-surface-container-lowest flex gap-2">
              <QbitButton
                variant="primary"
                size="lg"
                icon="download"
                fullWidth
                onClick={() => onDownload?.(download)}
              >
                Download {download.version}
              </QbitButton>
              <QbitButton variant="outline" size="lg" icon="share">
                Share
              </QbitButton>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Small helper — a titled section with an icon. */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-qbit-on-surface mb-2">
        <Icon name={icon} className="text-[18px] text-qbit-primary" />
        {title}
      </h4>
      <div className="pl-6">{children}</div>
    </div>
  );
}
