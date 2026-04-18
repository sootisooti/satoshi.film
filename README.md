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

