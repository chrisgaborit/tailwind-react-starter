// backend/src/library/injectBlueprint.ts

import fs from "fs";
import path from "path";

interface PromptFragments {
  promptPreamble: string;
  pages: { pageNumber: string; title: string; type: string; instructions?: string; contentInstructions?: any }[];
}

/**
 * Reads the Brandon Hall JSON blueprint and constructs a full prompt string.
 * Injects the topic, audience, duration, word count, and narration speed dynamically.
 */
export function injectBlueprint(
  topic: string,
  audience: string,
  duration: number = 20,
  narrationSpeedWPM: number = 140
): string {
  const blueprintPath = path.resolve(__dirname, "blueprints", "bhBlueprint.json");
  const raw = fs.readFileSync(blueprintPath, "utf-8");
  const json: PromptFragments = JSON.parse(raw);

  const totalWords = duration * narrationSpeedWPM;
  const pageCount = json.pages.length;

  // 🧠 Replace tokens in prompt preamble
  let prompt = json.promptPreamble
    .replace(/{{PAGE_COUNT}}/g, String(pageCount))
    .replace(/{{TOPIC}}/g, topic)
    .replace(/{{AUDIENCE}}/g, audience)
    .replace(/{{DURATION}}/g, `${duration} minutes`)
    .replace(/{{WORD_COUNT}}/g, String(totalWords))
    .replace(/{{NARRATION_SPEED}}/g, String(narrationSpeedWPM));

  // 🧩 Append structured pages as detailed instructions
  for (const page of json.pages) {
    prompt += `\n\n--- Page ${page.pageNumber} — ${page.title} (${page.type}) ---\n`;
    if (page.instructions) prompt += page.instructions + "\n";
    if (page.contentInstructions) {
      prompt += "\nLevel-specific guidance:";
      for (const [level, guidance] of Object.entries(page.contentInstructions)) {
        prompt += `\n  - ${level}: ${guidance}`;
      }
    }
  }

  return prompt.trim();
}
