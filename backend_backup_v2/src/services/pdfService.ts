// backend/src/services/pdfService.ts
import type { StoryboardModule, Scene, BrandonHallOnScreenText } from "../types";

/**
 * Renders a clean, professional storyboard PDF that matches the reference format.
 * Focuses on clear table structure, character-driven content, and sequential storytelling.
 */
export function renderStoryboardAsHTML(sb: StoryboardModule, formData?: any): string {
  const brandonHall = (sb as any).brandonHall || null;
  const brandonSlides = Array.isArray(brandonHall?.slides) ? brandonHall.slides : [];

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
    .image-grid{display:grid; grid-template-columns: 1fr; gap:10px;}
    .image-meta{background:var(--bg-soft); border:1px solid var(--line); border-radius:10px; padding:8px;}
    
    /* ENHANCED: Professional storyboard table format matching human-created style */
    .storyboard-table{width:100%; border-collapse:collapse; font-size:11px; margin:12px 0; border:2px solid var(--line);}
    .storyboard-table th, .storyboard-table td{border:1px solid var(--line); padding:10px 8px; text-align:left; vertical-align:top;}
    .storyboard-table th{background:#f8fafc; color:#1e293b; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;}
    .storyboard-table .event-number{width:50px; text-align:center; font-weight:bold; color:var(--brand); background:#f1f5f9;}
    .storyboard-table .audio-column{width:35%; font-family:'Courier New', monospace; font-size:10px; line-height:1.4;}
    .storyboard-table .ost-column{width:30%; font-size:11px; line-height:1.4;}
    .storyboard-table .notes-column{width:35%; font-size:10px; color:var(--muted); line-height:1.3;}
    
    /* Character color coding system */
    .character-narrator-1{color:#8B0000; font-weight:600;} /* Dark Red - Neutral Narrator 1 */
    .character-narrator-2{color:#800080; font-weight:600;} /* Purple - Karen */
    .character-narrator-3{color:#FF8C00; font-weight:600;} /* Orange - Mark */
    .character-narrator-4{color:#4169E1; font-weight:600;} /* Light Blue - Ariana */
    .character-narrator-5{color:#8B4513; font-weight:600;} /* Brown - Public Official */
    .character-dialogue{font-style:italic; margin:4px 0; padding:4px; background:#f8f9fa; border-left:3px solid var(--brand);}
    .step-instruction{font-weight:600; color:var(--brand); margin:4px 0; background:#e3f2fd; padding:4px; border-radius:3px;}
    .interaction-type{background:#fff3cd; padding:2px 6px; border-radius:3px; font-size:9px; font-weight:600; text-transform:uppercase;}
    .knowledge-check{background:#d4edda; padding:2px 6px; border-radius:3px; font-size:9px; font-weight:600; text-transform:uppercase;}
  </style>
  `;

  // ==== HEADER =======================================================================
  const timing = (sb as any)?.metadata?.moduleTiming || {};
  const brand = (sb as any)?.metadata?.brand || {};
  const brandColours = toStringArray(brand.colours);
  const brandFonts = toStringArray(brand.fonts);
  const brandGuidelines = brand.guidelines ? String(brand.guidelines) : "";
  const brandVoice = brand.voice
    ? String(brand.voice)
    : String((sb as any)?.tone || (sb as any)?.voice || "");
  const brandLogoUrl = brand.logoUrl ? String(brand.logoUrl) : "";

  const brandColoursMarkup = brandColours.length
    ? `<div class="swatches">${brandColours
        .map((colour) => {
          const hex = cssColor(colour);
          return `<div class="sw"><i style="background:${esc(hex)}"></i><span>${esc(colour)}</span></div>`;
        })
        .join("")}</div>`
    : `<div class="muted small">—</div>`;

  const brandFontsMarkup = brandFonts.length
    ? `<div>${brandFonts.map((font) => `<span class="badge">${esc(font)}</span>`).join(" ")}</div>`
    : `<div class="muted small">—</div>`;

  const brandVoiceMarkup = brandVoice
    ? `<div>${esc(brandVoice)}</div>`
    : `<div class="muted small">—</div>`;

  const brandGuidelinesMarkup = brandGuidelines
    ? `<div class="small">${esc(brandGuidelines)}</div>`
    : `<div class="muted small">—</div>`;

  const brandLogoMarkup = brandLogoUrl
    ? `<div class="muted small" style="margin-top:8px;">Logo</div>
       <div class="imgwrap" style="max-width:160px;"><img src="${esc(brandLogoUrl)}" alt="Brand logo" style="max-width:100%;"/></div>`
    : "";
  const headerHTML = `
    <h1>${esc((sb as any).moduleName || "Untitled Module")}</h1>
    <div class="muted small">${esc((sb as any).moduleOverview || "—")}</div>
    <div class="kpi" style="margin-top:10px;">
      <div class="box"><div class="muted small">Learning Level</div><strong>${esc((sb as any).learningLevel || "—")}</strong></div>
      <div class="box"><div class="muted small">Audience</div><strong>${esc((sb as any).targetAudience || "—")}</strong></div>
      <div class="box"><div class="muted small">Target Minutes</div><strong>${numOrDash(timing.targetMinutes)}</strong></div>
      <div class="box"><div class="muted small">Estimated Minutes</div><strong>${numOrDash(timing.estimatedMinutes)}</strong></div>
      <div class="box"><div class="muted small">Scenes</div><strong>${((sb as any).scenes || []).length}</strong></div>
    </div>

    <div class="kv" style="margin-top:12px;">
      <div class="muted small">Company</div><div>${esc((sb as any).metadata?.company || "—")}</div>
      <div class="muted small">Project Code</div><div>${esc((sb as any).metadata?.projectCode || "—")}</div>
      <div class="muted small">Created By</div><div>${esc((sb as any).metadata?.createdBy || "—")}</div>
    </div>

    <div class="header-grid" style="margin-top:12px;">
      <div class="brand-card">
        <h3 style="margin-top:0">Brand</h3>
        <div class="kv">
          <div class="muted small">Colours</div><div>${brandColoursMarkup}</div>
          <div class="muted small">Fonts</div><div>${brandFontsMarkup}</div>
          <div class="muted small">Voice</div><div>${brandVoiceMarkup}</div>
          <div class="muted small">Guidelines</div><div>${brandGuidelinesMarkup}</div>
        </div>
        ${brandLogoMarkup}
      </div>
      <div class="brand-card">
        <h3 style="margin-top:0">Revision History</h3>
        ${
          ((sb as any).revisionHistory && (sb as any).revisionHistory.length)
            ? `<ul class="rev small">${(sb as any).revisionHistory
                .map((r: any) => `<li><strong>${esc(r.dateISO || "")}</strong> — ${esc(r.change || "")} <span class="muted">(${esc(r.author || "—")})</span></li>`)
                .join("")}</ul>`
            : `<div class="small muted">—</div>`
        }
      </div>
    </div>

    ${'' /* TOC and Pronunciation Guide removed per user request */}
    ${renderGlobalNotes(brandonHall?.global_notes || (sb as any).metadata?.globalNotes)}
    <div class="hr"></div>
  `;

  // ==== INTERNAL PAGES ==============================================================
  const internalPagesHTML = renderInternalPages(sb);

  // ==== INPUT SUMMARY ===============================================================
  const inputSummaryHTML = formData ? renderInputSummary(formData) : '';

  // ==== SCENES =======================================================================
  const scenesHTML = ((sb as any).scenes || [])
    .map((s: any, i: number) => renderScene(s, i, brandonSlides[i]))
    .join("");

  return `<!doctype html>
  <html>
    <head><meta charset="utf-8" />${css}</head>
    <body>
      ${headerHTML}
      ${internalPagesHTML}
      ${inputSummaryHTML}
      ${scenesHTML}
      <div class="footer-note muted small">Generated ${new Date().toLocaleString()}</div>
    </body>
  </html>`;
}

// ----------------------------- Scene Renderer ---------------------------------------

function renderScene(s: Scene, idx: number, bhSlide?: any): string {
  const v = (s as any).visual || ({} as any);
  const b = v.visualGenerationBrief || ({} as any);

  const overlay = Array.isArray((v as any).overlayElements) ? (v as any).overlayElements : [];
  const palette = Array.isArray(b.colorPalette) ? b.colorPalette : [];

  const ostRaw = bhSlide?.events?.[0]?.on_screen_text || (s as any).onScreenText || "";
  const ostHtml = formatOnScreenTextBlock(ostRaw);
  const ostWords = countWords(
    typeof ostRaw === "string"
      ? ostRaw
      : [ostRaw?.title, ...(ostRaw?.body_text || []), ...(ostRaw?.bullet_points || [])]
          .filter(Boolean)
          .join(" ")
  );

  // NEW: resolve generated image + recipe (flat mirror preferred)
  const imgSrc =
    (typeof (s as any).imageUrl === "string" && (s as any).imageUrl.trim()) ? (s as any).imageUrl.trim()
    : (typeof v.generatedImageUrl === "string" && v.generatedImageUrl.trim()) ? v.generatedImageUrl.trim()
    : "";

  const recipe = (s as any).imageParams || v.imageParams || null;

  const pageBadges = `
    <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
    <span class="badge">${esc((s as any).pageType || (((s as any).interactionType && (s as any).interactionType !== "None") ? "Interactive" : "Informative"))}</span>
    ${(s as any).interactionType && (s as any).interactionType !== "None" ? `<span class="badge">${esc((s as any).interactionType!)}</span>` : ""}
    ${v?.aspectRatio ? `<span class="badge">${esc(v.aspectRatio)}</span>` : ""}
    ${(s as any).screenId ? `<span class="badge">#${esc((s as any).screenId)}</span>` : ""}
  `;

  const quick = computeQuickChecks(s, v);

  // Image block (if we have a URL)
  const imageBlock = imgSrc
    ? `
      <div class="section" style="padding-top:0;">
        <div class="muted small"><strong>Generated Image</strong></div>
        <div class="image-grid">
          <div class="imgwrap" style="max-width:520px;">
            <img alt="${esc(v.altText || (s as any).pageTitle || "Scene Image")}" src="${esc(imgSrc)}" />
          </div>
          ${
            recipe
              ? `<div class="image-meta small">
                   <div class="muted"><strong>Image Recipe</strong></div>
                   <div class="kv" style="margin-top:6px;">
                     <div class="muted small">Prompt</div><div class="mono small">${esc(recipe.prompt || "—")}</div>
                     <div class="muted small">Model</div><div>${esc(recipe.model || "gemini-2.5-flash-image")}</div>
                     <div class="muted small">Size</div><div>${esc(recipe.size || "1280x720")}</div>
                     <div class="muted small">Style</div><div>${esc(recipe.style || "photorealistic")}</div>
                   </div>
                 </div>`
              : ``
          }
        </div>
      </div>
    `
    : "";

  // Knowledge check (legacy tolerance)
  const kcBlock = renderKnowledgeChecks(s, bhSlide);

  // Events (legacy tolerance)
  const eventsBlock = renderEvents(s, bhSlide);

  const primaryEvent = bhSlide?.events?.[0] || null;
  const audioScript = primaryEvent?.audio_script || (s as any).audio?.script || (s as any).narrationScript || "—";
  const internalNotes = primaryEvent?.internal_development_notes || (s as any).developerNotes || "—";
  const screenTreatment =
    primaryEvent?.screen_media_treatment ||
    b.sceneDescription ||
    b.composition ||
    (s as any).screenLayout ||
    "—";

  const assetsSection = formatAssets(primaryEvent?.assets);

  const pageType = bhSlide?.type || (s as any).interactionType || "Informative";
  const pageBadgeHtml = `
    <span class="badge">${esc(bhSlide?.slide_number ? `Slide ${bhSlide.slide_number}` : `p${String(idx + 1).padStart(2, "0")}`)}</span>
    <span class="badge">${esc(pageType)}</span>
    ${(s as any).interactionType && (s as any).interactionType !== "None" ? `<span class="badge">${esc((s as any).interactionType!)}</span>` : ""}
    ${v?.aspectRatio ? `<span class="badge">${esc(v.aspectRatio)}</span>` : ""}
    ${(s as any).screenId ? `<span class="badge">#${esc((s as any).screenId)}</span>` : ""}
  `;

  // NEW: Clean storyboard table format like the reference
      // Determine character and interaction type
      const characterClass = determineCharacterClass(audioScript);
      const interactionType = determineInteractionType(s);
      const eventNumber = 1; // For now, single event per scene
      
      const storyboardTable = `
        <table class="storyboard-table">
          <thead>
            <tr>
              <th class="event-number">Event</th>
              <th class="audio-column">Audio</th>
              <th class="ost-column">On-Screen Text (OST)</th>
              <th class="notes-column">Internal Development Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="event-number">${eventNumber}</td>
              <td class="audio-column">
                <div class="${characterClass}">${esc(audioScript || "—")}</div>
                ${interactionType ? `<div class="interaction-type">${interactionType}</div>` : ""}
              </td>
              <td class="ost-column">${ostHtml || "—"}</td>
              <td class="notes-column">
                ${esc(internalNotes || "—")}
                ${generateTechnicalSpecs(s)}
              </td>
            </tr>
          </tbody>
        </table>
      `;

  return `
  <div class="card">
    <div class="bar">
      <div class="title">${esc(bhSlide?.slide_title || (s as any).pageTitle || `Screen ${idx + 1}`)}</div>
      <div class="right">
        ${pageBadgeHtml}
        <span class="badge">OST: ${ostWords} words</span>
      </div>
    </div>

    <!-- Clean storyboard table format -->
    <div class="section">
      <h3>Storyboard</h3>
      ${storyboardTable}
    </div>

    ${imageBlock}

    ${kcBlock}
  </div>`;
}

// ----------------------------- Header helpers ---------------------------------------

function renderTOC(sb: StoryboardModule): string {
  const bhToc: any[] = (sb as any).brandonHall?.table_of_contents || [];
  if (Array.isArray(bhToc) && bhToc.length) {
    return `<h2>Table of Contents</h2>
      <ol class="toc">
        ${bhToc
          .map((t: any) =>
            `<li>${esc(t.item_number ? `${t.item_number}. ` : "") + esc(t.title || "")}
              ${t.page_number ? `<span class="muted small">— p${esc(t.page_number)}</span>` : ""}
            </li>`
          )
          .join("")}
      </ol>`;
  }

  const toc: any = (sb as any).tableOfContents || [];
  if (!toc || (Array.isArray(toc) && toc.length === 0)) return "";

  const isStructured =
    Array.isArray(toc) && toc[0] && typeof toc[0] === "object" && "title" in toc[0];

  if (isStructured) {
    return `<h2>Table of Contents</h2>
      <ol class="toc">
        ${toc
          .map((t: any) => `<li>${esc(t.title)} ${t.pageNumber ? `<span class="muted small">— p${t.pageNumber}</span>` : ""}</li>`)
          .join("")}
      </ol>`;
  }

  return `<h2>Table of Contents</h2>
    <ol class="toc">${(toc as string[]).map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`;
}

function renderPronunciationGuide(sb: StoryboardModule): string {
  const pg: any[] = (sb as any).pronunciationGuide || [];
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

function renderGlobalNotes(globalNotes: any): string {
  const notes = Array.isArray(globalNotes?.notes) ? globalNotes.notes : [];
  if (!notes.length) return "";
  return `
    <h2>Global Notes</h2>
    <ul class="rev small">
      ${notes.map((note: any) => `<li>${esc(note)}</li>`).join("")}
    </ul>
  `;
}

// ----------------------------- Scene helpers ----------------------------------------

function interactionBlock(s: Scene, bhSlide?: any): string {
  const id: any = (s as any).interactionDetails;
  const question: any = bhSlide?.events?.find((event: any) => event?.question)?.question;
  if (!id && !question) return `<div class="hint small">No interaction details.</div>`;

  const logicRows = (id?.aiDecisionLogic || []).map((r: any) => `
    <tr>
      <td>${esc(r.choice || "—")}</td>
      <td>${esc(r.feedback?.text || r.feedback || "—")}</td>
      <td>${esc(r.navigateTo || "—")}</td>
    </tr>
  `).join("");

  const xapiRows = (id?.xapiEvents || []).map((e: any) => `
    <tr>
      <td>${esc(e.verb || "—")}</td>
      <td>${esc(e.object || "—")}</td>
      <td class="mono small">${esc(e.result ? JSON.stringify(e.result) : "—")}</td>
    </tr>
  `).join("");

  const questionBlock = (() => {
    if (!question) return "";
    const options = Array.isArray(question.options) ? question.options : [];
    const optionRows = options
      .map((opt: any, idx: number) => `
        <tr>
          <td>${esc(opt.text || `Option ${idx + 1}`)}</td>
          <td>${opt.is_correct ? "✔" : ""}</td>
        </tr>
      `)
      .join("");
    const feedback = question.feedback || {};
    const feedbackParts = [] as string[];
    if (feedback.correct) feedbackParts.push(`<div>Correct: ${esc(feedback.correct)}</div>`);
    if (feedback.incorrect) feedbackParts.push(`<div>Incorrect: ${esc(feedback.incorrect)}</div>`);
    if (feedback.try_again) feedbackParts.push(`<div>Try again: ${esc(feedback.try_again)}</div>`);
    if (feedback.visual) feedbackParts.push(`<div>Visual: ${esc(feedback.visual)}</div>`);
    return `
      <div class="section" style="padding-top:0;">
        <h3>Knowledge Check</h3>
        <div class="small"><strong>Stem</strong></div>
        <div class="small">${esc(question.stem)}</div>
        ${question.instruction ? `<div class="small" style="margin-top:6px;"><strong>Instruction</strong></div><div class="small">${esc(question.instruction)}</div>` : ""}
        ${
          optionRows
            ? `<div class="small" style="margin-top:6px;"><strong>Options</strong></div>
               <table class="tbl small"><thead><tr><th>Option</th><th>Correct</th></tr></thead><tbody>${optionRows}</tbody></table>`
            : ""
        }
        ${feedbackParts.length ? `<div class="small" style="margin-top:6px;">${feedbackParts.join("")}</div>` : ""}
      </div>
    `;
  })();

  return `
    ${
      id
        ? `<div class="grid g-3" style="margin-top:8px;">
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
          </div>`
        : ""
    }
    ${questionBlock}
  `;
}

function renderKnowledgeChecks(s: Scene, bhSlide?: any): string {
  const bhEvents = Array.isArray(bhSlide?.events) ? bhSlide.events : [];
  const kcFromBh = bhEvents.filter((event: any) => event?.question);
  if (kcFromBh.length) {
    return kcFromBh
      .map((event: any, idx: number) => {
        const question = event.question;
        const options = Array.isArray(question.options) ? question.options : [];
        const optionRows = options
          .map((opt: any, optIdx: number) =>
            `<tr><td>${esc(opt.text || `Option ${optIdx + 1}`)}</td><td>${opt.is_correct ? "✔" : ""}</td></tr>`
          )
          .join("");
        const feedback = question.feedback || {};
        const feedbackParts = [] as string[];
        if (feedback.correct) feedbackParts.push(`<div>Correct: ${esc(feedback.correct)}</div>`);
        if (feedback.incorrect) feedbackParts.push(`<div>Incorrect: ${esc(feedback.incorrect)}</div>`);
        if (feedback.try_again) feedbackParts.push(`<div>Try again: ${esc(feedback.try_again)}</div>`);
        if (feedback.visual) feedbackParts.push(`<div>Visual: ${esc(feedback.visual)}</div>`);
        return `
          <div class="section" style="padding-top:0;">
            <h3>Knowledge Check</h3>
            <div class="small"><strong>Stem</strong></div>
            <div class="small">${esc(question.stem || `Item ${idx + 1}`)}</div>
            ${question.instruction ? `<div class="small" style="margin-top:6px;"><strong>Instruction</strong></div><div class="small">${esc(question.instruction)}</div>` : ""}
            ${
              optionRows
                ? `<div class="small" style="margin-top:6px;"><strong>Options</strong></div>
                   <table class="tbl small"><thead><tr><th>Option</th><th>Correct</th></tr></thead><tbody>${optionRows}</tbody></table>`
                : ""
            }
            ${feedbackParts.length ? `<div class="small" style="margin-top:6px;">${feedbackParts.join("")}</div>` : ""}
          </div>
        `;
      })
      .join("");
  }

  const kcList: any[] = (s as any).knowledgeChecks || ((s as any).knowledgeCheck ? [(s as any).knowledgeCheck] : []);
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

function renderEvents(s: Scene, bhSlide?: any): string {
  const events: any[] = Array.isArray(bhSlide?.events)
    ? bhSlide.events
    : ((s as any).events || []).map((evt: any, idx: number) => ({
        event_number: evt.eventNumber ?? idx + 1,
        on_screen_text: evt.onScreenText,
        audio_script: evt.audio?.script,
        internal_development_notes: evt.developerNotes,
      }));

  if (!events.length) return "";

  const rows = events
    .map((e: any) => {
      const ostPlain = formatOnScreenTextPlain(e.on_screen_text || "—");
      return `<tr>
        <td>${esc(e.event_number ?? "—")}</td>
        <td>${esc(ostPlain || "—")}</td>
        <td class="mono small">${esc(e.audio_script || "—")}</td>
        <td class="small">${esc(e.internal_development_notes || "—")}</td>
      </tr>`;
    })
    .join("");

  return `
    <div class="section" style="padding-top:0;">
      <h3>Events</h3>
      <table class="tbl small">
        <thead><tr><th>#</th><th>On-Screen</th><th>Audio</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function normalizeOnScreenTextBlock(value: any): BrandonHallOnScreenText {
  const result: BrandonHallOnScreenText = {};
  if (!value) return result;

  if (typeof value === "object" && !Array.isArray(value)) {
    if (value.title || value.heading) result.title = String(value.title || value.heading);
    if (Array.isArray(value.body_text)) {
      result.body_text = value.body_text.map((line: any) => String(line)).filter(Boolean);
    } else if (Array.isArray(value.bodyText)) {
      result.body_text = value.bodyText.map((line: any) => String(line)).filter(Boolean);
    } else if (value.body || value.text) {
      result.body_text = [String(value.body || value.text)].filter(Boolean);
    }
    if (Array.isArray(value.bullet_points)) {
      result.bullet_points = value.bullet_points.map((line: any) => String(line)).filter(Boolean);
    } else if (Array.isArray(value.bullets)) {
      result.bullet_points = value.bullets.map((line: any) => String(line)).filter(Boolean);
    }
    if (value.continue_prompt || value.cta) {
      result.continue_prompt = String(value.continue_prompt || value.cta);
    }
    return result;
  }

  const text = String(value);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return result;

  const bulletRegex = /^([-*•‣–]|\d+\.)\s*/;
  let titleAssigned = false;
  const body: string[] = [];
  const bullets: string[] = [];

  lines.forEach((line) => {
    if (!titleAssigned) {
      result.title = line;
      titleAssigned = true;
      return;
    }
    if (bulletRegex.test(line)) {
      bullets.push(line.replace(bulletRegex, "").trim());
    } else {
      body.push(line);
    }
  });

  if (body.length) result.body_text = body;
  if (bullets.length) result.bullet_points = bullets;
  return result;
}

function formatOnScreenTextBlock(value: any): string {
  const structured = normalizeOnScreenTextBlock(value);
  const parts: string[] = [];
  if (structured.title) parts.push(`<div><strong>${esc(structured.title)}</strong></div>`);
  if (structured.body_text && structured.body_text.length) {
    parts.push(`<div>${structured.body_text.map((line) => esc(line)).join("<br/>")}</div>`);
  }
  if (structured.bullet_points && structured.bullet_points.length) {
    parts.push(
      `<ul>${structured.bullet_points.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>`
    );
  }
  if (structured.continue_prompt) {
    parts.push(`<div class="hint small">${esc(structured.continue_prompt)}</div>`);
  }
  return parts.join("");
}

function formatOnScreenTextPlain(value: any): string {
  const structured = normalizeOnScreenTextBlock(value);
  const lines: string[] = [];
  if (structured.title) lines.push(structured.title);
  if (structured.body_text && structured.body_text.length) lines.push(...structured.body_text);
  if (structured.bullet_points && structured.bullet_points.length) lines.push(...structured.bullet_points);
  if (structured.continue_prompt) lines.push(structured.continue_prompt);
  return lines.join(" \n ");
}

function formatAssets(assets: any): string {
  if (!Array.isArray(assets) || !assets.length) return "";
  const rows = assets
    .map((asset: any) => {
      const type = asset?.type ? `<strong>${esc(asset.type)}</strong>` : "Asset";
      const source = asset?.source ? ` — ${esc(asset.source)}` : "";
      const description = asset?.description ? ` — ${esc(asset.description)}` : "";
      return `<li>${type}${source}${description}</li>`;
    })
    .join("");
  return `
    <div class="section" style="margin-top:12px;">
      <div class="muted small"><strong>Assets</strong></div>
      <ul class="rev small">${rows}</ul>
    </div>
  `;
}

// ----------------------------- Utility ----------------------------------------------

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[\r\n;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Character determination based on content analysis
function determineCharacterClass(audioScript: string): string {
  if (!audioScript) return "character-narrator-1";
  
  const script = audioScript.toLowerCase();
  
  // Character-specific keywords
  if (script.includes("karen") || script.includes("manager karen")) return "character-narrator-2";
  if (script.includes("mark") || script.includes("procurement officer")) return "character-narrator-3";
  if (script.includes("ariana") || script.includes("compliance officer")) return "character-narrator-4";
  if (script.includes("public official") || script.includes("government")) return "character-narrator-5";
  
  // Default to neutral narrator
  return "character-narrator-1";
}

// Interaction type determination
function determineInteractionType(s: Scene): string {
  const interactionDetails = (s as any).interactionDetails;
  const knowledgeCheck = (s as any).knowledgeCheck;
  
  if (knowledgeCheck && knowledgeCheck.type) {
    return `Knowledge Check: ${knowledgeCheck.type}`;
  }
  
  if (interactionDetails?.interactionType) {
    return interactionDetails.interactionType;
  }
  
  // Determine from scene content
  const screenLayout = String((s as any).screenLayout || "").toLowerCase();
  if (screenLayout.includes("click to reveal")) return "Click to Reveal";
  if (screenLayout.includes("timeline")) return "Timeline";
  if (screenLayout.includes("scenario")) return "Scenario";
  if (screenLayout.includes("interactive")) return "Interactive";
  
  return "Static";
}

// Generate technical specifications for developers
function generateTechnicalSpecs(s: Scene): string {
  const specs: string[] = [];
  
  // Visual specifications
  const visual = (s as any).visual;
  if (visual?.aspectRatio) specs.push(`Aspect Ratio: ${visual.aspectRatio}`);
  if (visual?.mediaType) specs.push(`Media Type: ${visual.mediaType}`);
  
  // Interaction specifications
  const interactionDetails = (s as any).interactionDetails;
  if (interactionDetails?.keyboardPath) specs.push(`Keyboard Path: ${interactionDetails.keyboardPath}`);
  if (interactionDetails?.focusOrder) specs.push(`Focus Order: ${interactionDetails.focusOrder}`);
  
  // Accessibility specifications
  const accessibilityNotes = (s as any).accessibilityNotes;
  if (accessibilityNotes) {
    if (accessibilityNotes.includes("captions")) specs.push("Captions: Required");
    if (accessibilityNotes.includes("keyboard")) specs.push("Keyboard Navigation: Required");
    if (accessibilityNotes.includes("screen reader")) specs.push("Screen Reader: Compatible");
  }
  
  // Brand specifications
  const brandIntegration = visual?.brandIntegration;
  if (brandIntegration) specs.push(`Brand Integration: ${brandIntegration}`);
  
  return specs.length > 0 ? `<br><strong>Technical Specs:</strong><br>${specs.join("<br>")}` : "";
}

function computeQuickChecks(s: Scene, v: any) {
  const notes = `${((s as any).accessibilityNotes || "").toLowerCase()} ${JSON.stringify((s as any).interactionDetails || {})}`;
  const captionsRequired = /video|animation/i.test(v?.mediaType || "") || /video/.test(String((s as any).screenLayout || ""));
  const captionsFlag = /captions\s*on/.test(notes) || !captionsRequired;
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
  if (!Number.isFinite(x)) return "—";
  if (Math.abs(x - Math.round(x)) < 0.01) {
    return String(Math.round(x));
  }
  return (Math.round(x * 10) / 10).toFixed(1);
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

// ----------------------------- Internal Pages Renderer ---------------------------------------
function renderInternalPages(storyboard: any): string {
  // Internal pages removed per user request
  return '';
}

// ----------------------------- Input Summary Renderer ---------------------------------------
function renderInputSummary(formData: any): string {
  if (!formData) return '';

  const formatDuration = (mins?: number) => {
    if (!mins) return "Not specified";
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const formatFileList = (files: any[]) => {
    if (!files || files.length === 0) return "None";
    return files.map(f => f.name || f).join(", ");
  };

  return `
    <div class="card">
      <div class="bar">
        <div class="title">Project Summary</div>
        <div class="right">
          <span class="badge">Configuration</span>
        </div>
      </div>
      <div class="section">
        <div class="grid g-2">
          <div>
            <div class="kv">
              <div class="muted small">Module Title</div>
              <div><strong>${esc(formData.moduleName || "Untitled Module")}</strong></div>
              <div class="muted small">Module Type</div>
              <div>${esc(formData.moduleType || "Not specified")}</div>
              <div class="muted small">Complexity Level</div>
              <div>${esc(formData.complexityLevel || "Not specified")}</div>
              <div class="muted small">Duration</div>
              <div>${formatDuration(formData.durationMins)}</div>
              <div class="muted small">Tone</div>
              <div>${esc(formData.tone || "Not specified")}</div>
            </div>
          </div>
          <div>
            <div class="kv">
              <div class="muted small">Target Audience</div>
              <div>${esc(formData.targetAudience || "Not specified")}</div>
              <div class="muted small">Learning Objectives</div>
              <div class="mono small">${esc(formData.learningObjectives || "Not specified")}</div>
              <div class="muted small">Content Files</div>
              <div class="small">${formatFileList(formData.selectedFiles || [])}</div>
              <div class="muted small">Image Files</div>
              <div class="small">${formatFileList(formData.imageFiles || [])}</div>
            </div>
          </div>
        </div>
        
        ${formData.content ? `
          <div style="margin-top: 16px;">
            <div class="muted small"><strong>Content Preview</strong></div>
            <div class="mono small" style="background: var(--bg-soft); padding: 8px; border-radius: 6px; max-height: 120px; overflow-y: auto; margin-top: 4px;">
              ${esc(formData.content.length > 500 ? formData.content.substring(0, 500) + "..." : formData.content)}
            </div>
          </div>
        ` : ''}
        
        ${formData.businessImpact ? `
          <div style="margin-top: 16px;">
            <div class="muted small"><strong>Business Impact</strong></div>
            <div class="small" style="margin-top: 4px;">
              ${esc(typeof formData.businessImpact === 'string' ? formData.businessImpact : JSON.stringify(formData.businessImpact, null, 2))}
            </div>
          </div>
        ` : ''}
        
        ${formData.innovationStrategies && formData.innovationStrategies.length > 0 ? `
          <div style="margin-top: 16px;">
            <div class="muted small"><strong>Innovation Strategies</strong></div>
            <div style="margin-top: 4px;">
              ${formData.innovationStrategies.map((strategy: string) => 
                `<span class="pill ok" style="margin-right: 6px; margin-bottom: 4px; display: inline-block;">${esc(strategy)}</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
        
        ${formData.measurementApproaches && formData.measurementApproaches.length > 0 ? `
          <div style="margin-top: 16px;">
            <div class="muted small"><strong>Measurement Approaches</strong></div>
            <div style="margin-top: 4px;">
              ${formData.measurementApproaches.map((approach: string) => 
                `<span class="pill warn" style="margin-right: 6px; margin-bottom: 4px; display: inline-block;">${esc(approach)}</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
    <div class="hr"></div>
  `;
}

module.exports = {
  renderStoryboardAsHTML,
};
