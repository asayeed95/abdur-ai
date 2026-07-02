---
slug: the-last-fifteen-percent
title: "The last fifteen percent"
subtitle: "A launch postmortem: five gates between a green dev server and a live URL"
description: "The handoff said the site was 85% done — finish wiring and deploy. The last 15% surfaced five failures. Every one passed some local notion of 'done.' None of them survived the next gate up."
dek: "A green dev server caught nothing. The production build caught two type errors. The deploy platform refused two dependencies outright. 'Done on my machine' shipped exactly zero of it."
date: 2026-06-28T02:15:00-04:00
author: Abdur Rahman Sayeed
section: "Shipping"
draft: true
flagship: false
pinned: false
featured: false
reading_time: 7
tags:
  - shipping
  - deployment
  - vercel
  - nextjs
  - postmortem
  - moll
patterns:
  - id: P-013
    name: Local-green is not deploy-green
  - id: P-014
    name: The typed contract YAML quietly violates
  - id: P-015
    name: Security gates moved to the deploy boundary
  - id: P-016
    name: The handoff doc encodes the pre-gate world
receipts:
  - path: "lib/posts.ts"
    sha: "82c5c59"
    note: "YAML parsed `date:` frontmatter into a JS Date; the type said string. Coerced to ISO at the source — fixed the homepage and /llms.txt 500s in one edit."
  - path: "components/Reveal.tsx"
    sha: "82c5c59"
    note: "Added HTML-attribute passthrough so section `id` anchors forward; JSX.IntrinsicElements -> React.JSX.IntrinsicElements for React 19 types. Both only surfaced under `next build`."
  - path: ".npmrc"
    sha: "6ede7d1"
    note: "legacy-peer-deps=true — next@15 peer-wanted a React 19 RC, not stable 19.0.0. Local install needed the flag; Vercel's remote install needed it committed."
  - path: "package.json"
    sha: "ce3fa9c"
    note: "Next.js 15.0.3 -> 15.5.19. Vercel refused to deploy the CVE-flagged version. Build had already completed."
  - path: "package.json"
    sha: "452a959"
    note: "next-mdx-remote 5.0.0 -> 6.0.0. Same refusal. The handoff doc said to downgrade to 4.4.1 — the exact wrong direction."
citation_preferred: "Sayeed, Abdur Rahman. 'The last fifteen percent.' abdur.ai, 28 June 2026."
related:
  - the-night-the-doctrine-failed
  - who-owns-the-architecture-when-ai-writes-the-code
---

The handoff doc was confident: the site was scaffolded to about 85% complete. Visual design locked, content locked, architecture locked. The remaining job was to finish the wiring and deploy. A clean evening.

The last fifteen percent took five fixes to clear. Not one of them was a design decision or a missing feature. Every single one was a failure that had been sitting in the "done" pile the whole time — invisible because the gate that would have caught it hadn't run yet.

That's the whole story, and it's the same story as [the agent-audit one](/aitldr/the-night-the-doctrine-failed): a thing can pass every check you happen to be running and still be broken. There it was Potemkin *verification*. Here it was Potemkin *done*.

## The five

| # | Looked done because | Actually failed at | The real fix |
|---|---|---|---|
| 1 | `package.json` was filled in | `npm install` (ERESOLVE) | `.npmrc legacy-peer-deps=true` |
| 2 | The dev server rendered | first request to `/` and `/llms.txt` (500) | coerce YAML dates to ISO strings |
| 3 | The dev server compiled | `next build` (two type errors) | forward `id` props + React 19 JSX namespace |
| 4 | The build completed | Vercel's deploy gate (CVE) | Next.js 15.0.3 → 15.5.19 |
| 5 | The build completed again | Vercel's deploy gate (CVE) | next-mdx-remote 5.0.0 → 6.0.0 |

Read the middle column top to bottom. That's a ladder. Each failure was caught one rung higher than the last: install, then runtime, then build, then platform. The dev server — the thing most people mean when they say "it works" — caught the fewest of them. It caught none.

## Gate 1: the dev server lies by omission

`next dev` is a generous host. It compiles per-route, on demand, and it does not type-check. So the first time I ran it, five of the seven routes were green and I almost believed the 85% number.

Two routes returned 500. The homepage threw `Objects are not valid as a React child (found: [object Date])`. `/llms.txt` threw `flagship.date.slice is not a function`.

