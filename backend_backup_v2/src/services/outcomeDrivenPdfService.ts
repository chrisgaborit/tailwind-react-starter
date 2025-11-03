/**
 * Outcome-Driven PDF Service
 * 
 * Enhanced PDF generation with Learn-See-Do-Apply framework features:
 * - Business Impact and Learning Outcomes pages
 * - Alignment Map visualization
 * - Proper file naming by module title
 * - Phase indicators in scene tables
 * - Framework compliance summary
 */

import type { StoryboardModule, LearningOutcome, AlignmentLink, PedagogyPhase } from "../../types";

export interface OutcomeDrivenPdfOptions {
  includeAlignmentMap?: boolean;
  includeBusinessImpact?: boolean;
  includeLearningOutcomes?: boolean;
  includeFrameworkSummary?: boolean;
}

/**
 * Generate sanitized filename from module title
 */
export function generatePdfFileName(storyboard: StoryboardModule): string {
  const title = storyboard.project_metadata?.title || 
                storyboard.moduleName || 
                "Storyboard";
  
  const safeTitle = title
    .replace(/[^\w\s\-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .replace(/_+/g, '_')       // Replace multiple underscores with single
    .replace(/^_|_$/g, '')     // Remove leading/trailing underscores
    .toLowerCase();
  
  return `${safeTitle}.pdf`;
}

/**
 * Render storyboard as HTML with Learn-See-Do-Apply framework enhancements
 */
export function renderOutcomeDrivenStoryboardAsHTML(
  storyboard: StoryboardModule, 
  formData?: any,
  options: OutcomeDrivenPdfOptions = {}
): string {
  const {
    includeAlignmentMap = true,
    includeBusinessImpact = true,
    includeLearningOutcomes = true,
    includeFrameworkSummary = true
  } = options;

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
    
    /* Phase badges */
    .phase-badge{display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:600; text-transform:uppercase; margin-right:6px;}
    .phase-LEARN{background:#dbeafe; color:#1e40af; border:1px solid #93c5fd;}
    .phase-SEE{background:#dcfce7; color:#166534; border:1px solid #86efac;}
    .phase-DO{background:#fef3c7; color:#92400e; border:1px solid #fcd34d;}
    .phase-APPLY{background:#e9d5ff; color:#6b21a8; border:1px solid #c4b5fd;}
    
    /* Learning outcome styling */
    .learning-outcome{background:#f8fafc; border:1px solid var(--line); border-radius:8px; padding:12px; margin:8px 0;}
    .outcome-verb{font-weight:700; color:var(--brand); text-transform:uppercase; font-size:11px;}
    .outcome-text{color:var(--ink); margin:4px 0;}
    .outcome-context{color:var(--muted); font-size:12px; font-style:italic;}
    
    /* Alignment map styling */
    .alignment-table{width:100%; border-collapse:collapse; font-size:11px; margin:12px 0;}
    .alignment-table th, .alignment-table td{border:1px solid var(--line); padding:8px; text-align:center;}
    .alignment-table th{background:#f8fafc; color:#1e293b; font-weight:700;}
    .alignment-table .outcome-cell{text-align:left; font-weight:600;}
    .coverage-yes{color:var(--ok); font-weight:700;}
    .coverage-no{color:var(--bad); font-weight:700;}
    
    /* Business impact styling */
    .business-impact{background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:2px solid var(--brand); border-radius:12px; padding:16px; margin:16px 0;}
    .business-impact h3{color:var(--brand); margin-top:0;}
    
    /* Framework summary styling */
    .framework-summary{background:#fefce8; border:1px solid #facc15; border-radius:8px; padding:12px; margin:12px 0;}
    .framework-summary h4{color:#a16207; margin-top:0;}
    
    /* Storyboard table enhancements */
    .storyboard-table{width:100%; border-collapse:collapse; font-size:11px; margin:12px 0; border:2px solid var(--line);}
    .storyboard-table th, .storyboard-table td{border:1px solid var(--line); padding:10px 8px; text-align:left; vertical-align:top;}
    .storyboard-table th{background:#f8fafc; color:#1e293b; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;}
    .storyboard-table .phase-column{width:80px; text-align:center;}
    .storyboard-table .audio-column{width:35%; font-family:'Courier New', monospace; font-size:10px; line-height:1.4;}
    .storyboard-table .ost-column{width:30%; font-size:11px; line-height:1.4;}
    .storyboard-table .notes-column{width:35%; font-size:10px; color:var(--muted); line-height:1.3;}
  </style>
  `;

  const title = storyboard.project_metadata?.title || storyboard.moduleName || "Storyboard";
  const category = storyboard.project_metadata?.category || "Unknown";
  const businessImpact = storyboard.project_metadata?.businessImpact;
  const learningOutcomes = storyboard.learningOutcomes || [];
  const alignmentMap = storyboard.alignmentMap || [];
  const scenes = storyboard.scenes || [];

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body>`;

  // ==== COVER PAGE ====
  html += `
    <div class="card">
      <div class="bar">
        <div class="title">${title}</div>
        <div class="right">
          <span class="badge">${category}</span>
        </div>
      </div>
      <div class="section">
        <h1>${title}</h1>
        <p class="muted">Generated using the Learn-See-Do-Apply Framework</p>
        <div class="grid g-2">
          <div>
            <h3>Module Information</h3>
            <div class="kv">
              <div>Module Name:</div>
              <div>${storyboard.moduleName || title}</div>
            </div>
            <div class="kv">
              <div>Category:</div>
              <div>${category}</div>
            </div>
            <div class="kv">
              <div>Target Audience:</div>
              <div>${storyboard.targetAudience || "Not specified"}</div>
            </div>
            <div class="kv">
              <div>Duration:</div>
              <div>${storyboard.durationMinutes || "Not specified"} minutes</div>
            </div>
          </div>
          <div>
            <h3>Framework Compliance</h3>
            <div class="framework-summary">
              <h4>Learn-See-Do-Apply Structure</h4>
              <p>This module follows the outcome-driven Learn-See-Do-Apply framework with:</p>
              <ul>
                <li>${learningOutcomes.length} measurable learning outcomes</li>
                <li>${alignmentMap.length} alignment links across phases</li>
                <li>Progressive complexity from learning to application</li>
                <li>Business impact integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ==== BUSINESS IMPACT PAGE ====
  if (includeBusinessImpact && businessImpact) {
    html += `
      <div class="card">
        <div class="bar">
          <div class="title">Business Impact</div>
        </div>
        <div class="section">
          <div class="business-impact">
            <h3>Expected Business Impact</h3>
            <p>${businessImpact}</p>
          </div>
        </div>
      </div>
    `;
  }

  // ==== LEARNING OUTCOMES PAGE ====
  if (includeLearningOutcomes && learningOutcomes.length > 0) {
    html += `
      <div class="card">
        <div class="bar">
          <div class="title">Learning Outcomes</div>
        </div>
        <div class="section">
          <h2>Measurable Learning Outcomes</h2>
          <p class="muted">By the end of this module, learners will be able to:</p>
    `;

    learningOutcomes.forEach((outcome, index) => {
      html += `
        <div class="learning-outcome">
          <div class="outcome-verb">${outcome.verb.toUpperCase()}</div>
          <div class="outcome-text">${outcome.text}</div>
          ${outcome.context ? `<div class="outcome-context">Context: ${outcome.context}</div>` : ''}
          ${outcome.measure ? `<div class="outcome-context">Measure: ${outcome.measure}</div>` : ''}
        </div>
      `;
    });

    html += `</div></div>`;
  }

  // ==== ALIGNMENT MAP PAGE ====
  if (includeAlignmentMap && learningOutcomes.length > 0) {
    html += `
      <div class="card">
        <div class="bar">
          <div class="title">Learning Outcomes Alignment Map</div>
        </div>
        <div class="section">
          <h2>Phase Coverage Matrix</h2>
          <p class="muted">This matrix shows how each learning outcome is addressed across the Learn-See-Do-Apply phases.</p>
          
          <table class="alignment-table">
            <thead>
              <tr>
                <th style="text-align:left;">Learning Outcome</th>
                <th>LEARN</th>
                <th>SEE</th>
                <th>DO</th>
                <th>APPLY</th>
              </tr>
            </thead>
            <tbody>
    `;

    const phases: PedagogyPhase[] = ['LEARN', 'SEE', 'DO', 'APPLY'];
    
    learningOutcomes.forEach(outcome => {
      html += `<tr>`;
      html += `<td class="outcome-cell">`;
      html += `<div class="outcome-verb">${outcome.verb.toUpperCase()}</div>`;
      html += `<div class="small">${outcome.text}</div>`;
      html += `</td>`;
      
      phases.forEach(phase => {
        const hasCoverage = alignmentMap.some(link => 
          link.outcomeId === outcome.id && link.phase === phase
        ) || scenes.some(scene => 
          scene.phase === phase && scene.learningOutcomeRefs?.includes(outcome.id)
        );
        
        html += `<td class="${hasCoverage ? 'coverage-yes' : 'coverage-no'}">`;
        html += hasCoverage ? '✓' : '✗';
        html += `</td>`;
      });
      
      html += `</tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==== TABLE OF CONTENTS ====
  html += `
    <div class="card">
      <div class="bar">
        <div class="title">Table of Contents</div>
      </div>
      <div class="section">
        <h2>Module Structure</h2>
        <ol>
  `;

  scenes.forEach((scene, index) => {
    const phaseBadge = scene.phase ? `<span class="phase-badge phase-${scene.phase}">${scene.phase.toUpperCase()}</span>` : '';
    html += `<li>Scene ${scene.sceneNumber}: ${scene.pageTitle || scene.title} ${phaseBadge}</li>`;
  });

  html += `</ol></div></div>`;

  // ==== PRONUNCIATIONS & ACRONYMS ====
  // Pronunciation Guide section removed per user request
  const pronunciations: any[] = []; // Disabled
  if (false && pronunciations.length > 0) {
    html += `
      <div class="card">
        <div class="bar">
          <div class="title">Pronunciations & Acronyms</div>
        </div>
        <div class="section">
          <h2>Key Terms and Pronunciations</h2>
          <table class="tbl">
            <thead>
              <tr><th>Term</th><th>Pronunciation</th><th>Definition</th></tr>
            </thead>
            <tbody>
    `;

    pronunciations.forEach(item => {
      html += `
        <tr>
          <td><strong>${item.term}</strong></td>
          <td>${item.pronunciation}</td>
          <td>${item.note || ''}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div></div>`;
  }

  // ==== SCENES ====
  html += `<div class="card"><div class="bar"><div class="title">Storyboard Scenes</div></div><div class="section">`;

  scenes.forEach((scene, index) => {
    const phaseBadge = scene.phase ? `<span class="phase-badge phase-${scene.phase}">${scene.phase.toUpperCase()}</span>` : '';
    const outcomeRefs = scene.learningOutcomeRefs ? 
      scene.learningOutcomeRefs.map(id => {
        const outcome = learningOutcomes.find(lo => lo.id === id);
        return outcome ? `${outcome.verb.toUpperCase()}: ${outcome.text.substring(0, 50)}...` : id;
      }).join(', ') : '';

    html += `
      <h2>Scene ${scene.sceneNumber}: ${scene.pageTitle || scene.title} ${phaseBadge}</h2>
      
      <table class="storyboard-table">
        <thead>
          <tr>
            <th class="phase-column">Phase</th>
            <th class="audio-column">Audio Script</th>
            <th class="ost-column">On-Screen Text</th>
            <th class="notes-column">Notes & Interactions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="phase-column">${scene.phase ? scene.phase.toUpperCase() : ''}</td>
            <td class="audio-column">${scene.narrationScript || scene.audio?.script || ''}</td>
            <td class="ost-column">${scene.onScreenText || ''}</td>
            <td class="notes-column">
              ${scene.interactionType ? `<div><strong>Interaction:</strong> ${scene.interactionType}</div>` : ''}
              ${scene.interactionDescription ? `<div><strong>Description:</strong> ${scene.interactionDescription}</div>` : ''}
              ${outcomeRefs ? `<div><strong>Learning Outcomes:</strong> ${outcomeRefs}</div>` : ''}
              ${scene.developerNotes ? `<div><strong>Developer Notes:</strong> ${scene.developerNotes}</div>` : ''}
              ${scene.accessibilityNotes ? `<div><strong>Accessibility:</strong> ${scene.accessibilityNotes}</div>` : ''}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  });

  html += `</div></div>`;

  // ==== FRAMEWORK SUMMARY ====
  if (includeFrameworkSummary) {
    html += `
      <div class="card">
        <div class="bar">
          <div class="title">Framework Summary</div>
        </div>
        <div class="section">
          <h2>Learn-See-Do-Apply Framework Implementation</h2>
          <div class="framework-summary">
            <h4>Framework Compliance</h4>
            <ul>
              <li><strong>Learning Outcomes:</strong> ${learningOutcomes.length} measurable outcomes defined</li>
              <li><strong>Alignment Coverage:</strong> ${alignmentMap.length} alignment links across phases</li>
              <li><strong>Business Impact:</strong> ${businessImpact ? 'Integrated' : 'Not specified'}</li>
              <li><strong>Phase Distribution:</strong> ${getPhaseDistribution(scenes)}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  html += `</body></html>`;
  return html;
}

/**
 * Get phase distribution summary
 */
function getPhaseDistribution(scenes: any[]): string {
  const phaseCounts = scenes.reduce((acc, scene) => {
    if (scene.phase) {
      acc[scene.phase] = (acc[scene.phase] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(phaseCounts)
    .map(([phase, count]) => `${phase.toUpperCase()}: ${count}`)
    .join(', ') || 'No phases assigned';
}

/**
 * Convert various input types to string arrays
 */
function toStringArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
  return [String(input)];
}

