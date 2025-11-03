// Simple JSON diff → HTML (no TS needed)
const fs = require("fs");
const { create, formatters } = require("jsondiffpatch");

if (process.argv.length < 4) {
  console.error("Usage: node scripts/compare.js <fileA.json> <fileB.json> [output.html]");
  process.exit(1);
}

const fileA = process.argv[2];
const fileB = process.argv[3];
const out = process.argv[4] || "diff-report.html";

const a = JSON.parse(fs.readFileSync(fileA, "utf-8"));
const b = JSON.parse(fs.readFileSync(fileB, "utf-8"));

const jdp = create({ arrays: { detectMove: false, includeValueOnMove: false } });
const delta = jdp.diff(a, b);

const html = `
<html><head>
  <meta charset="utf-8" />
  <style>${formatters.html.css()}</style>
</head><body>
  <h1>Storyboard Diff</h1>
  <p><strong>A:</strong> ${fileA}<br/><strong>B:</strong> ${fileB}</p>
  ${formatters.html.format(delta, a)}
</body></html>`;

fs.writeFileSync(out, html);
console.log(\`✅ Report saved to \${out}\`);
