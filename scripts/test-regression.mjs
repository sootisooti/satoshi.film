/**
 * Regression test for curate-forum.js prompt rules and extractJson.
 * Does NOT call the Claude API — validates prompt content and JSON extraction logic.
 */

import { readFile } from "node:fs/promises";

const src = await readFile(new URL("./curate-forum.js", import.meta.url), "utf-8");

// ── 1. Static checks on the source ──────────────────────────────────────────

const checks = [
  ["Model is claude-sonnet-4-6",        /claude-sonnet-4-6/.test(src)],
  ["extractJson function present",       /function extractJson/.test(src)],
  ["Raw response debug log present",     /\[DEBUG\] Raw response/.test(src)],
  ["System prompt field present",        /system:.*JSON-only API endpoint/.test(src)],
  ["KEEP IN ENGLISH list present",       /KEEP IN ENGLISH/.test(src)],
  ["TRANSLATE TO THAI list present",     /TRANSLATE TO THAI naturally/.test(src)],
  ["UTF-8 Cyrillic warning present",     /Cyrillic/.test(src)],
  ["'private key' in keep-list",         /private key/.test(src)],
  ["'post-quantum' in keep-list",        /post-quantum/.test(src)],
  ["'quantum hard fork' in keep-list",   /quantum hard fork/.test(src)],
  ["'semantics' in keep-list",           /semantics/.test(src)],
  ["migration anti-pattern noted",       /ย้ายถิ่น/.test(src)],
  ["Prompt ends: Raw JSON only",         /Raw JSON only/.test(src)],
];

let passed = 0;
let failed = 0;
for (const [label, result] of checks) {
  const mark = result ? "✅" : "❌";
  console.log(`${mark} ${label}`);
  result ? passed++ : failed++;
}

// ── 2. extractJson edge-case tests ──────────────────────────────────────────

// Inline the function for isolated testing
function extractJson(responseText) {
  const fenceMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

const VALID = '{"ok":true}';
const jsonTests = [
  ["bare JSON",                          VALID,                      VALID],
  ["```json fence```",                   "```json\n" + VALID + "\n```", VALID],
  ["``` fence```",                       "```\n" + VALID + "\n```",  VALID],
  ["leading preamble + fence",           "Sure!\n```json\n" + VALID + "\n```", VALID],
  ["trailing fence only",                VALID + "\n```",            VALID],
  ["leading fence only",                 "```json\n" + VALID,        VALID],
  ["preamble + bare JSON (brace scan)", "Here is the JSON:\n" + VALID, VALID],
];

console.log("\nextractJson edge cases:");
for (const [label, input, expected] of jsonTests) {
  const got = extractJson(input);
  const ok = got === expected;
  const mark = ok ? "✅" : "❌";
  console.log(`${mark} ${label}`);
  if (!ok) {
    console.log(`   expected: ${expected}`);
    console.log(`   got:      ${got}`);
    failed++;
  } else {
    passed++;
  }
}

// ── 3. Prompt translation-rule coverage ─────────────────────────────────────

console.log("\nTranslation-rule regression coverage:");
const regressionCases = [
  ["'semantics' stays English",
    /KEEP IN ENGLISH[\s\S]{0,300}semantics/.test(src)],
  ["'private key' stays English",
    /KEEP IN ENGLISH[\s\S]{0,300}private key/.test(src)],
  ["'post-quantum' stays English",
    /KEEP IN ENGLISH[\s\S]{0,300}post-quantum/.test(src)],
  ["'quantum hard fork' stays English",
    /KEEP IN ENGLISH[\s\S]{0,300}quantum hard fork/.test(src)],
  ["'migration' → NOT 'ย้ายถิ่น' rule present",
    /ย้ายถิ่น/.test(src)],
  ["Cyrillic ban in Thai fields",
    /Cyrillic/.test(src)],
];

for (const [label, result] of regressionCases) {
  const mark = result ? "✅" : "❌";
  console.log(`${mark} ${label}`);
  result ? passed++ : failed++;
}

console.log(`\n── Summary: ${passed} passed, ${failed} failed ──`);
process.exit(failed > 0 ? 1 : 0);
