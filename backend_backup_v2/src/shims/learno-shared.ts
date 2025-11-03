// Minimal shared types so the backend compiles without the real @learno/shared.
export type SceneVisual = {
  mediaType?: "Image" | "Graphic" | "Animation" | "Video" | string;
  style?: string;
  aiPrompt?: string;
  altText?: string;
  aspectRatio?: string;
  composition?: string;
  environment?: string;
};

export type StoryboardSceneV2 = {
  sceneNumber: number;
  pageTitle: string;
  screenLayout?: string;
  templateId?: string;
  screenId?: string;
  narrationScript?: string;
  onScreenText?: string;
  visual?: SceneVisual;
  interactionType?: string;
  interactionDescription?: string;
  developerNotes?: string;
  accessibilityNotes?: string;
  events?: Array<{
    eventNumber?: number;
    audio?: { script?: string };
    narrationScript?: string;
    onScreenText?: string;
    developerNotes?: string;
    interactive?: { behaviourExplanation?: string };
  }>;
};

export type RevisionEntry = { dateISO: string; change: string; author: string };

export type StoryboardModuleV2 = {
  moduleName: string;
  revisionHistory?: RevisionEntry[];
  pronunciationGuide?: Array<{ term: string; pronunciation: string; note?: string }>;
  tableOfContents?: string[];
  scenes: StoryboardSceneV2[];
};

export type StoryboardEnvelope =
  | { success: true; data: { storyboardModule: StoryboardModuleV2 }; meta?: Record<string, any> }
  | { success: false; data?: any; meta?: Record<string, any> };
