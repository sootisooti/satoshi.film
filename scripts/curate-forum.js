#!/usr/bin/env node
/**
 * curate-forum.js (v3 - archive support)
 *
 * Weekly forum curation script for SATOSHI.FILM.
 *
 * Why HTML and not RSS:
 *   bitcointalk disabled the RSS endpoint (?action=.xml) due to load.
 *   We scrape the standard board HTML pages instead, which are stable
 *   (the forum runs SMF 1.1 with custom theme - unchanged for years).
 *
 * Archive behavior (v3):
 *   Each run writes TWO files:
 *   1. forum-archive/YYYY-W##.json (permanent snapshot)
 *   2. forum-daily.json (latest week, overwritten)
 *   Also maintains forum-archive/index.json manifest for week picker.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("[curate-forum] ANTHROPIC_API_KEY is not set. Aborting.");
  process.exit(1);
}

const BOARDS = [
  { id: 1,  name: "Bitcoin Discussion" },
  { id: 6,  name: "Development & Technical Discussion" },
  { id: 73, name: "Economics" },
  { id: 75, name: "Politics & Society" },
];

const MAX_CANDIDATES = 60;
const OUT_FILE = "forum-daily.json";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16000;
const FETCH_TIMEOUT_MS = 15000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const archiveDir = resolve(repoRoot, "forum-archive");

function log(msg) {
  console.log(`[curate-forum ${new Date().toISOString()}] ${msg}`);
}

/**
 * Calculate ISO week number (YYYY-W##) for a given date.
 * ISO week starts on Monday, week 1 contains the first Thursday of the year.
 */
function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

function parseBoardHtml(html, boardName) {
  const items = [];
  const spanRegex = /<span id="msg_(\d+)">\s*<a[^>]*href="[^"]*topic=(\d+)\.0[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

  let m;
  while ((m = spanRegex.exec(html)) !== null) {
    const topicId = m[2];
    const title = decodeEntities(stripTags(m[3])).replace(/\s+/g, " ").trim();

    if (!title || title.length < 5) continue;
    if (/^\s*(Sticky|MOVED:|LOCKED:)/i.test(title)) continue;

    items.push({
      title,
      url: `https://bitcointalk.org/index.php?topic=${topicId}.0`,
      topic_id: topicId,
      board: boardName,
      author: "anonymous",
    });
  }

  // Enrich with author from nearby profile link
  return items.map((it) => {
    const anchorIdx = html.indexOf(`topic=${it.topic_id}.0`);
    if (anchorIdx === -1) return it;
    const slice = html.slice(anchorIdx, anchorIdx + 800);
    const profileMatch = slice.match(/<a[^>]*href="[^"]*action=profile;u=\d+[^"]*"[^>]*>([^<]+)<\/a>/);
    if (profileMatch) {
      it.author = decodeEntities(stripTags(profileMatch[1])).trim() || "anonymous";
    }
    return it;
  });
}

async function fetchBoard(board) {
  const url = `https://bitcointalk.org/index.php?board=${board.id}.0`;
  log(`Fetching board ${board.id} (${board.name})`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      log(`  -> HTTP ${res.status}, skipping`);
      return [];
    }

    const html = await res.text();
    log(`  -> received ${html.length} bytes`);
    const items = parseBoardHtml(html, board.name);
    log(`  -> parsed ${items.length} threads`);
    return items;
  } catch (err) {
    clearTimeout(timeout);
    log(`  -> fetch error: ${err.message}, skipping`);
    return [];
  }
}

function dedupeByTopicId(items) {
  const seen = new Set();
  return items.filter((it) => {
    if (seen.has(it.topic_id)) return false;
    seen.add(it.topic_id);
    return true;
  });
}

