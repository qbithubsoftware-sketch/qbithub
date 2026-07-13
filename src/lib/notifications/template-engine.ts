/**
 * Template engine — {{Variable}} substitution + template lookup.
 *
 * Pure functions, no DB access. Caller is responsible for fetching templates
 * from the database and passing them to `renderTemplate()`.
 */

import type { TemplateVariables } from "./types";

/** Template row shape — matches Prisma NotificationTemplate model. */
export interface TemplateRecord {
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
}

/**
 * Substitutes {{Variable}} placeholders in a template string.
 * Unknown variables are left as-is (so typos are visible in QA).
 */
export function substitute(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined && value !== null ? value : match;
  });
}

/**
 * Renders a template with the given variables — returns subject + body + htmlBody.
 */
export function renderTemplate(
  template: TemplateRecord,
  variables: TemplateVariables,
): {
  subject: string | null;
  body: string;
  htmlBody: string | null;
} {
  return {
    subject: template.subject ? substitute(template.subject, variables) : null,
    body: substitute(template.body, variables),
    htmlBody: template.htmlBody ? substitute(template.htmlBody, variables) : null,
  };
}

/**
 * Extracts all {{Variable}} names from a template body.
 * Useful for template editor UI (shows which variables are used).
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) ?? [];
  const names = new Set<string>();
  for (const m of matches) {
    const name = m.replace(/[{}]/g, "");
    names.add(name);
  }
  return Array.from(names).sort();
}

/**
 * Validates a template body — returns list of unknown variables.
 * "Known" = any key in the TemplateVariables interface.
 */
export function validateTemplate(template: string, knownVariables: string[] = KNOWN_VARIABLES): string[] {
  const used = extractVariables(template);
  return used.filter((v) => !knownVariables.includes(v));
}

/** All variables the engine knows about (mirrors TemplateVariables interface). */
export const KNOWN_VARIABLES = [
  "CustomerName",
  "CustomerPhone",
  "CustomerEmail",
  "EngineerName",
  "EngineerPhone",
  "JobNumber",
  "JobType",
  "JobStatus",
  "Priority",
  "Date",
  "Time",
  "ScheduledDate",
  "ProductName",
  "Model",
  "SerialNumber",
  "TrackingURL",
  "DashboardURL",
  "CompanyName",
  "SupportPhone",
  "Reason",
  "OldDate",
  "NewDate",
  "Notes",
  "FeedbackLink",
  "ReportLink",
];

/** Default branding variables — merged into every dispatch. */
export const DEFAULT_BRAND_VARIABLES: TemplateVariables = {
  CompanyName: "QBIT Hub",
  SupportPhone: "1800-123-4567",
  TrackingURL: "https://qbithub.vercel.app",
  DashboardURL: "https://qbithub.vercel.app",
};
