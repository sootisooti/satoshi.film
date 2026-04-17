#!/usr/bin/env node
/**
 * curate-forum.js
 *
 * Weekly forum curation script for SATOSHI.FILM.
 *
 * Flow:
 *   1. Fetch bitcointalk.org RSS for a few key boards
 *   2. Parse titles + URLs + authors
 *   3. Call Claude API with the curation prompt
 *   4. Parse JSON response
 *   5. Write to forum-daily.json at repo root
 *
 * Requirements: Node 20+ (built-in fetch). No external npm packages.
 *
 * Environment:
 *   ANTHROPIC_API_KEY — required
 */

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- config ----------

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("[curate-forum] ANTHROPIC_API_KEY is not set. Aborting.");
  process.exit(1);
}

const BOARDS = [
  { id: 1,  name: "Bitcoin Discussion" },
  { id: 6,  name: "Development & Technical Discussion" },
  { id: 73, name: "Economics" },
  { id: 75, name: "Philosophy" },
];

const MAX_CANDIDATES = 60;
const OUT_FILE = "forum-daily.json";
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 8000;

// ---------- utilities ----------

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[curate-forum ${ts}] ${msg}`);
}

function parseRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || "";
    const link  = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
    const creator = (block.match(/<dc:creator>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/) || [])[1] || "anonymous";
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";

    if (!title || !link) continue;

    const topicMatch = link.match(/topic=(\d+)/);
    if (!topicMatch) continue;

    items.push({
      title: title.trim(),
      url: link.trim(),
      author: creator.trim(),
      topic_id: topicMatch[1],
      pubDate: pubDate.trim(),
    });
  }
  return items;
}

async function fetchBoard(board) {
  const url = `https://bitcointalk.org/index.php?type=rss;action=.xml;board=${board.id}`;
  log(`Fetching board ${board.id} (${board.name})`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "satoshi-film-curator/1.0 (+https://sootisooti.github.io/satoshi.film/)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      log(`  -> HTTP ${res.status}, skipping this board`);
      return [];
    }
    const xml = await res.text();
    const items = parseRss(xml);
    return items.map(it => ({ ...it, board: board.name }));
  } catch (err) {
    log(`  -> fetch error: ${err.message}, skipping`);
    return [];
  }
}

function dedupeByTopicId(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (seen.has(it.topic_id)) continue;
    seen.add(it.topic_id);
    out.push(it);
  }
  return out;
}

// ---------- curation prompt ----------

function buildPrompt(candidates) {
  const candidateLines = candidates
    .map(c => `${c.title} | ${c.url} | ${c.author} | ${c.board}`)
    .join("\n");

  return `You are the editorial curator for SATOSHI.FILM - a Thai feature film about
generational debt, fiat money, and Bitcoin, told through one ordinary family
across four generations. The film's core message: "We are all trapped in a
system designed for us to lose. Truth waits to be verified."

I will give you a list of recent bitcointalk.org thread titles and URLs.
Select exactly 21 that resonate with the film's themes:
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
- Anything requiring us to reproduce the original post's content at length

For each chosen thread, produce this JSON object:

{
  "bitcointalk_topic_id": "<number from the URL>",
  "title_en": "<the original thread title, cleaned>",
  "title_th": "<natural Thai translation of the title, NOT literal>",
  "author": "<OP username if known, else 'anonymous'>",
  "board": "<section name, e.g. 'Bitcoin Discussion'>",
  "summary_en": "<ONE sentence, YOUR words, describing what the thread is about - do NOT quote from the original post>",
  "summary_th": "<ONE sentence Thai version - natural, not a direct translation of the EN summary>",
  "take_en": "<ONE sentence: how this thread connects to SATOSHI's themes. Literary voice, not academic.>",
  "take_th": "<ONE sentence Thai version - can reference the film's world but never name characters directly>",
  "source_url": "https://bitcointalk.org/index.php?topic=<id>"
}

RULES for summaries and takes:
- Paraphrase only. Never quote more than 5 words from the original post.
- If a thread discusses a book, a person, or a historical event - you can name them.
- If a thread is mostly one user's opinion - describe the QUESTION they raised, not their answer.
- "Our take" should give the film's editorial voice. Contemplative, not hype.
- Avoid exclamation marks. Avoid the word "revolutionary". Avoid "game-changer".
- Thai: use Sarabun register (moderately formal, accessible). Not royal. Not slang.

Return ONLY a valid JSON object in this exact shape:

{
  "curated_date": "YYYY-MM-DD",
  "block_height": "-",
  "curator_note_th": "<ONE sentence explaining this week's theme>",
  "curator_note_en": "<ONE sentence explaining this week's theme>",
  "topics": [ ...21 objects... ]
}

Do not include markdown code fences. Return raw JSON only.

Here are this week's candidate threads:

${candidateLines}
`;
}

// ---------- Claude API call ----------

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
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .replace(/^```json\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();

  return text;
}

// ---------- main ----------

(async () => {
  try {
    log("Starting weekly curation run");
    const boardResults = await Promise.all(BOARDS.map(fetchBoard));
    let candidates = boardResults.flat();
    candidates = dedupeByTopicId(candidates);
    log(`Collected ${candidates.length} unique candidates across ${BOARDS.length} boards`);

    if (candidates.length < 21) {
      log("Not enough candidates to select 21 topics. Aborting.");
      process.exit(2);
    }

    candidates = candidates.slice(0, MAX_CANDIDATES);

    const prompt = buildPrompt(candidates);
    const raw = await callClaude(prompt);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      log("Failed to parse Claude response as JSON. Raw output saved for debugging.");
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

    const outPath = resolve(repoRoot, OUT_FILE);
    await writeFile(outPath, JSON.stringify(parsed, null, 2) + "\n");
    log(`Wrote ${parsed.topics.length} topics to ${OUT_FILE}`);
    log("Done.");
  } catch (err) {
    console.error("[curate-forum] FATAL:", err.message);
    process.exit(1);
  }
})();
