// backend/src/services/pdfService.ts
import type { StoryboardModule, StoryboardScene } from "@/types";

/**
 * Renders a polished, print‑ready HTML document for PDF export.
 * - Matches the on‑screen card layout, with readable typography and spacing
 * - Visual brief (incl. palette swatches), overlay elements, OST word count
 * - Audio (script + voice params), interaction (logic, retry, completion, xAPI)
 * - Accessibility quick checks and timing
 * - Module header: overview, brand, timing rollup, revision history, TOC, pronunciation guide
 * - Extras: optional preview image, knowledge checks, per‑scene events
 */
export function renderStoryboardAsHTML(sb: StoryboardModule): string {
  const css = `
  <style>
    :root{
      --ink:#0f172a;         /* slate-900 */
      --muted:#475569;       /* slate-600 */
      --line:#e5e7eb;        /* gray-200 */
      --bg:#ffffff;
      --bg-soft:#f8fafc;     /* slate-50 */
      --brand:#0ea5e9;       /* sky-500 */
      --accent:#1f2a44;      /* deep navy */
      --ok:#059669;          /* green-600 */
      --warn:#d97706;        /* amber-600 */
      --bad:#dc2626;         /* red-600 */
    }
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;background:#fff;color:var(--ink);}
    body{
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell;
      line-height:1.55; font-size:13.75px; padding:28px;
    }
    h1{font-size:28px; margin:0 0 6px; color:var(--brand);}
    h2{font-size:18px; margin:24px 0 8px; color:var(--accent);}
    h3{font-size:14px; margin:0 0 6px; color:var(--accent);}
    .muted{color:var(--muted);}
    .small{font-size:12px;}
    .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; white-space:pre-wrap;}
    .hr{height:1px;background:var(--line);margin:14px 0;}
    .badge{display:inline-block; border:1px solid var(--line); background:var(--bg-soft);
           color:var(--accent); font-weight:600; padding:2px 8px; border-radius:999px; font-size:10.5px; margin-right:6px;}
    .pill{display:inline-block; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:600; color:#fff;}
    .pill.ok{background:var(--ok);} .pill.warn{background:var(--warn);} .pill.bad{background:var(--bad);}
    .card{border:1px solid var(--line); border-radius:12px; overflow:hidden; margin:18px 0; box-shadow:0 1px 0 rgba(0,0,0,.04);}
    .bar{display:flex; justify-content:space-between; align-items:center; gap:8px;
         background:var(--bg-soft); border-bottom:1px solid var(--line); padding:10px 14px;}
    .title{font-weight:700;}
    .right{display:flex; align-items:center; gap:8px;}
    .section{padding:12px 14px;}
    .grid{display:grid; gap:12px;}
    .g-2{grid-template-columns:1fr 1fr;}
    .g-3{grid-template-columns:1fr 1fr 1fr;}
    .g-4{grid-template-columns:1fr 1fr 1fr 1fr;}
    .tbl{width:100%; border-collapse:collapse; font-size:12px;}
    .tbl th, .tbl td{border:1px solid var(--line); padding:6px 8px; text-align:left; vertical-align:top;}
    .tbl th{background:#f3f4f6; color:#111827;}
    .kv{display:grid; grid-template-columns:160px 1fr; gap:6px; align-items:start;}
    .swatches{display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;}
    .sw{display:flex; align-items:center; gap:6px;}
    .sw i{display:inline-block; width:14px; height:14px; border:1px solid #00000020; border-radius:3px;}
    .hint{color:var(--muted); font-style:italic;}
    .toc{margin:6px 0 0 18px; padding:0;}
    .toc li{margin:2px 0;}
    .header-grid{display:grid; gap:12px; grid-template-columns:2fr 1.3fr;}
    .brand-card{border:1px dashed var(--line); border-radius:10px; padding:10px 12px; background:linear-gradient(0deg, #ffffff, #fafafa);}
    .rev li{margin:4px 0;}
    .kpi{display:flex; gap:10px; flex-wrap:wrap;}
    .kpi .box{background:var(--bg-soft); border:1px solid var(--line); border-radius:10px; padding:8px 10px; min-width:130px;}
    .footer-note{margin-top:8px;}
    .imgwrap{border:1px solid var(--line); background:#fff; border-radius:10px; padding:8px; display:inline-block;}
    .imgwrap img{max-width:100%; height:auto; display:block; border-radius:6px;}
  </style>
  `;

  // ==== HEADER =======================================================================
  const timing = sb?.metadata?.moduleTiming || {};
  const brand = sb?.metadata?.brand || {};
  const headerHTML = `
    <h1>${esc(sb.moduleName || "Untitled Module")}</h1>
    <div class="muted small">${esc(sb.moduleOverview || "—")}</div>
    <div class="kpi" style="margin-top:10px;">
      <div class="box"><div class="muted small">Learning Level</div><strong>${esc(sb.learningLevel || "—")}</strong></div>
      <div class="box"><div class="muted small">Audience</div><strong>${esc(sb.targetAudience || "—")}</strong></div>
      <div class="box"><div class="muted small">Target Minutes</div><strong>${numOrDash(timing.targetMinutes)}</strong></div>
      <div class="box"><div class="muted small">Estimated Minutes</div><strong>${numOrDash(timing.totalEstimatedMinutes)}</strong></div>
      <div class="box"><div class="muted small">Scenes</div><strong>${(sb.scenes || []).length}</strong></div>
    </div>

    <div class="header-grid" style="margin-top:12px;">
      <div class="brand-card">
        <h3 style="margin-top:0">Brand</h3>
        <div class="kv">
          <div class="muted small">Colours</div><div>${esc(brand.colours || "—")}</div>
          <div class="muted small">Fonts</div><div>${esc(brand.fonts || "—")}</div>
          <div class="muted small">Guidelines</div><div>${esc(brand.guidelines || "—")}</div>
        </div>
      </div>
      <div class="brand-card">
        <h3 style="margin-top:0">Revision History</h3>
        ${
          (sb.revisionHistory && sb.revisionHistory.length)
            ? `<ul class="rev small">${sb.revisionHistory
                .map(r => `<li><strong>${esc(r.dateISO || "")}</strong> — ${esc(r.change || "")} <span class="muted">(${esc(r.author || "—")})</span></li>`)
                .join("")}</ul>`
            : `<div class="small muted">—</div>`
        }
      </div>
    </div>

    ${renderTOC(sb)}
    ${renderPronunciationGuide(sb)}
    <div class="hr"></div>
  `;

  // ==== SCENES =======================================================================
  const scenesHTML = (sb.scenes || []).map((s, i) => renderScene(s, i)).join("");

  return `<!doctype html>
  <html>
    <head><meta charset="utf-8" />${css}</head>
    <body>
      ${headerHTML}
      ${scenesHTML}
      <div class="footer-note muted small">Generated ${new Date().toLocaleString()}</div>
    </body>
  </html>`;
}

