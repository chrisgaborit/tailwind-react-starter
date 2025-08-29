// backend/src/library/interactivityLibrary.ts

/**
 * Enforce interactive density and quality across a storyboard's scenes.
 *
 * Responsibilities
 *  - Ensure a minimum ratio of interactive scenes (post "First Four").
 *  - Maintain variety (don’t repeat same interaction type > maxSameTypeInRow).
 *  - Prefer a rotating set of interaction types for distribution.
 *  - Seed/upgrade interactionDetails with retry rules, completion rules, and xAPI.
 *  - Leave the first four header scenes (Title, Pronunciation, ToC, Welcome) intact.
 *
 * Notes
 *  - The function returns a shallow-cloned array; it will not mutate the original.
 *  - This lives in the "library" layer (used by openaiService).
 */

export function enforceInteractiveDensity(
  scenes: any[],
  levelKey: "Level1" | "Level2" | "Level3" | "Level4" | string,
  targetInteractiveRatio = 0.5,
  maxSameTypeInRow = 2,
  preferredTypes: string[] = ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"]
): any[] {
  if (!Array.isArray(scenes) || scenes.length === 0) return scenes || [];

  // Work on a shallow clone so callers are safe from mutation side‑effects.
  const out = scenes.map((s) => ({ ...s }));

  // Helpers
  const isInteractive = (s: any) => {
    const t = normaliseType(s?.interactionType);
    return t !== "none" && t.length > 0;
  };

  const firstInteractiveIdx = Math.min(4, out.length); // after Title/Pronunciation/ToC/Welcome
  const total = out.length;
  const preferred = preferredTypes.length ? preferredTypes.slice() : ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"];

  // 1) Ensure minimum interactive ratio
  const neededInteractive = Math.max(0, Math.ceil(total * targetInteractiveRatio));
  let currentInteractive = out.filter(isInteractive).length;

  let cursor = firstInteractiveIdx;
  let rot = 0;

  while (currentInteractive < neededInteractive && cursor < out.length) {
    const s = out[cursor];
    if (!isInteractive(s)) {
      let nextType = preferred[rot % preferred.length];

      // Avoid violating maxSameTypeInRow when injecting
      nextType = chooseTypeRespectingRun(out, cursor, nextType, preferred, maxSameTypeInRow);

      s.interactionType = nextType;
      s.interactionDescription =
        s.interactionDescription || describeInteraction(nextType, s.pageTitle || s.title || `Screen ${cursor + 1}`);

      // Seed minimal interactionDetails if missing
      s.interactionDetails = normaliseInteractionDetails(
        s.interactionDetails,
        nextType,
        cursor + 1
      );

      // Developer hints
      s.developerNotes = ensureDeveloperNotes(s.developerNotes, nextType);

      currentInteractive++;
      rot++;
    }
    cursor++;
  }

  // 2) Post-pass to fix long runs of the same type (> maxSameTypeInRow)
  fixLongRuns(out, firstInteractiveIdx, preferred, maxSameTypeInRow);

  // 3) Normalisation & xAPI safety for all interactive screens
  for (let i = firstInteractiveIdx; i < out.length; i++) {
    const s = out[i];
    if (isInteractive(s)) {
      // Ensure details exists and is consistent with the chosen type
      s.interactionDetails = normaliseInteractionDetails(
        s.interactionDetails,
        normaliseLabel(s.interactionType),
        i + 1
      );
      s.developerNotes = ensureDeveloperNotes(s.developerNotes, s.interactionType);
    }
  }

  return out;
}

/* ========================================================================== */
/* Internal helpers                                                           */
/* ========================================================================== */

