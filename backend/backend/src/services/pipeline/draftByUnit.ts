// backend/src/services/pipeline/draftByUnit.ts

/**
 * Pipeline Stage 2: Draft By Unit
 * 
 * For LO bundles: Use ChatGPT-style generation (5 scenes at once)
 * For other pages: Use existing per-page generation
 */

import { Page } from "../../validation";
import { SYSTEM_PROMPT } from "../../prompts/systemPrompt";
import { openaiChat } from "../openaiGateway";
import { safeJSONParse } from "../../utils/safeJSONParse";
import { resetHeader } from "../../agents_v2/resetHeader";
import { generateLOSequence } from "./chatgptStyleGenerator";

export interface DraftUnitInput {
  pageType: Page["pageType"];
  title: string;
  learningObjectiveIds: string[];
  loText?: string;
  context?: string;
  estimatedDurationSec: number;
  sourceMaterial?: string; // Training material content
}

const MAX_RETRIES = 3;

/**
 * Draft a single page unit using LLM
 */
export async function draftByUnit(input: DraftUnitInput): Promise<Page> {
  const { pageType, title, learningObjectiveIds, loText, context, estimatedDurationSec, sourceMaterial } = input;

  // Determine phase-specific requirements based on pageType
  const getPhaseInstructions = (pt: Page["pageType"]): string => {
    if (pt === "Text + Image" || pt === "Text + Video") {
      if (title.toLowerCase().includes("teach")) {
        return `
TEACH PHASE - Create a teaching page with:
- 2-12 events with audio (25-40 words each) explaining the concept clearly
- OST (on-screen text) with key points that complement the audio
- Image specification in devNotes describing what visual supports the teaching
- Use Problem → Cause → Illustration → Application structure
- Assume zero prior knowledge - start from basics
`;
      } else if (title.toLowerCase().includes("reflect")) {
        return `
REFLECT PHASE - Create a reflection page with:
- 2-3 events prompting personal application
- Questions that bridge to next learning objective
- Encouraging tone for self-reflection
`;
      }
      return `
Create a content page with:
- 2-12 events with clear audio explanations
- OST with key points
- Image specifications in devNotes
`;
    }
    
    if (pt === "Interactive: Click-to-Reveal") {
      return `
SHOW PHASE - Create a click-to-reveal interaction with:
- 3-5 clickable items that reveal content progressively
- Each item has trigger text and reveal content (audio + OST)
- Full accessibility specs (keyboard nav, alt text, screen reader)
- Specify interaction trigger, behaviour, feedback, reset in devNotes
- Items should demonstrate the concept visually
`;
    }
    
    if (pt === "Interactive: Drag-and-Drop") {
      return `
APPLY PHASE - Create a drag-and-drop practice with:
- 4-6 draggable items with matching dropzones
- Correct/incorrect feedback for each match
- Full accessibility specs (keyboard nav with arrow keys, screen reader)
- Specify interaction trigger, behaviour, feedback, reset in devNotes
- Allow learners to practice applying the concept
`;
    }
    
    if (pt.startsWith("Assessment")) {
      return `
CHECK PHASE - Create a knowledge check with:
- Question text in first event
- 4 answer options (for MCQ) or multiple options (for MRQ)
- Correct answer clearly marked
- Feedback for correct/incorrect responses
- Full accessibility specs
`;
    }
    
    if (pt.startsWith("Scenario")) {
      if (pt === "Scenario: Setup") {
        return "Introduce the scenario context and characters";
      }
      if (pt === "Scenario: Decision") {
        return "Present decision points with options";
      }
      if (pt === "Scenario: Consequence") {
        return "Show outcomes of decisions";
      }
      if (pt === "Scenario: Debrief") {
        return "Reflect on the scenario and lessons learned";
      }
    }
    
    return "Create content following the Brandon Hall architecture";
  };

  const unitPrompt = `
Generate a single page for an eLearning storyboard following the Brandon Hall architecture.

CRITICAL PAGE SPECIFICATIONS:
- REQUIRED PAGE TYPE: "${pageType}" (THIS FIELD MUST BE EXACTLY: "${pageType}")
- Title: ${title}
- Learning Objective IDs: ${learningObjectiveIds.join(", ")}
${loText ? `- Learning Objective Text: ${loText}` : ""}
- Estimated Duration: ${estimatedDurationSec} seconds
${context ? `- Context: ${context}` : ""}

${sourceMaterial && sourceMaterial.length > 100 ? `
SOURCE TRAINING MATERIAL:
${sourceMaterial.substring(0, 3000)}${sourceMaterial.length > 3000 ? "\n\n[... content truncated for brevity ...]" : ""}

CRITICAL: Use this training material as the basis for your content. Extract specific:
- Definitions and concepts from the material
- Examples and scenarios mentioned
- Procedures and steps outlined
- Best practices and recommendations
- Key terminology and jargon used
- Real-world applications described

DO NOT generate generic content. Base everything on the actual training material provided above.
` : `
⚠️  No source material provided. Generate content based on the learning objective only.
`}

REQUIREMENTS:
1. Generate 2-12 events (four-column structure). For complex pages, you may include more events (up to 12) to fully cover the content.
2. Each event must have:
   - number: Incremental format (e.g., "1.1", "1.2", "1.3")
   - audio: 25-40 words, active voice, UK English
   - ost: On-screen text (concise, complements audio)
   - devNotes: Developer notes for implementation

3. Accessibility (required):
   - altText: Array of strings describing all images
   - keyboardNav: "Tab order: [explicit order]. Keyboard: [key bindings]"
   - contrastNotes: Notes on contrast requirements
   - screenReader: Screen reader announcements

4. ${getPhaseInstructions(pageType)}

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "pageNumber": "p01",  // Will be reassigned later
  "title": "${title}",
  "pageType": "${pageType}",  // CRITICAL: Must be exactly "${pageType}" - do not change this value
  "learningObjectiveIds": ${JSON.stringify(learningObjectiveIds)},
  "estimatedDurationSec": ${estimatedDurationSec},
  "accessibility": {
    "altText": ["Description 1", "Description 2"],
    "keyboardNav": "Tab order: 1. Main content, 2. Interaction elements. Keyboard: Arrow keys to navigate, Enter to select.",
    "contrastNotes": "High contrast text on background.",
    "screenReader": "Page title and main content announced."
  },
  "events": [
    {
      "number": "1.1",
      "audio": "First event audio script (25-40 words, active voice, UK English)",
      "ost": "On-screen text for first event",
      "devNotes": "Developer notes for first event"
    },
    {
      "number": "1.2",
      "audio": "Second event audio script (25-40 words, active voice, UK English)",
      "ost": "On-screen text for second event",
      "devNotes": "Developer notes for second event"
    }
  ]
}

CRITICAL: 
- Return ONLY valid JSON, no markdown, no code blocks
- Use UK English spelling
- Active voice only
- No placeholders or TODOs
- All fields must be populated
- THE pageType field MUST be exactly "${pageType}" - DO NOT use a different pageType value
`;

  let lastError: Error | null = null;
  const startTime = Date.now();
  const MAX_GENERATION_TIME = 180000; // 3 minutes timeout

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Safety timeout check
      if (Date.now() - startTime > MAX_GENERATION_TIME) {
        throw new Error("Scene generation timeout (3 minutes)");
      }
      
      console.log(`   📝 Drafting ${pageType} page "${title}" (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${SYSTEM_PROMPT}\n\n${unitPrompt}`,
      });

      const parsed = safeJSONParse(response);
      
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid JSON structure returned");
      }

      // Validate it's a Page-like structure
      if (!parsed.pageType || !parsed.title || !parsed.events || !Array.isArray(parsed.events)) {
        throw new Error("Missing required Page fields");
      }

      // CRITICAL: Verify pageType matches requirement and force if wrong
      if (parsed.pageType !== pageType) {
        console.warn(`⚠️  LLM returned wrong pageType: "${parsed.pageType}", expected: "${pageType}". Forcing correct type.`);
        parsed.pageType = pageType;  // Force correct type
      }

      // Ensure pageNumber format (will be reassigned in assembly)
      let page: Page = {
        ...parsed,
        pageNumber: parsed.pageNumber || "p00", // Temporary, will be reassigned
        pageType: pageType, // Explicitly set to ensure correctness
        learningObjectiveIds: parsed.learningObjectiveIds || learningObjectiveIds,
        estimatedDurationSec: parsed.estimatedDurationSec || estimatedDurationSec,
        accessibility: {
          altText: parsed.accessibility?.altText || ["Image description required"],
          keyboardNav: parsed.accessibility?.keyboardNav || "Tab order: 1. Main content. Keyboard: Use Tab to navigate.",
          contrastNotes: parsed.accessibility?.contrastNotes || "High contrast required.",
          screenReader: parsed.accessibility?.screenReader || "Page content announced.",
        },
        events: parsed.events.map((event: any, idx: number) => ({
          number: event.number || `${1}.${idx + 1}`,
          audio: event.audio || `Event ${idx + 1} audio`,
          ost: event.ost || `Event ${idx + 1} on-screen text`,
          devNotes: event.devNotes || `Event ${idx + 1} developer notes`,
        })),
      };

      // Ensure learningObjectiveIds is never empty (fallback to GLOBAL for intro/summary pages)
      if (!page.learningObjectiveIds || page.learningObjectiveIds.length === 0) {
        page.learningObjectiveIds = ["GLOBAL"]; // fallback tag for intro/summary
      }

      // Trimming safeguard: slice events to max 12 if exceeded
      if (page.events && page.events.length > 12) {
        console.warn(`⚠️  Page "${page.title}" has ${page.events.length} events (max 12). Trimming to first 12.`);
        page.events = page.events.slice(0, 12);
      }

      // Validate using Zod (will throw if invalid)
      const validationModule = await import("../../validation");
      validationModule.PageSchema.parse(page);

      // --- Voiceover length validation and controlled expansion ---
      const minutes = page.estimatedDurationSec / 60;
      const minVoiceoverChars = Math.max(600, 150 * minutes * 5); // 150 words/min × 5 chars/word, minimum 600
      const minOSTChars = Math.max(200, 50 * minutes * 5); // 50 words/min × 5 chars/word, minimum 200
      const tolerance = 0.85; // Accept 85% of target
      const maxExpansionRetries = 3;
      
      let expansionTries = 0;
      let currentPage = page;
      let totalVoiceover = currentPage.events.reduce((sum, e) => sum + e.audio.length, 0);
      
      // Controlled expansion loop for voiceover length
      while (totalVoiceover < minVoiceoverChars && expansionTries < maxExpansionRetries) {
        // Safety timeout check during expansion
        if (Date.now() - startTime > MAX_GENERATION_TIME) {
          console.warn("⚠️  Generation timeout reached during expansion. Stopping expansion.");
          break;
        }
        
        console.warn(
          `⚠️  Voiceover too short (${totalVoiceover} < ${minVoiceoverChars} chars). Expanding (attempt ${expansionTries + 1}/${maxExpansionRetries})...`
        );
        
        // Create expansion prompt
        const expansionPrompt = `The previous generation was too short. Expand the content with:
- More narrative detail and examples
- At least ${Math.ceil(minVoiceoverChars / 5)} total words across all events
- Behavioral examples or mini-scenarios
- Concrete illustrations of the concepts`;
        
        try {
          // Generate expanded version with enhanced context
          const expandedResponse = await openaiChat({
            systemKey: "master_blueprint",
            user: `${resetHeader}${SYSTEM_PROMPT}\n\n${unitPrompt}\n\n${expansionPrompt}`,
          });

          const expandedParsed = safeJSONParse(expandedResponse);
          
          if (expandedParsed && typeof expandedParsed === "object" && expandedParsed.events && Array.isArray(expandedParsed.events)) {
            // Ensure pageType matches
            if (expandedParsed.pageType !== pageType) {
              expandedParsed.pageType = pageType;
            }
            
            const expandedTotalVoiceover = expandedParsed.events.reduce((sum: number, e: any) => sum + (e.audio?.length || 0), 0);
            
            // Stop if expansion failed to meaningfully improve (less than 50 char increase)
            if (expandedTotalVoiceover <= totalVoiceover + 50) {
              console.warn(`⚠️  Expansion did not meaningfully improve (${expandedTotalVoiceover} <= ${totalVoiceover + 50}). Stopping expansion.`);
              break;
            }
            
            // Update page with expanded content
            currentPage = {
              ...currentPage,
              events: expandedParsed.events.map((event: any, idx: number) => ({
                number: event.number || `${1}.${idx + 1}`,
                audio: event.audio || `Event ${idx + 1} audio`,
                ost: event.ost || `Event ${idx + 1} on-screen text`,
                devNotes: event.devNotes || `Event ${idx + 1} developer notes`,
              })),
            };
            
            totalVoiceover = expandedTotalVoiceover;
            expansionTries++;
          } else {
            console.warn("⚠️  Expanded generation failed to parse. Stopping expansion.");
            break;
          }
        } catch (expansionError: any) {
          console.warn(`⚠️  Expansion attempt ${expansionTries + 1} failed: ${expansionError.message}. Stopping expansion.`);
          break;
        }
      }
      
      // Accept if at least 85% of required length or max retries reached
      if (totalVoiceover >= minVoiceoverChars * tolerance || expansionTries >= maxExpansionRetries) {
        page = currentPage;
        console.log(
          `✅ Accepted voiceover length: ${totalVoiceover} chars (after ${expansionTries} expansion attempt${expansionTries !== 1 ? 's' : ''})`
        );
      } else {
        console.warn(
          `⚠️  Voiceover remained short (${totalVoiceover} chars) after ${expansionTries} attempts. Proceeding anyway.`
        );
        page = currentPage; // Accept what we have
      }
      
      // Handle OST expansion (non-blocking, single pass)
      const totalOST = page.events.reduce((sum, e) => sum + e.ost.length, 0);
      if (totalOST < minOSTChars) {
        console.warn(`⚠️  On-screen text too short (${totalOST} < ${minOSTChars} chars). Expanding...`);
        // Expand OST in events if needed
        page.events = page.events.map((event) => ({
          ...event,
          ost: event.ost.length < (minOSTChars / page.events.length) 
            ? `${event.ost} ${event.audio.split(' ').slice(0, 10).join(' ')}` // Add key points from audio
            : event.ost,
        }));
      }

      // DEBUG: Log page details after drafting
      const finalVoiceover = page.events.reduce((sum, e) => sum + e.audio.length, 0);
      const finalOST = page.events.reduce((sum, e) => sum + e.ost.length, 0);
      console.log(`📋 Page drafted:`, {
        title: page.title,
        pageType: page.pageType,
        loIds: page.learningObjectiveIds,
        eventCount: page.events.length,
        voiceoverChars: finalVoiceover,
        ostChars: finalOST,
        minVoiceoverRequired: minVoiceoverChars,
        minOSTRequired: minOSTChars,
        expansionAttempts: expansionTries,
      });

      console.log(`   ✅ Drafted ${pageType} page: "${title}"`);
      return page;

    } catch (error: any) {
      lastError = error;
      console.warn(`   ⚠️  Draft attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < MAX_RETRIES) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // If all retries failed, throw with context
  throw new Error(`Failed to draft page "${title}" after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`);
}

/**
 * Draft multiple pages in parallel (with concurrency limit)
 * Uses ChatGPT-style generation for LO bundles, per-page for others
 */
export async function draftMultipleUnits(
  inputs: DraftUnitInput[],
  params?: {
    audience?: string;
    moduleTitle?: string;
    sourceMaterial?: string;
  }
): Promise<Page[]> {
  const pages: Page[] = [];
  
  // Group inputs by LO bundle (for ChatGPT-style generation)
  const loBundleMap = new Map<string, { loId: string; loText: string; inputs: DraftUnitInput[] }>();
  const otherInputs: DraftUnitInput[] = [];
  
  for (const input of inputs) {
    // Check if this is part of an LO bundle (has loText and is TEACH/SHOW/APPLY/CHECK/REFLECT)
    if (input.loText && input.learningObjectiveIds.length > 0 && 
        (input.title.toLowerCase().includes('teach') || 
         input.title.toLowerCase().includes('show') ||
         input.title.toLowerCase().includes('apply') ||
         input.title.toLowerCase().includes('check') ||
         input.title.toLowerCase().includes('reflect'))) {
      const loId = input.learningObjectiveIds[0];
      if (!loBundleMap.has(loId)) {
        loBundleMap.set(loId, { loId, loText: input.loText, inputs: [] });
      }
      loBundleMap.get(loId)!.inputs.push(input);
    } else {
      otherInputs.push(input);
    }
  }
  
  // Generate LO bundles using ChatGPT-style (all 5 scenes at once)
  console.log(`\n🎬 Generating ${loBundleMap.size} LO bundle(s) using ChatGPT-style...`);
  for (const [loId, bundle] of loBundleMap.entries()) {
    if (bundle.inputs.length >= 4) { // Only use ChatGPT-style if we have at least 4 scenes
      try {
        const loPages = await generateLOSequence(
          { loId: bundle.loId, loText: bundle.loText },
          params?.sourceMaterial || '',
          {
            audience: params?.audience,
            moduleTitle: params?.moduleTitle
          }
        );
        pages.push(...loPages);
        console.log(`   ✅ Generated ${loPages.length} pages for LO bundle ${loId}`);
      } catch (error: any) {
        console.warn(`   ⚠️  ChatGPT-style generation failed for ${loId}, falling back to per-page: ${error.message}`);
        // Fallback to per-page generation
        const fallbackPages = await Promise.all(
          bundle.inputs.map((input) => draftByUnit(input))
        );
        pages.push(...fallbackPages);
      }
    } else {
      // Not enough scenes, use per-page generation
      const fallbackPages = await Promise.all(
        bundle.inputs.map((input) => draftByUnit(input))
      );
      pages.push(...fallbackPages);
    }
  }
  
  // Generate other pages (Course Launch, Scenarios, Knowledge Checks, Summary) using per-page approach
  console.log(`\n📝 Generating ${otherInputs.length} other page(s) using per-page approach...`);
  const CONCURRENCY_LIMIT = 3; // Process 3 pages at a time
  for (let i = 0; i < otherInputs.length; i += CONCURRENCY_LIMIT) {
    const batch = otherInputs.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((input) => draftByUnit(input))
    );
    pages.push(...batchResults);
  }

  return pages;
}