// ----------------------------- Scene Renderer ---------------------------------------

function renderScene(s: StoryboardScene, idx: number): string {
  const v = (s as any).visual || ({} as any);
  const b = v.visualGenerationBrief || ({} as any);

  const overlay = Array.isArray((v as any).overlayElements) ? (v as any).overlayElements : [];
  const palette = Array.isArray(b.colorPalette) ? b.colorPalette : [];

  const ost = String((s as any).onScreenText || "");
  const ostWords = countWords(ost);

  const pageBadges = `
    <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
    <span class="badge">${esc(s.pageType || ((s.interactionType && s.interactionType !== "None") ? "Interactive" : "Informative"))}</span>
    ${s.interactionType && s.interactionType !== "None" ? `<span class="badge">${esc(s.interactionType!)}</span>` : ""}
    ${v?.aspectRatio ? `<span class="badge">${esc(v.aspectRatio)}</span>` : ""}
    ${s.screenId ? `<span class="badge">#${esc(s.screenId)}</span>` : ""}
  `;

  const quick = computeQuickChecks(s, v);

  // Optional preview image (e.g., already generated visual or placeholder)
  const preview = (v as any).previewUrl || (s as any).generatedImageUrl;
  const previewBlock = preview
    ? `<div class="section" style="padding-top:0;">
         <div class="muted small"><strong>Preview</strong></div>
         <div class="imgwrap" style="margin-top:6px; max-width:520px;">
           <img alt="${esc(v.altText || s.pageTitle || "Preview")}" src="${esc(preview)}" />
         </div>
       </div>`
    : "";

  // Knowledge check (legacy tolerance)
  const kcBlock = renderKnowledgeChecks(s);

  // Events (legacy tolerance)
  const eventsBlock = renderEvents(s);

  return `
  <div class="card">
    <div class="bar">
      <div class="title">${esc(s.pageTitle || `Screen ${idx + 1}`)}</div>
      <div class="right">
        ${pageBadges}
        <span class="badge">OST: ${ostWords} words</span>
      </div>
    </div>

    <!-- On‑screen text -->
    <div class="section">
      <div class="muted small"><strong>On‑Screen Text</strong></div>
      <div>${esc(ost || "—")}</div>
    </div>

    <!-- Visuals -->
    <div class="section">
      <h3>Screen Layout & Visuals</h3>
      <div class="grid g-3">
        <div>
          <div class="muted small"><strong>AI Visual Generation Brief</strong></div>
          <div class="mono small">
Scene: ${esc(b.sceneDescription || "—")}
Style: ${esc(b.style || v.style || "—")}
Subject: ${esc(b.subject ? JSON.stringify(b.subject) : "—")}
Setting: ${esc(b.setting || "—")}
Composition: ${esc(b.composition || "—")}
Lighting: ${esc(b.lighting || "—")}
Mood: ${esc(b.mood || "—")}
Brand Integration: ${esc(b.brandIntegration || "—")}
Negative Space: ${esc(b.negativeSpace || "—")}
          </div>
          ${
            palette.length
              ? `<div class="small" style="margin-top:6px;"><span class="muted">Palette:</span>
                   <div class="swatches">
                     ${palette.map(hex => `<span class="sw"><i style="background:${cssColor(hex)}"></i><span class="small mono">${esc(String(hex))}</span></span>`).join("")}
                   </div>
                 </div>`
              : ""
          }
        </div>
        <div>
          <div class="muted small"><strong>Alt Text</strong></div>
          <div class="small">${esc(v.altText || "—")}</div>
          <div class="muted small" style="margin-top:6px;"><strong>AI Prompt (legacy)</strong></div>
          <div class="mono small">${esc(v.aiPrompt || "—")}</div>
        </div>
        <div>
          <div class="muted small"><strong>Media</strong></div>
          <div class="small">${esc([v.mediaType, v.style, v.environment].filter(Boolean).join(" • ") || "—")}</div>
          <div class="muted small" style="margin-top:6px;"><strong>Screen Layout</strong></div>
          <div class="small">${esc(typeof s.screenLayout === "string" ? s.screenLayout : s.screenLayout?.description || "—")}</div>
        </div>
      </div>

      ${
        Array.isArray(overlay) && overlay.length
          ? `<div style="margin-top:12px;">
               <div class="muted small"><strong>Overlay Elements</strong></div>
               <table class="tbl small"><thead><tr><th>Type</th><th>Content</th><th>Style</th><th>AI Directive</th></tr></thead>
                 <tbody>
                   ${overlay.map(el => `
                     <tr>
                       <td>${esc(el.elementType || "—")}</td>
                       <td>${esc(el.content || (el as any).placement || "—")}</td>
                       <td class="mono small">${esc(el.style ? JSON.stringify(el.style) : "—")}</td>
                       <td class="mono small">${esc(el.aiGenerationDirective || "—")}</td>
                     </tr>`).join("")}
                 </tbody>
               </table>
             </div>`
          : ""
      }
    </div>

    ${previewBlock}

    <!-- Audio -->
    <div class="section">
      <h3>Audio</h3>
      <div class="grid g-3">
        <div>
          <div class="muted small"><strong>Voiceover Script</strong></div>
          <div class="mono small">${esc(s.audio?.script || s.narrationScript || "—")}</div>
        </div>
        <div>
          <div class="muted small"><strong>Voice Parameters</strong></div>
          <div class="small">
            Persona: ${esc(s.audio?.voiceParameters?.persona || "—")}<br/>
            Pace: ${esc(s.audio?.voiceParameters?.pace || "—")}<br/>
            Tone: ${esc(s.audio?.voiceParameters?.tone || "—")}<br/>
            Emphasis: ${esc(s.audio?.voiceParameters?.emphasis || "—")}
          </div>
        </div>
        <div>
          <div class="muted small"><strong>AI Directive</strong></div>
          <div class="mono small">${esc(s.audio?.aiGenerationDirective || "—")}</div>
        </div>
      </div>
    </div>

    <!-- Interaction -->
    <div class="section">
      <h3>Interaction</h3>
      <div class="small"><strong>Type:</strong> ${esc(s.interactionType || "None")}</div>
      ${interactionBlock(s)}
    </div>

    ${kcBlock}

    ${eventsBlock}

    <!-- Accessibility / Timing / Quick Checks -->
    <div class="section">
      <h3>Accessibility & Timing</h3>
      <div class="small"><strong>Accessibility Notes</strong></div>
      <div class="small">${esc(s.accessibilityNotes || "—")}</div>

      <div class="grid g-3" style="margin-top:8px;">
        <div>
          <div class="muted small"><strong>Quick Checks</strong></div>
          <div class="small">
            ${quick.captions ? `<span class="pill ok">✔ Captions ON by default</span>` : `<span class="pill bad">✗ Captions ON by default</span>`}
            ${quick.keyboard ? `<span class="pill ok">✔ Keyboard path</span>` : `<span class="pill bad">✗ Keyboard path</span>`}
            ${quick.focus ? `<span class="pill ok">✔ Focus order</span>` : `<span class="pill bad">✗ Focus order</span>`}
            ${quick.contrast ? `<span class="pill ok">✔ Contrast</span>` : `<span class="pill warn">! Contrast?</span>`}
            ${quick.reducedMotion ? `<span class="pill ok">✔ Reduced motion</span>` : `<span class="pill warn">! Reduced motion</span>`}
          </div>
        </div>
        <div>
          <div class="muted small"><strong>Timing</strong></div>
          <div class="small">Estimated: ${String(s.timing?.estimatedSeconds ?? "—")}s</div>
        </div>
        <div>
          <div class="muted small"><strong>Developer Notes</strong></div>
          <div class="small">${esc(s.developerNotes || "—")}</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ----------------------------- Header helpers ---------------------------------------

function renderTOC(sb: StoryboardModule): string {
  const toc = sb.tableOfContents || [];
  if (!toc || (Array.isArray(toc) && toc.length === 0)) return "";

  const isStructured =
    Array.isArray(toc) && (toc as any)[0] && typeof (toc as any)[0] === "object" && "title" in (toc as any)[0];

  if (isStructured) {
    return `<h2>Table of Contents</h2>
      <ol class="toc">
        ${(toc as any).map((t: any) => `<li>${esc(t.title)} ${t.pageNumber ? `<span class="muted small">— p${t.pageNumber}</span>` : ""}</li>`).join("")}
      </ol>`;
  }

  return `<h2>Table of Contents</h2>
    <ol class="toc">${(toc as string[]).map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`;
}

function renderPronunciationGuide(sb: StoryboardModule): string {
  const pg = sb.pronunciationGuide || [];
  if (!pg.length) return "";
  return `
    <h2>Pronunciation Guide</h2>
    <table class="tbl small">
      <thead><tr><th>Term</th><th>Pronunciation</th><th>Note</th></tr></thead>
      <tbody>
        ${pg.map(p => `<tr><td>${esc(p.term || "—")}</td><td>${esc(p.pronunciation || "—")}</td><td>${esc(p.note || "—")}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

// ----------------------------- Scene helpers ----------------------------------------

function interactionBlock(s: StoryboardScene): string {
  const id = (s as any).interactionDetails;
  if (!id) return `<div class="hint small">No interaction details.</div>`;

  const logicRows = (id.aiDecisionLogic || []).map((r: any) => `
    <tr>
      <td>${esc(r.choice || "—")}</td>
      <td>${esc(r.feedback?.text || r.feedback || "—")}</td>
      <td>${esc(r.navigateTo || "—")}</td>
    </tr>
  `).join("");

  const xapiRows = (id.xapiEvents || []).map((e: any) => `
    <tr>
      <td>${esc(e.verb || "—")}</td>
      <td>${esc(e.object || "—")}</td>
      <td class="mono small">${esc(e.result ? JSON.stringify(e.result) : "—")}</td>
    </tr>
  `).join("");

  return `
    <div class="grid g-3" style="margin-top:8px;">
      <div>
        <div class="muted small"><strong>AI Directive</strong></div>
        <div class="mono small">${esc(id.aiGenerationDirective || "—")}</div>
        <div class="muted small" style="margin-top:6px;"><strong>Retry</strong></div>
        <div class="small">${esc(id.retryLogic || "—")}</div>
        <div class="muted small" style="margin-top:6px;"><strong>Completion</strong></div>
        <div class="small">${esc(id.completionRule || "—")}</div>
      </div>
      <div>
        <div class="muted small"><strong>Decision Logic</strong></div>
        ${
          logicRows
            ? `<table class="tbl small"><thead><tr><th>Choice</th><th>Feedback</th><th>Navigate</th></tr></thead><tbody>${logicRows}</tbody></table>`
            : `<div class="small">—</div>`
        }
      </div>
      <div>
        <div class="muted small"><strong>xAPI Events</strong></div>
        ${
          xapiRows
            ? `<table class="tbl small"><thead><tr><th>Verb</th><th>Object</th><th>Result</th></tr></thead><tbody>${xapiRows}</tbody></table>`
            : `<div class="small">—</div>`
        }
      </div>
    </div>
  `;
}

function renderKnowledgeChecks(s: StoryboardScene): string {
  const kcList = (s as any).knowledgeChecks || ((s as any).knowledgeCheck ? [(s as any).knowledgeCheck] : []);
  if (!kcList || kcList.length === 0) return "";

  const rows = kcList
    .map((kc: any, i: number) => {
      const stem = kc.stem || kc.question || `Item ${i + 1}`;
      const options = Array.isArray(kc.options) ? kc.options : [];
      const optRows = options
        .map((o: any) => {
          const text = typeof o === "string" ? o : o.text || "";
          const correct = typeof o === "object" && o.correct ? "✔" : "";
          const fb = typeof o === "object" && o.feedback ? ` — ${o.feedback}` : "";
          return `<tr><td>${esc(text)}</td><td>${esc(correct)}</td><td class="small">${esc(fb)}</td></tr>`;
        })
        .join("");
      return `
        <div class="section" style="padding-top:0;">
          <h3>Knowledge Check</h3>
          <div class="small"><strong>Stem</strong></div>
          <div class="small">${esc(stem)}</div>
          ${
            optRows
              ? `<div class="small" style="margin-top:6px;"><strong>Options</strong></div>
                 <table class="tbl small"><thead><tr><th>Option</th><th>Correct</th><th>Feedback</th></tr></thead><tbody>${optRows}</tbody></table>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return rows;
}

function renderEvents(s: StoryboardScene): string {
  const events = (s as any).events || [];
  if (!Array.isArray(events) || !events.length) return "";
  const rows = events
    .map((e: any) => `<tr>
      <td>${esc(e.eventNumber ?? "—")}</td>
      <td>${esc(e.onScreenText || "—")}</td>
      <td class="mono small">${esc(e.audio?.script || "—")}</td>
      <td class="small">${esc(e.interactive?.behaviourExplanation || e.developerNotes || "—")}</td>
    </tr>`)
    .join("");

  return `
    <div class="section" style="padding-top:0;">
      <h3>Events</h3>
      <table class="tbl small">
        <thead><tr><th>#</th><th>On‑Screen</th><th>Audio</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ----------------------------- Utility ----------------------------------------------

function computeQuickChecks(s: StoryboardScene, v: any) {
  const notes = `${(s.accessibilityNotes || "").toLowerCase()} ${JSON.stringify(s.interactionDetails || {})}`; // include details text
  const captionsRequired = /video|animation/i.test(v?.mediaType || "") || /video/.test(String(s.screenLayout || ""));
  const captionsFlag = /captions\s*on/.test(notes) || !captionsRequired; // if not media, we allow ✓
  return {
    captions: captionsFlag,
    keyboard: /keyboard path|tab to focus|keyboard/i.test(notes),
    focus: /focus order|focus outline/i.test(notes),
    contrast: /contrast|wcag/i.test(notes),
    reducedMotion: /reduced[-\s]?motion|prefers-reduced-motion/i.test(notes),
  };
}

function numOrDash(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? String(x) : "—";
}

function countWords(s: string): number {
  return (s || "").trim() ? s.trim().split(/\s+/).filter(Boolean).length : 0;
}

function cssColor(hex: string) {
  const h = String(hex).trim();
  return /^#?[0-9a-f]{3,8}$/i.test(h) ? (h.startsWith("#") ? h : `#${h}`) : "#000000";
}

function esc(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default {
  renderStoryboardAsHTML,
};