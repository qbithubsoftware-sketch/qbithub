"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import type { ContactFormData } from "@/lib/portal/types";

const CATEGORIES = [
  { value: "general", label: "General Inquiry", icon: "help" },
  { value: "sales", label: "Sales / Quote", icon: "storefront" },
  { value: "support", label: "Technical Support", icon: "support_agent" },
  { value: "partnership", label: "Partnership", icon: "handshake" },
] as const;

/**
 * ContactForm — customer inquiry form.
 *
 * On submit, POSTs to /api/public/contact.  Validates required fields
 * client-side before sending.
 */
export function ContactForm({
  productId,
  productName,
}: {
  productId?: string;
  productName?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: productName ? `Inquiry about ${productName}` : "",
    message: "",
    productId,
    category: "general",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, email, subject, and message are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send message");
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 1 business hour.",
      });
      setForm((prev) => ({ ...prev, name: "", email: "", phone: "", company: "", subject: "", message: "" }));
    } catch {
      toast({
        title: "Failed to send message",
        description: "Please try again or email us directly at support@qbithub.io",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
          Inquiry Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => update("category", cat.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all",
                form.category === cat.value
                  ? "border-qbit-primary bg-qbit-primary/5 text-qbit-primary"
                  : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container",
              )}
            >
              <Icon name={cat.icon} className="text-[20px]" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@company.com"
            className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
      </div>

      {/* Phone + Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Subject *</label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="How can we help you?"
          className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-qbit-on-surface-variant mb-1">Message *</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Describe your inquiry in detail..."
          className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary resize-y"
        />
      </div>

      <QbitButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        icon={submitting ? "progress_activity" : "send"}
        disabled={submitting}
      >
        {submitting ? "Sending..." : "Send Message"}
      </QbitButton>
    </form>
  );
}
