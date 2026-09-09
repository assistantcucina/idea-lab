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
2. Write a fully self-contained `p/<slug>/index.html` — inline `<style>`
   and `<script>`, no external build tooling, no shared JS/CSS beyond what
   you inline. Design bar: real typography and a real color palette (don't
   reuse the gallery's orange/cream palette verbatim — pick something
   fitting the idea), mobile-responsive, at least one actually-working
   interaction, backed by mock/local data (no real backend). No lorem
   ipsum, no unfinished placeholder sections — it should look and feel like
   a real, finished demo even though the data isn't live. Every page on
   this site (gallery included) always shows a `built by ab` footer
   (hyperlinked to https://adrianbudny.com) fixed to the bottom of the
   viewport — `position: fixed; bottom: 0` with `env(safe-area-inset-bottom)`
   padding so it stays visible above Safari's toolbar on iPhone, and give
   the page enough bottom padding that content never sits behind it. Copy
   the footer markup/CSS straight from `index.html` / `assets/gallery.css`.
3. Prepend a new `{slug, title, description, date}` entry to
   `manifest.json` (keep it valid JSON — an array of objects, nothing
   else).
4. Commit and push to `main`. Vercel is connected to this repo for
   deploy-on-push — no separate deploy step, no Vercel credentials needed
   here.

## Notes

- This repo has no relationship to `hermes-canvas` beyond being written to
  by the same automated routine — don't assume shared code, styling, or
  auth. This site is fully public; `hermes-canvas` is not.
- Keep every prototype self-contained. A future build should never need to
  read another prototype's files to work.
