// backend/src/shims/learno-shared.ts
export type VisualBlock = {
  mediaType?: "Image" | "Graphic" | "Animation" | "Video";
  style?: string;
  aiPrompt?: string;
  altText?: string;
  aspectRatio?: string;
  composition?: string;
  environment?: string;
};

export type SceneV2 = {
  sceneNumber?: number;
  pageTitle?: string;
  screenLayout?: string;
  templateId?: string;
  screenId?: string;
  narrationScript?: string;
  onScreenText?: string;
  visual?: VisualBlock;
  interactionType?: string;
  interactionDescription?: string;
  developerNotes?: string;
  accessibilityNotes?: string;
  events?: Array<{
    eventNumber?: number;
    audio?: { script?: string };
    narrationScript?: string;
    voiceover?: string;
    onScreenText?: string;
    developerNotes?: string;
    interactive?: { behaviourExplanation?: string };
  }>;
};

export type StoryboardModuleV2 = {
  moduleName: string;
  revisionHistory?: Array<{ dateISO: string; change: string; author: string }>;
  pronunciationGuide?: Array<{ term: string; pronunciation: string; note?: string }>;
  tableOfContents?: string[];
  scenes: SceneV2[];
};

export type StoryboardEnvelope =
  | { success: true; data: { storyboardModule: StoryboardModuleV2 }; meta?: Record<string, any> }
  | { success: false; data: { storyboardModule?: undefined }; meta?: Record<string, any> };
