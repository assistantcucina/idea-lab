# Idea Lab

A public gallery of one-off prototype web apps, built automatically. Read
this first if you're an automated build picking this repo back up — it's
written for you, not a human visitor.

## What this is

Every day, Hermes (a personal AI agent) pushes "micro app idea" cards to
its owner's private [hermes-canvas](https://hermes-canvas-jet.vercel.app)
app. When the owner likes one and swipes it onto their To Do list, a
scheduled Claude Code cloud routine ("Idea Lab Prototype Builder") notices
it, builds a polished static demo of that idea, and publishes it here —
so it can be shared/posted as content.

## Structure

```
idea-lab/
├── index.html          gallery page — fetches manifest.json, renders a card per entry
├── manifest.json        [{ slug, title, description, date }, ...] — one entry per prototype, oldest first
├── assets/gallery.css   shared styling for the gallery page ONLY (not the prototypes)
├── p/<slug>/index.html  one self-contained prototype per idea (own HTML/CSS/JS, no build step, no shared deps)
└── vercel.json          static-site config (clean URLs)
```

## Adding a new prototype (what the automated routine does each run)

1. Pick a short kebab-case `slug` from the idea's title (e.g. "Micro Idea
   #1: Habit Arcade" → `habit-arcade`). Skip if that slug already exists in
   `manifest.json`.
2. Read the idea card closely for its newer structured fields (added
   2026-09-09 to the daily Micro Idea cron prompts — an older card may
   predate these and only have the original pitch fields, in which case
   infer as best you can, same as always):
   - **Format** — tells you the UI chrome to build in (a "mobile app" idea
     reads much better wrapped in a phone-frame mockup than as a bare
     full-width webpage; a "browser extension" idea should look like a
     popup; a "web dashboard" gets a sidebar/table layout).
   - **Demo hook** — the one moment/interaction your build must nail. This
     is your effort budget: make this genuinely work, don't spread effort
     thin across secondary features.
   - **Core loop** — the literal click-by-click sequence to implement.
     Build this, not your own guess at the flow.
   - **Example content** — use these exact sample items/numbers as your
     mock data instead of inventing generic placeholders.
   - **Vibe** (only present when the idea's aesthetic is itself the hook)
     — follow it. When absent, pick your own fitting palette/typography —
     don't default to the gallery's orange/cream, and don't leave it
     generic either.
3. Write a fully self-contained `p/<slug>/index.html` — inline `<style>`
   and `<script>`, no external build tooling, no shared JS/CSS beyond what
   you inline. Design bar: real typography and a real color palette,
   mobile-responsive, at least one actually-working interaction (per the
   Demo hook/Core loop above), backed by mock/local data (no real
   backend). No lorem ipsum, no unfinished placeholder sections — it
   should look and feel like a real, finished demo even though the data
   isn't live. Every page on this site (gallery included) always shows a
   `built by ab` footer (hyperlinked to https://adrianbudny.com) fixed to
   the bottom of the viewport — `position: fixed; bottom: 0` with
   `env(safe-area-inset-bottom)` padding so it stays visible above
   Safari's toolbar on iPhone, and give the page enough bottom padding
   that content never sits behind it. Copy the footer markup/CSS straight
   from `index.html` / `assets/gallery.css`.
4. Prepend a new `{slug, title, description, date}` entry to
   `manifest.json` (keep it valid JSON — an array of objects, nothing
   else). If your prototype splits into more than one file (e.g. a large
   one uses a same-folder `data.js`/`app.js` instead of one inline
   `index.html`), reference them with an **absolute path**
   (`/p/<slug>/data.js`), never a relative one (`data.js`). This site's
   `vercel.json` has `trailingSlash: false`, so a prototype's live URL is
   `/p/<slug>` with no trailing slash — a relative script src resolves
   against `/p/`, not `/p/<slug>/`, silently 404ing with a blank page and
   no console error. This actually happened (Editorial OS, 2026-09-18);
   caught only by testing in a real WebKit browser, not curl or Chromium.
5. Commit and push to `main`. **As of 2026-09-18, Vercel IS connected to
   this repo for deploy-on-push** — a plain `git push` alone triggers a
   production deploy, no manual `vercel --prod` step needed.
6. **Verifying the deploy actually went live**: the whole site sits behind
   a password gate (`middleware.js`, added 2026-09-18) — every path
   redirects unauthenticated requests to `/login`, `/p/<slug>` included.
   That means an unauthenticated `curl` to a prototype's own URL always
   returns a 302, for a real deployed page and for a typo'd slug alike —
   it proves nothing and must not be used as a live-check (this bit an
   automated run once already: it built and pushed all 5 pending
   prototypes correctly, then got stuck unable to tell "deployed" from
   "not deployed" and aborted without closing the loop). Instead: wait
   ~30–45 seconds after pushing, then `curl` **`/manifest.json`**
   specifically — that one path is intentionally excluded from the auth
   gate — and check that it now contains an entry for your new `slug`.
   That's the real live-deploy signal.

## Notes

- This repo has no relationship to `hermes-canvas` beyond being written to
  by the same automated routine — don't assume shared code, styling, or
  auth. This site is fully public; `hermes-canvas` is not.
- Keep every prototype self-contained. A future build should never need to
  read another prototype's files to work.
