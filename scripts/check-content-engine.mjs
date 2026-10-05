/** C-13: execute the published guides' examples and render via the post's MDX map. */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import matter from 'gray-matter';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MDXRemote as renderMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

const root = process.cwd();
const require = createRequire(import.meta.url);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-engine-'));
// Published 2026-10-05 (AGE-2391); previously content/posts/_drafts/<slug>.md.
const drafts = ['give-your-ai-agent-durable-memory', 'how-to-verify-ai-agent-work'];
/** Parse a published guide's frontmatter and MDX body. */
const readDraft = slug => matter(fs.readFileSync(path.join(root, 'content/posts', `${slug}.mdx`), 'utf8'));
/** Bodies of every fenced code block tagged `language`, in document order. */
const blocks = (text, language) => [...text.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(m => m[1]);
let checks = 0;
/** Count and print a passed check group. */
const pass = name => { checks++; console.log(`PASS ${name}`); };
/** Run a documented bash snippet in `cwd` with extra env; returns spawnSync's result. */
function shell(source, cwd = temp, env = {}) {
  return spawnSync('bash', ['-c', source], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
}
// Load the actual TS modules without generating files in the checkout.
const cache = new Map();
/** Stand-in for MDXRemote inside loaded TS; resolveMDX swaps it for the real renderer. */
function MDXSlot() { throw new Error('MDX slot must be resolved before render'); }
/** Transpile and evaluate a repo TS/TSX module in a VM, with `process.cwd()` pinned to `cwd`. */
function loadTS(file, cwd = root) {
  const absolute = path.resolve(root, file);
  const key = `${cwd}:${absolute}`;
  if (cache.has(key)) return cache.get(key);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Date, Buffer, console,
    process: { ...process, cwd: () => cwd },
    require: id => {
      if (id === 'next-mdx-remote/rsc') return { MDXRemote: MDXSlot };
      if (id === 'remark-gfm') return remarkGfm;
      if (id === 'rehype-slug') return rehypeSlug;
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(absolute), id);
        const target = [base, `${base}.ts`, `${base}.tsx`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        assert.ok(target, `Cannot resolve ${id}`);
        return loadTS(target, cwd);
      }
      return require(id);
    },
  }, { filename: absolute });
  cache.set(key, module.exports);
  return module.exports;
}
/** Walk a React tree and replace each MDXSlot with the rendered MDX output. */
async function resolveMDX(node) {
  if (!React.isValidElement(node)) return node;
  if (node.type === MDXSlot) return await renderMDX(node.props);
  if (node.props.children === undefined) return node;
  const children = await Promise.all(React.Children.toArray(node.props.children).map(resolveMDX));
  return React.cloneElement(node, undefined, ...children);
}
try {
  const memory = readDraft(drafts[0]);
  const verification = readDraft(drafts[1]);
  const moduleFile = path.join(temp, 'memory.mjs');
  fs.writeFileSync(moduleFile, blocks(memory.content, 'js')[0]);
  const log = path.join(temp, 'agent-memory.jsonl');
  const oldLog = process.env.MEMORY_LOG;
  process.env.MEMORY_LOG = log;
  const api = await import(pathToFileURL(moduleFile).href);
  if (oldLog === undefined) delete process.env.MEMORY_LOG; else process.env.MEMORY_LOG = oldLog;
  const commands = blocks(memory.content, 'bash')[0];
  const restart = shell(commands, temp, { MEMORY_LOG: log });
  assert.equal(restart.status, 0, restart.stderr);
  assert.match(restart.stdout, /metric/);
  assert.equal(api.loadEvents().length, 1);
  if (process.platform !== 'win32') assert.equal(fs.statSync(log).mode & 0o777, 0o600, 'fresh log must be 0600');
  pass('memory persists across the two documented Node processes; fresh log is owner-only');

  if (process.platform !== 'win32') {
    const before = fs.readFileSync(log);
    fs.chmodSync(log, 0o644);
    assert.throws(() => api.loadEvents(), /open to other users/);
    assert.throws(() => api.remember('decision', {}), /open to other users/);
    assert.deepEqual(fs.readFileSync(log), before);
    fs.chmodSync(log, 0o600);
    assert.equal(api.loadEvents().length, 1);
    pass('existing log with group/other permissions is refused for reads and writes');
  }

  fs.appendFileSync(log, '{"ts":');
  assert.equal(api.loadEvents().length, 1);
  api.remember('decision', { plan: 'B' });
  assert.equal(api.loadEvents().length, 2);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 2);
  fs.appendFileSync(log, 'not-json\n');
  const corrupt = fs.readFileSync(log);
  assert.throws(() => api.loadEvents());
  assert.throws(() => api.remember('decision', {}));
  assert.deepEqual(fs.readFileSync(log), corrupt);
  // Invalid UTF-8 (0xff) inside a complete record's JSON string is corruption, not U+FFFD.
  const good = Buffer.from(JSON.stringify({ ts: new Date().toISOString(), kind: 'note', data: 'ok' }) + '\n');
  const badUtf8 = Buffer.concat([Buffer.from('{"ts":"2026-10-05T00:00:00Z","kind":"note","data":"a'), Buffer.from([0xff]), Buffer.from('"}\n')]);
  fs.writeFileSync(log, Buffer.concat([good, badUtf8]));
  assert.throws(() => api.loadEvents(), TypeError);
  assert.throws(() => api.remember('decision', {}), TypeError);
  assert.deepEqual(fs.readFileSync(log), Buffer.concat([good, badUtf8]));
  fs.writeFileSync(log, Buffer.concat([good, Buffer.from([0xe7, 0x95])])); // Split multibyte tail stays recoverable.
  assert.equal(api.loadEvents().length, 1);
  pass('incomplete tail recovers; complete corruption (bad JSON or invalid UTF-8) refuses reads/writes');

  fs.writeFileSync(log, '');
  assert.throws(() => api.remember('tool', 'x'.repeat(4096)), /too large/);
  assert.throws(() => api.remember(' ', {}), /Invalid/);
  assert.throws(() => api.remember('missing', undefined), /Invalid/);
  for (let i = 0; i < 30; i++) api.remember('tool', { i, text: '界'.repeat(500) });
  const context = api.loadMemory();
  assert.ok(Buffer.byteLength(context) <= 8192);
  assert.match(context, /"i":29/);
  assert.doesNotMatch(context, /"i":0,/);
  assert.match(context, /older records omitted/);
  assert.equal(api.loadEvents().length, 30);
  const record = fs.readFileSync(log, 'utf8').split('\n')[0] + '\n';
  fs.writeFileSync(log, record.repeat(Math.floor((1024 * 1024) / Buffer.byteLength(record))));
  const full = fs.readFileSync(log);
  assert.throws(() => api.remember('tool', '界'.repeat(650)), /Log full/);
  assert.deepEqual(fs.readFileSync(log), full);
  fs.writeFileSync(log, 'x'.repeat(1024 * 1024 + 1));
  assert.throws(() => api.loadEvents(), /Log too large/);
  pass('event/log limits refuse excess; UTF-8 replay stays bounded without erasing history');

  const bash = blocks(verification.content, 'bash');
  const provenance = bash.find(b => b.startsWith('jq -e -s'));
  const valid = { verifier: 'reviewer', timestamp: '2026-10-03T22:00:00Z', source_sha: 'a'.repeat(40) };
  const cases = [
    [JSON.stringify(valid), true],
    [JSON.stringify({ ...valid, source_sha: 'a'.repeat(64) }), true],
    ['', false], ['{}', false], ['null', false], ['{', false],
    ...['', '  ', null, 1, []].map(verifier => [JSON.stringify({ ...valid, verifier }), false]),
    ...['', 'yesterday', '2026-02-30T22:00:00Z', 1].map(timestamp => [JSON.stringify({ ...valid, timestamp }), false]),
    ...['', 'abc123', 123, 'g'.repeat(40)].map(source_sha => [JSON.stringify({ ...valid, source_sha }), false]),
    [JSON.stringify(valid) + '\n{}', false],
  ];
  for (const [text, expected] of cases) {
    fs.writeFileSync(path.join(temp, 'verify.jsonl'), text);
    const result = shell(provenance);
    assert.equal(result.status === 0, expected, `provenance ${text}: ${result.stderr}`);
  }
  pass(`provenance predicate accepts/rejects ${cases.length} actual manifests`);

  fs.mkdirSync(path.join(temp, 'scripts'));
  const gate = bash.find(b => b.startsWith('if ./scripts/check-phase'));
  for (const exit of [0, 7]) {
    fs.writeFileSync(path.join(temp, 'scripts/check-phase.sh'), `#!/bin/sh\nexit ${exit}\n`, { mode: 0o755 });
    assert.equal(shell(gate).status, exit);
  }
  const ancestor = bash.find(b => b.startsWith('if git merge-base'));
  // A private history fixture also works in CI's depth-one checkout.
  const history = path.join(temp, 'history');
  fs.mkdirSync(path.join(history, 'lib'), { recursive: true });
  const git = args => execFileSync('git', args, { cwd: history, encoding: 'utf8' }).trim();
  git(['init', '-q']);
  fs.writeFileSync(path.join(history, 'lib/posts.ts'), 'first revision');
  git(['add', 'lib/posts.ts']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'first']);
  const base = git(['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(history, 'lib/posts.ts'), 'second revision');
  git(['add', 'lib/posts.ts']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'second']);
  const head = git(['rev-parse', 'HEAD']);
  const included = shell(ancestor, history, { REVIEW_SHA: base, BASE_SHA: head });
  assert.equal(included.status, 0, included.stderr);
  assert.match(included.stdout, /is an ancestor/);
  const absent = shell(ancestor, history, { REVIEW_SHA: head, BASE_SHA: base });
  assert.equal(absent.status, 0, absent.stderr);
  assert.match(absent.stdout, /is not an ancestor/);
  assert.notEqual(shell(ancestor, history, { REVIEW_SHA: 'not-a-revision', BASE_SHA: base }).status, 0);
  pass('gate preserves failure exit; ancestry distinguishes included, absent and invalid revisions');

  const fixture = path.join(temp, 'posts-fixture');
  fs.mkdirSync(path.join(fixture, 'content/posts'), { recursive: true });
  for (const [slug, date, tags, section] of [
    ['self', '2026-10-01', '[memory]', 'Agent Systems'],
    ['explicit', '2026-01-01', '[]', 'Other'],
    ['newer', '2026-09-03', '[memory]', 'Agent Systems'],
    ['older', '2026-09-02', '[memory]', 'Agent Systems'],
    ['unrelated', '2026-09-04', '[]', 'Other'],
    // Non-string YAML tags (number, null, bool, map) must not crash related-post scoring.
    ['mixed', '2026-08-01', '[2026, null, true, {a: 1}, Memory]', 'Other'],
    ['scalar', '2026-08-02', 'memory', 'Other'],
  ]) fs.writeFileSync(path.join(fixture, 'content/posts', `${slug}.mdx`), `---\nslug: ${slug}\ndate: '${date}'\nregister: argued\ntags: ${tags}\nsection: ${section}\n---\nText`);
  const fixturePosts = loadTS('lib/posts.ts', fixture);
  const self = fixturePosts.getPost('self');
  assert.deepEqual([...fixturePosts.getPost('mixed').tags], ['Memory']);
  assert.deepEqual([...fixturePosts.getPost('scalar').tags], []);
  assert.equal(fixturePosts.getRelatedPosts(fixturePosts.getPost('mixed'), 6).map(p => p.slug).join(','), 'self,unrelated,newer,older,scalar,explicit');
  self.related = ['missing', 'self', 'explicit', 'explicit'];
  assert.equal(fixturePosts.getRelatedPosts(self).map(p => p.slug).join(','), 'explicit,newer,older');
  assert.equal(fixturePosts.getRelatedPosts(self, 5).map(p => p.slug).join(','), 'explicit,newer,older,mixed');
  for (const limit of [0, -1, -0.5, 0.5, NaN, Infinity]) assert.equal(fixturePosts.getRelatedPosts(self, limit).length, 0);
  assert.equal(fixturePosts.getRelatedPosts(self, 1).length, 1);
  assert.equal(fixturePosts.getRelatedPosts(self, 1.5).length, 1);
  pass('related posts honor explicit order, dedupe, self exclusion, date ties and limit bounds');

  const posts = loadTS('lib/posts.ts');
  const { PostArticle } = loadTS('components/post/PostArticle.tsx');
  for (const slug of drafts) {
    const { data, content } = readDraft(slug);
    assert.ok(data.description.length <= 155, `${slug} description length ${data.description.length}`);
    assert.ok((data.seo_title + ' · abdur.ai').length <= 60);
    assert.equal(data.slug, slug, 'frontmatter slug must match the filename');
    const post = posts.getPost(slug);
    assert.ok(post, 'published guide must be in the post corpus');
    assert.equal(posts.getPostSource(slug), content);
    const tree = PostArticle({ post, source: content, prev: null, next: null });
    const html = renderToStaticMarkup(await resolveMDX(tree));
    assert.ok(html.includes('Short answer:'));
    assert.ok(html.includes('/subscribe'));
    assert.ok(html.includes('BreadcrumbList'));
    assert.ok(!html.includes('AppendOnlyMemoryDiagram') && !html.includes('VerificationLoopDiagram'));
    fs.writeFileSync(path.join(temp, `${slug}.html`), html);
    pass(`rendered ${slug} through PostArticle and its actual MDX component map`);
  }
  console.log(`${checks}/${checks} groups passed.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
