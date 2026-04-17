# CLAUDE.md — SATOSHI.FILM Repository Guide

This file is read by Claude Code on every invocation. It defines the project,
constraints, and how to edit the codebase safely.

---

## PROJECT

SATOSHI.FILM is the public-facing website for a Thai feature film about
generational debt, fiat money, and Bitcoin. Live at
`https://sootisooti.github.io/satoshi.film/`.

The film follows one ordinary Thai-Vietnamese family across four generations.
Core message: **"We are all trapped in a system designed for us to lose.
Truth waits to be verified."**

This is a **static site hosted on GitHub Pages** — no backend, no framework.

---

## TECH STACK — FIXED

- **Single HTML file** (`index.html`) — no build step, no framework, no bundler
- Vanilla JavaScript inside `<script>` tags — no npm dependencies in HTML
- CSS inside `<style>` tags — no separate stylesheet
- Fonts: Space Mono (mono), Noto Serif Thai (Thai display), Sarabun (Thai body)
- Colors: `#080806` dark / `#F7931A` Bitcoin orange / `#00FF41` terminal green / `#8BA8C4` cool blue / `#F7F3E8` off-white

**Do not** introduce React, Vue, a build step, a framework, or multiple HTML files.
**Do not** split CSS or JS into separate files.
The single-HTML constraint is a project value, not a limitation to fix.

---

## BILINGUAL PATTERN

The site is fully bilingual Thai/English. In almost all sections, TH and EN
are shown **simultaneously**, not toggled. Pattern:

- Section headers: `<span class="title-th">ชื่อไทย</span><span class="title-en">ENGLISH TITLE</span>`
- Body paragraphs: Thai in Sarabun above, English in Space Mono below, smaller and lower opacity
- Nav links use `data-th` / `data-en` attributes where toggle exists

When adding new sections, match the existing bilingual pattern exactly.
Do not invent a new convention.

---

## EDITING RULES — READ BEFORE MAKING CHANGES

### Rule 1: **Targeted edits only. Never rewrite `index.html` from scratch.**

The file is ~150KB and contains a large `BUNDLES` JavaScript object used by
the Cypherpunk Directory, plus a Verify terminal modal wired to an Anthropic
API endpoint. A full-file rebuild silently drops these structures.

Use small, surgical insertions. If a task requires large-scale
changes, propose a plan first and break it into ≤5 edits per PR.

### Rule 2: **Preserve existing interactive features.**

These are wired up and must not be broken:
- Custom cursor
- Block height counter (pulls from mempool.space in realtime)
- Scroll reveal animations
- Cypherpunk score bars
- Halving timeline
- Easter eggs (Hal Finney hover, Friedcat modal, World C silence)
- Verify terminal modal (wired to Anthropic API)
- Login/Register UI mockup
- Lightning zap UI, newsletter subscribe form

If your change might affect one of these, check before acting. If you're
unsure, open the PR as **Draft** and explain the uncertainty in the description.

### Rule 3: **Mobile-first workflow.**

The project owner works primarily from iPhone and iPad. Keep these in mind:
- New UI should test well at 375px width
- Don't introduce horizontal scroll
- Tap targets ≥ 44px
- All new CSS grids collapse to single column at 640px

### Rule 4: **Accessible commit messages.**

Use conventional commits. Short, present tense:
- `feat: add forum digest section`
- `fix: correct mobile padding on halving timeline`
- `content: update forum-daily.json for 2026-W16`

---

## CONTENT RULES — NEVER ADD

These have been explicitly excluded from the website and must not be re-introduced:

- The director's real name or identity — protagonist is anonymous by design
- Film industry comparisons (e.g., "like Koreeda", "Farhadi-style", "GDH does")
- Specific character names from the screenplay
- Mining sound-design references
- Bitcoin-maxi language that alienates non-crypto viewers
  (e.g., "have fun staying poor", "number go up", "tick tock next block" as CTAs)

If a task appears to require adding any of the above, stop and ask the
repository owner instead of proceeding.

---

## CYPHERPUNK SCORE METHODOLOGY — DO NOT CHANGE WITHOUT REASON

The Cypherpunk Directory assigns percentage scores to figures in the Satoshi
lineage. These numbers are editorial judgments, not computed:

- Nick Szabo 96% / Hal Finney 90% / Len Sassaman 86% / David Chaum 80%
- Eric Hughes 79% / Adam Back 75% / Timothy May 74% / Lord Rees-Mogg 60%

Formula for context: Technical proximity 35% + Philosophical alignment 25%
+ Timeline overlap 25% + Anonymity behavior 15%.

Only update these if the owner explicitly asks. Don't recalculate opportunistically.

---

## FORUM SECTION — how the weekly-curation feature works

The Forum section at `#forum` is powered by a static JSON file at the repo root:
`forum-daily.json`. The loader script inside `index.html` fetches this file
on page load and renders up to 21 topic cards.

There is a weekly GitHub Actions workflow
(`.github/workflows/forum-weekly.yml`) that:

1. Runs every Monday at 02:00 UTC (09:00 Bangkok time)
2. Fetches recent threads from bitcointalk.org RSS
3. Calls the Claude API with a curation prompt
4. Writes the result to `forum-daily.json`
5. Opens a **Draft PR** for owner review
6. Owner reviews on mobile, edits "Our Take" if needed, merges

When editing this pipeline:
- Keep the schema of `forum-daily.json` stable
- Never commit the output directly to main — always go through a PR
- If the RSS fetch fails, the workflow should skip, not publish a broken JSON

---

## FORUM COPYRIGHT BOUNDARY — CRITICAL

The forum feature summarizes bitcointalk threads in our own editorial voice.
It never reproduces posts.

- OK: Thread title (factual reference)
- OK: 1-sentence paraphrased summary in our words
- OK: "Our take" on how the thread relates to the film's themes
- **NOT OK**: Copying paragraphs from the original post
- **NOT OK**: Translating an entire original post into Thai
- **ALWAYS**: Link back to the source thread with OP's username

If a pull request contains summaries that feel close to verbatim, reject and
rewrite in paraphrase.

---

## PR PROCESS

When creating a PR:
1. Title: descriptive, ≤60 chars
2. Description: what changed, why, any risks, screenshots if visual
3. Never merge to `main` yourself — always leave for owner approval
4. If the change touches any of the "preserve existing features" list above,
   mark the PR as **Draft** and flag the feature by name in the description
5. Keep diffs small. A 500-line diff should probably be 3 smaller PRs.

---

## CONTACT FOR AMBIGUITY

If a task is ambiguous or falls outside the rules above, stop and post a
comment on the issue asking for clarification. Do not guess.
