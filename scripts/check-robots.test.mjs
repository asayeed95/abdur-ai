import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-robots.mjs', import.meta.url));
const policy = 'User-agent: *\nAllow: /\nAllow: /api/og$\nAllow: /api/og?\nDisallow: /api/\n';
function check(text) {
  const dir = mkdtempSync(path.join(tmpdir(), 'robots-test-'));
  try {
    const file = path.join(dir, 'robots.txt');
    writeFileSync(file, text);
    const result = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('exact route and query exception preserves the API boundary', () => {
  assert.equal(check(policy).status, 0);
});
test('broad OG prefix is rejected for adjacent and nested routes', () => {
  const result = check(policy.replace('Allow: /api/og$\nAllow: /api/og?', 'Allow: /api/og'));
  assert.equal(result.status, 1);
  assert.match(result.output, /may fetch \/api\/og-debug/);
  assert.match(result.output, /may fetch \/api\/og\/private/);
});
test('bare OG route must stay accessible too', () => {
  assert.equal(check(policy.replace('Allow: /api/og$\n', '')).status, 1);
});
test('most specific partial crawler token overrides wildcard', () => {
  const result = check(policy + '\nUser-agent: Slackbot-Link\nDisallow: /api/og\n');
  assert.equal(result.status, 1);
  assert.match(result.output, /Slackbot-LinkExpanding may NOT fetch/);
});
test('a longer token overrides a shorter matching group without merging it', () => {
  const specific = policy.replace('User-agent: *', 'User-agent: Slackbot-LinkExpanding');
  assert.equal(check(policy + '\nUser-agent: Slackbot-Link\nDisallow: /\n\n' + specific).status, 0);
});
test('equally specific groups merge case-insensitively', () => {
  const split = policy.replace('User-agent: *', 'User-agent: SLACKBOT-LINK');
  assert.equal(check(policy + '\n' + split + '\nUser-agent: slackbot-link\nDisallow: /api/og?\n').status, 0);
});
test('unknown records do not split consecutive agent declarations', () => {
  const result = check(policy + '\nUser-agent: Slackbot-Link\nSitemap: https://example.com/sitemap.xml\nUser-agent: Otherbot\nDisallow: /api/og\n');
  assert.equal(result.status, 1);
  assert.match(result.output, /Slackbot-LinkExpanding may NOT fetch/);
});
test('CR-only line endings are accepted', () => {
  assert.equal(check(policy.replaceAll('\n', '\r')).status, 0);
});
test('empty disallow and wildcard groups do not override named restrictions', () => {
  assert.equal(check(policy + '\nUser-agent: Twitterbot\nDisallow:\nDisallow: /api/og\n').status, 1);
});
test('an unrelated agent does not restrict card crawlers', () => {
  assert.equal(check(policy + '\nUser-agent: Otherbot\nDisallow: /\n').status, 0);
});
