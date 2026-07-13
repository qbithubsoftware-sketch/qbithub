"use client";

/**
 * NotificationTemplateManagerPage — admin UI to view/edit templates.
 *
 * Lists all 41 templates with filter by event/channel/recipient.
 * Click a template to edit body inline.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Template {
  id: string;
  code: string;
  name: string;
  event: string;
  recipientType: string;
  channel: string;
  subject: string | null;
  body: string;
  htmlBody: string | null;
  isActive: boolean;
  variables: string[];
  unknownVariables: string[];
}

const CHANNEL_ICONS: Record<string, string> = {
  email: "mail",
  whatsapp: "chat",
  in_app: "notifications",
  sms: "sms",
};

const RECIPIENT_VARIANT: Record<string, "primary" | "secondary" | "neutral" | "error"> = {
  admin: "secondary",
  engineer: "primary",
  customer: "neutral",
};

export function NotificationTemplateManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ event?: string; channel?: string; recipient?: string }>({});
  const [selected, setSelected] = useState<Template | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.event) params.set("event", filter.event);
    if (filter.channel) params.set("channel", filter.channel);
    if (filter.recipient) params.set("recipientType", filter.recipient);
    try {
      const res = await fetch(`/api/admin/notifications/templates?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { items: Template[] };
      setTemplates(data.items);
    } catch {
      toast({ title: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleSelect = (t: Template) => {
    setSelected(t);
    setEditMode(false);
    setEditBody(t.body);
    setEditSubject(t.subject ?? "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notifications/templates/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: editBody,
          subject: editSubject || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast({ title: "Template saved", description: selected.code });
      setEditMode(false);
      void fetchTemplates();
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (t: Template) => {
    await fetch(`/api/admin/notifications/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    toast({
      title: t.isActive ? "Template deactivated" : "Template activated",
      description: t.code,
    });
    void fetchTemplates();
  };

  const handleSendTest = async (t: Template) => {
    const adminEmail = user?.email ?? "admin@qbithub.com";
    try {
      const res = await fetch("/api/admin/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: t.event,
          recipientType: t.recipientType === "customer" ? "admin" : t.recipientType,
          recipientId: undefined,
          recipientContact: adminEmail,
          channels: [t.channel],
          variables: {
            CustomerName: "Test Customer",
            EngineerName: user?.name ?? "Test Engineer",
            JobNumber: "WO-TEST01",
            JobType: "installation",
            Date: new Date().toLocaleDateString("en-IN"),
            Time: "10:30",
            ProductName: "QBIT T-800",
            TrackingURL: "https://qbithub.vercel.app",
            DashboardURL: "https://qbithub.vercel.app",
          },
        }),
      });
      if (!res.ok) throw new Error("Dispatch failed");
      const data = await res.json();
      toast({
        title: "Test sent",
        description: `${data.summary.sent} sent, ${data.summary.failed} failed`,
      });
    } catch (e) {
      toast({
        title: "Test failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Get unique events/channels/recipients for filter dropdowns
  const events = Array.from(new Set(templates.map((t) => t.event))).sort();
  const channels = Array.from(new Set(templates.map((t) => t.channel)));
  const recipients = Array.from(new Set(templates.map((t) => t.recipientType)));

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Template Manager", icon: "description" }}
      navItems={NOTIFICATION_NAV}
      activeScreen="notification-template-manager"
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: "Search templates…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Notification Templates
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            {templates.length} templates loaded. Edit body, toggle active, or send test.
          </p>
        </div>

        {/* Filters */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="filter_list" className="text-[18px] text-qbit-on-surface-variant" />
            <select
              value={filter.event ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, event: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Events</option>
              {events.map((e) => (
                <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select
              value={filter.channel ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, channel: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Channels</option>
              {channels.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filter.recipient ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, recipient: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Recipients</option>
              {recipients.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Template list (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-2">
            {loading ? (
              <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-8 text-center">
                <Icon name="progress_activity" className="mx-auto text-[24px] animate-spin text-qbit-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-8 text-center text-sm text-qbit-on-surface-variant">
                No templates match the filter.
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={
                    "block w-full rounded-lg border bg-white p-3 text-left transition-all hover:shadow-sm " +
                    (selected?.id === t.id
                      ? "border-qbit-primary ring-2 ring-qbit-primary/20"
                      : "border-qbit-outline-variant/50")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon name={CHANNEL_ICONS[t.channel] ?? "notifications"} className="text-[16px] text-qbit-primary" />
                        <span className="truncate text-sm font-semibold text-qbit-on-surface">{t.name}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-qbit-on-surface-variant">{t.code}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <TagBadge variant={RECIPIENT_VARIANT[t.recipientType] ?? "neutral"}>
                          {t.recipientType}
                        </TagBadge>
                        {!t.isActive && (
                          <StatusBadge variant="error" dot>Inactive</StatusBadge>
                        )}
                        {t.unknownVariables.length > 0 && (
                          <StatusBadge variant="warning" dot>
                            {t.unknownVariables.length} unknown vars
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Editor (lg:col-span-3) */}
          <div className="lg:col-span-3">
            {selected ? (
              <SurfaceCard className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-qbit-on-surface">{selected.name}</h3>
                    <p className="font-mono text-xs text-qbit-on-surface-variant">{selected.code}</p>
                  </div>
                  <div className="flex gap-2">
                    {!editMode ? (
                      <QbitButton size="sm" variant="outline" icon="edit" onClick={() => setEditMode(true)}>
                        Edit
                      </QbitButton>
                    ) : (
                      <>
                        <QbitButton size="sm" variant="ghost" icon="close" onClick={() => { setEditMode(false); setEditBody(selected.body); setEditSubject(selected.subject ?? ""); }}>
                          Cancel
                        </QbitButton>
                        <QbitButton size="sm" variant="primary" icon={saving ? "progress_activity" : "check"} disabled={saving} onClick={handleSave}>
                          {saving ? "Saving…" : "Save"}
                        </QbitButton>
                      </>
                    )}
                    <QbitButton size="sm" variant="ghost" icon="send" onClick={() => void handleSendTest(selected)}>
                      Send Test
                    </QbitButton>
                    <QbitButton size="sm" variant="ghost" icon={selected.isActive ? "visibility_off" : "visibility"} onClick={() => void handleToggleActive(selected)}>
                      {selected.isActive ? "Deactivate" : "Activate"}
                    </QbitButton>
                  </div>
                </div>

                {/* Variables used */}
                {selected.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-1.5 text-xs font-semibold uppercase text-qbit-on-surface-variant">
                      Variables ({selected.variables.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.variables.map((v) => (
                        <span
                          key={v}
                          className={
                            "rounded px-1.5 py-0.5 font-mono text-[10px] " +
                            (selected.unknownVariables.includes(v)
                              ? "bg-qbit-error/10 text-qbit-error"
                              : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
                          }
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                    {selected.unknownVariables.length > 0 && (
                      <p className="mt-1 text-xs text-qbit-error">
                        ⚠ {selected.unknownVariables.length} unknown variable(s) — will not be substituted.
                      </p>
                    )}
                  </div>
                )}

                {/* Subject (email only) */}
                {selected.channel === "email" && (
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-semibold uppercase text-qbit-on-surface-variant">Subject</label>
                    {editMode ? (
                      <Input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-qbit-on-surface">{selected.subject ?? "(no subject)"}</p>
                    )}
                  </div>
                )}

                {/* Body */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-qbit-on-surface-variant">Body</label>
                  {editMode ? (
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={12}
                      className="resize-none font-mono text-xs"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap rounded-md bg-qbit-surface-container-low p-3 text-xs text-qbit-on-surface">
                      {selected.body}
                    </pre>
                  )}
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-8 text-center">
                <Icon name="description" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
                <p className="mt-3 text-sm text-qbit-on-surface-variant">Select a template to view or edit.</p>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
