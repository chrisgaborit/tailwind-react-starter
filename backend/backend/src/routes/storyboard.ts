// backend/src/routes/storyboard.ts
import { Router, Request, Response } from "express";
import { normaliseDuration } from "../middleware/normaliseDuration";
import openaiService from "../services/openaiGateway";

// If you added the Zod schema as suggested:
import { StoryboardModuleSchema } from "../validation/storyboardSchema";

const router = Router();

/* =========================================================================
 * Quality report helpers (OST, VO richness, visual brief coverage, interactions)
 * ========================================================================= */

type QualityIssue = {
  code: string;
  message: string;
  scene?: number;
};

type QualityReport = {
  ok: boolean;
  score: number; // 0–100
  totals: {
    scenes: number;
    interactive: number;
    knowledgeChecks: number;
  };
  issues: QualityIssue[];
  metrics: Record<string, number>;
};

function countWords(s?: string): number {
  if (!s) return 0;
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

function isKCType(t: string): boolean {
  const v = (t || "").toLowerCase();
  return ["mcq", "scenario", "drag & drop", "drag-drop", "drag&drop", "quiz", "multi-select"].some((k) =>
    v.includes(k)
  );
}

function computeQualityReport(sb: any): QualityReport {
  const scenes: any[] = Array.isArray(sb?.scenes) ? sb!.scenes : [];
  const issues: QualityIssue[] = [];
  const metrics: Record<string, number> = {
    ostOverLimit: 0,
    voTooShort: 0,
    missingVisualBrief: 0,
    missingAltText: 0,
    thinInteractionLogic: 0,
    missingXapi: 0,
    missingAudioDirective: 0,
    missingInteractionDirective: 0,
  };

  let interactive = 0;
  let kcs = 0;

  scenes.forEach((s, i) => {
    const idx = i + 1;

    // OST ≤ 70 words
    const ostWords = countWords(s?.onScreenText);
    if (ostWords > 70) {
      metrics.ostOverLimit++;
      issues.push({
        code: "OST_LIMIT",
        message: `Scene ${idx}: On‑screen text has ${ostWords} words (limit 70).`,
        scene: idx,
      });
    }

    // VO richness (basic heuristic)
    const vo = s?.audio?.script || s?.narrationScript || "";
    const voWords = countWords(vo);
    if (voWords < 25) {
      metrics.voTooShort++;
      issues.push({
        code: "VO_THIN",
        message: `Scene ${idx}: Voiceover is thin (${voWords} words). Enrich with context, examples and stronger verbs.`,
        scene: idx,
      });
    }

    // Visual brief completeness
    const vb = s?.visual?.visualGenerationBrief;
    if (!vb || !vb.sceneDescription || !vb.style) {
      metrics.missingVisualBrief++;
      issues.push({
        code: "VISUAL_BRIEF",
        message: `Scene ${idx}: Missing or incomplete visualGenerationBrief (include sceneDescription + style + composition/lighting/colour).`,
        scene: idx,
      });
    }
    if (!s?.visual?.altText || s.visual.altText.length > 125) {
      metrics.missingAltText++;
      issues.push({
        code: "ALT_TEXT",
        message: `Scene ${idx}: Alt text is missing or too long (>125 chars).`,
        scene: idx,
      });
    }

    // Interaction logic (if interactive)
    const type: string = s?.interactionType || "None";
    const interactiveScene = type && type !== "None";
    if (interactiveScene) {
      interactive++;
      const id = s?.interactionDetails || {};
      const hasDirective = !!id?.aiGenerationDirective;
      const hasRetry = !!id?.retryLogic;
      const hasCompletion = !!id?.completionRule;
      const hasDecision = Array.isArray(id?.aiDecisionLogic) && id.aiDecisionLogic.length > 0;

      if (!hasDirective || !hasRetry || !hasCompletion || !hasDecision) {
        metrics.thinInteractionLogic++;
        issues.push({
          code: "INTERACTION_THIN",
          message: `Scene ${idx}: Interaction details should include aiGenerationDirective, aiDecisionLogic (per‑option feedback), retryLogic and completionRule.`,
          scene: idx,
        });
      }

      const xapiEvents = Array.isArray(id?.xapiEvents) ? id.xapiEvents : [];
      const decisionHasXapi =
        hasDecision &&
        id.aiDecisionLogic.some((d: any) => d?.xapi?.verb && d?.xapi?.object);
      if (xapiEvents.length === 0 && !decisionHasXapi) {
        metrics.missingXapi++;
        issues.push({
          code: "XAPI_MISSING",
          message: `Scene ${idx}: Add xAPI events (verb, object, result) at interactionDetails.xapiEvents or per choice in aiDecisionLogic.`,
          scene: idx,
        });
      }
    }

    if (isKCType(type)) {
      kcs++;
    }

    // Audio directive present?
    if (!s?.audio?.aiGenerationDirective) {
      metrics.missingAudioDirective++;
      issues.push({
        code: "AUDIO_DIRECTIVE",
        message: `Scene ${idx}: Missing audio.aiGenerationDirective (persona, pace, tone, emphasis).`,
        scene: idx,
      });
    }

    // Interaction directive for interactive scenes
    if (interactiveScene && !s?.interactionDetails?.aiGenerationDirective) {
      metrics.missingInteractionDirective++;
      issues.push({
        code: "INTERACTION_DIRECTIVE",
        message: `Scene ${idx}: Missing interactionDetails.aiGenerationDirective (explicit micro‑brief for building the UI).`,
        scene: idx,
      });
    }
  });

  // Scoring (simple weighted heuristic)
  const totalScenes = scenes.length || 1;
  const penalties =
    metrics.ostOverLimit * 3 +
    metrics.voTooShort * 4 +
    metrics.missingVisualBrief * 4 +
    metrics.missingAltText * 2 +
    metrics.thinInteractionLogic * 5 +
    metrics.missingXapi * 4 +
    metrics.missingAudioDirective * 2 +
    metrics.missingInteractionDirective * 3;

  const maxPenalty = totalScenes * 10; // arbitrary cap
  const score = Math.max(0, Math.round(100 - (penalties / Math.max(1, maxPenalty)) * 100));

  return {
    ok: issues.length === 0,
    score,
    totals: {
      scenes: totalScenes,
      interactive,
      knowledgeChecks: kcs,
    },
    issues,
    metrics,
  };
}

/* =========================================================================
 * POST /api/generate
 * - Accepts form data, forwards to OpenAI service, validates JSON schema,
 *   runs quality checks, and returns the enriched storyboard.
 * ========================================================================= */
router.post("/generate", normaliseDuration, async (req: Request, res: Response) => {
  try {
    const formData = (req.body ?? {}) as Record<string, any>;

    // Light sanity on incoming toggles (optional)
    const aiModel = typeof formData.aiModel === "string" ? formData.aiModel : undefined;
    const ragContext = typeof formData.ragContext === "string" ? formData.ragContext : undefined;
    const idMethod = typeof formData.idMethod === "string" ? formData.idMethod : undefined;
    const durationMins =
      typeof formData.durationMins === "number" && Number.isFinite(formData.durationMins)
        ? formData.durationMins
        : undefined;

    const options = { aiModel, ragContext, idMethod, durationMins };

    // 1) Generate storyboard
    const generated = await openaiService.generateStoryboardFromOpenAI(formData, options);

    // 2) Validate strict schema
    const validated = StoryboardModuleSchema.parse(generated);

    // 3) Compute quality report + attach to metadata
    const quality = computeQualityReport(validated);
    validated.metadata = validated.metadata || {};
    (validated.metadata as any).qualityReport = quality;

    // 4) (Optional) Convert quality issues to warnings for legacy consumers
    if (!quality.ok) {
      validated.metadata.warnings = [
        ...(validated.metadata.warnings || []),
        ...quality.issues.map((i) => `[#${i.code}] ${i.message}`),
      ];
    }

    return res.status(200).json(validated);
  } catch (err: any) {
    const message =
      (err && (err.message || err.error || err.toString())) || "Failed to generate storyboard";

    console.error("[/api/generate] error:", {
      message,
      // body: req.body, // uncomment if you need deeper diagnostics (mind PII)
    });

    // If the error originated from schema parsing, return 400 with details
    if (err?.issues) {
      return res.status(400).json({ error: "Validation error", details: err.issues });
    }

    return res.status(500).json({ error: message });
  }
});

/* =========================================================================
 * POST /api/generate/upgrade
 * - Re-generates with "forceLength" and stricter cues, then runs the same
 *   validation + quality pass. Useful for a one‑click “Make It Stronger”.
 *   Body can contain the same formData as /generate, plus overrides.
 * ========================================================================= */
router.post("/generate/upgrade", normaliseDuration, async (req: Request, res: Response) => {
  try {
    const formData = { ...(req.body ?? {}) };
    // Push stronger constraints to the generator
    formData.forceLength = true;
    // Nudge min scenes if author provided nothing
    if (!formData.minScenes && formData.durationMins) {
      // rough rule: ~1 scene/min at L3; generator clamps per level
      formData.minScenes = Math.max(12, Math.round(formData.durationMins));
    }

    const aiModel = typeof formData.aiModel === "string" ? formData.aiModel : undefined;
    const ragContext = typeof formData.ragContext === "string" ? formData.ragContext : undefined;
    const idMethod = typeof formData.idMethod === "string" ? formData.idMethod : undefined;
    const durationMins =
      typeof formData.durationMins === "number" && Number.isFinite(formData.durationMins)
        ? formData.durationMins
        : undefined;

    const options = { aiModel, ragContext, idMethod, durationMins };

    const generated = await openaiService.generateStoryboardFromOpenAI(formData, options);
    const validated = StoryboardModuleSchema.parse(generated);

    const quality = computeQualityReport(validated);
    validated.metadata = validated.metadata || {};
    (validated.metadata as any).qualityReport = quality;

    if (!quality.ok) {
      validated.metadata.warnings = [
        ...(validated.metadata.warnings || []),
        ...quality.issues.map((i) => `[#${i.code}] ${i.message}`),
      ];
    }

    return res.status(200).json(validated);
  } catch (err: any) {
    const message =
      (err && (err.message || err.error || err.toString())) || "Failed to upgrade storyboard";

    console.error("[/api/generate/upgrade] error:", { message });

    if (err?.issues) {
      return res.status(400).json({ error: "Validation error", details: err.issues });
    }
    return res.status(500).json({ error: message });
  }
});

export default router;