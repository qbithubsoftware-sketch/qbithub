"use client";

/**
 * CustomerLoginPage — V3 customer-facing login at /accounts/login.
 *
 * Distinct from the staff LoginPage (which uses Corporate Email + is used
 * inside /portal). This page is for public_customers logging in to /account.
 *
 * Layout (within the /accounts/login PublicLayout wrapper):
 *   1. Header: "QBIT Hub" + "Sign in" headline + sub-copy
 *   2. Login form:
 *        - Mobile Number (with phone icon, +91 prefix, 10-digit validation)
 *        - Password (with show/hide toggle)
 *        - Forgot Password link + Remember Me checkbox
 *        - Sign In button
 *   3. Quick links row: Register Product | Activate Warranty
 *   4. "Need Support?" section: Download Driver | Run Dr. QBIT
 *
 * Auth flow:
 *   - signIn("credentials", { email: <mobile>@qbit.customer, password })
 *     (The NextAuth credentials provider accepts either email OR mobile; we
 *      pass the mobile number prefixed so the provider can look it up.)
 *   - On success: if role === public_customer → /account
 *                  if role === staff (admin/engineer/support) → /portal
 *   - On failure: show error banner
 */

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useRouter } from "next/navigation";
import { type Role } from "@/lib/rbac/roles";

type LoginState = "idle" | "loading" | "error";

export function CustomerLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Sanitize mobile input: digits only, max 10
  function handleMobileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mobile.length !== 10) {
      setLoginState("error");
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      setLoginState("error");
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoginState("loading");
    setErrorMessage("");

    // ===== STEP 1: Verify mobile number against the Purchase Database =====
    // This denies login for mobile numbers not associated with any registered
    // QBIT product purchase — BEFORE we even check the password.
    try {
      const verifyRes = await fetch("/api/auth/verify-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.verified) {
        setLoginState("error");
        // Show the specific reason message from the verification service.
        setErrorMessage(
          verifyData.message ??
            "This mobile number is not associated with any registered QBIT product. Please contact your dealer or QBIT Support.",
        );
        return;
      }
    } catch {
      setLoginState("error");
      setErrorMessage("Could not verify your mobile number. Please try again.");
      return;
    }

    // ===== STEP 2: Sign in with NextAuth (password check) =====
    // The NextAuth authorize callback ALSO runs the Purchase DB verification
    // (defense in depth) — so even if someone bypasses step 1, login still fails.
    const result = await signIn("credentials", {
      email: mobile, // provider treats 10-digit number as mobile
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoginState("error");
      setErrorMessage(
        "Invalid mobile number or password. If you are a registered customer, please verify your password or use OTP login.",
      );
      return;
    }

    const session = await getSession();
    const role = session?.user?.role as Role | undefined;

    if (typeof window !== "undefined") {
      if (role === "public_customer") {
        // Customer → /customer dashboard
        window.location.href = "/customer";
      } else if (role) {
        // Staff (super_admin/admin/engineer/support) should NOT log in here.
        // Redirect them to the Enterprise Login page with a message.
        // This keeps the Customer Login and Enterprise Login fully separated.
        window.location.href = "/enterprise/login?error=staff_use_enterprise_login";
      } else {
        // No role — fallback to customer dashboard
        window.location.href = "/customer";
      }
    }
  }

  return (
    <div className="w-full">
      {/* ===== Header ===== */}
      <div className="mb-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary">
          <span className="material-symbols-outlined text-[14px]">account_circle</span>
          Customer Account
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Sign in</h2>
        <p className="mt-1 text-sm text-qbit-on-surface-variant">
          Access your registered products, warranty, and downloads.
        </p>
      </div>

      {/* ===== Login Form ===== */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error banner */}
        {loginState === "error" && (
          <div className="flex items-center gap-2 rounded-xl border border-qbit-error/30 bg-qbit-error-container/40 px-3 py-2.5 text-xs font-medium text-qbit-on-error-container">
            <Icon name="error" className="text-[16px]" filled />
            {errorMessage}
          </div>
        )}

        {/* Mobile Number */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Mobile Number
          </label>
          <div className="relative focus-within:scale-[1.01] transition-transform">
            <Icon
              name="call"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant"
            />
            <div className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-qbit-on-surface-variant">
              <span className="font-semibold">+91</span>
              <span className="h-4 w-px bg-qbit-outline-variant" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              value={mobile}
              onChange={handleMobileChange}
              placeholder="98765 43210"
              aria-label="Mobile Number"
              className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-20 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
            />
          </div>
          <p className="mt-1 text-[11px] text-qbit-on-surface-variant/70">
            10-digit registered mobile number
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Password
          </label>
          <div className="relative focus-within:scale-[1.01] transition-transform">
            <Icon
              name="lock"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant"
            />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-label="Password"
              className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-10 pr-10 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-qbit-on-surface-variant hover:text-qbit-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[18px]" />
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
            />
            <span className="text-xs font-medium text-qbit-on-surface-variant">Remember Me</span>
          </label>
          <Link
            href="/support"
            className="text-xs font-semibold text-qbit-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <QbitButton
          type="submit"
          size="lg"
          fullWidth
          iconRight={loginState === "loading" ? "progress_activity" : "arrow_forward"}
          disabled={loginState === "loading"}
        >
          {loginState === "loading" ? "Signing in…" : "Sign In"}
        </QbitButton>
      </form>

      {/* ===== Divider ===== */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-qbit-outline-variant" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-qbit-on-surface-variant">
            New to QBIT Hub?
          </span>
        </div>
      </div>

      {/* ===== Register Product + Activate Warranty ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/accounts/register"
          className="group flex flex-col items-center rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4 text-center transition-all hover:border-qbit-primary/30 hover:shadow-md"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
            <Icon name="add_circle" className="text-[22px]" />
          </div>
          <span className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">Register Product</span>
          <span className="mt-0.5 text-[11px] text-qbit-on-surface-variant">Create your account</span>
        </Link>
        <Link
          href="/support"
          className="group flex flex-col items-center rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4 text-center transition-all hover:border-qbit-primary/30 hover:shadow-md"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-success/10 text-qbit-success">
            <Icon name="verified_user" className="text-[22px]" />
          </div>
          <span className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">Activate Warranty</span>
          <span className="mt-0.5 text-[11px] text-qbit-on-surface-variant">Verify coverage</span>
        </Link>
      </div>

      {/* ===== Need Support? section ===== */}
      <div className="mt-6 rounded-2xl border border-qbit-primary/20 bg-qbit-primary/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="support_agent" className="text-[20px] text-qbit-primary" />
          <h3 className="text-sm font-bold text-qbit-on-surface">Need Support?</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/drivers"
            className="group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-3 transition-all hover:border-qbit-primary/30 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
              <Icon name="memory" className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-qbit-on-surface group-hover:text-qbit-primary">Download Driver</p>
              <p className="text-[10px] text-qbit-on-surface-variant">Windows / Linux / Android</p>
            </div>
          </Link>
          <Link
            href="/dr-qbit"
            className="group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-3 transition-all hover:border-qbit-primary/30 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-secondary/10 text-qbit-secondary">
              <Icon name="smart_toy" className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-qbit-on-surface group-hover:text-qbit-primary">Run Dr. QBIT</p>
              <p className="text-[10px] text-qbit-on-surface-variant">Auto-detect hardware</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ===== Footer help ===== */}
      <p className="mt-6 text-center text-xs text-qbit-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/accounts/register" className="font-semibold text-qbit-primary hover:underline">
          Register your QBIT product
        </Link>{" "}
        to create one.
      </p>
    </div>
  );
}
