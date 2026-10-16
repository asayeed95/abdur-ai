#!/usr/bin/env node
/**
 * Builds public/kit/agent-reliability-kit.zip from the kit's source files
 * (AGE-2391). Node built-ins only, no zip dependency.
 *
 * Deterministic: the same input bytes always give the same zip bytes. Entries
 * are sorted, stored uncompressed (method 0, so no zlib-version drift), carry
 * a fixed 1980-01-01 00:00 DOS timestamp and fixed Unix mode 0644, and no
 * extra fields. Everything sits under one top-level folder so unzipping never
 * scatters files into the current directory.
 *
 * Usage:
 *   node scripts/build-kit.mjs           # write the zip
 *   node scripts/build-kit.mjs --check   # exit 1 if the committed zip is stale
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KIT = join(ROOT, "public", "kit");
const OUT = join(KIT, "agent-reliability-kit.zip");
const PREFIX = "agent-reliability-kit/";

/** The kit, by path relative to public/kit. Listed, not globbed, so a stray file never ships. */
const FILES = [
  "README.md",
  "agent-verification-checklist.md",
  "durable-memory-starter/README.md",
  "durable-memory-starter/memory.mjs",
  "incident-postmortem-template.md",
].sort();

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0; // 00:00:00
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const UNIX_FILE_0644 = (0o100644 << 16) >>> 0;
const UTF8_FLAG = 1 << 11;

function buildZip() {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const rel of FILES) {
    const data = readFileSync(join(KIT, rel));
    const name = Buffer.from(PREFIX + rel, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed: 2.0
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(0, 8); // method: stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, 2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(UNIX_FILE_0644, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(FILES.length, 8);
  end.writeUInt16LE(FILES.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, ...centrals, end]);
}

const zip = buildZip();

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT) : null;
  if (!current || !current.equals(zip)) {
    console.error("public/kit/agent-reliability-kit.zip is stale: run `npm run kit:build` and commit it.");
    process.exit(1);
  }
  console.log(`kit zip up to date (${FILES.length} files, ${zip.length} bytes)`);
} else {
  writeFileSync(OUT, zip);
  console.log(`wrote public/kit/agent-reliability-kit.zip (${FILES.length} files, ${zip.length} bytes)`);
}
