// backend/src/utils/normalizeStoryboard.ts

// ===== Types for incoming (pages/events) shape =====
export type IncomingEvent = {
  eventNumber: number;
  onScreenText?: string;
  aiProductionBrief?: {
    visual?: {
      mediaType?: string;
      style?: string;
      subject?: string;
      composition?: string;
      environment?: string;
      animationSpec?: string;
    };
    audio?: { script?: string; voice?: string; pacing?: string };
    interactive?: {
      interactionType?: string;
      layoutDescription?: string;
      behaviourExplanation?: string;
      learningPurpose?: string;
    };
  };
};

export type IncomingPage = {
  pageNumber: number;
  pageTitle?: string;
  events?: IncomingEvent[];
};

export type IncomingModule = {
  // V1 (pages/events) shape
  moduleName?: string;
  revisionHistory?: any[];
  pronunciationGuide?: any[];
  pages?: IncomingPage[];

  // V2 (scenes) shape (already normalized) – if present we just pass through
  scenes?: any[];
  meta?: { moduleName?: string };
};

// ===== Normalized (scenes) shape =====
export interface NormalizedScene {
  sceneNumber: number;
  pageTitle: string;
  screenLayout: string;
  templateId: string;
  screenId: string;
  narrationScript: string;
  onScreenText: string;
  visualDescription: string;
  interactionType: string;
  interactionDescription: string;
  developerNotes: string;
  accessibilityNotes: string;
  imagePrompt: string;

  // Optional additions for future use
  knowledgeCheck?: string | object;
  learningObjectivesCovered?: string[];
  id?: string;
  sceneTitle?: string;
  version?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface NormalizedModule {
  moduleName: string;
  revisionHistory: any[];
  pronunciationGuide: any[];
  tableOfContents: string[];
  scenes: NormalizedScene[];
}

// ===== Helpers =====
const safeStr = (v: unknown) => (typeof v === 'string' ? v : '');
const joinNonEmpty = (parts: Array<string | undefined>) =>
  parts
    .map((p) => (p || '').trim())
    .filter((p) => p.length > 0)
    .join(' | ');

// ===== Type guards =====
function hasScenes(mod: IncomingModule): boolean {
  return Array.isArray((mod as any).scenes);
}

function getModuleName(mod: IncomingModule): string {
  return safeStr(mod.moduleName) || safeStr(mod.meta?.moduleName) || 'Untitled Module';
}

// ===== Normalizer =====
/**
 * Normalizes any incoming storyboard (with `pages`/`events` or already `scenes`)
 * into a unified shape containing:
 *   { moduleName, revisionHistory, pronunciationGuide, tableOfContents, scenes }
 *
 * If `scenes` already exists, returns the module unchanged (pass-through) while
 * ensuring top-level metadata and a computed tableOfContents exist.
 */
export function normalizeToScenes(mod: IncomingModule): NormalizedModule {
  // Pass-through if already normalized (has scenes)
  if (hasScenes(mod)) {
    const moduleName = getModuleName(mod);
    const scenes = ((mod as any).scenes || []) as NormalizedScene[];

    return {
      moduleName,
      revisionHistory: mod.revisionHistory || [],
      pronunciationGuide: mod.pronunciationGuide || [],
      tableOfContents: scenes.map(
        (s: any) => safeStr(s.pageTitle) || safeStr(s.title) || `Scene ${s.sceneNumber ?? ''}`
      ),
      scenes,
    };
  }

  // Build scenes from pages/events
  const pages: IncomingPage[] = Array.isArray(mod.pages) ? mod.pages : [];
  const scenes: NormalizedScene[] = pages.map((p) => {
    const events: IncomingEvent[] = Array.isArray(p.events) ? p.events : [];

    const onScreenText = events
      .map((e) => safeStr(e.onScreenText).trim())
      .filter(Boolean)
      .join('\n\n');

    const narrationScript = events
      .map((e) => safeStr(e.aiProductionBrief?.audio?.script).trim())
      .filter(Boolean)
      .join('\n\n');

    // Use the first event’s visuals/interaction as scene-level summaries
    const first = events[0];
    const vis = first?.aiProductionBrief?.visual || {};
    const intx = first?.aiProductionBrief?.interactive || {};

    const visualDescription = joinNonEmpty([
      vis.mediaType ? `Media: ${vis.mediaType}` : undefined,
      vis.style ? `Style: ${vis.style}` : undefined,
      vis.subject ? `Subject: ${vis.subject}` : undefined,
      vis.composition ? `Composition: ${vis.composition}` : undefined,
      vis.environment ? `Environment: ${vis.environment}` : undefined,
      vis.animationSpec ? `Animation: ${vis.animationSpec}` : undefined,
    ]);

    const interactionType = safeStr(intx.interactionType);

    const interactionDescription = joinNonEmpty([
      intx.layoutDescription ? `Layout: ${intx.layoutDescription}` : undefined,
      intx.behaviourExplanation ? `Behaviour: ${intx.behaviourExplanation}` : undefined,
      intx.learningPurpose ? `Purpose: ${intx.learningPurpose}` : undefined,
    ]);

    const developerNotes = interactionDescription; // reuse for now

    const imagePrompt = [vis.subject, vis.style, vis.composition, vis.environment]
      .map(safeStr)
      .filter(Boolean)
      .join(', ');

    return {
      sceneNumber: p.pageNumber,
      pageTitle: p.pageTitle || `Scene ${p.pageNumber}`,
      screenLayout: '',
      templateId: '',
      screenId: `scene-${p.pageNumber}`,
      narrationScript,
      onScreenText,
      visualDescription,
      interactionType,
      interactionDescription,
      developerNotes,
      accessibilityNotes: '',
      imagePrompt,
    };
  });

  return {
    moduleName: getModuleName(mod),
    revisionHistory: mod.revisionHistory || [],
    pronunciationGuide: mod.pronunciationGuide || [],
    tableOfContents: scenes.map((s) => s.pageTitle),
    scenes,
  };
}

export default normalizeToScenes;
