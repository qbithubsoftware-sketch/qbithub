"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";

/**
 * NewsletterSignup — email subscription form for the public footer.
 *
 * POSTs to /api/public/newsletter.  Validates email format client-side.
 */
export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to subscribe");
      }
      toast({
        title: "Subscribed!",
        description: "You'll receive product updates and announcements.",
      });
      setEmail("");
      setName("");
    } catch (err) {
      toast({
        title: "Subscription failed",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:bg-white/20 focus:outline-none"
        />
        <QbitButton
          type="submit"
          size="sm"
          variant="primary"
          disabled={submitting}
          icon={submitting ? "progress_activity" : "arrow_forward"}
        >
          Join
        </QbitButton>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:bg-white/20 focus:outline-none"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:bg-white/20 focus:outline-none"
      />
      <QbitButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={submitting}
        icon={submitting ? "progress_activity" : "email"}
      >
        {submitting ? "Subscribing..." : "Subscribe"}
      </QbitButton>
    </form>
  );
}
