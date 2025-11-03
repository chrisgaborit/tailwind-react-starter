// backend/scripts/patch_interactivity_templates.ts
import fs from "fs";
import path from "path";

const filePath = path.resolve(__dirname, "../src/library/interactivityLibrary.ts");

const safeOptionsHelper = `
// ✅ TEMP PATCH FOR INTERACTIVITY TEMPLATES USING \`.map()\` UNSAFELY
function safeOptions<T>(params: any, fallback: T[] = []): T[] {
  return Array.isArray(params?.options) ? params.options : fallback;
}
`;

// Read original content
let content = fs.readFileSync(filePath, "utf-8");

// Inject `safeOptions()` if not already present
if (!content.includes("function safeOptions")) {
  const insertAfter = content.indexOf("export type StoryboardModule");
  content =
    content.slice(0, insertAfter) +
    "\n" +
    safeOptionsHelper +
    "\n" +
    content.slice(insertAfter);
  console.log("🛠️ Inserted `safeOptions()` helper.");
}

// Replace all unsafe `.map()` calls on `params.options`
const mapRegex = /params\.options\.map/g;
const replaced = content.replace(mapRegex, "(params?.options ?? []).map");

fs.writeFileSync(filePath, replaced, "utf-8");
console.log("✅ All unsafe `.map()` calls patched in interactivityLibrary.ts.");