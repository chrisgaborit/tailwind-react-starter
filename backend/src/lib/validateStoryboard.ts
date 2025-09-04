export type ValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

const countWords = (s?: string) =>
  (s || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

const isPhotorealistic = (style?: string) =>
  /photo|real(?:istic)?|photographic/i.test(String(style || ""));

const toStr = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

function push(issues: ValidationIssue[], path: string, message: string, severity: "error" | "warn") {
  issues.push({ path, message, severity });
}

function hasAll<T extends object>(obj: T | undefined, keys: string[]) {
  if (!obj || typeof obj !== "object") return false;
  return keys.every((k) => (obj as any)[k] !== undefined && (obj as any)[k] !== null);
}

function isInteractive(scene: any) {
  const t = String(scene?.interactionType || "None").toLowerCase();
  return t !== "none" && !!t;
}

function isKCType(type: string) {
  const t = type.toLowerCase();
  return (
    t.includes("mcq") ||
    t.includes("scenario") ||
    t.includes("drag") ||
    t.includes("quiz") ||
    t.includes("assessment")
  );
}

function checkFrontMatter(sb: any, issues: ValidationIssue[]) {
  if (!Array.isArray(sb.frontMatter)) {
    push(issues, "$.frontMatter", "frontMatter must be an array with exactly 3 items (Cover, Pronunciation, TableOfContents).", "error");
    return;
  }
  if (sb.frontMatter.length !== 3) {
    push(issues, "$.frontMatter", "frontMatter must contain exactly 3 items in order: Cover, Pronunciation, TableOfContents.", "error");
  } else {
    const [cover, pron, toc] = sb.frontMatter;
    if ((cover?.type || "").toLowerCase() !== "cover") {
      push(issues, "$.frontMatter[0].type", 'First item must be type "Cover".', "error");
    }
    if ((pron?.type || "").toLowerCase() !== "pronunciation") {
      push(issues, "$.frontMatter[1].type", 'Second item must be type "Pronunciation".', "error");
    } else {
      if (!Array.isArray(pron.items)) {
        push(issues, "$.frontMatter[1].items", "Pronunciation.items should be an array (can be empty).", "warn");
      }
    }
    if ((toc?.type || "").toLowerCase() !== "tableofcontents") {
      push(issues, "$.frontMatter[2].type", 'Third item must be type "TableOfContents".', "error");
    } else if (!Array.isArray(toc.items) || toc.items.length === 0) {
      push(issues, "$.frontMatter[2].items", "TableOfContents.items should be a non-empty string array.", "warn");
    }
  }
}

function checkTopLevel(sb: any, issues: ValidationIssue[]) {
  const requiredTop = ["moduleName", "scenes"];
  for (const k of requiredTop) {
    if (!(k in sb)) {
      push(issues, `$.${k}`, `Missing required top-level field "${k}".`, "error");
    }
  }

  // idMethod + allowed values
  const idMethod = String(sb.idMethod || "").toUpperCase();
  const allowed = new Set(["ADDIE", "SAM", "MERRILL", "GAGNE", "BACKWARD", "BLOOM"]);
  if (!idMethod) {
    push(issues, "$.idMethod", "idMethod is required (ADDIE, SAM, MERRILL, GAGNE, BACKWARD, BLOOM).", "error");
  } else if (!allowed.has(idMethod)) {
    push(issues, "$.idMethod", `idMethod "${idMethod}" is not supported. Use one of: ${Array.from(allowed).join(", ")}.`, "error");
  }

  // metadata.brand presence (for palette/fonts thread-through)
  const brand = sb?.metadata?.brand || {};
  if (!brand.colours || !brand.fonts) {
    push(issues, "$.metadata.brand", "Brand (colours, fonts) should be provided for visual consistency.", "warn");
  }

  // evaluationPlan presence
  if (!hasAll(sb?.evaluationPlan, ["postTestItems", "passMarkPercent"])) {
    push(issues, "$.evaluationPlan", "evaluationPlan should include postTestItems and passMarkPercent (plus confidenceSlider/followUpDays).", "warn");
  }

  // learningObjectiveMap presence and structure
  if (!Array.isArray(sb.learningObjectiveMap) || sb.learningObjectiveMap.length === 0) {
    push(issues, "$.learningObjectiveMap", "learningObjectiveMap should map each LO to teach/practice/assess scene IDs.", "warn");
  } else {
    sb.learningObjectiveMap.forEach((m: any, i: number) => {
      const p = `$.learningObjectiveMap[${i}]`;
      if (!m.objective) push(issues, `${p}.objective`, "Objective text is required.", "warn");
      ["teachScenes", "practiceScenes", "assessScenes"].forEach((key) => {
        const arr = m?.[key];
        if (!Array.isArray(arr) || arr.length === 0) {
          push(issues, `${p}.${key}`, `${key} should be a non-empty array of scene numbers.`, "warn");
        }
      });
    });
  }
}

function checkScenes(sb: any, issues: ValidationIssue[]) {
  const scenes: any[] = Array.isArray(sb.scenes) ? sb.scenes : [];
  if (!scenes.length) {
    push(issues, "$.scenes", "No scenes were generated.", "error");
    return;
  }

  // First module scene should be Welcome & Learning Objectives
  const firstTitle = String(scenes[0]?.pageTitle || "").toLowerCase();
  if (!/welcome/.test(firstTitle) || !/objective/.test(firstTitle)) {
    push(issues, "$.scenes[0].pageTitle", 'First module scene should be "Welcome & Learning Objectives".', "warn");
  }

  // Photorealistic policy: ≥97% of scenes must be photorealistic image style
  let nonPhoto = 0;
  scenes.forEach((s) => {
    const style = s?.visual?.style || s?.visual?.visualGenerationBrief?.style;
    if (!isPhotorealistic(style)) nonPhoto++;
  });
  const nonPhotoPct = (nonPhoto / Math.max(1, scenes.length)) * 100;
  if (nonPhotoPct > 3) {
    push(
      issues,
      "$.scenes[*].visual.style",
      `Photorealistic policy violation: ${(100 - nonPhotoPct).toFixed(1)}% photorealistic (< 97% target).`,
      "error"
    );
  } else if (nonPhoto > 0) {
    push(
      issues,
      "$.scenes[*].visual.style",
      `Non-photorealistic scenes present (${nonPhoto}/${scenes.length}). Keep ≤ 3% overall.`,
      "warn"
    );
  }

  // Knowledge-check cadence: every 3–5 scenes
  let lastKC = -999;
  scenes.forEach((scene, i) => {
    const t = String(scene?.interactionType || "None");
    const isKC = isKCType(t);
    if (isKC) lastKC = i;
    const gap = i - lastKC;
    if (i > 0 && gap > 5) {
      push(issues, `$.scenes[${i}]`, "Knowledge-check cadence exceeded (>5 scenes since last KC). Insert a KC.", "warn");
    }
  });

  // Per-scene checks
  scenes.forEach((scene, i) => {
    const p = `$.scenes[${i}]`;

    // Required core fields
    const required = ["pageTitle", "pageType", "screenLayout", "narrationScript", "onScreenText", "visual", "timing"];
    required.forEach((f) => {
      if (scene[f] == null || (typeof scene[f] === "string" && !scene[f].trim())) {
        push(issues, `${p}.${f}`, `Missing required field "${f}".`, "error");
      }
    });

    // Audio block (structured) optional but recommended
    if (!scene.audio || !scene.audio.script) {
      push(issues, `${p}.audio.script`, "audio.script recommended for TTS consistency.", "warn");
    }

    // VO / OST rules
    const voWords = countWords(scene?.narrationScript);
    const ostWords = countWords(scene?.onScreenText);
    if (voWords < 75) {
      push(issues, `${p}.narrationScript`, `Voiceover too short (${voWords} words). Target 75–150.`, "warn");
    }
    if (voWords > 180) {
      push(issues, `${p}.narrationScript`, `Voiceover long (${voWords} words). Consider splitting (>180 words).`, "warn");
    }
    if (ostWords > 70) {
      push(issues, `${p}.onScreenText`, `OST too long (${ostWords} words). Keep ≤ 70 words.`, "warn");
    }

    // Visual blueprint completeness
    const v = scene.visual || {};
    const vgb = v.visualGenerationBrief || {};
    const mustVisual = ["sceneDescription", "style", "composition", "lighting", "colorPalette", "mood", "brandIntegration", "negativeSpace"];
    mustVisual.forEach((k) => {
      if (vgb[k] == null || (Array.isArray(vgb[k]) && !vgb[k].length)) {
        push(issues, `${p}.visual.visualGenerationBrief.${k}`, `Visual brief is missing "${k}".`, "warn");
      }
    });
    if (!v.altText) {
      push(issues, `${p}.visual.altText`, "Alt text is required for accessibility.", "error");
    }

    // Accessibility notes basics
    const a11y = toStr(scene.accessibilityNotes || "");
    if (!/caption/i.test(a11y)) {
      push(issues, `${p}.accessibilityNotes`, 'Accessibility notes should include "Captions ON".', "warn");
    }
    if (!/keyboard path/i.test(a11y)) {
      push(issues, `${p}.accessibilityNotes`, 'Accessibility notes should include a "Keyboard path".', "warn");
    }
    if (!/focus order/i.test(a11y)) {
      push(issues, `${p}.accessibilityNotes`, 'Accessibility notes should include "Focus order".', "warn");
    }

    // Instructional-tag per scene
    if (!scene.instructionalTag || !scene.instructionalTag.method) {
      push(issues, `${p}.instructionalTag`, "instructionalTag with selected method is required for every scene.", "error");
    } else {
      const method = String(scene.instructionalTag.method || "").toUpperCase();
      switch (method) {
        case "ADDIE":
          if (!scene.instructionalTag.addie || !/^(A|D1|D2|I|E)$/.test(scene.instructionalTag.addie.phase || "")) {
            push(issues, `${p}.instructionalTag.addie.phase`, 'ADDIE tag must include phase ∈ {"A","D1","D2","I","E"}.', "error");
          }
          break;
        case "SAM":
          if (!scene.instructionalTag.sam || !/^(Prepare|Iterate|Implement)$/i.test(scene.instructionalTag.sam.phase || "")) {
            push(issues, `${p}.instructionalTag.sam.phase`, 'SAM tag must include phase ∈ {"Prepare","Iterate","Implement"}.', "error");
          }
          break;
        case "MERRILL":
          if (!scene.instructionalTag.merrill || !/^(Activation|Demonstration|Application|Integration)$/i.test(scene.instructionalTag.merrill.phase || "")) {
            push(issues, `${p}.instructionalTag.merrill.phase`, 'Merrill tag must include phase ∈ {"Activation","Demonstration","Application","Integration"}.', "error");
          }
          break;
        case "GAGNE":
          if (!scene.instructionalTag.gagne || !scene.instructionalTag.gagne.event) {
            push(issues, `${p}.instructionalTag.gagne.event`, "Gagné tag must include a Nine Events 'event'.", "error");
          }
          break;
        case "BACKWARD":
          if (!scene.instructionalTag.backward || !/^(IdentifyResults|DetermineEvidence|PlanLearning)$/i.test(scene.instructionalTag.backward.stage || "")) {
            push(issues, `${p}.instructionalTag.backward.stage`, 'Backward Design tag must include stage ∈ {"IdentifyResults","DetermineEvidence","PlanLearning"}.', "error");
          }
          break;
        case "BLOOM":
          if (!scene.instructionalTag.bloom || !/^(Remember|Understand|Apply|Analyze|Analyse|Evaluate|Create)$/i.test(scene.instructionalTag.bloom.level || "")) {
            push(issues, `${p}.instructionalTag.bloom.level`, "Bloom tag must include a cognitive level.", "error");
          }
          break;
        default:
          push(issues, `${p}.instructionalTag.method`, `Unsupported instructionalTag method "${method}".`, "error");
      }
    }

    // Interaction completeness for interactive scenes
    if (isInteractive(scene)) {
      if (!scene.interactionDescription) {
        push(issues, `${p}.interactionDescription`, "Interactive scene requires interactionDescription.", "error");
      }
      if (!scene.interactionDetails) {
        push(issues, `${p}.interactionDetails`, "Interactive scene requires interactionDetails.", "error");
      } else {
        const id = scene.interactionDetails;
        if (!id.interactionType) {
          push(issues, `${p}.interactionDetails.interactionType`, "interactionDetails.interactionType is required.", "error");
        }
        if (!id.completionRule) {
          push(issues, `${p}.interactionDetails.completionRule`, "completionRule is required.", "warn");
        }
        if (!id.retryLogic) {
          push(issues, `${p}.interactionDetails.retryLogic`, "retryLogic should be defined.", "warn");
        }
        if (!Array.isArray(id.xapiEvents) || id.xapiEvents.length === 0) {
          push(issues, `${p}.interactionDetails.xapiEvents`, "xAPI events should be defined for tracking.", "warn");
        }
        // MCQ-specific
        if (String(scene.interactionType || "").toLowerCase().includes("mcq")) {
          if (!Array.isArray(id.distractorRationale)) {
            push(issues, `${p}.interactionDetails.distractorRationale`, "MCQ must include distractorRationale per option.", "warn");
          }
        }
      }
    }

    // Developer notes branding hint (carry-through)
    const notes = String(scene?.developerNotes || "");
    const hasBrandHint =
      /font|typeface|colour|color|logo|brand|palette|#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})/i.test(notes) ||
      /use .*brand/i.test(notes);
    if (!hasBrandHint) {
      push(issues, `${p}.developerNotes`, "Developer notes should reference brand usage (fonts/colours/logos) where visuals apply.", "warn");
    }
  });
}

export function validateStoryboard(sb: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!sb || typeof sb !== "object") {
    push(issues, "$", "Storyboard payload is empty or invalid.", "error");
    return issues;
  }

  // Top-level requireds + schema expectations
  checkTopLevel(sb, issues);

  // Front matter (Cover, Pronunciation, TableOfContents) – separate from module scenes
  checkFrontMatter(sb, issues);

  // Scenes (module flow starts here)
  checkScenes(sb, issues);

  // Optional legacy sections (warn if present but thin)
  if (sb.assessment && (!Array.isArray(sb.assessment.items) || sb.assessment.items.length === 0)) {
    push(issues, "$.assessment.items", "Assessment items empty; rely on in-line knowledge checks or supply 5–10 items.", "warn");
  }

  // Timing sanity (module-level)
  const per: number[] = Array.isArray(sb?.metadata?.moduleTiming?.perSceneSeconds)
    ? sb.metadata.moduleTiming.perSceneSeconds
    : [];
  if (per.length && Array.isArray(sb.scenes) && sb.scenes.length && per.length !== sb.scenes.length) {
    push(
      issues,
      "$.metadata.moduleTiming.perSceneSeconds",
      `perSceneSeconds length (${per.length}) should match scenes length (${sb.scenes.length}).`,
      "warn"
    );
  }

  return issues;
}