// scripts/repairAndValidateJson.ts
// Usage: npx ts-node scripts/repairAndValidateJson.ts "/path/to/folder" [--target='*.JSON']
// Creates <name>.repaired.json for files it can fix.

import fs from 'fs';
import path from 'path';
import glob from 'glob';

const root = process.argv[2];
if (!root) {
  console.error('Usage: npx ts-node scripts/repairAndValidateJson.ts "/path/to/folder"');
  process.exit(1);
}

// naive smart quotes -> ASCII
const deSmart = (s: string) =>
  s
    .replace(/\u201C|\u201D|\u301D|\u301E|\u00AB|\u00BB/g, '"')
    .replace(/\u2018|\u2019|\u2032/g, "'");

// strip BOM + control chars (except \n \t)
const stripWeird = (s: string) =>
  s
    .replace(/^\uFEFF/, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');

// try to keep only the JSON body if there’s stray text
const keepJsonBody = (s: string) => {
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return s.slice(first, last + 1);
  return s;
};

// fix a few common trailing comma patterns
const fixTrailingCommas = (s: string) =>
  s
    .replace(/,\s*([}\]])/g, '$1'); // remove commas before } or ]

// basic quote-around-keys (best effort; assumes simple keys)
// Use cautiously; only when parse fails at the end
const maybeQuoteKeys = (s: string) =>
  s.replace(/([{,\s])([A-Za-z0-9_]+)\s*:/g, '$1"$2":');

function tryRepairs(raw: string) {
  let txt = raw;
  txt = stripWeird(txt);
  txt = deSmart(txt);
  txt = keepJsonBody(txt);
  txt = fixTrailingCommas(txt);

  const attempts = [txt, maybeQuoteKeys(txt)];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      return { ok: true as const, text: JSON.stringify(parsed, null, 2) };
    } catch (e) {
      // continue
    }
  }
  return { ok: false as const, text: '' };
}

const pattern = path.join(root, '**/*.json');
const files = glob.sync(pattern, { nocase: true });

if (files.length === 0) {
  console.log('No JSON files found.');
  process.exit(0);
}

let fixed = 0, failed = 0, skipped = 0;

for (const f of files) {
  const base = path.basename(f).toLowerCase();
  // only touch your known-bad ones or everything — adjust here if you want tighter scope
  const raw = fs.readFileSync(f, 'utf-8');
  const trimmed = raw.trim();
  if (!trimmed) { console.log(`⏭️  ${path.basename(f)} — empty (skipping)`); skipped++; continue; }

  const res = tryRepairs(raw);
  if (res.ok) {
    const out = f.replace(/\.json$/i, '.repaired.json');
    fs.writeFileSync(out, res.text, 'utf-8');
    console.log(`✅ Repaired → ${path.basename(out)}`);
    fixed++;
  } else {
    console.log(`❌ Could not repair → ${path.basename(f)}`);
    failed++;
  }
}

console.log('\n=== REPAIR SUMMARY ===');
console.log(`✅ Repaired: ${fixed}`);
console.log(`⏭️  Empty:   ${skipped}`);
console.log(`❌ Failed:   ${failed}`);

