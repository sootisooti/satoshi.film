# SATOSHi — The Film 🎬

*เราทุกคนถูกขังอยู่ในระบบที่ออกแบบมาเพื่อให้แพ้ — ความจริงรอการตรวจสอบจากทุกคน*
*We are all trapped in a system designed for us to lose — truth waits to be verified.*

This repository contains the source code for the official interactive website of the **SATOSHi** feature film project.

🌐 **Live Site:** <https://sootisooti.github.io/satoshi.film/>

---

## ⬛️ Overview — เกี่ยวกับโปรเจกต์

**SATOSHI (ซาโตชิ)** คือภาพยนตร์ไทย-เวียดนาม ที่เล่าเรื่องครอบครัวสี่รุ่นที่ถูกขังในระบบเงิน fiat และการเดินทางของคนธรรมดาคนหนึ่งที่พยายามพาครอบครัวออกจากวงจรหนี้ด้วย Bitcoin — พิสูจน์ให้รุ่นถัดไปเห็นว่า *future* มีจริง

เว็บไซต์นี้คือ **interactive platform** สำหรับแนะนำโปรเจกต์หนัง, เก็บข้อมูลชุมชน (community research), และรับการสนับสนุนผ่าน Bitcoin Lightning — ออกแบบในสไตล์ **Cypherpunk × Thai Auteur × Satoshi Internet Art** เขียนด้วยโค้ดแบบไร้เฟรมเวิร์ก (zero-dependencies) เพื่อสะท้อนจริยธรรมของ "Don't Trust, Verify"

---

## 🟩 Features — ฟีเจอร์หลัก

### 🎬 Narrative & Content
- **Hero Section** — introduce the film with universal bilingual copy
- **Three Worlds** — Past (โลก A) / Present (โลก B) / Future (โลก C)
- **Halving Timeline** — interactive timeline with user memory fields
- **Cypherpunk Directory** — **44+ bundle cards across 13 chapters** (including new **Chapter -1: The Forethinkers Root** tracing Austrian economics lineage from 1871)
- **Verify Terminal Modal** — interactive AI-powered terminal wired to Anthropic API (`claude-sonnet-4-20250514`)

### 📮 Community Features
- **Forum Section** — weekly-curated bitcointalk.org threads via GitHub Actions + Claude API
  - Archive system with week picker for browsing past curations
  - Editorial voice only (paraphrase — never reproduce forum posts)
- **Community Verify** — user story collection
- **Lightning Support tiers** — Bitcoin Lightning donations
- **Newsletter subscribe** — coming soon

### 🎨 Design & Interaction
- **Bilingual Simultaneous Display** — Thai + English shown together (not toggle)
- **Fonts:** Space Mono + Noto Serif Thai + Sarabun
- **Palette:** `#080806` dark / `#F7931A` Bitcoin orange / `#00FF41` terminal green / `#8BA8C4` cool blue / `#F7F3E8` cream
- **Custom Cursor + Scroll Reveal** + Block Height Counter
- **Easter eggs** — Hal Finney hover, Friedcat modal, World C silence

---

## 🟧 Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `index.html` | Main entry | ✅ Live |
| `dialogue.html` | Screenplay writing feature (บทภาพยนตร์) | ✅ Live |
| `photobook.html` | Visual diary / production stills (หนังสือภาพ) | 🚧 Placeholder |
| `forum.html` | Curated bitcointalk threads (standalone) | 📋 Planned |

---

## ⚙️ Automation — การทำงานอัตโนมัติ

### `@claude` Mentions
Trigger Claude Code on any issue or PR comment — follows `CLAUDE.md` rules for safe, targeted edits.

Workflow: .github/workflows/claude.yml
Rules:    CLAUDE.md (authoritative source of truth)


### Weekly Forum Curation
- **Schedule:** Every Monday 09:00 Bangkok time (02:00 UTC)
- **Action:** Fetch bitcointalk.org RSS → Claude API curates 21 threads → writes `forum-daily.json` + archive snapshot → opens Draft PR
- **Archive:** Each week's snapshot saved as `/forum-archive/YYYY-W##.json`
- **Manifest:** `/forum-archive/index.json` listing available weeks

### Global Error Overlay
All pages include a visible error overlay that surfaces JavaScript errors at the top of the page — enabling mobile-first debugging without DevTools.

---

## 🟪 Tech Stack

- **Single HTML file per route** — no framework, no build step
- **Vanilla JavaScript** inside `<script>` tags
- **CSS** inside `<style>` tags
- **Fonts:** Google Fonts CDN (only external dependency)
- **Hosting:** GitHub Pages (free, serves static files)
- **API:** Anthropic Claude API (for Verify modal + weekly curation)

---

## 🔨 Local Setup — การรันบนเครื่อง

เนื่องจากเป็นไฟล์ HTML ธรรมดา คุณสามารถรันได้ทันทีโดยไม่ต้องติดตั้งอะไรเพิ่ม:

```bash
# 1. Clone repository
git clone https://github.com/sootisooti/satoshi.film.git
cd satoshi.film

# 2. Open in browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

หรือใช้ local server:

python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 📝 Contributing — การมีส่วนร่วม
This project follows a mobile-first workflow — most development happens from iPhone/iPad via GitHub web + @claude automation.
For code contributions:
	1.	Read CLAUDE.md first — it encodes all project constraints
	2.	Open an issue describing what you want to change
	3.	Comment @claude with instructions for targeted edits
	4.	Review the generated PR before merging
For content contributions (community verify / forum curation):
	•	Merge weekly Draft PRs from the forum curation workflow
	•	Submit community stories via the forum section UI
	•	All contributions honor the “Editorial voice only, paraphrase always” copyright boundary

---

## 🚫 Content Boundaries — สิ่งที่ไม่เพิ่ม
Per project identity (documented in CLAUDE.md):
	•	No director’s real name or identity (protagonist is anonymous by design)
	•	No film industry comparisons
	•	No screenplay character names
	•	No Bitcoin-maxi slang that alienates non-crypto viewers

---

## 🟡 Support the Film
Lightning donations + Bitcoin co-production inquiries are accepted on the live site. Current supporter:
	•	🏛️ Bitcoin Learning Center Chiang Mai (first community supporter)

---

## 📜 License
Source code: MIT License
Film content, story, and world bibles: All rights reserved © 2026 SATOSHi Film

Built on iPad with Claude Code. Deployed on GitHub Pages. Funded by sats.
