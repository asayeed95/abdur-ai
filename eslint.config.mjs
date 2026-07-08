import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Minimal flat config so `next lint` / `eslint .` run non-interactively.
// Previously this repo had NO eslint config at all, which makes `next lint`
// block on an interactive setup prompt — useless in a pre-commit hook or CI.
// This is wiring, not design: do not add rules beyond next's own presets
// without a reason (see CLAUDE.md — "do not redesign" applies to config too).
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The locked Clay design system uses a literal "/// LABEL" prefix as
      // the eyebrow-text convention across every page (see CLAUDE.md — design
      // is locked, do not touch). ESLint's heuristic flags any JSX text node
      // starting with "//" as an accidental comment. Here it's real,
      // intentional copy, not a stray comment — disabling this one rule beats
      // rewriting the JSX (which would risk mangling the eyebrow text) or
      // sprinkling disable comments across ~15 files for the same false
      // positive.
      "react/jsx-no-comment-textnodes": "off",
    },
  },
];

export default eslintConfig;
