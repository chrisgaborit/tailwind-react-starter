// backend/src/services/pdfTemplates.ts
import type { StoryboardModule, StoryboardScene } from "@/types";
import { BrandTheme, defaultTheme, escapeHTML, clampWords } from "./formatting";

/**
 * Decide which scene template to use and render HTML.
 * You can expand these templates over time for richer layouts
 * without touching the core pdfService.
 */

export function renderSceneCard(
  s: StoryboardScene,
  idx: number,
  _total: number,
  _theme: BrandTheme = defaultTheme
): string {
  // Heuristics for specialised slides
  const titleish = /title/i.test(s.pageTitle || "") && idx === 0;
  const isPronunciation = /pronunciation/i.test(s.pageTitle || "");
  const isTOC = /(table of contents|contents)/i.test(s.pageTitle || "");
  const isKC =
    /mcq|knowledge\s*check|quiz/i.test(String(s.interactionType || "")) ||
    /knowledge\s*check/i.test(s.pageTitle || "");

  if (titleish) return renderTitleSlide(s, idx);
  if (isPronunciation) return renderPronunciationSlide(s, idx);
  if (isTOC) return renderTOCSlide(s, idx);
  if (isKC) return renderKnowledgeCheckSlide(s, idx);

  // Default: rich content slide
  return renderContentSlide(s, idx);
}

/* =========================
 * TEMPLATES
 * =======================*/

function renderTitleSlide(s: StoryboardScene, idx: number): string {
  const v = s.visual || ({} as any);
  return `
  <div class="card">
    <div class="bar">
      <div class="title">${escapeHTML(s.pageTitle || "Title")}</div>
      <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
      <span class="badge">${escapeHTML(v.aspectRatio || s.aspectRatio || "16:9")}</span>
      <span class="badge">${escapeHTML(s.pageType || s.interactionType || "Informative")}</span>
    </div>
    <div class="section title-splash">
      <div class="big">${escapeHTML(s.onScreenText || s.pageTitle || "")}</div>
      <div class="subtitle">Template: Title • ${escapeHTML(v.style || "Clean corporate")}</div>
    </div>
    ${renderVisualSections(s)}
    ${renderAudioSection(s)}
    ${renderA11yTiming(s)}
  </div>`;
}

function renderPronunciationSlide(s: StoryboardScene, idx: number): string {
  return `
  <div class="card">
    <div class="bar">
      <div class="title">${escapeHTML(s.pageTitle || "Pronunciation Guide")}</div>
      <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
      <span class="badge pill">Interactive</span>
    </div>
    <div class="section">
      <div class="ost">${escapeHTML(clampWords(s.onScreenText || "Key terms with phonetic guidance."))}</div>
    </div>
    ${renderVisualSections(s)}
    ${renderInteractionSection(s)}
    ${renderAudioSection(s)}
    ${renderA11yTiming(s)}
  </div>`;
}

function renderTOCSlide(s: StoryboardScene, idx: number): string {
  return `
  <div class="card">
    <div class="bar">
      <div class="title">${escapeHTML(s.pageTitle || "Table of Contents")}</div>
      <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
      <span class="badge">Informative</span>
    </div>
    <div class="section">
      <div class="ost">${escapeHTML(clampWords(s.onScreenText || "What you'll cover. Your progress is saved as you go."))}</div>
    </div>
    ${renderVisualSections(s)}
    ${renderAudioSection(s)}
    ${renderA11yTiming(s)}
  </div>`;
}

function renderKnowledgeCheckSlide(s: StoryboardScene, idx: number): string {
  return `
  <div class="card">
    <div class="bar">
      <div class="title">${escapeHTML(s.pageTitle || "Knowledge Check")}</div>
      <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
      <span class="badge pill">${escapeHTML(s.interactionType || "MCQ")}</span>
    </div>

    <div class="section">
      <h3>On‑Screen Text</h3>
      <div class="ost">${escapeHTML(clampWords(s.onScreenText || "Answer the questions."))}</div>
    </div>

    ${renderVisualSections(s)}
    ${renderInteractionSection(s)}
    ${renderAudioSection(s)}
    ${renderA11yTiming(s)}
  </div>`;
}

