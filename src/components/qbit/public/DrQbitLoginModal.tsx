"use client";

/**
 * DrQbitLoginModal — shown when a Guest user clicks a locked field
 * (Warranty, Device History, Customer Details, Registered Device,
 * Claim Warranty, Service Request) in the Dr. QBIT scan result.
 *
 * Critical behavior:
 *   - "Login" button → navigates to /accounts/login?from=/dr-qbit
 *   - "Continue as Guest" button → closes the modal, returns to Dr. QBIT.
 *     NEVER redirects anywhere. The user stays on /dr-qbit.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  fieldName: string;
  onClose: () => void;
}

export function DrQbitLoginModal({ open, fieldName, onClose }: Props) {
  function handleLogin() {
    // Navigate to login with return-to=/dr-qbit so the user comes back here
    // after successful authentication.
    if (typeof window !== "undefined") {
      window.location.href = "/accounts/login?from=/dr-qbit";
    }
  }

  function handleContinueAsGuest() {
    // Just close the modal — do NOT redirect anywhere.
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-primary/10 text-qbit-primary">
            <Icon name="lock_person" className="text-[32px]" filled />
          </div>
          <DialogTitle className="text-center text-xl">Sign in to QBIT Hub</DialogTitle>
          <DialogDescription className="text-center">
            Login to view
            {fieldName ? (
              <span className="block mt-1 font-semibold text-qbit-on-surface">{fieldName}</span>
            ) : (
              <span className="block mt-1">
                Warranty, Purchase Details, Registered Products,
                Installation History, Service History, and Engineer Support.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* What you'll get after login */}
        <div className="my-4 space-y-2 rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-4">
          {[
            { icon: "verified_user", label: "Warranty status & remaining days" },
            { icon: "receipt_long", label: "Purchase date & invoice details" },
            { icon: "devices", label: "Registered products" },
            { icon: "history", label: "Installation & service history" },
            { icon: "engineering", label: "Engineer support" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-qbit-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-qbit-primary">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <QbitButton variant="primary" fullWidth icon="login" onClick={handleLogin}>
            Login
          </QbitButton>
          <QbitButton variant="ghost" fullWidth onClick={handleContinueAsGuest}>
            Continue as Guest
          </QbitButton>
        </DialogFooter>

        <p className="mt-2 text-center text-[11px] text-qbit-on-surface-variant">
          Don&apos;t have an account?{" "}
          <a href="/support" className="font-semibold text-qbit-primary hover:underline">
            Contact us
          </a>{" "}
          to register your QBIT product.
        </p>
      </DialogContent>
    </Dialog>
  );
}
