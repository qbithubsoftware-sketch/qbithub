"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SystemSettingEntry } from "@/lib/admin/types";

const CATEGORY_ICON: Record<string, string> = {
  company: "business",
  branding: "palette",
  application: "tune",
  security: "security",
  backup: "backup",
};

/**
 * SettingsPanel — renders a group of system settings as a form.
 * Supports text, email, phone, url, select, toggle, and image types.
 */
export function SettingsPanel({
  title,
  icon,
  settings,
  onSave,
}: {
  title: string;
  icon?: string;
  settings: SystemSettingEntry[];
  onSave?: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.key, s.value])),
  );

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
            <Icon name={icon} className="text-[18px]" />
          </div>
        )}
        <h4 className="text-sm font-semibold text-qbit-on-surface">{title}</h4>
      </div>
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">
              {setting.label}
            </label>
            {setting.description && (
              <p className="text-[11px] text-qbit-outline mb-1.5">{setting.description}</p>
            )}
            {setting.type === "select" ? (
              <Select value={values[setting.key]} onValueChange={(v) => update(setting.key, v)}>
                <SelectTrigger className="w-full h-10 bg-qbit-surface-container-low border-qbit-outline-variant/60 text-qbit-on-surface text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {setting.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : setting.type === "image" ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-qbit-outline-variant bg-qbit-surface-container-low">
                  <Icon name="cloud_upload" className="text-[20px] text-qbit-on-surface-variant" />
                </div>
                <QbitButton size="sm" variant="outline" icon="upload">Upload</QbitButton>
              </div>
            ) : (
              <input
                type={setting.type === "email" ? "email" : setting.type === "phone" ? "tel" : setting.type === "url" ? "url" : "text"}
                value={values[setting.key] ?? ""}
                onChange={(e) => update(setting.key, e.target.value)}
                className="w-full rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2 text-sm text-qbit-on-surface focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
              />
            )}
          </div>
        ))}
      </div>
      {onSave && (
        <div className="mt-4 pt-4 border-t border-qbit-outline-variant/40 flex justify-end">
          <QbitButton size="sm" variant="primary" icon="save" onClick={onSave}>
            Save Changes
          </QbitButton>
        </div>
      )}
    </SurfaceCard>
  );
}

/**
 * SettingsGrid — renders multiple SettingsPanel cards in a responsive grid.
 */
export function SettingsGrid({
  groups,
}: {
  groups: { title: string; icon: string; settings: SystemSettingEntry[] }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {groups.map((group) => (
        <SettingsPanel
          key={group.title}
          title={group.title}
          icon={group.icon}
          settings={group.settings}
        />
      ))}
    </div>
  );
}
