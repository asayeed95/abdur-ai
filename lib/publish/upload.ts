/**
 * Local-file intake for image uploads (MCP `abdur_upload_image` filePath).
 *
 * This repo is public, so anything an agent uploads lands on a public draft
 * branch. A prompt-injected or careless agent must not be able to point at
 * ~/Desktop/anything.png and publish it. Reads are therefore confined to one
 * upload root, resolved through symlinks, and sized before they are read.
 */
import { readFile, realpath, stat } from "node:fs/promises";
import { sep } from "node:path";
import { DraftError, IMAGE_MAX_BYTES } from "./draft";

/** The directory uploads may come from: ABDUR_PUBLISH_UPLOAD_DIR, else the working directory. */
export function uploadRoot(env: Record<string, string | undefined> = process.env): string {
  return env.ABDUR_PUBLISH_UPLOAD_DIR || process.cwd();
}

/**
 * Base64 of `filePath` if — after resolving symlinks — it is a regular file
 * inside `root` and no larger than IMAGE_MAX_BYTES. Content-type checks
 * (magic bytes vs extension) stay in Publisher.uploadImage.
 */
export async function readUploadFile(filePath: string, root = uploadRoot()): Promise<string> {
  const realRoot = await realpath(root);
  let real: string;
  try {
    real = await realpath(filePath);
  } catch {
    throw new DraftError([`filePath not found: ${filePath}`]);
  }
  if (real !== realRoot && !real.startsWith(realRoot + sep)) {
    throw new DraftError([`filePath must be inside the upload root (${realRoot}); set ABDUR_PUBLISH_UPLOAD_DIR to change it`]);
  }
  const info = await stat(real);
  if (!info.isFile()) throw new DraftError([`filePath is not a regular file: ${filePath}`]);
  if (info.size > IMAGE_MAX_BYTES) throw new DraftError([`image is ${info.size} bytes; limit is ${IMAGE_MAX_BYTES}`]);
  return (await readFile(real)).toString("base64");
}