Same root cause, two costumes. The MDX frontmatter had `date: 2026-06-25T03:30:00-04:00`, unquoted. YAML helpfully parses that into a JavaScript `Date` object. The post loader's type declared `date: string`. The type was a polite fiction — at runtime it was a `Date`. The post page survived because it wrapped the value in `new Date(...)`, which swallows a `Date` happily. The homepage rendered it raw as a React child, and `/llms.txt` called `.slice()` on it. A `Date` has no `.slice()`.

The fix was one helper at the source — coerce to ISO once, in the loader, so the `string` contract stops lying — and both 500s closed together. **(P-014: a typed contract is only as true as the parser feeding it. YAML's date coercion will violate `: string` and TypeScript will never know, because the lie happens at the I/O boundary, past the type system.)**

## Gate 2: the build type-checks what dev waved through

With the routes green in dev, I ran `next build` — because the dev server's 200 is not Vercel's 200, and the build is the first place TypeScript actually runs in anger.

It failed twice. First: `Property 'id' does not exist` on the `<Reveal>` wrapper. The component took `children`, `className`, `as` — and seven sections were passing it an `id`, because those ids are the anchor targets the homepage nav scrolls to. The prop contract had never allowed the thing the whole layout depended on. Dev never cared. The build did.

Fixed that, ran again. Second: `Cannot find namespace 'JSX'`. React 19's types removed the global `JSX` namespace; it lives under `React.JSX` now. That line had been wrong since the scaffold was written — it just never got compiled until the build reached it.

Two errors, both latent, both invisible to a running dev server, both surfaced the instant a stricter gate ran. **(P-013: local-green is not deploy-green. The dev server, the production build, and the deploy platform are three escalating gates, and "it runs" only clears the lowest one.)**

## Gate 3: the platform refuses what the build accepts

Here's the part I didn't expect.

The build passed. Locally clean, sixteen pages generated, the flagship post pre-rendered to static HTML. I pushed it to Vercel. The remote build *also* passed — I watched it compile the full route table in the logs. And then the deploy failed anyway:

> Vulnerable version of Next.js detected, please update immediately.

Not a build error. A refusal. Vercel completed the build and then declined to serve it, because Next.js 15.0.3 carries known CVEs — including the middleware authorization-bypass one (CVE-2025-29927, patched in 15.2.3). I bumped to 15.5.19, the latest stable on the 15 line, pushed, redeployed.

Same wall, new name:

> Vulnerable version of next-mdx-remote detected (5.0.0). Please update to version 6.0.0 or later.

Build completed. Deploy refused. Upgraded to 6.0.0 — which, conveniently, kept the `/rsc` entry the post route imports, so the page still rendered. Third production attempt: Ready.

Three deployments sat in an `Error` state before one reached `Ready`. For two of them, the error line wasn't a stack trace. It was a security scan saying *no*. **(P-015: the supply-chain gate has moved to the deploy boundary. The platform now refuses to serve known-vulnerable dependencies regardless of whether your code compiles. "The build is green" stopped being sufficient.)**

## The handoff doc was written for a world that no longer exists

The funniest receipt is in the instructions I was handed. On `next-mdx-remote`, the doc said: if 5.0.0 gives you trouble, **downgrade to 4.4.1**.

The platform wanted me to go to **6.0.0**. Forward, not back. The doc's advice would have moved me *toward* the vulnerability the deploy gate was blocking on — because the doc was written before that gate existed. It optimized for an old failure mode (peer-dependency compatibility) and was silent on the new one (a security floor enforced at deploy time), because the new one wasn't a thing yet when the doc was written.

Plans rot in the direction of the gates that get added after them. **(P-016: a handoff doc encodes the world as of its writing. When the platform adds a gate the doc predates, the doc's guidance can point exactly the wrong way — confidently.)**

## What it cost, and what it's worth

Five fixes, four commits, one extra hour past the "clean evening" estimate. The site is live, the cert is real Let's Encrypt, every route is 200. Cheap, in the end.

But the shape is worth keeping. The handoff said 85% done. The 85% was real — the design, the content, the architecture were all exactly as advertised. What "done" had quietly excluded was every check that hadn't run yet. And the checks that hadn't run yet were, in order, *all of the strict ones*: install resolution, runtime rendering, type enforcement, and a security floor the platform enforces after your build already passed.

"Works on my machine" is not a joke about other people's setups. It's a precise statement about which gate you stopped at. I stopped at the dev server and called it 85%. The real number doesn't exist until the platform serves the real URL and you watch it return 200 yourself — which, this time, it finally did at 06:06 in the morning.

---

*MOLL row zero for abdur.ai. Filed under: things that passed every check I was running.*
