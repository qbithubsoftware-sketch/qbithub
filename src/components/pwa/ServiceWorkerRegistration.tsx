"use client";

/**
 * ServiceWorkerRegistration — client component that registers /sw.js.
 *
 * Rendered once from RootLayout. Logs success/failure to console.
 * On update found, prompts user to refresh (via toast in future).
 */

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        console.log("[PWA] Service worker registered:", registration.scope);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] Update available — new service worker installed.");
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("[PWA] Controller changed — new service worker active.");
        });
      } catch (err) {
        console.warn("[PWA] Service worker registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
