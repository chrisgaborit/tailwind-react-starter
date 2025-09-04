// frontend/src/utils/normalize.ts
export function normalizeToScenes(sb: any) {
  if (!sb) return {};
  // already scenes?
  if (Array.isArray(sb.scenes) && sb.scenes.length > 0) return sb;

  // convert legacy pages → scenes
  if (Array.isArray(sb.pages) && sb.pages.length > 0) {
    return {
      ...sb,
      scenes: sb.pages.map((p: any, i: number) => ({
        sceneNumber: p.pageNumber ?? i + 1,
        pageTitle: p.pageTitle || p.title || `Scene ${i + 1}`,
        screenLayout: p.screenLayout || "",
        templateId: p.templateId || "",
        screenId: p.screenId || `scene-${i + 1}`,
        narrationScript: p.narrationScript || p.voiceover || "",
        onScreenText: p.onScreenText || p.ost || "",
        visualDescription: p.visualDescription || p.visuals || "",
        interactionType: p.interactionType || p.interactivity?.type || "None",
        interactionDescription: p.interactionDescription || "",
        developerNotes: p.developerNotes || p.developerNotesV2 || "",
        accessibilityNotes: p.accessibilityNotes || "",
      })),
    };
  }

  return sb;
}

export function isStoryboardModule(x: any): boolean {
  return !!x && typeof x.moduleName === "string" && Array.isArray(x.scenes) && x.scenes.length > 0;
}
