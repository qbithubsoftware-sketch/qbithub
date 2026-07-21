"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { Icon } from "../primitives/Icon";
import { QbitButton } from "../primitives/QbitButton";
import { ScreenSwitcher } from "../shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";
import { homeScreenForRole, portalRouteForRole, type Role } from "@/lib/rbac/roles";

type LoginState = "idle" | "loading" | "error";

export function LoginPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="flex min-h-screen bg-qbit-surface-container-lowest">
      {/* Floating Screen Switcher — for design demo */}
      <div className="fixed top-4 right-4 z-50">
        <ScreenSwitcher />
      </div>

      {/* ===== Left brand panel (Stitch: lg:w-3/5 xl:w-2/3, justify-center, items-center) ===== */}
      <div className="relative hidden lg:flex lg:w-3/5 xl:w-2/3 flex-col justify-center items-center overflow-hidden bg-qbit-primary-container p-12 xl:p-16">
        {/* Background overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url(/qbit-hero-illustration.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-qbit-primary/80 via-qbit-primary-container/40 to-transparent" />

        {/* Center content (Stitch: p-2xl max-w-2xl text-on-primary, centered) */}
        <div className="relative z-10 p-8 max-w-2xl text-qbit-on-primary-container">
          {/* Brand badge (Stitch: glass pill with white/20 bg) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-lg rounded-full text-sm font-medium mb-8">
            <Icon name="verified" className="text-[16px]" filled />
            Enterprise Installation Management
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white mb-5">
            Precision Engineering for Modern POS Systems.
          </h1>
          <p className="text-base xl:text-lg leading-relaxed text-qbit-on-primary-container/85 mb-12">
            Manage hardware lifecycles, installation workflows, and driver deployments across your global enterprise fleet with QBIT Hub.
          </p>

          {/* Micro stats (Stitch: grid grid-cols-2 gap-lg mt-3xl, glass-panel p-md rounded-xl border border-white/20) */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel p-4 rounded-xl border border-white/20">
              <p className="text-2xl font-bold text-white">12,400+</p>
              <p className="text-xs text-qbit-on-primary-container/80 mt-1">Active Drivers</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/20">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-qbit-on-primary-container/80 mt-1">Uptime Reliability</p>
            </div>
          </div>
        </div>

        {/* Footer (absolute bottom) */}
        <div className="absolute bottom-8 left-12 xl:left-16 z-10 flex items-center gap-4 text-xs text-qbit-on-primary-container/70">
          <span>© 2024 QBIT Hub Technology Group</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>

      {/* ===== Right form panel (Stitch: w-full lg:w-2/5 xl:w-1/3, justify-between) ===== */}
      <div className="flex w-full lg:w-2/5 xl:w-1/3 flex-col justify-between bg-qbit-surface-container-lowest p-8 md:p-12 xl:p-16 relative">
        {/* Top: brand + form */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary text-qbit-on-primary">
                <Icon name="bolt" className="text-[22px]" filled />
              </div>
              <span className="text-lg font-bold text-qbit-on-surface">QBIT Hub</span>
            </div>

            <h2 className="text-2xl font-bold text-qbit-on-surface">Welcome Back</h2>
            <p className="mt-2 text-sm text-qbit-on-surface-variant">
              Sign in to manage your enterprise POS infrastructure.
            </p>

            {/* Form */}
            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginState("loading");
                setErrorMessage("");
                const result = await signIn("credentials", {
                  email,
                  password,
                  redirect: false,
                });
                if (result?.error) {
                  setLoginState("error");
                  setErrorMessage("Invalid email or password. Please try again.");
                  return;
                }
                const session = await getSession();
                const role = session?.user?.role as Role | undefined;
                // V3 Enterprise architecture: post-login, redirect each role
                // to its dedicated portal URL via portalRouteForRole().
                //   super_administrator → /super-admin
                //   administrator       → /admin
                //   installation_engineer → /engineer
                //   support_engineer    → /engineer (unified Support module)
                //   sales/dealer/viewer → /portal
                //   public_customer     → /customer (shouldn't happen here, but safe)
                if (typeof window !== "undefined") {
                  if (role) {
                    navigate(homeScreenForRole(role));
                    window.location.href = portalRouteForRole(role);
                  } else {
                    window.location.href = "/enterprise/login";
                  }
                } else {
                  navigate(role ? homeScreenForRole(role) : "home");
                }
              }}
            >
              {/* Error banner */}
              {loginState === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-qbit-error/30 bg-qbit-error-container/40 px-3 py-2.5 text-xs font-medium text-qbit-on-error-container">
                  <Icon name="error" className="text-[16px]" filled />
                  {errorMessage}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5">
                  Corporate Email
                </label>
                <div className="relative group focus-within:scale-[1.01] transition-transform">
                  <Icon
                    name="mail"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    aria-label="Corporate Email"
                    className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-10 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5">
                  Password
                </label>
                <div className="relative group focus-within:scale-[1.01] transition-transform">
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

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
                  />
                  <span className="text-xs font-medium text-qbit-on-surface-variant">Remember Device</span>
                </label>
                <a href="#" className="text-xs font-semibold text-qbit-primary hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <QbitButton
                type="submit"
                size="lg"
                fullWidth
                iconRight={loginState === "loading" ? "progress_activity" : "arrow_forward"}
                disabled={loginState === "loading"}
              >
                {loginState === "loading" ? "Signing in…" : "Login to Dashboard"}
              </QbitButton>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-qbit-outline-variant" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-qbit-surface-container-lowest px-3 text-xs font-medium text-qbit-on-surface-variant">
                  or continue with
                </span>
              </div>
            </div>

            {/* SSO */}
            <QbitButton variant="outline" size="lg" fullWidth icon="security">
              Single Sign-On (SSO)
            </QbitButton>
          </div>
        </div>

        {/* Bottom: system info (absolute bottom, like Stitch) */}
        <div className="pt-8 border-t border-qbit-outline-variant">
          <div className="flex items-center justify-between text-xs text-qbit-on-surface-variant mb-3">
            <span className="font-medium">System Build</span>
            <span className="font-mono text-qbit-on-surface">v2.4.12-enterprise</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="mailto:support@qbithub.io" className="flex items-center gap-1.5 text-xs font-medium text-qbit-on-surface-variant hover:text-qbit-primary">
              <Icon name="contact_support" className="text-[14px]" /> Support Hub
            </a>
            <a href="#" className="flex items-center gap-1.5 text-xs font-medium text-qbit-on-surface-variant hover:text-qbit-primary">
              <Icon name="terminal" className="text-[14px]" /> API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
