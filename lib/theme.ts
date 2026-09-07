/**
 * Theme resolution — one definition, used by both the pre-paint inline script
 * in `app/layout.tsx` and the React `<ThemeToggle />`.
 *
 * Resolution order, highest wins:
 *   1. Explicit choice in localStorage["abdur-theme"] = "dark" | "light"
 *   2. Auto: the visitor's local clock — light 06:00–17:59, dark 18:00–05:59
 *   3. Fallback: dark
 *
 * The clock belongs to the visitor, so the theme can never be server-rendered:
 * a server component would pick one timezone for the whole world and then get
 * cached with it. Everything here runs on the client, and the bootstrap script
 * below runs *before first paint* so a night visitor never sees a white flash.
 */

export const THEME_STORAGE_KEY = "abdur-theme";

/** Light begins at 06:00 local. */
export const LIGHT_START_HOUR = 6;
/** Light ends at 18:00 local (exclusive) — 17:59 is the last light minute. */
export const LIGHT_END_HOUR = 18;

export type Theme = "light" | "dark";
/** "auto" is the default and is represented by the *absence* of the key. */
export type ThemeMode = "auto" | Theme;

/** Toggle order: Auto → Light → Dark → Auto. */
export const THEME_CYCLE: readonly ThemeMode[] = ["auto", "light", "dark"] as const;

export function themeForHour(hour: number): Theme {
  return hour >= LIGHT_START_HOUR && hour < LIGHT_END_HOUR ? "light" : "dark";
}

export function resolveTheme(mode: ThemeMode, now: Date = new Date()): Theme {
  if (mode === "light" || mode === "dark") return mode;
  return themeForHour(now.getHours());
}

/**
 * Milliseconds until the next 06:00/18:00 boundary, so a tab left open across
 * sunset flips instead of going stale. Only meaningful while mode is "auto".
 * Always at least 1s so a clock landing exactly on the boundary cannot spin.
 */
export function msUntilNextBoundary(now: Date = new Date()): number {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  const hour = now.getHours();
  if (hour < LIGHT_START_HOUR) {
    next.setHours(LIGHT_START_HOUR);
  } else if (hour < LIGHT_END_HOUR) {
    next.setHours(LIGHT_END_HOUR);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(LIGHT_START_HOUR);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * The blocking script injected into <head>. Interpolated from the constants
 * above so the pre-paint path and the React path can never disagree about the
 * key name or the boundary hours.
 *
 * Deliberately: no ES6 (runs before any bundle), each lookup in its own
 * try/catch (a locked-down browser that throws on localStorage must still get
 * the clock result, not the fallback), and dark if everything fails.
 */
export const THEME_BOOTSTRAP = `(function(){var t="dark";try{var h=new Date().getHours();t=(h>=${LIGHT_START_HOUR}&&h<${LIGHT_END_HOUR})?"light":"dark"}catch(e){}try{var v=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(v==="light"||v==="dark")t=v}catch(e){}document.documentElement.setAttribute("data-theme",t)})();`;
