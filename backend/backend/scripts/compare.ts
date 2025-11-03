import fs from "fs";
import { writeReport } from "../src/utils/compareStoryboards";

if (process.argv.length < 4) {
  console.error("Usage: ts-node scripts/compare.ts <fileA.json> <fileB.json> [output.html]");
  process.exit(1);
}

const a = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
const b = JSON.parse(fs.readFileSync(process.argv[3], "utf-8"));
const out = process.argv[4] || "diff-report.html";

console.log("📄 Creating diff report...");
const reportPath = writeReport(a, b, out);
console.log(`✅ Report saved to ${reportPath}`);