function buildPrompt(candidates) {
  const candidateLines = candidates
    .map((c) => `${c.title} | ${c.url} | ${c.author} | ${c.board}`)
    .join("\n");

  return `You are the editorial curator for SATOSHI.FILM - a Thai feature film about
generational debt, fiat money, and Bitcoin, told through one ordinary family
across four generations. The film's core message: "We are all trapped in a
system designed for us to lose. Truth waits to be verified."

I will give you a list of recent bitcointalk.org thread titles and URLs.
Select up to 21 that resonate with the film's themes:
- Generational economic trauma (parents passing debt to children)
- Fiat system decay / inflation
- Proof of work (as philosophy, not only as algorithm)
- Self-sovereignty, Don't Trust Verify
- The cypherpunk lineage (Chaum, Hughes, Szabo, Finney, Sassaman, May, Back)
- Quiet craftsmanship over spectacle
- Thai / Southeast Asian perspectives if present

AVOID:
- Price speculation threads, shitcoin pumps, trading tips
- Threads that are mostly noise, drama, or scam accusations
- Threads in languages other than English (unless specifically Thai)

If fewer than 21 strong candidates exist, pick the best available and note
this in the curator_note. Never invent threads - only use ones from the list.

For each chosen thread, produce this JSON object:

{
  "bitcointalk_topic_id": "<number from the URL>",
  "title_en": "<the original thread title, cleaned>",
  "title_th": "<natural Thai translation, NOT literal>",
  "author": "<OP username from the list>",
  "board": "<board name from the list>",
  "summary_en": "<ONE sentence, YOUR words - do NOT quote from the original>",
  "summary_th": "<ONE sentence Thai version - natural>",
  "take_en": "<ONE sentence: how this connects to SATOSHI's themes. Literary voice.>",
  "take_th": "<ONE sentence Thai - can reference the film's world, never name characters>",
  "source_url": "https://bitcointalk.org/index.php?topic=<id>"
}

RULES:
- Paraphrase only. Never quote more than 5 words from the original.
- "Our take" = film's editorial voice. Contemplative, not hype.
- Avoid exclamation marks. Avoid "revolutionary" and "game-changer".
- Thai: Sarabun register (moderately formal). Not royal. Not slang.

TRANSLATION RULES FOR THAI FIELDS (title_th, summary_th, take_th):

KEEP IN ENGLISH — do NOT translate these terms, ever:
  private key, public key, hard fork, soft fork, proof of work, hash rate,
  block, blockchain, mining, mempool, UTXO, node, wallet, address, script,
  Lightning Network, Nostr, Taproot, SegWit, Schnorr, semantics, quantum,
  post-quantum, quantum hard fork, post-quantum migration, cryptography,
  protocol, algorithm, consensus, Byzantine, Merkle, elliptic curve, Bitcoin

TRANSLATE TO THAI naturally — avoid over-literal translations:
  "migration" in a technical/crypto context → "การอัปเกรด" or "การเปลี่ยนระบบ"
    (NOT "ย้ายถิ่น", which means emigrating to another country)
  "frozen" / "locked" → use the contextually correct Thai equivalent

UTF-8 SAFETY: Thai output fields must contain ONLY Thai Unicode characters,
  standard ASCII, or the approved English terms above. Do NOT output Cyrillic
  letters, look-alike Latin substitutes, or any other non-Thai non-ASCII glyphs.

Return ONLY valid JSON in this shape:

{
  "curated_date": "YYYY-MM-DD",
  "block_height": "-",
  "curator_note_th": "<ONE sentence about this week's theme>",
  "curator_note_en": "<ONE sentence about this week's theme>",
  "topics": [ ...up to 21 objects... ]
}

No markdown code fences. Raw JSON only.

Candidate threads:

${candidateLines}
`;
}

function extractJson(responseText) {
  // Extract content from a complete markdown code fence (handles preamble text)
  const fenceMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Strip incomplete leading/trailing fences
  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Last resort: find outermost JSON object by brace boundaries (handles preamble)
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) return cleaned.slice(start, end + 1);

  return cleaned;
}

