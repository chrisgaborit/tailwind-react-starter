// backend/src/services/pipeline/editQuality.ts

/**
 * Pipeline Stage 4: Edit Quality
 * 
 * Single LLM pass to tighten audio, remove passive voice, add missing alt text,
 * and fill any interaction trigger/behaviour/feedback/reset/accessibility gaps.
 */

import { Page } from "../../validation";
import { SYSTEM_PROMPT } from "../../prompts/systemPrompt";
import { openaiChat } from "../openaiGateway";
import { safeJSONParse } from "../../utils/safeJSONParse";
import { resetHeader } from "../../agents_v2/resetHeader";

/**
 * Edit a single page for quality improvements
 */
export async function editQuality(page: Page): Promise<Page> {
  console.log(`   ✏️  Editing quality for page ${page.pageNumber}: ${page.title}`);

  const editPrompt = `
You are a Senior Editor reviewing and improving an eLearning storyboard page.

CURRENT PAGE:
${JSON.stringify(page, null, 2)}

IMPROVEMENTS REQUIRED:

1. AUDIO (events[].audio):
   - Remove passive voice (change to active voice)
   - Tighten wording (remove filler words)
   - Ensure 25-40 words per event
   - Use UK English spelling
   - Make it more engaging and clear

2. ACCESSIBILITY:
   - Ensure altText array has descriptions for ALL images
   - Ensure keyboardNav includes explicit "Tab order:" and "Keyboard:" sections
   - Ensure contrastNotes are specific
   - Ensure screenReader notes are complete

3. INTERACTIONS (if pageType starts with "Interactive" or "Scenario"):
   - Ensure devNotes include: trigger, behaviour, feedback, reset, accessibility
   - Make interaction specs complete and actionable

4. ON-SCREEN TEXT (events[].ost):
   - Complement audio without duplication
   - Be concise and scannable
   - Highlight key points

5. DEVELOPER NOTES (events[].devNotes):
   - Be specific and actionable
   - Include implementation guidance
   - No placeholders or TODOs

OUTPUT:
Return the improved page as valid JSON with the exact same structure.
Only modify fields that need improvement. Keep pageNumber, title, pageType, learningObjectiveIds unchanged.

Return ONLY valid JSON, no markdown, no code blocks.
`;

  try {
    const response = await openaiChat({
      systemKey: "master_blueprint",
      user: `${resetHeader}${SYSTEM_PROMPT}\n\n${editPrompt}`,
    });

    const parsed = safeJSONParse(response);
    
    if (!parsed || typeof parsed !== "object") {
      console.warn(`   ⚠️  Quality edit failed to parse, using original page`);
      return page;
    }

    // Merge improvements while preserving structure
    const edited: Page = {
      ...page,
      accessibility: {
        altText: parsed.accessibility?.altText || page.accessibility.altText,
        keyboardNav: parsed.accessibility?.keyboardNav || page.accessibility.keyboardNav,
        contrastNotes: parsed.accessibility?.contrastNotes || page.accessibility.contrastNotes,
        screenReader: parsed.accessibility?.screenReader || page.accessibility.screenReader,
      },
      events: parsed.events?.map((event: any, idx: number) => ({
        number: event.number || page.events[idx]?.number || `${parseInt(page.pageNumber.slice(1))}.${idx + 1}`,
        audio: event.audio || page.events[idx]?.audio || "",
        ost: event.ost || page.events[idx]?.ost || "",
        devNotes: event.devNotes || page.events[idx]?.devNotes || "",
      })) || page.events,
    };

      // Validate edited page
      const validationModule = await import("../../validation");
      validationModule.Page.parse(edited);

    console.log(`   ✅ Quality edit complete for page ${page.pageNumber}`);
    return edited;

  } catch (error: any) {
    console.warn(`   ⚠️  Quality edit failed: ${error.message}, using original page`);
    return page;
  }
}

/**
 * Edit quality for multiple pages
 */
export async function editQualityBatch(pages: Page[]): Promise<Page[]> {
  console.log(`✏️  Editing quality for ${pages.length} pages...`);
  
  const CONCURRENCY_LIMIT = 3;
  const edited: Page[] = [];

  for (let i = 0; i < pages.length; i += CONCURRENCY_LIMIT) {
    const batch = pages.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(batch.map((page) => editQuality(page)));
    edited.push(...batchResults);
  }

  console.log(`✅ Quality editing complete for ${edited.length} pages`);
  return edited;
}

