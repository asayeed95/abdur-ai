"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Captures first-touch session attribution (UTMs, landing path, external
 * referrer) on mount. Renders nothing; mounted once in the root layout.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