function renderContentSlide(s: StoryboardScene, idx: number): string {
  return `
  <div class="card">
    <div class="bar">
      <div class="title">${escapeHTML(s.pageTitle || `Screen ${idx + 1}`)}</div>
      <span class="badge">p${String(idx + 1).padStart(2, "0")}</span>
      <span class="badge">${escapeHTML(s.interactionType || s.pageType || "Informative")}</span>
      <span class="badge">${escapeHTML(s.visual?.aspectRatio || s.aspectRatio || "16:9")}</span>
    </div>

    <div class="section">
      <h3>On‑Screen Text</h3>
      <div class="ost">${escapeHTML(clampWords(s.onScreenText || "—"))}</div>
    </div>

    ${renderVisualSections(s)}
    ${renderInteractionSection(s)}
    ${renderAudioSection(s)}
    ${renderA11yTiming(s)}
  </div>`;
}

/* =========================
 * Sub‑sections
 * =======================*/

function renderVisualSections(s: StoryboardScene): string {
  const v = s.visual || ({} as any);
  const b = v.visualGenerationBrief || ({} as any);
  const overlay =
    typeof s.screenLayout === "object" ? (s.screenLayout as any).elements || [] : (v.overlayElements || []);

  return `
  <div class="section">
    <h3>Visuals</h3>
    <div class="grid grid-3">
      <div>
        <div class="muted small"><strong>AI Visual Generation Brief</strong></div>
        <div class="mono small">
Scene: ${escapeHTML(b.sceneDescription || "—")}
Style: ${escapeHTML(b.style || v.style || "—")}
Subject: ${escapeHTML(b.subject ? JSON.stringify(b.subject) : "—")}
Setting: ${escapeHTML(b.setting || "—")}
Composition: ${escapeHTML(b.composition || v.composition || "—")}
Lighting: ${escapeHTML(b.lighting || "—")}
Palette: ${escapeHTML(Array.isArray(b.colorPalette) ? b.colorPalette.join(", ") : "—")}
Mood: ${escapeHTML(b.mood || "—")}
Brand: ${escapeHTML(b.brandIntegration || "—")}
Negative Space: ${escapeHTML(b.negativeSpace || "—")}
        </div>
      </div>
      <div>
        <div class="muted small"><strong>Alt Text</strong></div>
        <div class="small">${escapeHTML(v.altText || "—")}</div>
        <div class="muted small" style="margin-top:6px;"><strong>AI Prompt (legacy)</strong></div>
        <div class="mono small">${escapeHTML(v.aiPrompt || "—")}</div>
      </div>
      <div>
        <div class="muted small"><strong>Media</strong></div>
        <div class="small">${escapeHTML([v.mediaType, v.style, v.environment].filter(Boolean).join(" • ") || "—")}</div>
      </div>
    </div>

    ${
      overlay && overlay.length
        ? `
      <div class="section">
        <div class="muted small"><strong>Overlay Elements</strong></div>
        <table class="tbl small">
          <thead><tr><th>Type</th><th>Content / Placement</th><th>AI Directive</th></tr></thead>
          <tbody>
            ${overlay
              .map(
                (el: any) =>
                  `<tr>
                    <td>${escapeHTML(el.elementType || "—")}</td>
                    <td>${escapeHTML(el.content || el.placement || "—")}</td>
                    <td class="mono small">${escapeHTML(el.aiGenerationDirective || "—")}</td>
                  </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
        : ""
    }
  </div>`;
}

function renderAudioSection(s: StoryboardScene): string {
  return `
  <div class="section">
    <h3>Audio</h3>
    <div class="grid grid-3">
      <div>
        <div class="muted small"><strong>Script</strong></div>
        <div class="mono small">${escapeHTML((s as any).voiceoverScript || s.narration || s.audio?.script || s.narrationScript || (s as any).voiceover || (s as any).VO || "—")}</div>
      </div>
      <div>
        <div class="muted small"><strong>Voice</strong></div>
        <div class="small">
          Persona: ${escapeHTML(s.audio?.voiceParameters?.persona || "—")}<br/>
          Pace: ${escapeHTML(s.audio?.voiceParameters?.pace || "—")}<br/>
          Tone: ${escapeHTML(s.audio?.voiceParameters?.tone || "—")}<br/>
          Emphasis: ${escapeHTML(s.audio?.voiceParameters?.emphasis || "—")}
        </div>
      </div>
      <div>
        <div class="muted small"><strong>AI Directive</strong></div>
        <div class="mono small">${escapeHTML(s.audio?.aiGenerationDirective || "—")}</div>
      </div>
    </div>
  </div>`;
}

function renderInteractionSection(s: StoryboardScene): string {
  if (!s.interactionDetails && (!s.interactionType || s.interactionType === "None")) {
    return `<div class="section"><h3>Interaction</h3><div class="muted small">No interaction details.</div></div>`;
  }

  const det = s.interactionDetails || ({} as any);
  const rowsDL =
    (det.aiDecisionLogic || []).length > 0
      ? det.aiDecisionLogic
          .map(
            (r: any) =>
              `<tr><td>${escapeHTML(r.choice)}</td><td>${escapeHTML(r.feedback?.text || r.feedback || "—")}</td><td>${escapeHTML(r.navigateTo || "—")}</td></tr>`
          )
          .join("")
      : "";

  const rowsX =
    (det.xapiEvents || []).length > 0
      ? det.xapiEvents
          .map(
            (e: any) =>
              `<tr><td>${escapeHTML(e.verb)}</td><td>${escapeHTML(e.object)}</td><td class="mono">${escapeHTML(e.result ? JSON.stringify(e.result) : "—")}</td></tr>`
          )
          .join("")
      : "";

  return `
  <div class="section">
    <h3>Interaction</h3>
    <div class="small"><strong>Type:</strong> ${escapeHTML(s.interactionType || det.interactionType || "—")}</div>
    <div class="grid grid-3" style="margin-top:8px;">
      <div>
        <div class="muted small"><strong>AI Directive</strong></div>
        <div class="mono small">${escapeHTML(det.aiGenerationDirective || "—")}</div>
        <div class="muted small" style="margin-top:6px;"><strong>Retry</strong></div>
        <div class="small">${escapeHTML(det.retryLogic || "—")}</div>
        <div class="muted small" style="margin-top:6px;"><strong>Completion</strong></div>
        <div class="small">${escapeHTML(det.completionRule || "—")}</div>
      </div>
      <div>
        <div class="muted small"><strong>Decision Logic</strong></div>
        ${
          rowsDL
            ? `<table class="tbl small"><thead><tr><th>Choice</th><th>Feedback</th><th>Navigate</th></tr></thead><tbody>${rowsDL}</tbody></table>`
            : "<div class='small'>—</div>"
        }
      </div>
      <div>
        <div class="muted small"><strong>xAPI Events</strong></div>
        ${
          rowsX
            ? `<table class="tbl small"><thead><tr><th>Verb</th><th>Object</th><th>Result</th></tr></thead><tbody>${rowsX}</tbody></table>`
            : "<div class='small'>—</div>"
        }
      </div>
    </div>
  </div>`;
}

function renderA11yTiming(s: StoryboardScene): string {
  return `
  <div class="section">
    <h3>Accessibility & Timing</h3>
    <div class="small"><strong>Accessibility:</strong> ${escapeHTML(s.accessibilityNotes || "—")}</div>
    <div class="small"><strong>Estimated:</strong> ${escapeHTML(String(s.timing?.estimatedSeconds ?? "—"))}s</div>
  </div>`;
}

/* =========================
 * Module-level header
 * =======================*/

export function renderModuleHeader(sb: StoryboardModule): string {
  return `
    <h1>${escapeHTML(sb.moduleName)}</h1>
    <div class="muted small">
      Scenes: ${(sb.scenes || []).length}
      ${sb.metadata?.moduleTiming?.targetMinutes ? ` • Target: ${sb.metadata.moduleTiming.targetMinutes} mins` : ""}
    </div>
  `;
}