"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { Icon } from "../primitives/Icon";
import { QbitButton } from "../primitives/QbitButton";
import { ScreenSwitcher } from "../shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";
import { homeScreenForRole, type Role } from "@/lib/rbac/roles";

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
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-3/5 xl:w-2/3 flex-col justify-between overflow-hidden bg-qbit-primary-container p-12 xl:p-16">
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

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-on-primary-container/15 text-qbit-on-primary-container backdrop-blur-sm">
            <Icon name="bolt" className="text-[22px]" filled />
          </div>
          <span className="text-lg font-bold text-qbit-on-primary-container">QBIT Hub</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-xl">
          <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-qbit-on-primary-container">
            <Icon name="verified" className="text-[14px]" filled />
            Enterprise Installation Management
          </div>
          <h1 className="mt-6 text-4xl xl:text-5xl font-bold leading-tight text-white">
            Precision Engineering for Modern POS Systems.
          </h1>
          <p className="mt-5 text-base xl:text-lg leading-relaxed text-qbit-on-primary-container/85">
            Manage hardware lifecycles, installation workflows, and driver deployments across your global enterprise fleet with QBIT Hub.
          </p>
          {/* Micro stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-2xl font-bold text-white">12,400+</p>
              <p className="text-xs text-qbit-on-primary-container/80 mt-1">Active Drivers</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-qbit-on-primary-container/80 mt-1">Uptime Reliability</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-qbit-on-primary-container/70">
          <span>© 2024 QBIT Hub Technology Group</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-2/5 xl:w-1/3 flex-col justify-center px-6 py-12 sm:px-12 lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary text-qbit-on-primary">
              <Icon name="dataset" className="text-[22px]" filled />
            </div>
            <span className="text-lg font-bold text-qbit-on-surface">QBIT Hub</span>
          </div>

          <h2 className="text-3xl font-bold text-qbit-on-surface">Welcome Back</h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">
            Sign in to manage your enterprise POS infrastructure.
          </p>

          {/* Form */}
          <form
            className="mt-8 space-y-5"
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
              // Refresh the session in the React context so AuthGuard sees
              // the authenticated state immediately, then navigate.
              const session = await getSession();
              const role = session?.user?.role as Role | undefined;
              navigate(role ? homeScreenForRole(role) : "home");
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
                  className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-10 pr-10 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-qbit-on-surface-variant hover:text-qbit-primary"
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

          {/* Footer */}
          <div className="mt-10 space-y-2 border-t border-qbit-outline-variant pt-6">
            <div className="flex items-center justify-between text-xs text-qbit-on-surface-variant">
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
    </div>
  );
}