function normaliseType(t: any): string {
  const raw = String(t || "None").trim().toLowerCase();
  if (!raw || raw === "none") return "none";
  if (/^mcq/.test(raw) || /multiple\s*choice/.test(raw)) return "MCQ";
  if (/drag/.test(raw)) return "Drag & Drop";
  if (/hotspot/.test(raw)) return "Clickable Hotspots";
  if (/scenario|branch/.test(raw)) return "Scenario";
  if (/reflect/.test(raw) || /text\s*entry/.test(raw)) return "Reflection";
  if (/interactive\s*video/.test(raw)) return "Interactive Video";
  return capitaliseWords(raw);
}
function normaliseLabel(label: any): string {
  return normaliseType(label);
}
function capitaliseWords(s: string) {
  return s.replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

/** Choose a type while respecting max run, by looking at neighbours. */
function chooseTypeRespectingRun(
  scenes: any[],
  idx: number,
  desired: string,
  preferred: string[],
  maxRun: number
) {
  const desiredLabel = normaliseLabel(desired);
  if (!violatesRun(scenes, idx, desiredLabel, maxRun)) return desiredLabel;

  // Try alternate types from preferred
  for (let j = 1; j < preferred.length; j++) {
    const alt = normaliseLabel(preferred[(preferred.indexOf(desired) + j) % preferred.length]);
    if (!violatesRun(scenes, idx, alt, maxRun)) return alt;
  }

  // Fallback to desired even if it violates run (rare)
  return desiredLabel;
}

/** Determine if placing "type" at index idx would exceed maxSameTypeInRow. */
function violatesRun(scenes: any[], idx: number, type: string, maxRun: number): boolean {
  if (maxRun <= 0) return false;

  // Look backwards and forwards to measure the run length around idx.
  let run = 1; // counting current placement
  // backwards
  for (let i = idx - 1; i >= 0; i--) {
    const t = normaliseType(scenes[i]?.interactionType);
    if (t === type) run++;
    else break;
  }
  // forwards (only consider existing fixed types)
  for (let i = idx + 1; i < scenes.length; i++) {
    const t = normaliseType(scenes[i]?.interactionType);
    if (t === type) run++;
    else break;
  }
  return run > maxRun;
}

/** After injection, fix any long runs by swapping in alternates. */
function fixLongRuns(scenes: any[], startIdx: number, preferred: string[], maxRun: number) {
  if (maxRun <= 0) return;
  let runType = "";
  let runStart = -1;
  let runLen = 0;

  for (let i = startIdx; i <= scenes.length; i++) {
    const t = i < scenes.length ? normaliseType(scenes[i]?.interactionType) : "__END__";
    if (i < scenes.length && t !== "none" && t === runType) {
      runLen++;
    } else {
      // run ends here
      if (runType && runLen > maxRun) {
        // We need to break the run by changing some mid items (not all).
        for (let j = runStart + 1; j < runStart + runLen - 1; j += 2) {
          const desiredBreak = chooseTypeRespectingRun(scenes, j, pickAlternate(preferred, runType), preferred, maxRun);
          scenes[j].interactionType = desiredBreak;
          scenes[j].interactionDescription =
            scenes[j].interactionDescription || describeInteraction(desiredBreak, scenes[j].pageTitle || `Screen ${j + 1}`);
          scenes[j].interactionDetails = normaliseInteractionDetails(
            scenes[j].interactionDetails,
            desiredBreak,
            j + 1
          );
          scenes[j].developerNotes = ensureDeveloperNotes(scenes[j].developerNotes, desiredBreak);
        }
      }
      // reset
      runType = t !== "none" ? t : "";
      runStart = i;
      runLen = t !== "none" ? 1 : 0;
    }
  }
}

function pickAlternate(preferred: string[], avoid: string): string {
  const idx = preferred.findIndex((p) => normaliseLabel(p) === normaliseLabel(avoid));
  if (idx === -1) return preferred[0] || "Scenario";
  return preferred[(idx + 1) % preferred.length] || "Scenario";
}

function normaliseInteractionDetails(
  details: any,
  type: string,
  sceneNumber: number
) {
  const d = details && typeof details === "object" ? { ...details } : {};
  d.interactionType = normaliseLabel(type);

  // Retry / completion defaulting
  if (!d.retryLogic) {
    d.retryLogic =
      type === "MCQ"
        ? "Allow up to 2 retries; reveal correct after second incorrect."
        : type === "Scenario"
        ? "Allow replay to explore alternate branches."
        : "Allow retry.";
  }
  if (!d.completionRule) {
    d.completionRule =
      type === "Clickable Hotspots"
        ? "All hotspots revealed."
        : type === "Reflection"
        ? "Text field not empty (≥ 140 characters)."
        : "User must interact at least once.";
  }

  // Minimal aiActions
  if (!Array.isArray(d.aiActions) || d.aiActions.length === 0) {
    d.aiActions =
      type === "MCQ"
        ? ["Render question and options", "On select, show feedback", "Enable Retry button"]
        : type === "Scenario"
        ? ["Render decision options", "On select, branch A/B and display coaching feedback", "Track choice for xAPI"]
        : type === "Clickable Hotspots"
        ? ["Render 3–5 hotspots", "On hover, show tooltip", "On click, show panel and mark visited"]
        : type === "Drag & Drop"
        ? ["Render draggable chips/cards", "Highlight valid drop zones on drag", "Snap on correct drop, shake & hint on incorrect"]
        : ["Render prompt", "Auto-save text", "Validate on submit"];
  }

  // xAPI defaults
  if (!Array.isArray(d.xapiEvents) || d.xapiEvents.length === 0) {
    d.xapiEvents = [
      {
        verb: defaultXapiVerb(type),
        object: `${labelToId(type)}_S${sceneNumber}`,
      },
    ];
  }

  // AI directive default
  if (!d.aiGenerationDirective) {
    d.aiGenerationDirective = defaultAiDirective(type);
  }

  return d;
}

function ensureDeveloperNotes(notes: any, type: string): string {
  const base = String(notes || "").trim();
  const add =
    type === "MCQ"
      ? "Provide option‑level feedback for each response. Allow up to 2 retries; reveal correct after second incorrect. xAPI verb: answered."
      : type === "Scenario"
      ? "Include coaching feedback per branch. Allow replay to explore both branches. xAPI verb: responded."
      : type === "Clickable Hotspots"
      ? "All hotspots must be revealed to continue. Provide tooltips and a visited indicator. xAPI verb: experienced."
      : type === "Drag & Drop"
      ? "Snap on correct drop, shake on incorrect with hint. Allow retry. xAPI verb: interacted."
      : type === "Reflection"
      ? "Autosave text, min length validation, optional exemplar answers."
      : "Ensure completion rule and xAPI are configured.";
  if (!base) return add;
  if (base.toLowerCase().includes("xapi") || base.toLowerCase().includes("retry") || base.toLowerCase().includes("feedback"))
    return base; // assume adequate
  return `${base}\n${add}`.trim();
}

function defaultXapiVerb(type: string): string {
  switch (normaliseLabel(type)) {
    case "MCQ":
      return "answered";
    case "Scenario":
      return "responded";
    case "Clickable Hotspots":
      return "experienced";
    case "Drag & Drop":
      return "interacted";
    case "Reflection":
      return "responded";
    case "Interactive Video":
      return "experienced";
    default:
      return "interacted";
  }
}

function labelToId(label: string): string {
  return normaliseLabel(label).replace(/\s+|&/g, "_");
}

function defaultAiDirective(type: string): string {
  switch (normaliseLabel(type)) {
    case "MCQ":
      return "[AI Generate: MCQ with accessible radio buttons; keyboard operable; visible focus; ARIA roles; feedback panel with correct/incorrect states.]";
    case "Scenario":
      return "[AI Generate: Branching UI with two large decision cards; on select, animate feedback and branch A/B; include Retry to explore other branch.]";
    case "Clickable Hotspots":
      return "[AI Generate: Image map with 3–5 hotspots; tooltip on hover; panel on click; visited badges; keyboard focus rings with arrow‑key support.]";
    case "Drag & Drop":
      return "[AI Generate: Draggable chips; highlight valid drop zones; snap on correct; shake on incorrect with hint text; keyboard drag alternative.]";
    case "Reflection":
      return "[AI Generate: Text input with placeholder guidance; 140–500 characters; auto‑save; word count; validate on submit.]";
    case "Interactive Video":
      return "[AI Generate: Video with inline decision points; captions on; transcript toggle; keyboard seek and activate.]";
    default:
      return "[AI Generate: Accessible interaction; visible focus; keyboard operation; ARIA roles.]";
  }
}

/** Narrative description used when we auto‑assign an interaction type. */
function describeInteraction(t: string, topic: string) {
  const type = normaliseLabel(t);
  switch (type) {
    case "MCQ":
      return `2–3 question knowledge check on: ${topic}. Immediate, option‑level feedback.`;
    case "Scenario":
      return `Branching decision on: ${topic}. Two paths (A/B) with consequences and coaching feedback.`;
    case "Clickable Hotspots":
      return `Reveal hotspots to explore key elements of: ${topic}. Tooltips and visited indicators.`;
    case "Drag & Drop":
      return `Sort or match items related to: ${topic}. Snap on correct; shake with hint on incorrect.`;
    case "Reflection":
      return `Short written reflection on: ${topic}. Validate minimum length and auto‑save.`;
    case "Interactive Video":
      return `Short video with inline decision point(s) on: ${topic}. Captions and transcript available.`;
    default:
      return `Interactive activity aligned to: ${topic}.`;
  }
}