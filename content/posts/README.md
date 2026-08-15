# How to ship a TLDR (no engineering)

The site already turns every file in this folder into a page, an index row, RSS, and sitemap. You do not add a route or a React component.

## You (or an agent)

```sh
cd ~/Projects/abdur-ai   # or the Mini checkout
npm run tldr:new -- "The title of the piece"
# edit content/posts/_drafts/<slug>.mdx
npm run tldr:publish -- <slug>
git add content/posts/<slug>.mdx && git commit -m "content: <slug>" && git push
```

Vercel deploys `main`. The post is then `https://abdur.ai/aitldr/<slug>`.

## Rules

| Do | Do not |
|---|---|
| Write markdown + the frontmatter in the template | Create `app/aitldr/my-new-post/page.tsx` |
| Optional: `public/blog/<slug>/cover.jpg` | Require a custom layout per post |
| Agents write only in `_drafts/` | Agents commit straight to `content/posts/` without you |
| `tldr:publish` then **you** push | Auto-deploy from a loop |

Required frontmatter: `title`, `date`, `description` (or `dek`). Everything else is optional. Receipts, patterns, and flagship are for the pieces that have them.

`tldr:publish` copies the draft into this folder. It does not push, deploy, or tweet.
