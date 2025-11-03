import fs from "fs";
import path from "path";

const HEALTH_URL = "http://localhost:8080/health";
const BANNED_PATTERNS = [
  /\bSarah\b/i,
  /\bChen\b/i,
  /\bcoach(?:es|ing)?\b/i,
  /\bmentoring\b/i,
];
const IGNORED_DIRS = new Set([
  "node_modules",
  "docs",
  "types",
  "__unused__",
  ".git",
  "dist",
]);

interface ContaminationHit {
  file: string;
  line: number;
  snippet: string;
}

async function pingHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.error(`⚠️ Health check failed with status ${res.status}`);
      return false;
    }
    console.log("✅ Health endpoint reachable");
    return true;
  } catch (error) {
    console.error("⚠️ Health request failed:", (error as Error).message);
    return false;
  }
}

function scanFile(filePath: string, hits: ContaminationHit[]): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      BANNED_PATTERNS.forEach((pattern) => {
        if (pattern.test(line)) {
          hits.push({
            file: filePath,
            line: idx + 1,
            snippet: line.trim(),
          });
        }
      });
    });
  } catch (error) {
    console.warn(`⚠️ Unable to read ${filePath}:`, (error as Error).message);
  }
}

function walkDir(root: string, hits: ContaminationHit[]): void {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, hits);
    } else if (entry.isFile()) {
      scanFile(fullPath, hits);
    }
  }
}

async function main(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n===== Clean Backend Verification @ ${timestamp} =====`);

  const healthOk = await pingHealth();

  const hits: ContaminationHit[] = [];
  walkDir(path.join(process.cwd(), "src"), hits);

  if (hits.length === 0) {
    console.log("✅ No legacy contamination detected — Clean launch confirmed");
  } else {
    console.log("⚠️ Contamination detected:");
    hits.forEach((hit) => {
      console.log(`  ${hit.file}:${hit.line} → ${hit.snippet}`);
    });
  }

  if (healthOk && hits.length === 0) {
    console.log("\nCLEAN ✅");
  } else {
    console.log("\nCONTAMINATED ⚠️");
  }
}

main().catch((error) => {
  console.error("Verification run failed:", error);
  process.exitCode = 1;
});
