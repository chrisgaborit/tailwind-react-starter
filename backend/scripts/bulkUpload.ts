import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ----- Config -----
const FOLDER = process.argv[2] || './json';
const EMBEDDING_MODEL = 'text-embedding-3-large'; // 3072-dim

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Accept both schemas: {scenes: [...] } or {pages:[{events:[...]}]}
function toScenes(sb: any) {
  if (Array.isArray(sb?.scenes)) return sb.scenes;
  if (Array.isArray(sb?.pages)) {
    const scenes: any[] = [];
    for (const p of sb.pages) {
      if (!Array.isArray(p?.events)) continue;
      for (const ev of p.events) {
        scenes.push({
          sceneNumber: Number(ev?.eventNumber) || undefined,
          title: ev?.pageTitle || p?.pageTitle || `Event ${ev?.eventNumber ?? ''}`.trim(),
          onScreenText: ev?.onScreenText,
          narration: ev?.aiProductionBrief?.audio?.script,
          visual: [
            ev?.aiProductionBrief?.visual?.mediaType,
            ev?.aiProductionBrief?.visual?.style,
            ev?.aiProductionBrief?.visual?.subject,
            ev?.aiProductionBrief?.visual?.composition,
            ev?.aiProductionBrief?.visual?.environment
          ].filter(Boolean).join(' | ')
        });
      }
    }
    return scenes;
  }
  return [];
}

function sceneToText(s: any) {
  const bits = [
    s.title,
    Array.isArray(s.onScreenText) ? s.onScreenText.join(' ') : s.onScreenText,
    s.narration,
    s.visual,
    s.userInstructions
  ].filter(Boolean);
  return bits.join('\n').trim();
}

async function embed(text: string) {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}

async function upsertStoryboard(sb: any, slug: string) {
  const { data: row, error: upErr } = await supabase
    .from('storyboards')
    .upsert(
      {
        slug,
        module_name: sb.moduleName ?? slug,
        json: sb,
        tags: sb.tags ?? null,
        rating: sb.rating ?? null
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();

  if (upErr) throw upErr;

  const { error: delErr } = await supabase.from('storyboard_chunks').delete().eq('storyboard_id', row.id);
  if (delErr) throw delErr;

  const scenes = toScenes(sb);
  let count = 0;
  for (const [i, sc] of scenes.entries()) {
    const content = sceneToText(sc);
    if (!content) continue;
    const embedding = await embed(content);
    const payload = {
      storyboard_id: row.id as string,
      scene_no: Number(sc.sceneNumber) || i + 1,
      content,
      metadata: { title: sc.title ?? null },
      embedding
    };
    const { error: insErr } = await supabase.from('storyboard_chunks').insert(payload);
    if (insErr) throw insErr;
    count++;
  }

  return { id: row.id as string, chunks: count };
}

(async () => {
  const abs = path.resolve(FOLDER);
  console.log(`📂 Scanning: ${abs}`);
  if (!fs.existsSync(abs)) {
    console.error('Folder not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(abs).filter(f => f.toLowerCase().endsWith('.json'));
  if (!files.length) {
    console.log('No JSON files found.');
    process.exit(0);
  }

  let ok = 0, bad = 0;
  for (const file of files) {
    const full = path.join(abs, file);
    try {
      const raw = fs.readFileSync(full, 'utf8');
      const sb = JSON.parse(raw);
      const slug = file
        .toLowerCase()
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { id, chunks } = await upsertStoryboard(sb, slug);
      ok++;
      console.log(`✅ ${file}: upserted ${id} with ${chunks} chunks`);
    } catch (e: any) {
      bad++;
      console.error(`❌ ${file}: ${e.message || e}`);
    }
  }

  console.log(`\nSummary: ${ok} succeeded, ${bad} failed.`);
  process.exit(bad ? 1 : 0);
})();