async function callClaude(prompt) {
  log(`Calling Claude API (${MODEL}, max_tokens=${MAX_TOKENS})`);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: "You are a JSON-only API endpoint. Respond with raw JSON exclusively. Do not include markdown code fences, preamble text, or any explanation — only the JSON object itself.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const responseText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  log(`[DEBUG] Raw response (first 500 chars): ${responseText.slice(0, 500)}`);

  return extractJson(responseText);
}

(async () => {
  try {
    log("Starting weekly curation run (HTML scraping mode)");
    const boardResults = await Promise.all(BOARDS.map(fetchBoard));
    let candidates = boardResults.flat();
    candidates = dedupeByTopicId(candidates);
    log(`Collected ${candidates.length} unique candidates across ${BOARDS.length} boards`);

    if (candidates.length < 5) {
      log("Too few candidates (<5). Aborting - likely a parsing or fetch issue.");
      if (candidates.length) {
        await writeFile(
          resolve(repoRoot, "forum-daily.debug.json"),
          JSON.stringify(candidates, null, 2)
        );
        log("Wrote forum-daily.debug.json with partial candidates");
      }
      process.exit(2);
    }

    candidates = candidates.slice(0, MAX_CANDIDATES);

    const prompt = buildPrompt(candidates);
    const raw = await callClaude(prompt);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      log("Failed to parse Claude response as JSON.");
      await writeFile(resolve(repoRoot, "forum-daily.raw.txt"), raw);
      throw err;
    }

    if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      throw new Error("Claude response missing valid topics array");
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!parsed.curated_date || parsed.curated_date === "YYYY-MM-DD") {
      parsed.curated_date = today;
    }

    // Calculate ISO week and add to JSON
    const isoWeek = getISOWeek(new Date());
    parsed.iso_week = isoWeek;
    log(`ISO week: ${isoWeek}`);

    // Ensure archive directory exists
    await mkdir(archiveDir, { recursive: true });

    // 1. Write archive snapshot FIRST (before overwriting forum-daily.json)
    const archiveFileName = `${isoWeek}.json`;
    const archivePath = resolve(archiveDir, archiveFileName);
    await writeFile(archivePath, JSON.stringify(parsed, null, 2) + "\n");
    log(`Wrote archive: forum-archive/${archiveFileName}`);

    // 2. Update archive manifest (index.json)
    const manifestPath = resolve(archiveDir, "index.json");
    let manifest = { weeks: [] };
    try {
      const existingManifest = await readFile(manifestPath, "utf-8");
      manifest = JSON.parse(existingManifest);
    } catch (err) {
      log("No existing manifest, creating new one");
    }

    // Add this week if not already present
    if (!manifest.weeks.find(w => w.iso_week === isoWeek)) {
      manifest.weeks.unshift({
        iso_week: isoWeek,
        curated_date: parsed.curated_date,
        topic_count: parsed.topics.length
      });
      log(`Added ${isoWeek} to manifest`);
    } else {
      log(`${isoWeek} already in manifest, updating entry`);
      const existing = manifest.weeks.find(w => w.iso_week === isoWeek);
      existing.curated_date = parsed.curated_date;
      existing.topic_count = parsed.topics.length;
    }

    // Keep manifest sorted by ISO week (newest first)
    manifest.weeks.sort((a, b) => b.iso_week.localeCompare(a.iso_week));

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    log("Updated manifest: forum-archive/index.json");

    // 3. Write forum-daily.json (overwrites previous week)
    const outPath = resolve(repoRoot, OUT_FILE);
    await writeFile(outPath, JSON.stringify(parsed, null, 2) + "\n");
    log(`Wrote ${parsed.topics.length} topics to ${OUT_FILE}`);
    log("Done.");
  } catch (err) {
    console.error("[curate-forum] FATAL:", err.message);
    process.exit(1);
  }
})();
