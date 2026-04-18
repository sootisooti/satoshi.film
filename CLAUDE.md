# CLAUDE.md — SATOSHI.FILM Repository Guide

This file is read by Claude Code on every invocation.
It defines the project identity, technical constraints, and editorial rules.
Treat this as the single Source of Truth for all automated and manual edits.

-----

## PROJECT IDENTITY

SATOSHI.FILM is a static site for a Thai feature film about generational debt,
fiat money, and Bitcoin — told through one ordinary family across four generations.

- **Visual DNA:** Cypherpunk × Thai Auteur × Satoshi Internet Art
- **Core Aesthetic:** Raw, cinematic, and lived-in
- **STRICT PROHIBITION:** Do NOT apply “Modern Minimalist” or “Japandi” styles.
  Those belong to the Giraffe School project. Keep SATOSHI gritty and distinct.
- **Tone:** Universal — the protagonist is anonymous, representing anyone trapped
  in the system. Target audience: age 25–45 who feel economically squeezed.
- **Core Message:** “We are all trapped in a system designed for us to lose.
  Truth waits to be verified.”

-----

## ROUTES

|Route         |Status |Notes                                               |
|--------------|-------|----------------------------------------------------|
|index.html    |Live   |Main entry (~170KB). Single-file. All inline CSS/JS.|
|dialogue.html |Live   |React 18 + Babel via CDN. Do not rewrite in vanilla.|
|photobook.html|Planned|Visual diary / mood board. Inherits visual DNA.     |
|forum.html    |Planned|Migrate from #forum section when content scales.    |

**Migration trigger for forum.html:** when forum content exceeds inline capacity
inside index.html. Until then, forum lives as `<section id="forum">` in index.html.

-----

## TECH STACK & ARCHITECTURE

- **Pattern:** Single HTML file per route. Inline CSS/JS only. No frameworks, no bundlers.
- **Exception — dialogue.html:** Uses React 18 + Babel via CDN. This is an established
  exception. Do not remove React and do not rewrite in vanilla JS.
- **Fonts:** Space Mono (English) / Noto Serif Thai (Thai headings) / Sarabun (Thai body)
- **Colors:**
  - `#080806` Dark background
  - `#F7931A` Bitcoin orange
  - `#00FF41` Terminal green
  - `#8BA8C4` Cool blue
  - `#F7F3E8` Cream

-----

## BILINGUAL PATTERN (TH/EN)

- **Mode A — Simultaneous (Default):** Thai and English shown together (stacked).
  Use for all standard sections. Maintain parity in emphasis and meaning.
- **Mode B — Toggle:** Supported via `<body>` classes `.lang-th` and `.lang-en`.
  Available for specific interactive components when appropriate.
- **Typography rule:** English → Space Mono always. Thai headings → Noto Serif Thai.
  Thai body → Sarabun.

-----

## EDITING RULES — CRITICAL

1. **Targeted edits only.** Never rewrite `index.html` from scratch.
   Use surgical string replacements to preserve structure.
1. **Must-preserve list — do not break these on any edit:**
- `BUNDLES` JavaScript object (44 bundle cards, Cypherpunk Directory data)
- Verify terminal modal (wired to Anthropic API)
- Custom cursor
- Block height counter (mempool.space)
- Scroll reveal
- Easter eggs: Hal Finney hover, Friedcat modal, World C silence
1. **Mobile-first:** Test at 375px width first. Tap targets ≥ 44px.
   No horizontal scroll. Grids collapse to 1 column at 640px.
1. **For major changes:** Propose a plan and diff before editing.
   Never execute a large rewrite without explicit approval.

-----

## FORUM PIPELINE (WEEKLY CURATION)

- **Source:** HTML scraping from bitcointalk.org boards (1, 6, 73, 75)
- **CRITICAL CONSTRAINT:** DO NOT USE RSS. Bitcointalk RSS is disabled.
  Use the scraping logic in `scripts/curate-forum.js` only.
- **Schedule:** GitHub Action every Monday 09:00 Bangkok time
- **Output:** Writes `forum-daily.json` → opens Draft PR for review
- **Editorial voice:** Paraphrase only. Never copy verbatim posts (copyright boundary).
  Claude API curates 21 threads per run.

-----

## PAY-TO-VOTE ARCHITECTURE

- Protocol: Nostr (kind:1 event)
- Lightning zap attached to each vote
- Vote weight: log₂(sats) — whale-resistant
- Minimum: 21 sats per vote
- All votes public on Nostr relay — cannot be deleted
- Backend: pending

-----

## CYPHERPUNK SCORE METHODOLOGY

Do not change these scores without explicit instruction.

|Name          |Score|
|--------------|-----|
|Nick Szabo    |96%  |
|Hal Finney    |90%  |
|Len Sassaman  |86%  |
|David Chaum   |80%  |
|Eric Hughes   |79%  |
|Adam Back     |75%  |
|Timothy May   |74%  |
|Lord Rees-Mogg|60%  |

Formula: Technical proximity (35%) + Philosophical alignment (25%) +
Timeline overlap (25%) + Anonymity behavior (15%)

-----

## CONTENT RESTRICTIONS — NEVER ADD

- Director’s real name or identity (protagonist must remain anonymous)
- Film comparisons: Koreeda, Farhadi, GDH, or any other filmmaker
- Character names from the screenplay 
- Mining sound-design text references
- Bitcoin-maximalist slang that alienates non-crypto viewers:
  “HFSP”, “have fun staying poor”, “number go up”, “tick tock next block”

-----

## AUTOMATION (@claude)

- Triggered via `.github/workflows/claude.yml` on issue/PR comments
- Claude Code must follow this CLAUDE.md strictly on every invocation
- Targeted edits only — BUNDLES object, Verify modal, and easter eggs
  must be preserved on every single edit without exception
- For major changes: propose plan first, edit second

## NAV TERMINOLOGY
- DIALOGUE (dialogue.html) = "บทภาพยนตร์" — screenplay writing feature
- FORUM (#forum section) = "ชุมชน" — bitcointalk community curation
These two must stay distinct to avoid user confusion.
