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

export function validateStoryboard(sb: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!sb || typeof sb !== "object") {
    issues.push({ path: "$", message: "Storyboard payload is empty or invalid.", severity: "error" });
    return issues;
  }

  // Required top-level sections
  const requiredTop = ["moduleName", "intro", "frontMatter", "scenes", "assessment", "closing"];
  for (const k of requiredTop) {
    if (!(k in sb)) {
      issues.push({ path: `$.${k}`, message: `Missing required top-level section "${k}".`, severity: "error" });
    }
  }

  // Branding
  if (!sb.brand || !sb.brand.fonts || !sb.brand.colours) {
    issues.push({
      path: "$.brand",
      message: "Branding (fonts/colours) should be provided and repeated in developerNotes.",
      severity: "warn",
    });
  }

  // Intro checks
  if (sb.intro) {
    if (!Array.isArray(sb.intro.learningObjectives) || sb.intro.learningObjectives.length === 0) {
      issues.push({
        path: "$.intro.learningObjectives",
        message: "Learning objectives are required.",
        severity: "error",
      });
    }
    if (!Array.isArray(sb.intro.courseStructure) || sb.intro.courseStructure.length === 0) {
      issues.push({
        path: "$.intro.courseStructure",
        message: "Course structure (sections) is required.",
        severity: "error",
      });
    }
  }

  // Scenes
  const scenes = Array.isArray(sb.scenes) ? sb.scenes : [];
  if (scenes.length === 0) {
    issues.push({ path: "$.scenes", message: "No scenes were generated.", severity: "error" });
  }

  scenes.forEach((scene: any, i: number) => {
    const basePath = `$.scenes[${i}]`;

    const requiredFields = [
      "pageTitle",
      "pageType",
      "screenLayout",
      "narrationScript",
      "onScreenText",
      "developerNotes",
      "endInstruction",
    ];
    requiredFields.forEach((f) => {
      if (!scene || !scene[f]) {
        issues.push({ path: `${basePath}.${f}`, message: `Missing required field "${f}".`, severity: "error" });
      }
    });

    // VO / OST rules
    const voWords = countWords(scene?.narrationScript);
    const ostWords = countWords(scene?.onScreenText);

    if (voWords < 75) {
      issues.push({
        path: `${basePath}.narrationScript`,
        message: `Voiceover too short (${voWords} words). Target 75–150.`,
        severity: "warn",
      });
    }
    if (voWords > 150) {
      issues.push({
        path: `${basePath}.narrationScript`,
        message: `Voiceover long (${voWords} words). Consider splitting (>150 words).`,
        severity: "warn",
      });
    }
    if (ostWords > 30) {
      issues.push({
        path: `${basePath}.onScreenText`,
        message: `OST too long (${ostWords} words). Keep within 5–30 words.`,
        severity: "warn",
      });
    }

    // Interaction completeness if present
    const interactive = (scene?.interactionType || "").trim();
    if (interactive) {
      if (!scene.interactionDescription) {
        issues.push({
          path: `${basePath}.interactionDescription`,
          message: `Interactive scene requires interactionDescription.`,
          severity: "error",
        });
      }
      if (!scene.interactionItems || typeof scene.interactionItems !== "object") {
        issues.push({
          path: `${basePath}.interactionItems`,
          message: `Interactive scene requires interactionItems (labels, terms, etc.).`,
          severity: "error",
        });
      }
      if (!scene.feedback || scene.feedback.correct == null || scene.feedback.incorrect == null) {
        issues.push({
          path: `${basePath}.feedback`,
          message: `Interactive/knowledge-check scene requires feedback.correct and feedback.incorrect.`,
          severity: "warn",
        });
      }
    }

    // Branding reminder in dev notes
    const notes = String(scene?.developerNotes || "");
    const hasBrandHint =
      /font|typeface|colour|color|logo|brand|palette|#([0-9a-f]{3}|[0-9a-f]{6})/i.test(notes) ||
      /use .*brand/i.test(notes);
    if (!hasBrandHint) {
      issues.push({
        path: `${basePath}.developerNotes`,
        message: `Developer notes should remind branding (fonts/colours/logos) where visuals apply.`,
        severity: "warn",
      });
    }
  });

  // Assessment
  const items = sb.assessment?.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    issues.push({
      path: "$.assessment.items",
      message: "Assessment items are required (5–10).",
      severity: "warn",
    });
  } else {
    items.forEach((q: any, qi: number) => {
      const qPath = `$.assessment.items[${qi}]`;
      ["type", "stem", "options", "answer", "feedback"].forEach((f) => {
        if (!q || q[f] == null || (Array.isArray(q[f]) && q[f].length === 0)) {
          issues.push({
            path: `${qPath}.${f}`,
            message: `Assessment question missing "${f}".`,
            severity: "error",
          });
        }
      });
    });
  }

  return issues;
}