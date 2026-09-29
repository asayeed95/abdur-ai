// Minimal Node resolve hook so `node --test` can import the Next.js route
// handlers directly: maps the tsconfig `@/*` alias to the repo root and adds
// the `.ts` extension to extensionless local imports, and lets extensionless
// deep imports of packages without an `exports` map (`next/server`,
// `next/cache`) resolve as Next's bundler would. Type stripping itself is
// Node's own (on by default since Node 22.18).
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function toTsFile(absPath) {
  const candidates = [`${absPath}.ts`, path.join(absPath, "index.ts")];
  if (path.extname(absPath)) candidates.unshift(absPath);
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  let target = null;
  if (specifier.startsWith("@/")) {
    target = toTsFile(path.join(ROOT, specifier.slice(2)));
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith("file:")
  ) {
    target = toTsFile(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
  }
  if (target) return nextResolve(pathToFileURL(target).href, context);
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    const bareDeepImport = /^[a-z@][^:]*\/[^.]+$/.test(specifier);
    if (err?.code === "ERR_MODULE_NOT_FOUND" && bareDeepImport) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
