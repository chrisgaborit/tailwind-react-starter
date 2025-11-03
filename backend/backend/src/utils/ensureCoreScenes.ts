import { StoryboardFormData, StoryboardModule } from "../types";

function pad2(n: number) { return n.toString().padStart(2, "0"); }
function isTitle(s?: string) { return /^(title|module\s*title)/i.test(s || ""); }
function isPronun(s?: string) { return /(pronunciation|pronunciation guide)/i.test(s || ""); }
function isToc(s?: string) { return /(table of contents|contents|toc)/i.test(s || ""); }
function isWelcomeObj(s?: string) { return /(welcome|learning objectives|objectives)/i.test(s || ""); }

export function ensureCoreScenes(sb: StoryboardModule, form: StoryboardFormData): StoryboardModule {
  const scenes = Array.isArray(sb.scenes) ? [...sb.scenes] : [];

  const makeTitle = () => ({
    sceneNumber: 1,
    pageTitle: "Title",
    screenLayout: "Static title layout",
    templateId: "TITLE",
    screenId: "p01",
    onScreenText: form.moduleName || "Module Title",
    narrationScript: "",
    visualDescription: "Brand title slide with logo",
    interactionType: "None",
    interactionDescription: "None",
    developerNotes: "Show module title and brand mark. No interaction.",
    accessibilityNotes: "Title text announced as H1.",
  });

  const makePronunciation = () => ({
    sceneNumber: 2,
    pageTitle: "Pronunciation Guide",
    screenLayout: "Table of terms with phonetics",
    templateId: "PRONUN",
    screenId: "p02",
    onScreenText: "Pronunciation Guide",
    narrationScript: "",
    visualDescription: "Simple table listing key terms and pronunciations",
    interactionType: "None",
    interactionDescription: "None",
    developerNotes:
      "Render storyboard.pronunciationGuide as a two-column table (Term | Pronounced). If empty, show 'No special pronunciations'.",
    accessibilityNotes: "Table has headers; announce as glossary.",
  });

  const makeTOC = () => ({
    sceneNumber: 3,
    pageTitle: "Table of Contents",
    screenLayout: "Bulleted list of sections",
    templateId: "TOC",
    screenId: "p03",
    onScreenText: "Table of Contents",
    narrationScript: "",
    visualDescription: "List of scene titles grouped by section",
    interactionType: "None",
    interactionDescription: "None",
    developerNotes:
      "Build bullets from storyboard.tableOfContents if present; else from later scene pageTitle values.",
    accessibilityNotes: "List is keyboard navigable.",
  });

  const makeWelcomeObjectives = () => ({
    sceneNumber: 4,
    pageTitle: "Welcome & Learning Objectives",
    screenLayout: "Headline + 3 bullets",
    templateId: "WELCOME_OBJECTIVES",
    screenId: "p04",
    onScreenText:
      (form.learningOutcomes && typeof form.learningOutcomes === "string")
        ? form.learningOutcomes
        : "By the end of this module you will be able to: • … • … • …",
    narrationScript: "Welcome to the module. In this lesson you will…",
    visualDescription: "Clean corporate hero image. Subtitle: Learning Objectives.",
    interactionType: "None",
    interactionDescription: "None",
    developerNotes: "No interaction. Proceed to concept build afterwards.",
    accessibilityNotes: "Objectives listed as bullets; announce as section.",
  });

  // Ensure positions 0..3 are the required pages (insert or replace as needed)
  const need = [makeTitle, makePronunciation, makeTOC, makeWelcomeObjectives];
  const testers = [isTitle, isPronun, isToc, isWelcomeObj];

  for (let i = 0; i < 4; i++) {
    if (!scenes[i] || !testers[i](scenes[i].pageTitle)) {
      // Look elsewhere for a matching page to move up
      const foundIdx = scenes.findIndex((s, idx) => idx > i && testers[i](s.pageTitle));
      if (foundIdx > -1) {
        const [moved] = scenes.splice(foundIdx, 1);
        scenes.splice(i, 0, moved);
      } else {
        scenes.splice(i, 0, need[i]());
      }
    }
  }

  // Renumber & page codes like "p01"
  scenes.forEach((s, i) => {
    s.sceneNumber = i + 1;
    s.screenId = s.screenId || `p${pad2(i + 1)}`;
  });

  return { ...sb, scenes };
}
