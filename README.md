# SATOSHi — The Film 🎬

*เราทุกคนถูกขังอยู่ในระบบที่ออกแบบมาเพื่อให้แพ้ — ความจริงรอการตรวจสอบจากทุกคน*
*We are all trapped in a system designed for us to lose.*

This repository contains the source code for the official interactive website of the **SATOSHi** feature film project. 

🌐 **Live Site:** [https://sootisooti.github.io/satoshi.film/](https://sootisooti.github.io/satoshi.film/)

---

## ⬛️ Overview (เกี่ยวกับโปรเจกต์)
เว็บไซต์นี้เป็นหน้า Landing Page แบบ Single-page application (หน้าเดียวจบ) ที่ออกแบบมาในสไตล์ Cypherpunk / Terminal เพื่อเล่าเรื่องราวประวัติศาสตร์ของ Bitcoin, กลุ่ม Cypherpunks, และปรัชญา "Don't Trust, Verify" ผ่านโปรเจกต์ภาพยนตร์เรื่อง SATOSHi 

โครงสร้างถูกเขียนขึ้นด้วยโค้ดแบบไร้เฟรมเวิร์ก (Zero-dependencies) เน้นความดิบ ความเร็ว และสไตล์ที่สะท้อนถึงการเขียนโค้ดยุคบุกเบิก

## 🟩 Features (ฟีเจอร์หลัก)
* **Pure HTML/CSS/JS:** โค้ดทั้งหมดรวมอยู่ใน `index.html` ไฟล์เดียว ไม่มี External Libraries (ยกเว้น Google Fonts)
* **Bilingual Toggle (EN/TH):** ระบบเปลี่ยนภาษาแบบทันทีโดยไม่ต้องโหลดหน้าเว็บใหม่
* **Interactive Terminal (AI-Powered):** หน้าต่าง Terminal ลับที่ผูกกับ API เพื่อให้ผู้ใช้สามารถโต้ตอบและถามคำถามเกี่ยวกับประวัติของ Cypherpunks แต่ละคนได้
* **Custom UI:** เมาส์แบบ Custom Cursor, แอนิเมชัน Scroll Reveal, และเอฟเฟกต์ Glitch/Glow
* **Easter Eggs:** มีความลับซ่อนอยู่ในโค้ดและหน้าเว็บ (เช่น Friedcat Modal) สำหรับผู้ที่ "ตรวจสอบ" อย่างละเอียด

## 🟧 Local Setup (การรันโปรเจกต์บนเครื่อง)
เนื่องจากเป็นไฟล์ HTML ธรรมดา คุณสามารถรันเว็บนี้ได้ทันทีโดยไม่ต้องติดตั้งอะไรเพิ่มเติม:
1. Clone repository นี้:
   ```bash
   git clone [https://github.com/sootisooti/satoshi.film.git](https://github.com/sootisooti/satoshi.film.git)
