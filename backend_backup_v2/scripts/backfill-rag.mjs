import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

/** ---- CONFIG ---- */
const DATA_DIR = process.argv[2] || './data/storyboards'; // folder of .json files
const MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

/** ---- CLIENTS ---- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/** ---- HELPERS ---- */
async function embed(text) {
  const e = await openai.embeddings.create({ model: MODEL, input: text });
  return e.data[0].embedding;
}

function toPlainContent(obj) {
  // Accept a few common shapes, fall back to the whole object.
  if (typeof obj === 'string') return obj;
  if (obj?.content) return typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content);
  if (obj?.json)     return typeof obj.json === 'string' ? obj.json : JSON.stringify(obj.json);
  return JSON.stringify(obj);
}

async function insertOne(item) {
  const title = item.title || item.moduleName || item.name || '(untitled storyboard)';
  const tags  = Array.isArray(item.tags) ? item.tags : [];
  const level = Number.isFinite(item.level) ? item.level : null;

  const plain = toPlainContent(item).slice(0, 8000); // keep under token limits
  const vec = await embed(plain);

  const { error } = await supabase
    .from('rag_storyboards')
    .insert({ title, tags, level, content: item, embedding: vec });

  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('✓ Inserted', title);
  }
}

async function main() {
  // Ensure env
  ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].forEach(k => {
    if (!process.env[k]) throw new Error(`Missing env: ${k}`);
  });

  // Read all .json files in DATA_DIR
  const files = fs.readdirSync(DATA_DIR).filter(f => f.toLowerCase().endsWith('.json'));
  if (files.length === 0) {
    console.log('No .json files found in', DATA_DIR);
    return;
  }

  for (const f of files) {