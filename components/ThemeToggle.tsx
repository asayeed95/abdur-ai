"use client";

import { useCallback, useEffect, useState } from "react";
import {
  msUntilNextBoundary,
  resolveTheme,
  THEME_CYCLE,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeMode,
} from "@/lib/theme";

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Tri-state theme control: Auto → Light → Dark → Auto.
 *
 * "Auto" is the default for a first-time visitor and is stored as the *absence*
 * of the key, so choosing it clears the override rather than writing a third
 * value. The label shows the resolved theme, marked when it was chosen for you
 * ("Auto · Dark") — otherwise a visitor on Auto at night cannot tell whether
 * the site is dark because of the clock or because they once picked dark.
 */
export function ThemeToggle() {
  // null until mounted: the server cannot know the visitor's clock or storage,
  // so there is nothing honest to render until we are on the client.
  const [mode, setMode] = useState<ThemeMode | null>(null);
  const [resolved, setResolved] = useState<Theme>("dark");

  useEffect(() => {
    const initial = readMode();
    setMode(initial);
    setResolved(resolveTheme(initial));
  }, []);

  // Apply and persist whenever the mode changes.
  useEffect(() => {
    if (mode === null) return;
    const next = resolveTheme(mode);
    setResolved(next);
    apply(next);
    try {
      if (mode === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* private mode / storage disabled — the choice just won't survive reload */
    }
  }, [mode]);

  // On Auto only: re-resolve at the next 06:00/18:00 boundary so a tab left
  // open across sunset flips instead of going stale.
  useEffect(() => {
    if (mode !== "auto") return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const next = resolveTheme("auto");
        setResolved(next);
        apply(next);
        schedule();
      }, msUntilNextBoundary());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [mode]);

  // Storage is shared across tabs; keep them in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setMode(readMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cycle = useCallback(() => {
    setMode((current) => {
      const i = THEME_CYCLE.indexOf(current ?? "auto");
      return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
    });
  }, []);

  const label =
    mode === null
      ? "Theme"
      : mode === "auto"
        ? `Auto · ${resolved === "light" ? "Light" : "Dark"}`
        : resolved === "light"
          ? "Light"
          : "Dark";

  const nextMode =
    mode === null ? "auto" : THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-live="polite"
      title={
        mode === null
          ? "Switch theme"
          : `Theme: ${mode === "auto" ? `automatic, currently ${resolved}` : mode}. Click for ${nextMode}.`
      }
      className="flex items-center gap-2.5 bg-transparent border border-border rounded-full pl-2 pr-3 py-1.5 cursor-pointer text-text hover:border-clay hover:text-clay font-mono text-[10px] tracking-widest uppercase transition-colors"
    >
      <span className="w-5 h-5 rounded-full bg-surface flex items-center justify-center flex-none">
        {resolved === "light" ? (
          <span
            aria-hidden
            className="w-2 h-2 rounded-full bg-current"
            style={{
              boxShadow:
                "0 -7px 0 -2.5px currentColor,0 7px 0 -2.5px currentColor,-7px 0 0 -2.5px currentColor,7px 0 0 -2.5px currentColor,5px 5px 0 -2.5px currentColor,-5px -5px 0 -2.5px currentColor,5px -5px 0 -2.5px currentColor,-5px 5px 0 -2.5px currentColor",
            }}
          />
        ) : (
          <span aria-hidden className="relative block w-3 h-3 rounded-full bg-current overflow-hidden">
            <span className="absolute -top-1 -left-1.5 block w-3 h-3 rounded-full bg-surface" />
          </span>
        )}
      </span>
      {/* Fixed min-width: the label changes length (Dark → Auto · Light) and
          the nav must not reflow when it does. */}
      <span className="min-w-[74px] text-left">{label}</span>
    </button>
  );
}
