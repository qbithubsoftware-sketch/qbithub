"use client";

/**
 * CustomerDashboard — V3 customer portal home.
 *
 * Renders the authenticated customer's overview: registered devices,
 * warranty status, recent downloads, installation + service history.
 *
 * Auth model: reuses the existing NextAuth session. The user.role must be
 * `public_customer` (or any non-staff role). For staff roles (admin,
 * installation_engineer, etc.) we offer a "Switch to staff portal" link.
 *
 * Device/warranty data is fetched from the existing FSMCustomerAsset +
 * DeviceWarranty models (via /api/account/* — see below). If the customer
 * has no registered devices yet, we show an empty state with a CTA to
 * register their first device.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { Icon } from "@/components/qbit/primitives/Icon";

interface RegisteredDevice {
  id: string;
  productName: string;
  model: string;
  serialNumber: string;
  purchaseDate: string | null;
  warrantyStatus: string;
  warrantyExpiry: string | null;
  firmwareVersion: string | null;
  driverVersion: string | null;
  qrCode: string | null;
}

export function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/accounts/login?from=/account");
      return;
    }
    // SECURITY: Staff (admin/engineer/support) should not see the customer dashboard.
    // Redirect them to /portal where their role-appropriate screens live.
    const role = (session?.user?.role as string) ?? null;
    if (role && role !== "public_customer") {
      router.push("/portal");
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/account/devices", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load devices");
        const data = await res.json();
        setDevices(data.devices ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, router]);

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Icon name="progress_activity" className="animate-spin text-[40px] text-qbit-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!session) {
    // Should have been redirected by the effect above
    return null;
  }

  const userName = session.user?.name ?? "Customer";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const role = (session.user?.role as string) ?? "public_customer";

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {/* Welcome header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary text-qbit-on-primary">
              <span className="text-xl font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Welcome, {userName}</h1>
              <p className="text-sm text-qbit-on-surface-variant">
                {session.user?.email ?? "—"} · {role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {role !== "public_customer" && (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low"
              >
                <Icon name="dashboard" className="text-[18px]" />
                Staff Portal
              </Link>
            )}
            <Link
              href="/dr-qbit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container"
            >
              <Icon name="smart_toy" className="text-[18px]" />
              Run Dr. QBIT
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Registered Devices" value={devices.length} icon="devices" />
          <StatCard
            label="Active Warranty"
            value={devices.filter((d) => d.warrantyStatus === "active").length}
            icon="verified_user"
          />
          <StatCard
            label="Expiring Soon"
            value={devices.filter((d) => {
              if (!d.warrantyExpiry) return false;
              const days = Math.ceil((new Date(d.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return days > 0 && days <= 60;
            }).length}
            icon="schedule"
          />
          <StatCard
            label="Expired"
            value={devices.filter((d) => d.warrantyStatus === "expired").length}
            icon="warning"
          />
        </div>

        {/* Devices table */}
        <section className="mb-8 rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-qbit-outline-variant px-6 py-4">
            <h2 className="text-base font-bold text-qbit-on-surface">Registered Devices</h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-qbit-primary hover:underline"
            >
              Browse products
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <Icon name="progress_activity" className="mx-auto animate-spin text-[28px] text-qbit-primary" />
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-sm text-qbit-error">{error}</div>
          ) : devices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Icon name="devices_other" className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
              <p className="mt-3 text-sm font-medium text-qbit-on-surface">No registered devices yet.</p>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">
                Run Dr. QBIT to auto-detect your hardware, or browse the product catalog to register manually.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/dr-qbit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-on-primary"
                >
                  <Icon name="smart_toy" className="text-[16px]" />
                  Scan with Dr. QBIT
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface"
                >
                  <Icon name="inventory_2" className="text-[16px]" />
                  Browse Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-qbit-outline-variant/50 bg-qbit-surface-container-low text-left text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Serial No.</th>
                    <th className="px-6 py-3">Purchase Date</th>
                    <th className="px-6 py-3">Warranty</th>
                    <th className="px-6 py-3">Driver / Firmware</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-qbit-outline-variant/30">
                  {devices.map((d) => {
                    const daysRemaining = d.warrantyExpiry
                      ? Math.max(0, Math.ceil((new Date(d.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : null;
                    return (
                      <tr key={d.id} className="hover:bg-qbit-surface-container-low/50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-qbit-on-surface">{d.productName}</p>
                          <p className="text-xs text-qbit-on-surface-variant">{d.model}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-qbit-on-surface-variant">{d.serialNumber}</td>
                        <td className="px-6 py-4 text-xs text-qbit-on-surface-variant">
                          {d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              d.warrantyStatus === "active"
                                ? "bg-qbit-success/15 text-qbit-success"
                                : d.warrantyStatus === "expired"
                                  ? "bg-qbit-error/15 text-qbit-error"
                                  : "bg-qbit-warning/15 text-qbit-warning"
                            }`}
                          >
                            {d.warrantyStatus === "active" ? "Active" : d.warrantyStatus === "expired" ? "Expired" : "Unknown"}
                            {daysRemaining !== null && d.warrantyStatus === "active" && ` · ${daysRemaining}d left`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-qbit-on-surface-variant">
                          {d.driverVersion && <div>Driver: {d.driverVersion}</div>}
                          {d.firmwareVersion && <div>Firmware: {d.firmwareVersion}</div>}
                          {!d.driverVersion && !d.firmwareVersion && "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/products?search=${encodeURIComponent(d.model)}`}
                              className="rounded-lg p-2 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                              title="Find drivers"
                            >
                              <Icon name="download" className="text-[18px]" />
                            </Link>
                            <Link
                              href="/dr-qbit"
                              className="rounded-lg p-2 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                              title="Run diagnostics"
                            >
                              <Icon name="smart_toy" className="text-[18px]" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: "smart_toy", title: "Dr. QBIT Diagnostics", desc: "Scan your device for drivers + firmware.", href: "/dr-qbit", color: "bg-qbit-primary/10 text-qbit-primary" },
            { icon: "download", title: "Downloads", desc: "Drivers, manuals, firmware, SDKs.", href: "/downloads", color: "bg-qbit-secondary/10 text-qbit-secondary" },
            { icon: "support_agent", title: "Support", desc: "Get help from our team.", href: "/support", color: "bg-qbit-tertiary/10 text-qbit-tertiary" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-qbit-outline-variant/50 bg-white p-5 transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <Icon name={card.icon} className="text-[20px]" />
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{card.title}</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-qbit-outline-variant/50 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">{label}</span>
        <Icon name={icon} className="text-[18px] text-qbit-primary" />
      </div>
      <p className="mt-2 text-2xl font-bold text-qbit-on-surface">{value}</p>
    </div>
  );
}
