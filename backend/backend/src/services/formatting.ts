// backend/src/services/formatting.ts

/**
 * Centralised styles + small helpers for PDF rendering.
 * Keep all colours, spacing, and typography here so the PDF
 * stays consistent with your on-screen storyboard.
 */

export type BrandTheme = {
  accent: string;       // headings / highlights
  barBg: string;        // section bars / table headers
  barText: string;      // bar text colour
  border: string;       // card & table borders
  text: string;         // body text
  muted: string;        // secondary text
  thBg: string;         // table header bg
  thText: string;       // table header text
  cardBg: string;       // card background
  fontFamily: string;   // base font
};

export const defaultTheme: BrandTheme = {
  accent: "#0ea5e9",
  barBg: "#f5f7fb",
  barText: "#1f2a44",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  thBg: "#f5f7fb",
  thText: "#1f2a44",
  cardBg: "#ffffff",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
};

export function getBaseCss(theme: BrandTheme = defaultTheme): string {
  return `
  <style>
    :root {
      --accent: ${theme.accent};
      --bar-bg: ${theme.barBg};
      --bar-text: ${theme.barText};
      --border: ${theme.border};
      --text: ${theme.text};
      --muted: ${theme.muted};
      --th-bg: ${theme.thBg};
      --th-text: ${theme.thText};
      --card-bg: ${theme.cardBg};
      --font: ${theme.fontFamily};
    }

    @page { size: A4 landscape; margin: 12mm; }
    html, body { height: 100%; }
    body {
      font-family: var(--font);
      color: var(--text);
      margin: 0;
      background: #fff;
      font-size: 12px;
      line-height: 1.35;
    }

    h1 { margin: 0 0 6px 0; font-size: 20px; color: var(--accent); }
    h2, h3 { color: var(--bar-text); margin: 0 0 6px 0; }
    .muted { color: var(--muted); }
    .small { font-size: 12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; white-space: pre-wrap; }

    .wrapper { padding: 10mm 8mm 8mm; }

    .card {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card-bg);
      margin: 10px 0;
      box-shadow: 0 1px 0 rgba(0,0,0,0.02);
      break-inside: avoid;
    }
    .bar {
      display: grid; grid-template-columns: 1fr auto auto auto; gap: 8px;
      border-bottom: 1px solid var(--border);
      background: var(--bar-bg);
      border-top-left-radius: 8px; border-top-right-radius: 8px;
      padding: 10px;
      align-items: center;
    }
    .bar .title { font-weight: 700; color: var(--bar-text); font-size: 13px; }
    .badge { border: 1px solid var(--border); background: var(--bar-bg); border-radius: 9999px; padding: 2px 8px; font-size: 10px; color: var(--bar-text); }
    .section { padding: 10px 12px; border-top: 1px solid var(--border); }
    .section:first-of-type { border-top: 0; }
    .grid { display: grid; gap: 12px; }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
    .kv { display: grid; grid-template-columns: 140px 1fr; gap: 6px; }
    .kv .k { color: var(--muted); font-weight: 600; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
    .tbl th { text-align: left; background: var(--th-bg); color: var(--th-text); font-weight: 700; padding: 8px; border: 1px solid var(--border); }
    .tbl td { border: 1px solid var(--border); padding: 8px; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border); font-size: 10px; color: var(--bar-text); background: #fff; }

    /* On-screen text block */
    .ost { padding: 8px; border: 1px dashed var(--border); border-radius: 6px; background: #fff; }

    /* Title slide helper */
    .title-splash { text-align: center; padding: 18px 0; }
    .title-splash .big { font-size: 24px; font-weight: 800; color: var(--bar-text); }
    .subtitle { color: var(--muted); margin-top: 6px; }

  </style>
  `;
}

/** Tiny helper to safely escape text into HTML */
export function escapeHTML(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Clamp OST to ~70 words (keeps PDF tidy if upstream missed it) */
export function clampWords(text: string, limit = 70): string {
  const words = String(text || "").trim().split(/\s+/);
  return words.length <= limit ? words.join(" ") : words.slice(0, limit).join(" ") + " […]";
}