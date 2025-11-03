import fs from 'fs';
import path from 'path';

const PROMPT_DIR = path.join(__dirname, '../src/prompts');
const REQUIRED_FIELDS = ['prompt']; // Expandable if needed

function isJsonFile(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.json';
}

function validatePromptFile(filePath: string): void {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    const missingFields = REQUIRED_FIELDS.filter((field) => !(field in json));
    if (missingFields.length > 0) {
      console.warn(`❌ ${filePath} is missing fields: ${missingFields.join(', ')}`);
    } else {
      console.log(`✅ ${filePath} is valid.`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`🛑 ${filePath} is not valid JSON.`, message);
  }
}

function walkDirAndValidate(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDirAndValidate(fullPath);
    } else if (entry.isFile() && isJsonFile(fullPath)) {
      validatePromptFile(fullPath);
    }
  }
}

// Run the validator
walkDirAndValidate(PROMPT_DIR);
