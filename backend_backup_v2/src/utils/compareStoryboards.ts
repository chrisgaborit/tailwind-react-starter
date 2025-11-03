const { create } = require('jsondiffpatch');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const htmlFormatter = require("jsondiffpatch/formatters/html");

export function diffToHtml(a: unknown, b: unknown, titleA = "A", titleB = "B") {
  const jdp = create({ arrays: { detectMove: false, includeValueOnMove: false } });
  const delta = jdp.diff(a, b);

  // css may be a function in some versions, or a string in others
  const css = typeof htmlFormatter.css === "function"
    ? htmlFormatter.css()
    : (htmlFormatter.css || "");

  const formatted = htmlFormatter.format(delta, a);

  const html = `
  <html><head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head><body>
    <h1>Storyboard Diff: ${titleA} → ${titleB}</h1>
    ${formatted}
  </body></html>`;
  return html;
}

export function writeReport(a: object, b: object, outPath = "diff-report.html") {
  const fs = require("fs");
  fs.writeFileSync(outPath, diffToHtml(a, b));
  return outPath;
}
