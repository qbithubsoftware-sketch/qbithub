"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCard } from "./QRCodeCard";

/**
 * ShareModal — share dialog with Copy Link, WhatsApp, Email, QR Code,
 * and Native Share API (where supported).
 *
 * Uses the Web Share API (`navigator.share`) on mobile/desktop platforms
 * that support it.  Falls back to individual share buttons.
 */
export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function shareEmail() {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description ?? ""}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch {
        // User cancelled — no action needed
      }
    } else {
      copyLink();
    }
  }

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white overflow-hidden">
        <DialogHeader className="p-5 border-b border-qbit-outline-variant">
          <DialogTitle className="text-base font-semibold text-qbit-on-surface">
            Share this product
          </DialogTitle>
          <DialogDescription className="text-xs text-qbit-on-surface-variant">
            Share &quot;{title}&quot; via your preferred channel.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Copy link */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5">
              Product Link
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low p-1.5">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-transparent text-xs text-qbit-on-surface px-2 py-1 focus:outline-none truncate"
              />
              <button
                onClick={copyLink}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  copied ? "bg-emerald-500 text-white" : "bg-qbit-primary text-white hover:bg-qbit-primary-container",
                )}
              >
                <Icon name={copied ? "check" : "content_copy"} className="text-[14px]" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <ShareButton icon="chat" label="WhatsApp" onClick={shareWhatsApp} color="bg-emerald-500" />
            <ShareButton icon="mail" label="Email" onClick={shareEmail} color="bg-qbit-primary" />
            {supportsNativeShare && (
              <ShareButton icon="share" label="Share" onClick={nativeShare} color="bg-qbit-on-surface-variant" />
            )}
          </div>

          {/* QR Code */}
          <div className="pt-3 border-t border-qbit-outline-variant">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
              QR Code
            </label>
            <div className="flex flex-col items-center">
              <QRCodeCard url={url} size={160} />
              <p className="text-[10px] text-qbit-on-surface-variant mt-2 text-center">
                Scan to open this product page on any device
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-qbit-outline-variant hover:bg-qbit-surface-container-low transition-colors group"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white group-hover:scale-110 transition-transform", color)}>
        <Icon name={icon} className="text-[20px]" />
      </div>
      <span className="text-[11px] font-medium text-qbit-on-surface-variant">{label}</span>
    </button>
  );
}
