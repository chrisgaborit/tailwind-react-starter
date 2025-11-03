// backend/src/services/pdfSummary.ts

/**
 * Builds a Brandon Hall–style summary (HTML) of a storyboard for PDF export.
 * This file intentionally produces HTML; your existing pdfService can convert HTML → PDF.
 */

import type { StoryboardModule, StoryboardScene } from "../types/storyboardTypes";

type AddieTally = { A: number; D1: number; D2: number; I: number; E: number };

function tallyADDIE(scenes: StoryboardScene[]): AddieTally {
  const t: AddieTally = { A: 0, D1: 0, D2: 0, I: 0, E: 0 };
  for (const s of scenes) {
    const p = s?.instructionalTag?.addie?.phase as keyof AddieTally | undefined;
    if (p && t[p] != null) t[p]++;
  }
  return t;
}

function distinctInteractionTypes(scenes: StoryboardScene[]) {
  return Array.from(
    new Set(
      scenes
        .map((s) => (s?.interactionType || "").trim())
        .filter(Boolean)
    )
  );
}

function knowledgeCheckScenes(scenes: StoryboardScene[]) {
  const isKC = (s: any) => {
    const t = String(s?.interactionType || "").toLowerCase();
    return ["mcq", "scenario", "drag", "drop", "quiz", "multi-select"].some((k) => t.includes(k));
  };
  return scenes.map((s, i) => ({ s, i })).filter(({ s }) => isKC(s));
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderSummaryHTML(storyboard: StoryboardModule): string {
  const sb = storyboard;
  const scenes = (sb.scenes || []) as StoryboardScene[];

  const addie = tallyADDIE(scenes);
  const types = distinctInteractionTypes(scenes);
  const kcs = knowledgeCheckScenes(scenes);

  const totalSec = scenes.reduce((acc, s: any) => acc + Number(s?.timing?.estimatedSeconds || 60), 0);
  const totalMin = Math.round(totalSec / 60);

  const loList = Array.isArray((sb as any).learningOutcomes)
    ? (sb as any).learningOutcomes
    : (sb as any).intro?.learningObjectives || [];

  const brandColours =
    (sb as any)?.metadata?.brand?.colours ||
    (sb as any)?.colours ||
    "";

  const addieTable = `
    <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <thead><tr><th>Phase</th><th>Count</th></tr></thead>
      <tbody>
        <tr><td>Analysis (A)</td><td>${addie.A}</td></tr>
        <tr><td>Design (D1)</td><td>${addie.D1}</td></tr>
        <tr><td>Development (D2)</td><td>${addie.D2}</td></tr>
        <tr><td>Implementation (I)</td><td>${addie.I}</td></tr>
        <tr><td>Evaluation (E)</td><td>${addie.E}</td></tr>
      </tbody>
    </table>
  `;

  const kcRows = kcs
    .map(({ s, i }) => {
      const title = escapeHtml(String(s.pageTitle || `Scene ${i + 1}`));
      const itype = escapeHtml(String(s.interactionType || "—"));
      const rule = escapeHtml(String(s?.interactionDetails?.completionRule || "—"));
      return `<tr><td>${i + 1}</td><td>${title}</td><td>${itype}</td><td>${rule}</td></tr>`;
    })
    .join("");

  const kcTable = `
    <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <thead><tr><th>#</th><th>Scene</th><th>Type</th><th>Completion Rule</th></tr></thead>
      <tbody>${kcRows || `<tr><td colspan="4">No knowledge checks found</td></tr>`}</tbody>
    </table>
  `;

  const loHtml = (loList || [])
    .map((x: any) => `<li>${escapeHtml(String(x))}</li>`)
    .join("");

  const tocHtml = (sb.tableOfContents || [])
    .map((t: string, i: number) => `<li>${i + 1}. ${escapeHtml(t)}</li>`)
    .join("");

  const interactionsHtml = types.map((t) => `<li>${escapeHtml(t)}</li>`).join("");

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(sb.moduleName)} — Summary</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; }
        h1, h2, h3 { margin: 0.6rem 0; }
        .section { margin: 1rem 0 1.5rem; }
        .muted { color: #666; font-size: 0.95rem; }
        ul { margin: 0.5rem 0 0.5rem 1.25rem; }
        table { font-size: 0.95rem; }
        .pill { display:inline-block; padding: 2px 8px; border-radius: 999px; background: #f1f1f1; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(sb.moduleName)}</h1>
      <div class="muted">Target Duration: ~${totalMin} min • Scenes: ${scenes.length} • Distinct Interactions: ${
    types.length
  }</div>

      <div class="section">
        <h2>Learning Outcomes</h2>
        <ul>${loHtml || "<li>Not provided</li>"}</ul>
      </div>

      <div class="section">
        <h2>Table of Contents</h2>
        <ul>${tocHtml || "<li>Not provided</li>"}</ul>
      </div>

      <div class="section">
        <h2>ADDIE Coverage</h2>
        ${addieTable}
      </div>

      <div class="section">
        <h2>Interaction Diversity</h2>
        <ul>${interactionsHtml || "<li>None detected</li>"}</ul>
      </div>

      <div class="section">
        <h2>Knowledge Checks</h2>
        ${kcTable}
      </div>

      <div class="section">
        <h2>Brand & Accessibility</h2>
        <p><span class="pill">Brand Colours:</span> ${escapeHtml(brandColours)}</p>
        <p class="muted">Accessibility must include: captions ON, keyboard path + focus order, WCAG AA contrast, reduced-motion alternatives.</p>
      </div>

      <div class="section">
        <h2>Evaluation Plan</h2>
        ${
          sb.evaluationPlan
            ? `<pre>${escapeHtml(JSON.stringify(sb.evaluationPlan, null, 2))}</pre>`
            : `<p>Not provided</p>`
        }
      </div>
    </body>
  </html>
  `.trim();

  return html;
}

// Convenience: return object with both HTML and small metadata
export function buildSummary(storyboard: StoryboardModule) {
  return {
    html: renderSummaryHTML(storyboard),
    meta: {
      scenes: storyboard.scenes?.length || 0,
      idMethod: (storyboard as any).idMethod || "ADDIE",
    },
  };
}