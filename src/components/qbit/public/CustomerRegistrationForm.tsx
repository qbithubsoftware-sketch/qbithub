"use client";

/**
 * CustomerRegistrationForm — secure customer account registration at
 * /accounts/register.
 *
 * DESIGN GOAL:
 *   Premium card UI matching the existing /accounts/login page (same colors,
 *   typography, spacing, button styles). Only the form fields differ.
 *
 * REGISTRATION FLOW:
 *   Step 1 — Enter mobile number
 *     - User enters the mobile number used during product purchase
 *     - Click "Verify Mobile" → POST /api/auth/verify-mobile
 *     - API checks:
 *       a) Mobile format valid?
 *       b) Account already exists for this mobile? → redirect to /accounts/login
 *       c) Mobile has at least one registered QBIT device? → if no, reject
 *     - If verified → show "Registered Device Found" confirmation card with
 *       customer name, product, serial, purchase date, warranty status
 *     - User can NOT proceed to password step until mobile is verified
 *
 *   Step 2 — Create password
 *     - Password field with strength indicator
 *     - Confirm password with live "Passwords Match" / "Passwords Do Not Match" validation
 *     - Password rules: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special
 *     - T&C checkbox must be checked
 *
 *   Step 3 — Create Account
 *     - POST /api/auth/register with mobile, password, confirmPassword, acceptTerms
 *     - Backend re-verifies mobile + duplicate check + password strength (defense in depth)
 *     - On success → auto sign-in via NextAuth credentials provider → redirect to /customer
 *
 * SECURITY:
 *   - Mobile verification REQUIRED before password step
 *   - Duplicate account protection (server-side check)
 *   - Password strength enforced client + server side
 *   - Passwords hashed with bcrypt (server-side)
 *   - T&C must be accepted
 *
 * UI inspired by HP / Dell / Lenovo / Microsoft Support Portals.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

// ====================== Types ======================
interface RegisteredDevice {
  productName: string;
  model: string;
  serialNumber: string;
  purchaseDate: string | null;
  warrantyStatus: string;
  warrantyExpiry: string | null;
}

interface VerifyMobileResponse {
  verified: boolean;
  hasAccount?: boolean;
  reason?: string;
  message?: string;
  redirectTo?: string;
  customer?: {
    name: string;
    mobileNumber: string;
    companyName: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
  };
  registeredDevices?: RegisteredDevice[];
  totalDevices?: number;
}

type Step = "mobile" | "password" | "success" | "error";

// ====================== Password strength ======================
function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd) && /\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score = Math.min(4, score + 1);
  const clampedScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"];
  return { score: clampedScore, label: labels[clampedScore], color: colors[clampedScore] };
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0-9)", test: (p: string) => /\d/.test(p) },
  { label: "One special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ====================== Component ======================
export function CustomerRegistrationForm() {
  const router = useRouter();

  // ===== Mobile step state =====
  const [mobile, setMobile] = useState("");
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [verifiedData, setVerifiedData] = useState<VerifyMobileResponse | null>(null);

  // ===== Password step state =====
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // ===== Submit state =====
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState<Step>("mobile");

  // ===== Mobile input handler (digits only, max 10) =====
  function handleMobileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    if (mobileVerified) {
      // Reset verification when mobile changes
      setMobileVerified(false);
      setVerifiedData(null);
    }
    setMobileError("");
  }

  // ===== Verify mobile =====
  async function handleVerifyMobile(e?: React.FormEvent) {
    e?.preventDefault();
    if (mobile.length !== 10) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMobileVerifying(true);
    setMobileError("");

    try {
      const res = await fetch("/api/auth/verify-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data: VerifyMobileResponse = await res.json();

      if (data.hasAccount && data.redirectTo) {
        setMobileError(data.message ?? "An account already exists. Please sign in instead.");
        setStep("error");
        return;
      }

      if (!data.verified) {
        setMobileError(
          data.message ??
            "No registered QBIT device was found with this mobile number.",
        );
        return;
      }

      // Verified — show confirmation card + enable password step
      setVerifiedData(data);
      setMobileVerified(true);
      setStep("password");
    } catch {
      setMobileError("Could not verify your mobile number. Please try again.");
    } finally {
      setMobileVerifying(false);
    }
  }

  // ===== Submit registration =====
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!mobileVerified) {
      setSubmitError("Please verify your mobile number first.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setSubmitError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: mobile,
          password,
          confirmPassword,
          acceptTerms,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.reason === "DUPLICATE_ACCOUNT" && data.redirectTo) {
          setSubmitError(data.error);
          setStep("error");
          return;
        }
        setSubmitError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // ===== Auto-login after registration =====
      const signInResult = await signIn("credentials", {
        email: mobile, // provider treats 10-digit as mobile
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Account created but auto-login failed — redirect to login page
        setStep("success");
        setTimeout(() => {
          router.push("/accounts/login?from=register");
        }, 3000);
        return;
      }

      // Success — redirect to customer dashboard
      setStep("success");
      setTimeout(() => {
        window.location.href = "/customer";
      }, 1500);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== Render =====
  if (step === "success") {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-qbit-success/30 bg-qbit-success/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
            <Icon name="check_circle" className="text-[40px]" filled />
          </div>
          <h2 className="text-xl font-bold text-qbit-on-surface">Account Created Successfully!</h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">
            Your QBIT account has been created. Redirecting you to your dashboard…
          </p>
          <div className="mt-4 flex justify-center">
            <Icon name="progress_activity" className="animate-spin text-[24px] text-qbit-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-qbit-warning/30 bg-qbit-warning/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qbit-warning/15 text-qbit-warning">
            <Icon name="info" className="text-[40px]" filled />
          </div>
          <h2 className="text-xl font-bold text-qbit-on-surface">Account Already Exists</h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">
            {submitError || mobileError}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/accounts/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
            >
              <Icon name="login" className="text-[18px]" />
              Go to Sign In
            </Link>
            <button
              onClick={() => {
                setStep("mobile");
                setMobile("");
                setMobileVerified(false);
                setVerifiedData(null);
                setMobileError("");
                setSubmitError("");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-5 py-2.5 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
            >
              <Icon name="refresh" className="text-[18px]" />
              Try Different Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  const strength = passwordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password));

  return (
    <div className="w-full">
      {/* ===== Header ===== */}
      <div className="mb-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary">
          <span className="material-symbols-outlined text-[14px]">person_add</span>
          Customer Registration
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Create Your QBIT Account</h2>
        <p className="mt-1 text-sm text-qbit-on-surface-variant">
          Register your device to access warranty, drivers, downloads, manuals and support.
        </p>
      </div>

      {/* ===== Step indicator ===== */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${mobileVerified ? "bg-qbit-success text-white" : "bg-qbit-primary text-white"}`}>
          {mobileVerified ? <Icon name="check" className="text-[16px]" /> : "1"}
        </div>
        <div className={`h-0.5 w-12 ${mobileVerified ? "bg-qbit-success" : "bg-qbit-outline-variant"}`} />
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${mobileVerified ? (allRulesPassed && acceptTerms ? "bg-qbit-success text-white" : "bg-qbit-primary text-white") : "bg-qbit-surface-container-high text-qbit-on-surface-variant"}`}>
          2
        </div>
        <div className="h-0.5 w-12 bg-qbit-outline-variant" />
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-qbit-surface-container-high text-qbit-on-surface-variant">
          3
        </div>
      </div>

      {/* ===== Mobile verification card (shown when verified) ===== */}
      {mobileVerified && verifiedData && (
        <div className="mb-5 rounded-2xl border border-qbit-success/30 bg-qbit-success/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
              <Icon name="verified" className="text-[22px]" filled />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-qbit-on-surface">Registered Device Found</p>
              <div className="mt-2 space-y-1 text-xs text-qbit-on-surface-variant">
                <p><span className="font-semibold text-qbit-on-surface">Customer:</span> {verifiedData.customer?.name}</p>
                {verifiedData.customer?.companyName && (
                  <p><span className="font-semibold text-qbit-on-surface">Company:</span> {verifiedData.customer.companyName}</p>
                )}
                {verifiedData.registeredDevices?.[0] && (
                  <>
                    <p><span className="font-semibold text-qbit-on-surface">Product:</span> {verifiedData.registeredDevices[0].productName}</p>
                    <p><span className="font-semibold text-qbit-on-surface">Serial Number:</span> <span className="font-mono">{verifiedData.registeredDevices[0].serialNumber}</span></p>
                    <p>
                      <span className="font-semibold text-qbit-on-surface">Warranty:</span>{" "}
                      <span className={`font-semibold ${verifiedData.registeredDevices[0].warrantyStatus === "active" ? "text-qbit-success" : "text-qbit-error"}`}>
                        {verifiedData.registeredDevices[0].warrantyStatus === "active" ? "Active" : "Expired"}
                      </span>
                    </p>
                    {verifiedData.registeredDevices[0].purchaseDate && (
                      <p><span className="font-semibold text-qbit-on-surface">Purchase Date:</span> {new Date(verifiedData.registeredDevices[0].purchaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    )}
                    {verifiedData.totalDevices && verifiedData.totalDevices > 1 && (
                      <p className="mt-1 text-[11px] text-qbit-primary">+ {verifiedData.totalDevices - 1} more registered device(s)</p>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileVerified(false);
                  setVerifiedData(null);
                  setMobile("");
                  setStep("mobile");
                }}
                className="mt-2 text-[11px] font-semibold text-qbit-primary hover:underline"
              >
                Use a different mobile number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Error banner ===== */}
      {(mobileError || submitError) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-qbit-error/30 bg-qbit-error-container/40 px-3 py-2.5 text-xs font-medium text-qbit-on-error-container">
          <Icon name="error" className="text-[16px]" filled />
          {mobileError || submitError}
        </div>
      )}

      {/* ===== Mobile step form ===== */}
      {!mobileVerified && (
        <form onSubmit={handleVerifyMobile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Registered Mobile Number
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
                aria-label="Registered Mobile Number"
                className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-20 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-qbit-on-surface-variant/80">
              Enter the same mobile number used while purchasing your QBIT product or mentioned on your invoice.
              <br />
              <span className="font-medium text-qbit-on-surface-variant">We will verify this number against your registered device before creating your account.</span>
            </p>
          </div>

          <QbitButton
            type="submit"
            size="lg"
            fullWidth
            iconRight={mobileVerifying ? "progress_activity" : "verified"}
            disabled={mobileVerifying || mobile.length !== 10}
          >
            {mobileVerifying ? "Verifying…" : "Verify Mobile Number"}
          </QbitButton>
        </form>
      )}

      {/* ===== Password step form ===== */}
      {mobileVerified && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Create Password
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
                placeholder="Create a secure password"
                aria-label="Create Password"
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

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-qbit-outline-variant"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-qbit-on-surface-variant">{strength.label}</span>
                </div>
                <ul className="mt-2 grid grid-cols-1 gap-0.5">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5 text-[11px]">
                        <Icon
                          name={passed ? "check_circle" : "radio_button_unchecked"}
                          className={`text-[14px] ${passed ? "text-qbit-success" : "text-qbit-on-surface-variant/50"}`}
                        />
                        <span className={passed ? "text-qbit-success font-medium" : "text-qbit-on-surface-variant"}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Confirm Password
            </label>
            <div className="relative focus-within:scale-[1.01] transition-transform">
              <Icon
                name="lock"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant"
              />
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                aria-label="Confirm Password"
                className={`w-full rounded-xl border bg-qbit-surface-container-low py-3 pl-10 pr-10 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 ${
                  passwordsMismatch
                    ? "border-qbit-error focus:border-qbit-error focus:ring-qbit-error/30"
                    : passwordsMatch
                      ? "border-qbit-success focus:border-qbit-success focus:ring-qbit-success/30"
                      : "border-qbit-outline-variant focus:border-qbit-primary"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-qbit-on-surface-variant hover:text-qbit-primary"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                <Icon name={showConfirm ? "visibility_off" : "visibility"} className="text-[18px]" />
              </button>
            </div>
            {passwordsMatch && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-qbit-success">
                <Icon name="check_circle" className="text-[14px]" filled /> Passwords Match
              </p>
            )}
            {passwordsMismatch && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-qbit-error">
                <Icon name="cancel" className="text-[14px]" filled /> Passwords Do Not Match
              </p>
            )}
          </div>

          {/* T&C checkbox */}
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
              required
            />
            <span className="text-xs text-qbit-on-surface-variant">
              I agree to the{" "}
              <Link href="/support" className="font-semibold text-qbit-primary hover:underline">Terms & Conditions</Link>{" "}
              and{" "}
              <Link href="/support" className="font-semibold text-qbit-primary hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          {/* Submit */}
          <QbitButton
            type="submit"
            size="lg"
            fullWidth
            iconRight={submitting ? "progress_activity" : "arrow_forward"}
            disabled={submitting || !allRulesPassed || !passwordsMatch || !acceptTerms}
          >
            {submitting ? "Creating Account…" : "Create Account"}
          </QbitButton>
        </form>
      )}

      {/* ===== Footer ===== */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-qbit-outline-variant" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-qbit-on-surface-variant">
            Already have an account?
          </span>
        </div>
      </div>

      <Link
        href="/accounts/login"
        className="block w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 text-center text-sm font-semibold text-qbit-on-surface transition-all hover:border-qbit-primary/30 hover:bg-white"
      >
        Sign In Instead
      </Link>

      <p className="mt-6 text-center text-[11px] text-qbit-on-surface-variant">
        Need help?{" "}
        <Link href="/support" className="font-semibold text-qbit-primary hover:underline">
          Contact QBIT Support
        </Link>
      </p>
    </div>
  );
}
