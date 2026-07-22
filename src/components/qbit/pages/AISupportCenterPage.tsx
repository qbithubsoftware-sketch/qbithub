"use client";

/**
 * AISupportCenterPage — DEPRECATED.
 *
 * This page has been merged into SupportModulePage.
 * It now redirects to the unified Support module within Engineer Portal.
 */

import { useEffect } from "react";
import { useNavigation } from "@/lib/navigation/store";
import { SupportModulePage } from "@/components/qbit/pages/SupportModulePage";

export function AISupportCenterPage() {
  const navigate = useNavigation((s) => s.navigate);

  useEffect(() => {
    // Redirect to the unified support module
    navigate("support-tickets");
  }, [navigate]);

  // Render SupportModulePage as fallback (in case redirect hasn't triggered)
  return <SupportModulePage defaultTab="tickets" />;
}
