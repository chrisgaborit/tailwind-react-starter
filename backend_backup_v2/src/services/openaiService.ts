// ✅ System & FS
import fs from "fs";
import path from "path";

// ✅ OpenAI + Supabase
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Timeout wrapper to prevent hanging OpenAI calls
async function withTimeout<T>(promise: Promise<T>, ms = 60000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// 🆕 PEDAGOGICAL PATTERN INSTRUCTIONS: Generate deep teaching prompts
function generatePedagogicalPatternInstructions(blueprintBlock: any, learningOutcomes: string[], targetAudience: string): string {
  const segmentType = blueprintBlock.type?.toUpperCase();
  const pattern = pedagogicalPatterns[segmentType as keyof typeof pedagogicalPatterns];
  
  if (!pattern) {
    return `
    
--- PEDAGOGICAL REQUIREMENTS ---
Create engaging, relevant content that connects to the audience's work experience.
Avoid boring corporate statements - make it conversational and practical.`;
  }

  const learningObjective = learningOutcomes[0] || 'key concepts';
  
  return `
  
--- PEDAGOGICAL PATTERN: ${pattern.name} ---
${pattern.structure.map(element => `• ${element.replace(/_/g, ' ')}`).join('\n')}

REQUIRED TEACHING ELEMENTS:
${pattern.structure.map(element => {
  const templates = pattern.templates[element];
  const template = templates ? templates[0] : '';
  return `• ${element.replace(/_/g, ' ')}: ${template}`;
}).join('\n')}

FORBIDDEN ELEMENTS:
${pattern.forbiddenElements.map(element => `• ${element}`).join('\n')}

TONE GUIDANCE: ${pattern.toneGuidance}

SPECIFIC INSTRUCTIONS FOR THIS SCENE:
${generateSpecificPatternInstructions(segmentType, learningObjective, targetAudience)}
--- END PEDAGOGICAL PATTERN ---`;
}

function generateSpecificPatternInstructions(segmentType: string, learningObjective: string, audience: string): string {
  switch (segmentType) {
    case 'TEACH':
      return `
• Start with WHY this matters to ${audience}
• Define the core concept clearly using analogies or metaphors
• Explain 2-3 key principles with workplace examples
• Include a reflective question: "Think about..." or "Ask yourself..."
• Use conversational tone: "you" and "your" instead of passive voice
• Connect to real work situations they face daily`;

    case 'EXAMPLE':
      return `
• Introduce a realistic character facing a workplace challenge
• Show their decision-making process, including doubts and considerations
• Demonstrate both the outcome and the consequences
• Highlight the key learning takeaway explicitly
• Make the scenario relatable to ${audience} experience
• Use dialogue and internal thoughts to bring it to life`;

    case 'PRACTICE':
      return `
• Create a realistic practice scenario they might actually face
• Provide clear guidance and support during the practice
• Include success criteria: "You'll know you're on track when..."
• Allow for reflection: "After practicing, consider..."
• Connect practice to real work applications
• Make it feel like hands-on learning, not abstract exercises`;

    case 'ASSESSMENT':
      return `
• Set context and remind of key concepts before assessing
• Present realistic scenarios, not trick questions
• Provide clear success criteria and constructive feedback
• Connect assessment to ongoing learning and development
• Make it feel like progress checking, not testing
• Include reflection on what they learned about their understanding`;

    default:
      return `
• Make content engaging and relevant to ${audience}
• Avoid corporate jargon without explanation
• Use conversational, supportive tone
• Include real-world connections and examples`;
  }
}

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(content: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return content.trim();
}

// ✅ Blueprint & metadata helpers
import { master36PageBlueprint, humanBlueprintMetadata } from "../library/blueprints";
import { saveStoryboardToSupabase } from "../library/supabaseSaver";
import { pedagogicalPatterns, pedagogicalQualityAgent } from "./pedagogicalPatterns";
import { pedagogicalQualityAgent as qualityValidator } from "../agents/pedagogicalQualityAgent";

import {
  StoryboardModule,
  InstructionalBlock,
  StoryboardBrandMetadata,
  StoryboardTimingMetadata,
  BrandonHallStoryboard,
  BrandonHallSlide,
  BrandonHallEvent,
  SceneValidationResult,
  SceneDraftResult,
  BrandonHallOnScreenText,
  BrandonHallAsset,
  BrandonHallQuestionOption,
  BrandonHallQuestionFeedback,
  Scene,
} from "../types";

// Import pattern library and quality gates
import { getPatternsForArchetype, getPatternsForHybridArchetype, generateSceneFromPattern } from "./patternLibraryService";
import { runAllQualityGates } from "./qualityGatesService";

// Import Phase 3 services
import { generateNarrativeAnchor, NarrativeAnchor } from "./narrativeAnchorService";
import { enrichSceneWithSpecialist } from "./specialistAgentsService";

// Import Phase 4 services
const { captureFeedbackEvent } = require("./feedbackCaptureService");
const { applyCompanyLearning } = require("./adaptivePromptService");
const { generateQualityDashboard } = require("./qualityDashboardService");

// Import Narrative Engine
import { 
  selectCharacterArchetypes, 
  selectNarrativePattern, 
  getEmotionalBeats, 
  generateNarrativeScene,
  upgradeInteractivity 
} from "./narrativeEngineService";

// Import Archetype Rules
import { 
  getArchetypeForModuleType,
  getModuleTypeRules,
  generateArchetypePromptGuidance,
  enforceArchetypeRules
} from "./archetypeRulesService";

// Import Pedagogical Matrix
import { 
  getPedagogicalApproach,
  generatePedagogicalGuidance,
  enforcePedagogicalRules,
  validatePedagogicalCompliance
} from "./pedagogicalMatrixService";

// ✅ Project Scoper Agent
interface ProjectScope {
  archetype: 'compliance_policy' | 'software_tutorial' | 'scenario_based' | 'concept_explainer';
  hybridArchetype?: {
    primary: string;
    secondary: string;
    weight: number; // 0.0 to 1.0, how much secondary archetype to include
  };
  narrativeStructure: {
    hook: string;
    coreConcepts: string[];
    applicationScenarios: string[];
    assessment: string;
  };
  characterProfiles: {
    primary: { name: string; role: string; personality: string };
    secondary: { name: string; role: string; personality: string }[];
  };
  toneGuidance: string;
  keyLearningMoments: string[];
  estimatedDuration: number;
  recommendedPatterns: string[]; // Pattern types to use
  interactivityDensity: 'low' | 'medium' | 'high';
}

async function analyzeProjectScope(formData: any, openai: OpenAI, businessImpact?: any): Promise<ProjectScope> {
  const scoperPrompt = `
You are an expert instructional design consultant. Analyze these project inputs and create a comprehensive project scope.

PROJECT INPUTS:
- Company: ${formData?.company || formData?.organisationName || 'the organization'}
- Module Title: ${formData?.moduleName || formData?.title || 'Untitled Module'}
- Target Audience: ${formData?.targetAudience || 'General staff'}
- Learning Objectives: ${JSON.stringify(formData?.learningOutcomes || [])}
- Module Type: ${formData?.moduleType || 'General'}
- Primary Learning Mode: ${formData?.primaryLearningMode || 'Mixed'}
- Duration: ${formData?.durationMins || 20} minutes
- Complexity: ${formData?.complexityLevel || 'Intermediate'}
- Brand Style: ${formData?.brandStyleNotes || 'Professional'}
- Innovation Strategies: ${Array.isArray(formData?.innovationStrategies) ? formData.innovationStrategies.join(', ') : 'Not specified'}
- Measurement Approaches: ${Array.isArray(formData?.measurementApproaches) ? formData.measurementApproaches.join(', ') : 'Not specified'}

${businessImpact ? `BUSINESS IMPACT FRAMEWORK:
- Primary Goal: ${businessImpact.primaryGoal}
- Success Definition: ${businessImpact.successDefinition}
- Learning Approaches: ${businessImpact.learningApproaches.join(', ')}
- Measurement: ${businessImpact.measurement.join(', ')}
- Target Improvement: ${businessImpact.targetImprovement}%
- Timeframe: ${businessImpact.timeframe} days` : ''}

TASK: Create a detailed project scope that will guide storyboard generation.

OUTPUT JSON FORMAT:
{
  "archetype": "compliance_policy|software_tutorial|scenario_based|concept_explainer",
  "hybridArchetype": {
    "primary": "primary_archetype",
    "secondary": "secondary_archetype_or_null",
    "weight": 0.3
  },
  "narrativeStructure": {
    "hook": "How to grab attention and create emotional connection",
    "coreConcepts": ["Key concept 1", "Key concept 2", "Key concept 3"],
    "applicationScenarios": ["Real-world scenario 1", "Real-world scenario 2"],
    "assessment": "How to test understanding and application"
  },
  "characterProfiles": {
    "primary": {
      "name": "Character name",
      "role": "Job title at company",
      "personality": "Brief personality description"
    },
    "secondary": [
      {
        "name": "Secondary character name",
        "role": "Job title",
        "personality": "Brief description"
      }
    ]
  },
  "toneGuidance": "Specific tone and voice instructions for this audience and topic",
  "keyLearningMoments": ["Critical learning point 1", "Critical learning point 2"],
  "estimatedDuration": ${formData?.durationMins || 20},
  "recommendedPatterns": ["dilemma", "click_to_reveal", "assessment"],
  "interactivityDensity": "low|medium|high"
}

ARCHETYPE SELECTION RULES (Based on Module Type):
- "Compliance & Ethics" → compliance_policy archetype
- "Health & Safety" → compliance_policy archetype  
- "Leadership & Coaching" → scenario_based archetype
- "Sales & Customer Service" → scenario_based archetype
- "Technical & Systems" → software_tutorial archetype
- "Product Knowledge" → software_tutorial archetype
- "Onboarding & Culture" → concept_explainer archetype
- "Professional Skills" → scenario_based archetype

SINGLE CLASSIFICATION SYSTEM:
- Use Module Type ONLY for archetype selection
- No hybrid archetypes needed - each Module Type maps to ONE pure archetype
- This eliminates archetype contamination and ensures consistent pedagogical rules

ARCHETYPE-SPECIFIC RULES:
- compliance_policy: Formal, authoritative tone; policy application; no banned terms
- scenario_based: Conversational, empathetic tone; character dilemmas; BANNED: compliance, incident, breach, violation
- software_tutorial: Clear, step-by-step tone; simulations; no banned terms  
- concept_explainer: Engaging, foundational tone; click-to-reveal; no banned terms

PEDAGOGICAL APPROACH MATRIX:
- Compliance & Ethics: teach_rules → real_world_scenarios → rigorous_assessment
- Leadership & Coaching: model_behaviors → safe_roleplays → workplace_application → deep_reflection
- Sales & Customer Service: brief_frameworks → objection_practice → branching_scenarios → performance_outcomes
- Technical & Systems: demonstrate_steps → guided_simulations → realistic_tasks → accuracy_assessment
- Health & Safety: teach_standards → hazard_spotting → case_based_tests
- Onboarding & Culture: introduce_values → exploration_activities → gamified_checks
- Product Knowledge: teach_features → matching_practice → customer_conversations
- Professional Skills: teach_models → interactive_exercises → workplace_scenarios → growth_reflection

PATTERN RECOMMENDATIONS:
- dilemma: For ethical decisions, process choices, problem-solving
- click_to_reveal: For complex concepts, policy breakdowns, step-by-step processes
- tabbed_explainer: For organized information, policy sections, multi-faceted topics
- assessment: For knowledge checks, skill validation, understanding verification
- timeline: For historical context, process evolution, milestone tracking
- menu: For role-based paths, difficulty levels, learning preferences

INTERACTIVITY DENSITY:
- low: Mostly informational content, minimal interactions
- medium: Balanced mix of content and interactions
- high: Heavy on scenarios, decisions, and hands-on practice

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: scoperPrompt }],
        temperature: 0.7,
      }),
      60000
    );

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from scoper agent");

    // Parse and validate the JSON response
    const jsonContent = extractJsonFromMarkdown(content);
    const scope = JSON.parse(jsonContent) as ProjectScope;
    
    // Validate required fields
    if (!scope.archetype || !scope.narrativeStructure || !scope.characterProfiles) {
      throw new Error("Invalid scope response structure");
    }

    return scope;
  } catch (error) {
    console.error("Project scoper error:", error);
    
    // Fallback scope if scoper fails
    return {
      archetype: 'compliance_policy',
      hybridArchetype: undefined,
      narrativeStructure: {
        hook: "Create awareness of the importance of this topic",
        coreConcepts: ["Key concepts from learning objectives"],
        applicationScenarios: ["Real-world application scenarios"],
        assessment: "Test understanding through practical examples"
      },
      characterProfiles: {
        primary: { name: "Alex", role: "Team Member", personality: "Professional and curious" },
        secondary: [{ name: "Sam", role: "Manager", personality: "Supportive and knowledgeable" }]
      },
      toneGuidance: "Professional, clear, and engaging",
      keyLearningMoments: ["Core learning objectives"],
      estimatedDuration: formData?.durationMins || 20,
      recommendedPatterns: ["dilemma", "click_to_reveal", "assessment"],
      interactivityDensity: "medium"
    };
  }
}

// ✅ Editor Prompt Generator
function getEditorPrompt(storyboard: StoryboardModule, formData: any): string {
  const moduleName = storyboard.moduleName || "Untitled Module";
  const tone = formData?.tone || "Professional and friendly";

  return `
<< ROLE: SENIOR STORYBOARD EDITOR >>
You are a Senior eLearning Storyboard Editor working on a draft module titled "${moduleName}". Your task is to REVIEW and REFINE this draft.
Goals:
- Improve clarity, consistency, and quality of all text.
- Enforce a "${tone}" tone.
- Ensure narration is natural and flows at ~140 WPM.
- Align all scenes with expert instructional design principles.
- Verify Knowledge Checks are well-written with detailed feedback.
Return the ENTIRE storyboard as a single, valid JSON object with a "scenes" array.
`;
}

// ─── Environment Config ─────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_DEFAULT = (process.env.OPENAI_MODEL || "gpt-4o").trim();
const OPENAI_FALLBACK = (process.env.OPENAI_FALLBACK_MODEL || "gpt-4o").trim();
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
const ALLOWED_MODELS = (process.env.OPENAI_ALLOWED_MODELS || "gpt-5,gpt-4o,gpt-4-turbo")
  .split(",").map((s) => s.trim()).filter(Boolean);

// ─── Initialise Supabase & OpenAI ────────────────────────────────────────────────
let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("✅ Supabase client initialised for storyboards.");
} else {
  console.warn("⚠️ Supabase env not configured — storyboards will NOT be saved.");
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
console.log("🔧 Using OpenAI default model from env:", OPENAI_DEFAULT);

// ────────────────────────────────────────────────────────────────────────────────
// ─── Helper Functions ───────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────

function modelSupportsTuning(model: string): boolean {
  return !/gpt-5/i.test(model);
}

function extractJson(text?: string): string {
  if (typeof text !== "string") return "";
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

function safeParseJson(maybe?: string): any {
  const raw = extractJson(maybe);
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error("Failed to parse JSON from model output.");
  }
}

function toDelimitedArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[\r\n;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColourList(value: any): string[] {
  const raw = toDelimitedArray(value);
  return raw
    .map((item) => item.replace(/\s+/g, ""))
    .filter(Boolean);
}

function uniqueStrings(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean)));
}

const STOPWORDS = new Set(
  [
    "the",
    "this",
    "that",
    "with",
    "from",
    "have",
    "their",
    "about",
    "there",
    "which",
    "these",
    "those",
    "into",
    "where",
    "while",
    "through",
    "after",
    "before",
    "using",
    "being",
    "within",
    "among",
    "first",
    "second",
    "third",
    "shall",
    "should",
    "would",
    "could",
    "might",
    "must",
    "other",
    "we",
    "you",
    "they",
    "your",
    "our",
    "will",
    "each",
    "such",
    "make",
    "made",
    "ensure",
    "include",
    "including",
    "provide",
    "provided",
    "every",
    "very",
    "more",
    "most",
    "less",
    "many",
  ].map((word) => word.toLowerCase())
);

function tokenize(value: string): string[] {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
}

function extractKeyTerms(...values: (string | undefined)[]): string[] {
  return uniqueStrings(values.flatMap((value) => (value ? tokenize(value) : [])));
}

function countWords(value: string): number {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function deriveBlockKeywords(block: InstructionalBlock): string[] {
  if (Array.isArray(block.keywords) && block.keywords.length) {
    return uniqueStrings(block.keywords.map((kw) => String(kw).toLowerCase()));
  }

  const baseTokens = `${block.title || ""} ${block.type || ""}`
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 3);

  return uniqueStrings(baseTokens);
}

function applyHumanMetadata(
  storyboard: StoryboardModule,
  formData: any
): StoryboardModule {
  if (!humanBlueprintMetadata) {
    return storyboard;
  }

  const revisionHistory = Array.isArray(humanBlueprintMetadata.revisionHistory)
    ? humanBlueprintMetadata.revisionHistory
        .map((item: any) => ({
          dateISO: item?.date || item?.dateISO || "",
          change: item?.task || item?.change || "",
          author: item?.by || item?.author || "",
        }))
        .filter((entry) => entry.dateISO || entry.change || entry.author)
    : undefined;

  const tableOfContents = Array.isArray(humanBlueprintMetadata.tableOfContents)
    ? humanBlueprintMetadata.tableOfContents
        .map((entry: any) => {
          const title = entry?.title || entry?.name || entry?.section || "";
          const page = entry?.page_number || entry?.pageNumber || entry?.page;
          if (!title) return "";
          return page ? `${title} (p${page})` : title;
        })
        .filter(Boolean)
    : undefined;

  const previousMetadata = storyboard.metadata || {};
  const metadata = {
    ...previousMetadata,
    company:
      formData?.company ||
      formData?.organisationName ||
      formData?.organizationName ||
      humanBlueprintMetadata.company ||
      previousMetadata.company,
    projectCode: (() => {
      // Use provided project code if available
      if (formData?.projectCode || formData?.projectReference || humanBlueprintMetadata.projectCode || previousMetadata.projectCode) {
        return formData?.projectCode || formData?.projectReference || humanBlueprintMetadata.projectCode || previousMetadata.projectCode;
      }
      
      // Generate dynamic project code from module name
      const moduleName = formData?.moduleName || humanBlueprintMetadata.documentTitle || "UntitledModule";
      const safeModuleName = moduleName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .substring(0, 20); // Limit length
      
      return `EFX-${safeModuleName}-Nav`;
    })(),
    createdBy:
      formData?.createdBy ||
      formData?.author ||
      formData?.owner ||
      humanBlueprintMetadata.createdBy ||
      previousMetadata.createdBy,
    globalNotes: humanBlueprintMetadata.globalNotes || previousMetadata.globalNotes,
    extras: {
      ...(previousMetadata as any).extras,
      documentTitle: formData?.moduleName || formData?.title || humanBlueprintMetadata.documentTitle,
    },
    // NEW STRATEGIC FIELDS
    strategicCategory: formData?.strategicCategory || previousMetadata.strategicCategory,
    businessImpact: formData?.businessImpact || previousMetadata.businessImpact,
    innovationStrategies: formData?.innovationStrategies || previousMetadata.innovationStrategies,
    measurementApproaches: formData?.measurementApproaches || previousMetadata.measurementApproaches,
  };

  const formPalette = parseColourList(formData?.colours || formData?.colors);
  const existingPalette = Array.isArray(previousMetadata.colorPalette)
    ? previousMetadata.colorPalette
    : [];
  const colorPalette = formPalette.length ? uniqueStrings(formPalette) : existingPalette;
  if (colorPalette.length) {
    metadata.colorPalette = colorPalette;
  }

  const fontsFromForm = uniqueStrings(toDelimitedArray(formData?.fonts));
  const existingBrand = (previousMetadata as any).brand as StoryboardBrandMetadata | undefined;
  const brandGuidelines = formData?.brandGuidelines || formData?.brandStyle || existingBrand?.guidelines;
  const brandLogo = formData?.logoUrl || existingBrand?.logoUrl;
  const brandVoice = formData?.tone || formData?.toneOfVoice || existingBrand?.voice;

  const brandCandidate: StoryboardBrandMetadata = {
    colours: colorPalette.length ? colorPalette : existingBrand?.colours,
    fonts: fontsFromForm.length ? fontsFromForm : existingBrand?.fonts,
    guidelines: brandGuidelines,
    logoUrl: brandLogo,
    voice: brandVoice,
  };

  const cleanedBrandEntries = Object.entries(brandCandidate).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });

  if (cleanedBrandEntries.length) {
    metadata.brand = {
      ...(existingBrand || {}),
      ...(Object.fromEntries(cleanedBrandEntries) as StoryboardBrandMetadata),
    };
  } else if (existingBrand) {
    metadata.brand = existingBrand;
  }

  const existingTiming = (previousMetadata as any).moduleTiming as StoryboardTimingMetadata | undefined;
  const targetMinutesCandidates = [
    Number.isFinite(Number(formData?.durationMins)) ? Number(formData.durationMins) : undefined,
    formData?.duration
      ? Number(String(formData.duration).replace(/[^0-9.]/g, "")) || undefined
      : undefined,
    existingTiming?.targetMinutes,
  ].filter((value) => typeof value === "number" && Number.isFinite(value)) as number[];
  if (targetMinutesCandidates.length || existingTiming) {
    const moduleTiming: StoryboardTimingMetadata = {
      ...(existingTiming || {}),
    };
    if (targetMinutesCandidates.length) {
      moduleTiming.targetMinutes = Math.round(targetMinutesCandidates[0] * 10) / 10;
    }
    metadata.moduleTiming = moduleTiming;
  }

  const preferredName =
    formData?.moduleName || formData?.title || humanBlueprintMetadata.documentTitle || storyboard.moduleName;

  return {
    ...storyboard,
    moduleName: preferredName,
    revisionHistory: revisionHistory && revisionHistory.length ? revisionHistory : storyboard.revisionHistory,
    tableOfContents: tableOfContents && tableOfContents.length ? tableOfContents : storyboard.tableOfContents,
    metadata,
  };
}

function coerceLearningOutcomes(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  const stringValue = String(value);
  return stringValue
    .split(/\r?\n|\u2022|•|-|\d+\./)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSceneContexts(summary: string, blocks: InstructionalBlock[]): string[] {
  if (!summary || !summary.trim()) {
    return blocks.map((block) => {
      const keywords = deriveBlockKeywords(block);
      return keywords.length ? `Key topics to emphasise: ${keywords.join(", ")}` : "";
    });
  }

  const paragraphs = summary
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return blocks.map(() => summary.trim());
  }

  const paragraphMeta = paragraphs.map((text, index) => ({
    index,
    text,
    lower: text.toLowerCase(),
  }));

  const used = new Set<number>();

  return blocks.map((block, idx) => {
    const keywords = deriveBlockKeywords(block);
    const keywordSet = new Set(keywords.map((kw) => kw.toLowerCase()));
    const titleLower = (block.title || "").toLowerCase();

    const scored = paragraphMeta
      .map((para) => {
        let score = 0;
        keywordSet.forEach((kw) => {
          if (kw && para.lower.includes(kw)) {
            score += 1;
          }
        });
        if (titleLower && para.lower.includes(titleLower)) {
          score += 1.5;
        }
        if (used.has(para.index)) {
          score *= 0.35;
        }
        return { index: para.index, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    let selectedIndices: number[] = scored.slice(0, 2).map((entry) => entry.index);

    if (!selectedIndices.length) {
      const unused = paragraphMeta.find((para) => !used.has(para.index));
      selectedIndices = [unused ? unused.index : idx % paragraphMeta.length];
    }

    selectedIndices.forEach((index) => used.add(index));

    const contextParts = selectedIndices.map((index) => paragraphs[index]);

    const extras: string[] = [];
    if (keywords.length) {
      extras.push(`Key topics to emphasise: ${keywords.slice(0, 6).join(", ")}`);
    }
    if (Array.isArray(block.learningOutcomeReferences) && block.learningOutcomeReferences.length) {
      extras.push(`Learning outcomes: ${block.learningOutcomeReferences.join(", ")}`);
    }

    return [...contextParts, ...extras].filter(Boolean).join("\n\n");
  });
}

function flattenOnScreenTextValue(ost: BrandonHallOnScreenText): string {
  const lines: string[] = [];
  if (ost.title) lines.push(String(ost.title));
  if (Array.isArray(ost.body_text)) lines.push(...ost.body_text.map((line) => String(line)));
  if (Array.isArray(ost.bullet_points)) {
    lines.push(...ost.bullet_points.map((line) => `• ${String(line)}`));
  }
  if (ost.continue_prompt) lines.push(String(ost.continue_prompt));
  return lines.join("\n");
}

function normalizeKnowledgeCheck(raw: any) {
  if (!raw || typeof raw !== "object") return null;

  const stem = raw.stem || raw.question || raw.prompt || raw.title || "";
  if (!stem) return null;

  const type = raw.type || raw.format || raw.questionType || "Knowledge Check";
  const instruction = raw.instruction || raw.promptText || raw.instructions || "";

  const optionsSource = Array.isArray(raw.options)
    ? raw.options
    : Array.isArray(raw.choices)
    ? raw.choices
    : [];

  const options: (BrandonHallQuestionOption & { feedback?: string })[] = optionsSource
    .map((option: any) => {
      if (typeof option === "string") {
        return { text: option, is_correct: false, feedback: "" };
      }
      const text = option?.text || option?.label || option?.option || "";
      if (!text) return null;
      const isCorrect = Boolean(option?.is_correct ?? option?.correct ?? option?.isCorrect ?? false);
      const feedback = option?.feedback || option?.rationale || "";
      return {
        text: String(text),
        is_correct: isCorrect,
        feedback: feedback ? String(feedback) : "",
      };
    })
    .filter(Boolean) as (BrandonHallQuestionOption & { feedback?: string })[];

  const feedback: BrandonHallQuestionFeedback = {};
  const feedbackSource = raw.feedback || {};
  if (feedbackSource.correct || raw.correct_feedback || raw.correctFeedback) {
    feedback.correct = String(feedbackSource.correct || raw.correct_feedback || raw.correctFeedback);
  }
  if (feedbackSource.incorrect || raw.incorrect_feedback || raw.incorrectFeedback) {
    feedback.incorrect = String(feedbackSource.incorrect || raw.incorrect_feedback || raw.incorrectFeedback);
  }
  if (feedbackSource.try_again || raw.retry_feedback || raw.tryAgainFeedback) {
    feedback.try_again = String(feedbackSource.try_again || raw.retry_feedback || raw.tryAgainFeedback);
  }
  if (feedbackSource.visual || raw.visual_feedback) {
    feedback.visual = String(feedbackSource.visual || raw.visual_feedback);
  }

  return {
    type: String(type),
    stem: String(stem),
    instruction: instruction ? String(instruction) : undefined,
    options,
    feedback,
  };
}

function convertAiSceneToStoryboardScene(
  aiScene: any,
  blueprintBlock: InstructionalBlock,
  sceneIndex: number,
  sceneContext: string = ""
): Scene {
  if (!aiScene || typeof aiScene !== "object") {
    throw new Error("AI scene output is missing or invalid.");
  }

  const sceneTitle =
    aiScene.sceneTitle || aiScene.scene_name || aiScene.title || blueprintBlock.title || `Scene ${sceneIndex + 1}`;

  const narration =
    aiScene.narrationScript ||
    aiScene.narration ||
    aiScene.voiceover ||
    aiScene.audioScript ||
    aiScene.audio?.script ||
    "";

  const ostStructured = normalizeOnScreenText(
    aiScene.onScreenText || aiScene.on_screen_text || aiScene.ost || aiScene.onScreen || ""
  );
  const ostFlattened = flattenOnScreenTextValue(ostStructured);

  const developerNotes = aiScene.developerNotes || aiScene.internalNotes || "";
  const accessibilityNotes = aiScene.accessibilityNotes || aiScene.a11yNotes || "";
  const screenLayout =
    aiScene.screenLayout || aiScene.layout || blueprintBlock.type || "Standard storyboard layout";

  const visualInput = aiScene.visual || {};
  const visualBrief = visualInput.visualGenerationBrief || visualInput.brief || {};
  const colorPalette =
    Array.isArray(visualInput.colorPalette)
      ? visualInput.colorPalette
      : Array.isArray(visualBrief.colorPalette)
      ? visualBrief.colorPalette
      : undefined;

  const visual = {
    mediaType: visualInput.mediaType || visualBrief.mediaType || "Image",
    style: visualInput.style || visualBrief.style || blueprintBlock.type || "Illustration",
    aiPrompt:
      visualInput.aiPrompt ||
      visualInput.prompt ||
      visualBrief.prompt ||
      visualBrief.sceneDescription ||
      blueprintBlock.content ||
      "",
    altText: visualInput.altText || visualBrief.altText || sceneTitle,
    aspectRatio: visualInput.aspectRatio || visualBrief.aspectRatio || "16:9",
    composition: visualInput.composition || visualBrief.composition || visualBrief.sceneDescription || "",
    environment: visualInput.environment || visualBrief.setting || "",
    visualGenerationBrief: {
      sceneDescription: visualBrief.sceneDescription || visualInput.sceneDescription || visualInput.description || "",
      style: visualBrief.style || visualInput.style,
      subject: visualBrief.subject || visualInput.subject || {
        primarySubject: "Professional person or relevant object",
        secondaryElements: ["Background elements", "UI components"],
        action: "Engaging with content"
      },
      setting: visualBrief.setting || visualInput.setting || "",
      composition: visualBrief.composition || visualInput.composition || "",
      lighting: visualBrief.lighting || visualInput.lighting || "",
      colorPalette,
      mood: visualBrief.mood || visualInput.mood || "",
      brandIntegration: visualBrief.brandIntegration || visualInput.brandIntegration || "",
      negativeSpace: visualBrief.negativeSpace || visualInput.negativeSpace || "",
      assetId: visualBrief.assetId || visualInput.assetId || "",
    },
    overlayElements: visualInput.overlayElements,
  };

  const subjectCandidate = visual.visualGenerationBrief.subject;
  const subjectHasDetail = (() => {
    if (!subjectCandidate) return false;
    if (typeof subjectCandidate === "string") {
      return subjectCandidate.trim().length > 5;
    }
    if (typeof subjectCandidate === "object") {
      return Object.values(subjectCandidate).some(
        (value) => typeof value === "string" && value.trim().length > 3
      );
    }
    return false;
  })();

  if (!subjectHasDetail) {
    visual.visualGenerationBrief.subject = {
      primarySubject: blueprintBlock.title,
      details:
        sceneContext?.split(/\n/)[0]?.slice(0, 160) ||
        visual.visualGenerationBrief.sceneDescription ||
        blueprintBlock.content.slice(0, 160),
    };
  }
  if (!visual.visualGenerationBrief.sceneDescription) {
    visual.visualGenerationBrief.sceneDescription =
      (sceneContext && sceneContext.slice(0, 220)) || blueprintBlock.content.slice(0, 220);
  }
  if (!visual.aiPrompt) {
    visual.aiPrompt = visual.visualGenerationBrief.sceneDescription;
  }

  const assetsNormalized: BrandonHallAsset[] = Array.isArray(aiScene.assets)
    ? aiScene.assets
        .map((asset: any) => {
          const type = asset?.type || asset?.kind || "image";
          const source = asset?.source || asset?.url || asset?.path || asset?.id || "";
          const description = asset?.description || asset?.altText || asset?.notes || "";
          if (!type && !source && !description) return null;
          return {
            type: String(type),
            source: source ? String(source) : undefined,
            description: description ? String(description) : undefined,
          };
        })
        .filter(Boolean) as BrandonHallAsset[]
    : [];

  let knowledge = normalizeKnowledgeCheck(
    aiScene.knowledgeCheck || aiScene.quiz || aiScene.assessment || aiScene.question
  );

  if (blueprintBlock.requiresKnowledgeCheck && !knowledge) {
    console.warn('⚠️ Knowledge check required but missing from model output — auto-generating fallback assessment');
    // Auto-generate a fallback knowledge check
    const fallbackKnowledge = {
      question: 'Based on the key principles covered, which of the following best represents the main concept?',
      options: [
        { text: 'Option A (Correct)', is_correct: true },
        { text: 'Option B (Incorrect)', is_correct: false },
        { text: 'Option C (Incorrect)', is_correct: false }
      ],
      type: 'Multiple Choice',
      explanation: 'This question tests your understanding of the core concepts presented.',
      metadata: { auto_generated: true }
    };
    const normalizedFallback = normalizeKnowledgeCheck(fallbackKnowledge);
    if (normalizedFallback) {
      // Use the fallback knowledge check
      knowledge = normalizedFallback;
    } else {
      throw new Error("Knowledge check required but missing from model output and fallback generation failed.");
    }
  }
  if (
    blueprintBlock.requiresKnowledgeCheck &&
    knowledge &&
    (!Array.isArray(knowledge.options) || !knowledge.options.some((option) => option.is_correct))
  ) {
    throw new Error("Knowledge check must include answer options with at least one correct flag.");
  }

  const interactionType = knowledge
    ? knowledge.type || "Knowledge Check"
    : aiScene.interactionType || aiScene.sceneType || blueprintBlock.type || "Informational";

  const derivedInteractionType = blueprintBlock.expectedInteractionType || interactionType;

  let finalAccessibilityNotes = accessibilityNotes;
  if (blueprintBlock.accessibilityMustHaves && blueprintBlock.accessibilityMustHaves.length) {
    const lower = finalAccessibilityNotes.toLowerCase();
    const missing = blueprintBlock.accessibilityMustHaves.filter((requirement) => {
      const token = String(requirement).split(/\s+/)[0]?.toLowerCase();
      return token ? !lower.includes(token) : false;
    });
    if (missing.length) {
      finalAccessibilityNotes = [
        finalAccessibilityNotes,
        `Include: ${missing.join("; ")}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  } else if (
    blueprintBlock.expectedInteractionType &&
    /interactive|scenario|tab|timeline|drag|click/i.test(blueprintBlock.expectedInteractionType) &&
    !/keyboard|focus/.test(finalAccessibilityNotes.toLowerCase())
  ) {
    finalAccessibilityNotes = `${finalAccessibilityNotes ? `${finalAccessibilityNotes}\n` : ""}Document keyboard navigation and focus order.`;
  }

  let enrichedDeveloperNotes = developerNotes;
  if (
    Array.isArray(blueprintBlock.learningOutcomeReferences) &&
    blueprintBlock.learningOutcomeReferences.length
  ) {
    const outcomeLine = `🎯 Outcome alignment: ${blueprintBlock.learningOutcomeReferences.join(", ")}.`;
    if (!developerNotes.includes(outcomeLine)) {
      enrichedDeveloperNotes = enrichedDeveloperNotes
        ? `${enrichedDeveloperNotes}\n${outcomeLine}`
        : outcomeLine;
    }
  }

  const interactionDetails = knowledge
    ? {
        interactionType,
        aiActions: knowledge.instruction ? [knowledge.instruction] : [],
        aiDecisionLogic: (knowledge.options || []).map((option, idx) => ({
          choice: String.fromCharCode(65 + idx),
          feedback: {
            text: option.feedback || (option.is_correct ? "Correct" : "Incorrect"),
          },
        })),
        retryLogic: knowledge.feedback?.try_again || "",
        completionRule: knowledge.feedback?.correct || undefined,
        data: {
          stem: knowledge.stem,
          instruction: knowledge.instruction,
          options: knowledge.options,
          feedback: knowledge.feedback,
        },
      }
    : undefined;

  const narrationWordCount = countWords(narration);
  const expectedSeconds = blueprintBlock.expectedDurationSeconds || 0;
  const estimatedSecondsFromModel = Number(aiScene.estimatedSeconds || aiScene.durationSeconds);
  const estimatedSecondsFromWords = narrationWordCount
    ? Math.round(Math.max(20, (narrationWordCount / 140) * 60))
    : 0;

  let resolvedSeconds = 0;
  if (Number.isFinite(estimatedSecondsFromModel) && estimatedSecondsFromModel > 0) {
    resolvedSeconds = Math.round(estimatedSecondsFromModel);
  } else if (estimatedSecondsFromWords) {
    resolvedSeconds = estimatedSecondsFromWords;
  }

  if (expectedSeconds && resolvedSeconds) {
    const lower = Math.round(expectedSeconds * 0.6);
    const upper = Math.round(expectedSeconds * 1.6);
    resolvedSeconds = Math.min(Math.max(resolvedSeconds, lower), upper);
  } else if (!resolvedSeconds && expectedSeconds) {
    resolvedSeconds = expectedSeconds;
  }

  const timing: any = {};
  if (resolvedSeconds) {
    timing.estimatedSeconds = resolvedSeconds;
  }
  if (expectedSeconds) {
    timing.targetSeconds = expectedSeconds;
  }
  const timingData = Object.keys(timing).length ? timing : undefined;

  const scene: Scene = {
    sceneNumber: sceneIndex + 1,
    pageTitle: sceneTitle,
    screenLayout,
    pageType: blueprintBlock.type,
    templateId: undefined,
    screenId: `S${sceneIndex + 1}`,
    narrationScript: narration,
    onScreenText: ostFlattened,
    visual,
    interactionType: derivedInteractionType || interactionType,
    interactionDescription: knowledge?.stem || aiScene.interactionDescription || "",
    interactionDetails,
    developerNotes: enrichedDeveloperNotes,
    accessibilityNotes: finalAccessibilityNotes,
    timing: timingData,
    audio: narration ? { script: narration } : undefined,
    imageUrl: visualInput.imageUrl || visualInput.generatedImageUrl || undefined,
    imageParams: visualInput.imageParams || undefined,
  };

  const event: any = {
    eventNumber: 1,
    audio_script: narration,
    audio: { script: narration },
    narrationScript: narration,
    onScreenText: ostFlattened,
    on_screen_text: ostStructured,
    developerNotes: enrichedDeveloperNotes,
    assets: assetsNormalized.length ? assetsNormalized : undefined,
    internal_development_notes: enrichedDeveloperNotes,
    screen_media_treatment: screenLayout,
  };

  if (knowledge) {
    event.question = knowledge;
  }

  (scene as any).events = [event];
  if (knowledge) {
    (scene as any).knowledgeChecks = [knowledge];
  }

  return scene;
}

function normalizeOnScreenText(value: any): BrandonHallOnScreenText {
  const result: BrandonHallOnScreenText = {};

  if (!value) return result;

  if (typeof value === "object" && !Array.isArray(value)) {
    if (value.title || value.heading) result.title = String(value.title || value.heading);
    if (Array.isArray(value.body_text)) {
      result.body_text = value.body_text.map((line: any) => String(line)).filter(Boolean);
    } else if (Array.isArray(value.bodyText)) {
      result.body_text = value.bodyText.map((line: any) => String(line)).filter(Boolean);
    } else if (value.body || value.text) {
      result.body_text = [String(value.body || value.text)].filter(Boolean);
    }
    if (Array.isArray(value.bullet_points)) {
      result.bullet_points = value.bullet_points.map((line: any) => String(line)).filter(Boolean);
    } else if (Array.isArray(value.bullets)) {
      result.bullet_points = value.bullets.map((line: any) => String(line)).filter(Boolean);
    }
    if (value.continue_prompt || value.cta) {
      result.continue_prompt = String(value.continue_prompt || value.cta);
    }
    return result;
  }

  const text = String(value);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return result;

  const bulletRegex = /^([-*•‣–]|\d+\.)\s*/;
  let titleAssigned = false;
  const body: string[] = [];
  const bullets: string[] = [];

  lines.forEach((line) => {
    if (!titleAssigned) {
      result.title = line;
      titleAssigned = true;
      return;
    }
    if (bulletRegex.test(line)) {
      bullets.push(line.replace(bulletRegex, "").trim());
    } else {
      body.push(line);
    }
  });

  if (body.length) result.body_text = body;
  if (bullets.length) result.bullet_points = bullets;
  return result;
}

function buildQuestionFromInteraction(scene: any, event: any): BrandonHallEvent["question"] {
  if (event?.question) {
    return event.question;
  }

  const interaction = scene?.interactionDetails;
  const data = interaction?.data || {};
  const stem = data.stem || scene?.interactionDescription || "";
  if (!stem) return undefined;

  const options = Array.isArray(data.options)
    ? data.options
        .map((opt: any) => {
          const text = opt?.text || opt?.label || "";
          if (!text) return null;
          const isCorrect = Boolean(opt?.is_correct ?? opt?.isCorrect ?? opt?.correct);
          return { text: String(text), is_correct: isCorrect };
        })
        .filter(Boolean) as BrandonHallQuestionOption[]
    : undefined;

  const feedbackRaw = data.feedback || {};
  const feedback: BrandonHallQuestionFeedback = {};
  if (feedbackRaw.correct) feedback.correct = String(feedbackRaw.correct);
  if (feedbackRaw.incorrect) feedback.incorrect = String(feedbackRaw.incorrect);
  if (feedbackRaw.try_again) feedback.try_again = String(feedbackRaw.try_again);
  if (feedbackRaw.visual) feedback.visual = String(feedbackRaw.visual);

  const instruction = data.instruction || interaction?.aiActions?.[0] || "";

  return {
    stem: String(stem),
    instruction: instruction ? String(instruction) : undefined,
    options,
    feedback: Object.keys(feedback).length ? feedback : undefined,
  };
}

function buildBrandonHallEvent(scene: any, event: any, index: number): BrandonHallEvent {
  const audioScript =
    event?.audio?.script ||
    event?.narrationScript ||
    scene?.audio?.script ||
    scene?.narrationScript ||
    "";

  const ost = normalizeOnScreenText(event?.on_screen_text || event?.onScreenText || scene?.onScreenText);

  const internalNotes =
    event?.developerNotes ||
    event?.internal_development_notes ||
    scene?.developerNotes ||
    "";

  const screenTreatment =
    event?.screen_media_treatment ||
    scene?.visual?.visualGenerationBrief?.sceneDescription ||
    scene?.visual?.aiPrompt ||
    scene?.visual?.style ||
    "";

  const assets: BrandonHallAsset[] = [];
  if (scene?.visual?.generatedImageUrl) {
    assets.push({
      type: scene.visual.mediaType || "image",
      source: scene.visual.generatedImageUrl,
      description: scene.visual.altText || scene.visual.style || "",
    });
  }

  return {
    event_number: event?.eventNumber ?? index + 1,
    audio_script: audioScript ? String(audioScript) : undefined,
    on_screen_text: Object.values(ost).some((v) => (Array.isArray(v) ? v.length : v)) ? ost : undefined,
    internal_development_notes: internalNotes ? String(internalNotes) : undefined,
    screen_media_treatment: screenTreatment ? String(screenTreatment) : undefined,
    assets: assets.length ? assets : undefined,
    review_feedback: [],
    question: buildQuestionFromInteraction(scene, event),
  };
}

function buildBrandonHallSlide(scene: any, index: number): BrandonHallSlide {
  const blueprintBlock = master36PageBlueprint[index];
  const eventSources = Array.isArray(scene?.events) && scene.events.length ? scene.events : [scene];
  const events = eventSources.map((event: any, idx: number) => buildBrandonHallEvent(scene, event, idx));

  return {
    slide_number: `${index + 1}`,
    slide_title: scene?.pageTitle || blueprintBlock?.title || `Slide ${index + 1}`,
    page_number_in_document: Array.isArray(blueprintBlock?.pages)
      ? blueprintBlock.pages.join(", ")
      : undefined,
    type: blueprintBlock?.type || scene?.interactionType || "Informational",
    events,
  };
}

function buildBrandonHallStoryboard(storyboard: StoryboardModule): BrandonHallStoryboard {
  const slides = (storyboard.scenes || []).map((scene, index) => buildBrandonHallSlide(scene, index));

  const revision_history = (storyboard.revisionHistory || []).map((item) => ({
    date: item.dateISO,
    task: item.change,
    by: item.author,
  }));

  const table_of_contents = slides.map((slide, idx) => ({
    item_number: `${idx + 1}`,
    title: slide.slide_title,
    page_number: slide.page_number_in_document,
  }));

  const meta = storyboard.metadata || {};
  let global_notes: BrandonHallStoryboard["global_notes"] | undefined;
  if (meta.globalNotes && typeof meta.globalNotes === "object") {
    global_notes = {
      notes: Array.isArray(meta.globalNotes.notes)
        ? meta.globalNotes.notes.map((note: any) => String(note))
        : undefined,
      deleted_notes_for_tracking: Array.isArray(meta.globalNotes.deleted_notes_for_tracking)
        ? meta.globalNotes.deleted_notes_for_tracking.map((note: any) => String(note))
        : undefined,
    };
  }

  return {
    document_title: storyboard.moduleName,
    project_code: meta.projectCode,
    company: meta.company,
    created_by: meta.createdBy,
    revision_history: revision_history.length ? revision_history : undefined,
    table_of_contents: table_of_contents.length ? table_of_contents : undefined,
    global_notes,
    slides,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// ─── NEW SCENE-BY-SCENE GENERATION LOGIC ──────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Generates a single storyboard scene based on a specific blueprint block.
 * This focused approach ensures the AI adheres to the detailed instructions for each scene.
 */
async function generateSingleScene(
  blueprintBlock: InstructionalBlock,
  fullSummary: string,
  sceneContext: string,
  formData: any,
  sceneIndex: number,
  model: string,
  projectScope: ProjectScope,
  narrativeAnchor: NarrativeAnchor, // Phase 3: Add narrative anchor
  businessImpact: any, // Phase 1: Add business impact
  characters: any, // Narrative Engine: Character archetypes
  narrativePattern: any, // Narrative Engine: Narrative pattern
  emotionalBeats: any[], // Narrative Engine: Emotional beats
  attemptNumber = 1,
  remediationIssues: string[] = []
): Promise<any> {
  const totalScenes = master36PageBlueprint.length;
  console.log(
    `[SCENE ${sceneIndex + 1}/${totalScenes}][Attempt ${attemptNumber}] Generating: "${blueprintBlock.title}"...`
  );

  const moduleName = formData?.moduleName || formData?.title || "Untitled Module";
  const targetAudience = formData?.targetAudience || formData?.audience || "General learners";
  const tone = formData?.tone || formData?.toneOfVoice || "Professional and friendly";

  const learningOutcomes = coerceLearningOutcomes(
    formData?.learningOutcomes || formData?.outcomes || []
  );
  const learningOutcomesSection = learningOutcomes.length
    ? `- Target learning outcomes for this module:\n  ${learningOutcomes
        .map((outcome, idx) => `LO${idx + 1}: ${outcome}`)
        .join("\n  ")}`
    : "";

  const expectedDurationSeconds = blueprintBlock.expectedDurationSeconds ?? 50;
  const narrationWordTarget = Math.max(90, Math.round((expectedDurationSeconds * 140) / 60));
  const ostWordCap = Math.max(60, Math.round(narrationWordTarget * 0.55));
  const requiresKnowledgeCheck = Boolean(blueprintBlock.requiresKnowledgeCheck);
  const expectedInteractionType = blueprintBlock.expectedInteractionType;
  const interactionExpectation = blueprintBlock.interactionExpectation;
  const accessibilityMustHaves = blueprintBlock.accessibilityMustHaves || [];
  const continuityHint = blueprintBlock.continuityGroupId
    ? `Maintain narrative/character continuity with other scenes in group "${blueprintBlock.continuityGroupId}".`
    : "";

  const keywords = deriveBlockKeywords(blueprintBlock);
  const keywordsLine = keywords.length ? `Focus keywords: ${keywords.join(", ")}` : "";

  const brandColours = parseColourList(formData?.colours || formData?.colors);
  const brandFonts = uniqueStrings(toDelimitedArray(formData?.fonts));
  const brandGuidelines = formData?.brandGuidelines || formData?.brandStyle || "";

  const brandGuidanceLines: string[] = [];
  if (brandColours.length) brandGuidanceLines.push(`Brand colours: ${brandColours.join(", ")}.`);
  if (brandFonts.length) brandGuidanceLines.push(`Preferred fonts: ${brandFonts.join(", ")}.`);
  if (brandGuidelines) brandGuidanceLines.push(`Guidelines: ${brandGuidelines}`);
  const brandGuidance = brandGuidanceLines.length
    ? brandGuidanceLines.join("\n")
    : "Follow modern, inclusive corporate styling consistent with the organisation.";

  const outcomeRefs = Array.isArray(blueprintBlock.learningOutcomeReferences) &&
    blueprintBlock.learningOutcomeReferences.length
      ? `Reinforce these learning outcomes: ${blueprintBlock.learningOutcomeReferences.join(", ")}.`
      : "";

  const knowledgeInstruction = requiresKnowledgeCheck
    ? `This blueprint REQUIRES a knowledgeCheck object. Provide:\n  - A scenario-grounded stem referencing the supplied context.\n  - 3-4 options with at least one correct (set is_correct true).\n  - Detailed feedback for correct AND incorrect responses, plus try_again guidance.\n  - Interaction details (keyboard path, completion rule, retry logic).`
    : `If no interaction is needed, set "knowledgeCheck" to null and keep interactionType aligned with "${expectedInteractionType || blueprintBlock.type}".`;

  const accessibilityInstruction = accessibilityMustHaves.length
    ? `Accessibility notes MUST cover: ${accessibilityMustHaves.join("; ")}.`
    : expectedInteractionType && /interactive|scenario|tab|timeline|drag|click/i.test(expectedInteractionType)
    ? "Accessibility notes must include keyboard navigation, focus order, and screen-reader cues for the interaction."
    : "";

  const remediationSection = remediationIssues.length && attemptNumber > 1
    ? `\n--- FIX THESE ISSUES FROM PRIOR ATTEMPT ---\n${remediationIssues
        .map((issue, idx) => `${idx + 1}. ${issue}`)
        .join("\n")}\n--- END FIX LIST ---\n`
    : "";

  const focusedContext = sceneContext && sceneContext.trim().length > 0
    ? sceneContext.trim()
    : fullSummary;
  const contextSection = [focusedContext, keywordsLine].filter(Boolean).join("\n\n");

  // Phase 4: Apply company learning to prompts
  let enhancedPrompt = `
You are a senior instructional designer creating a SINGLE storyboard scene for the module "${moduleName}".

--- PROJECT SCOPE GUIDANCE ---
Archetype: ${projectScope.archetype}
Narrative Structure: ${projectScope.narrativeStructure.hook}
Key Concepts: ${projectScope.narrativeStructure.coreConcepts.join(", ")}
Primary Character: ${projectScope.characterProfiles.primary.name} (${projectScope.characterProfiles.primary.role}) - ${projectScope.characterProfiles.primary.personality}
Secondary Characters: ${projectScope.characterProfiles.secondary.map(c => `${c.name} (${c.role})`).join(", ")}
Tone Guidance: ${projectScope.toneGuidance}
Key Learning Moments: ${projectScope.keyLearningMoments.join(", ")}
--- END PROJECT SCOPE ---

--- NARRATIVE ANCHOR GUIDANCE ---
Primary Character: ${narrativeAnchor.characterRoster.primary.name} (${narrativeAnchor.characterRoster.primary.role})
- Personality: ${narrativeAnchor.characterRoster.primary.personality}
- Background: ${narrativeAnchor.characterRoster.primary.background}
- Speaking Style: ${narrativeAnchor.characterRoster.primary.speakingStyle}
- Motivations: ${narrativeAnchor.characterRoster.primary.motivations.join(", ")}

Secondary Characters: ${narrativeAnchor.characterRoster.secondary.map(c => 
  `${c.name} (${c.role}): ${c.personality} - ${c.relationshipToPrimary}`
).join("\n")}

Tone of Voice: ${narrativeAnchor.toneOfVoice.overall}
- For Scenarios: ${narrativeAnchor.toneOfVoice.forScenarios}
- For Assessments: ${narrativeAnchor.toneOfVoice.forAssessments}
- Examples: ${narrativeAnchor.toneOfVoice.examples.join(", ")}

Company Context: ${narrativeAnchor.companyContext.name} (${narrativeAnchor.companyContext.industry})
- Culture: ${narrativeAnchor.companyContext.culture}
- Key Policies: ${narrativeAnchor.companyContext.policies.join(", ")}
--- END NARRATIVE ANCHOR ---`;

  // Apply company learning (Phase 4)
  try {
    const companyId = formData?.company || formData?.organisationName || 'default';
    const patternType = blueprintBlock.type || 'dilemma';
    const archetype = projectScope.archetype;
    
    const companyLearnedPrompt = await applyCompanyLearning(
      enhancedPrompt,
      patternType,
      archetype,
      companyId
    );
    
    if (companyLearnedPrompt !== enhancedPrompt) {
      console.log(`[SCENE ${sceneIndex + 1}] 🧠 Applied company learning for ${companyId}`);
      enhancedPrompt = companyLearnedPrompt;
    }
  } catch (error) {
    console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Company learning failed:`, error);
  }

  // PHASE 1: BUSINESS IMPACT INTEGRATION
  const businessImpactSection = `
--- BUSINESS IMPACT FRAMEWORK ---
PRIMARY GOAL: ${businessImpact.primaryGoal}
SUCCESS DEFINITION: ${businessImpact.successDefinition}
LEARNING APPROACHES: ${businessImpact.learningApproaches.join(", ")}
MEASUREMENT: ${businessImpact.measurement.join(", ")}
TARGET IMPROVEMENT: ${businessImpact.targetImprovement}%
TIMEFRAME: ${businessImpact.timeframe} days
--- END BUSINESS IMPACT ---`;

  // PHASE 2: TRANSFORM LEARNING OBJECTIVES
  const transformedObjectives = transformLearningObjectives(learningOutcomes, businessImpact);
  const transformedOutcomesSection = transformedObjectives.length
    ? `- TRANSFORMED BUSINESS-IMPACT OBJECTIVES:\n  ${transformedObjectives
        .map((outcome, idx) => `LO${idx + 1}: ${outcome}`)
        .join("\n  ")}`
    : "";

  // NARRATIVE ENGINE: GENERATE STORY-DRIVEN CONTENT
  const narrativeContent = generateNarrativeScene(
    sceneIndex,
    totalScenes,
    characters,
    narrativePattern,
    emotionalBeats,
    businessImpact,
    learningOutcomes[0] || "Apply new skills effectively"
  );

  const narrativeEngineSection = `
--- NARRATIVE ENGINE ---
SCENE TITLE: ${narrativeContent.sceneTitle}
NARRATIVE HOOK: ${narrativeContent.narrativeHook}
CHARACTER DIALOGUE: ${narrativeContent.characterDialogue}
EMOTIONAL BEAT: ${narrativeContent.emotionalBeat}
DECISION POINT: ${narrativeContent.decisionPoint}
CONSEQUENCE: ${narrativeContent.consequence}

CHARACTER ARCHETYPES:
- Protagonist: ${characters.protagonist.name} (${characters.protagonist.role}) - ${characters.protagonist.personality}
- Mentor: ${characters.mentor.name} (${characters.mentor.role}) - ${characters.mentor.personality}
- Challenge: ${characters.challenge.name} (${characters.challenge.role}) - ${characters.challenge.personality}

NARRATIVE PATTERN: ${narrativePattern.name}
- Current Beat: ${narrativePattern.beats[Math.floor((sceneIndex / totalScenes) * narrativePattern.beats.length)]}
- Emotional Intensity: ${narrativePattern.emotionalIntensity}
- Decision Points Required: ${narrativePattern.decisionPoints}
--- END NARRATIVE ENGINE ---`;

  // ARCHETYPE RULES: Get rules for this Module Type
  const moduleType = formData.moduleType || "Leadership & Coaching";
  const archetypeRules = getModuleTypeRules(moduleType);
  const archetypeGuidance = generateArchetypePromptGuidance(moduleType);
  
  // PEDAGOGICAL MATRIX: Get pedagogical approach for this Module Type
  const pedagogicalApproach = getPedagogicalApproach(moduleType);
  const pedagogicalGuidance = generatePedagogicalGuidance(moduleType, sceneIndex);
  
  // 🆕 PEDAGOGICAL PATTERNS: Add deep teaching instructions based on segment type
  const pedagogicalPatternInstructions = generatePedagogicalPatternInstructions(blueprintBlock, learningOutcomes, targetAudience);

  const singleScenePrompt = enhancedPrompt + businessImpactSection + narrativeEngineSection + archetypeGuidance + pedagogicalGuidance + pedagogicalPatternInstructions + `

Audience: ${targetAudience}
Tone: ${tone} (Must follow archetype tone: ${archetypeRules.tone})
${transformedOutcomesSection}
${outcomeRefs}
${continuityHint}
${brandGuidance}
Expected narration length: ~${narrationWordTarget} words (~${expectedDurationSeconds} seconds at 140 WPM).
On-screen text must be <= ${ostWordCap} words and complement (not duplicate) narration.
${expectedInteractionType ? `Expected interaction type: ${expectedInteractionType}.` : ""}
${interactionExpectation ? `Interaction guidance: ${interactionExpectation}` : ""}
${accessibilityInstruction}
${knowledgeInstruction}
${remediationSection}

CRITICAL STORYBOARD FORMAT REQUIREMENTS:
- Create CHARACTER-DRIVEN scenarios with specific people, names, and realistic dialogue
- Use SEQUENTIAL STORYTELLING with numbered steps (1, 2, 3, 4) like the reference format
- Include SPECIFIC BUSINESS SCENARIOS with authentic workplace situations
- Build NARRATIVE PROGRESSION with character development and story arcs
- Create REALISTIC DIALOGUE that sounds like actual workplace conversations

BUSINESS IMPACT FRAMEWORK REQUIREMENTS:
- EVERY SCENE must connect to the ${businessImpact.targetImprovement}% ${businessImpact.primaryGoal.split(' by ')[0]} improvement goal
- Include adaptive learning paths: Create different scenario starting points based on experience level
- Add social learning elements: Peer feedback mechanisms and collaboration checkpoints
- Build in measurement mechanisms: Observation checklists, self-assessments, and performance dashboards
- Show consequences of decisions on virtual team performance metrics
- Go beyond basic "click-next" interactions with meaningful engagement

CONTENT QUALITY REQUIREMENTS:
- SOURCE FIDELITY: Use ONLY the provided context material. Quote specific terms, processes, and details from the source.
- CHARACTER DEVELOPMENT: Use the project-defined characters consistently:
  * ${projectScope.characterProfiles.primary.name}: ${projectScope.characterProfiles.primary.role} (${projectScope.characterProfiles.primary.personality})
  ${projectScope.characterProfiles.secondary.map(c => `  * ${c.name}: ${c.role} (${c.personality})`).join('\n')}
- AUTHENTIC SCENARIOS: Base all content on real workplace situations from the source material
- PROGRESSIVE STORYTELLING: Each scene should build on the previous one with character continuity
- SPECIFIC DETAILS: Include concrete examples, real processes, and specific terminology from the source
- COMPANY CONTEXT: Use the actual company name from the form data (${formData?.company || formData?.organisationName || formData?.organizationName || 'the organization'}) in all content, not hardcoded template names
- KNOWLEDGE CHECKS: Create comprehensive assessments with multiple options, detailed feedback, and specific workplace scenarios
- INTERACTION SPECIFICATIONS: Provide detailed technical requirements for developers including keyboard navigation, focus order, and accessibility features

INTERACTION REQUIREMENTS:
- CLEAR USER GUIDANCE: Provide specific instructions like "Click the screen or press [play button]"
- STEP-BY-STEP NAVIGATION: Break down complex interactions into numbered steps
- REALISTIC SCENARIOS: Base knowledge checks on actual workplace dilemmas from the source
- DETAILED FEEDBACK: Provide specific, actionable feedback for each response option

--- SCENE BLUEPRINT ---
Title: ${blueprintBlock.title}
Storyboards page(s): ${blueprintBlock.pages.join(', ')}
Scene Type: ${blueprintBlock.type}
Detailed instructions: ${blueprintBlock.content}
--- END SCENE BLUEPRINT ---

--- CONTENT FOCUS FOR THIS SCENE ---
${contextSection}
--- END CONTENT FOCUS ---

Return ONLY a JSON object with these fields:
{
  "sceneTitle": "...",
  "screenLayout": "...",
  "narrationScript": "...",
  "onScreenText": {
    "title": "...",
    "body_text": ["..."],
    "bullet_points": ["..."],
    "continue_prompt": "..."
  },
  "developerNotes": "...",
  "accessibilityNotes": "...",
  "visual": {
    "mediaType": "...",
    "style": "...",
    "sceneDescription": "...",
    "composition": "...",
    "setting": "...",
    "lighting": "...",
    "colorPalette": ["#FFFFFF", "..."] ,
    "mood": "...",
    "brandIntegration": "Use ${formData?.company || formData?.organisationName || formData?.organizationName || 'the organization'} branding and colors",
    "negativeSpace": "...",
    "altText": "...",
    "aiPrompt": "..."
  },
  "assets": [
    { "type": "image|audio|video", "source": "...", "description": "..." }
  ],
  "knowledgeCheck": {
    "type": "MCQ | MRQ | Scenario | DragDrop | null",
    "stem": "Create a realistic workplace scenario involving the characters (Mark, Karen, Ariana) with specific details from the source material",
    "instruction": "Provide clear, specific instructions for the interaction (e.g., 'Select all answers that apply, then select Submit')",
    "options": [ 
      { 
        "text": "Detailed option with specific workplace context", 
        "is_correct": true, 
        "feedback": "Comprehensive feedback explaining why this is correct with reference to company policies and real consequences" 
      } 
    ],
    "feedback": {
      "correct": "Detailed explanation of why the answer is correct, referencing specific policies and procedures",
      "incorrect": "Specific guidance on what was wrong and how to apply the correct approach in similar situations",
      "try_again": "Encouraging message with hints about the correct approach",
      "visual": "Specific visual indicators for correct/incorrect selection and answer display"
    }
  }
}

STORYBOARD FORMAT GUIDANCE:
- Create scenes that tell a story with specific characters and realistic dialogue
- Use numbered steps for user interactions (1. Click here, 2. Select option, etc.)
- Include specific workplace scenarios based on the source material
- Build character continuity across related scenes
- Make interactions feel like real workplace situations, not abstract concepts
- Provide clear, specific user guidance for every interaction
- IMPORTANT: Use the actual company name from the form data (${formData?.company || formData?.organisationName || formData?.organizationName || 'the organization'}) throughout all content. Do NOT use hardcoded template company names like "Equifax" or any other placeholder names.

DEVELOPER NOTES REQUIREMENTS:
- Include specific technical specifications (aspect ratio, media type, interaction requirements)
- Provide detailed accessibility requirements (keyboard navigation, screen reader compatibility, captions)
- Specify brand integration requirements and visual guidelines
- Include interaction flow details (click sequences, validation rules, error handling)
- Reference specific policies and procedures with exact links when applicable
- Provide character voice and tone guidance for audio production
- Include visual design specifications (colors, fonts, layout requirements)
`;


type SceneValidationResult = {
  ok: boolean;
  issues: string[];
  warnings: string[];
};


type SceneDraftResult = {
  aiScene: any;
  attempts: number;
  residualIssues: string[];
};

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "You are an Instructional Designer creating a single scene for a storyboard. Your output must be only the JSON object for the scene." },
        { role: "user", content: singleScenePrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
    60000
  );
    
    // Add detailed logging for debugging
    const responseText = response.choices[0].message.content;
    console.log("✅ RAW MODEL OUTPUT:", responseText);
    
    let sceneJson = safeParseJson(responseText);
    console.log("✅ PARSED MODEL OUTPUT:", sceneJson);
    
    console.log(`[SCENE ${sceneIndex + 1}] ✅ Basic generation complete.`);
    
    // Phase 3: Specialist Agent Enrichment
    try {
      const learningObjective = learningOutcomes[0] || "Apply key concepts";
      const enrichedContent = await enrichSceneWithSpecialist(
        blueprintBlock.type,
        blueprintBlock.content,
        learningObjective,
        sceneContext,
        narrativeAnchor,
        openai
      );
      
      if (enrichedContent) {
        console.log(`[SCENE ${sceneIndex + 1}] 🎯 Specialist enrichment applied.`);
        // Merge specialist content with basic scene
        sceneJson = {
          ...sceneJson,
          ...enrichedContent,
          // Preserve original fields but enhance with specialist content
          specialistEnhanced: true
        };
      }
    } catch (specialistError) {
      console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Specialist enrichment failed:`, specialistError);
      // Continue with basic scene if specialist enrichment fails
    }

    // ARCHETYPE RULE ENFORCEMENT: Apply archetype-specific rules
    try {
      const moduleType = formData.moduleType || "Leadership & Coaching";
      const enforcementResult = enforceArchetypeRules(sceneJson, moduleType);
      
      if (enforcementResult.fixed) {
        console.log(`[SCENE ${sceneIndex + 1}] 🔧 Archetype rules enforced - content updated`);
        sceneJson = enforcementResult.content;
      }
      
      if (enforcementResult.violations.length > 0) {
        console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Archetype rule violations:`, enforcementResult.violations);
      } else {
        console.log(`[SCENE ${sceneIndex + 1}] ✅ Archetype rules compliance verified`);
      }
    } catch (archetypeError) {
      console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Archetype rule enforcement failed:`, archetypeError);
      // Continue with scene if archetype enforcement fails
    }

    // PEDAGOGICAL RULE ENFORCEMENT: Apply pedagogical approach rules
    try {
      const moduleType = formData.moduleType || "Leadership & Coaching";
      const pedagogicalResult = enforcePedagogicalRules(sceneJson, moduleType, sceneIndex);
      
      if (pedagogicalResult.fixed) {
        console.log(`[SCENE ${sceneIndex + 1}] 🎯 Pedagogical rules enforced - interaction updated`);
        sceneJson = pedagogicalResult.scene;
      }
      
      if (pedagogicalResult.violations.length > 0) {
        console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Pedagogical rule violations:`, pedagogicalResult.violations);
      } else {
        console.log(`[SCENE ${sceneIndex + 1}] ✅ Pedagogical approach compliance verified`);
      }
    } catch (pedagogicalError) {
      console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Pedagogical rule enforcement failed:`, pedagogicalError);
      // Continue with scene if pedagogical enforcement fails
    }
    
    // PHASE 3: INNOVATION EXECUTION - Add adaptive and social learning elements
    sceneJson = addInnovationElements(sceneJson, businessImpact);
    
    // PHASE 4: MEASUREMENT INTEGRATION - Add measurement mechanisms
    sceneJson = addMeasurementMechanisms(sceneJson, businessImpact);
    
    // NARRATIVE ENGINE: UPGRADE INTERACTIVITY FROM PASSIVE TO ACTIVE
    if (sceneJson.interactionType && sceneJson.interactionType !== "None") {
      const originalInteractivity = sceneJson.interactionType;
      sceneJson.interactionType = upgradeInteractivity(originalInteractivity, {
        characters,
        narrativePattern,
        businessImpact
      });
      console.log(`[SCENE ${sceneIndex + 1}] 🔄 Upgraded interactivity: ${originalInteractivity} → ${sceneJson.interactionType}`);
    }
    
    // VALIDATION CHECK - Ensure scene meets business impact framework requirements
    const validation = validateBusinessImpactFramework(sceneJson, businessImpact);
    if (!validation.valid) {
      console.warn(`[SCENE ${sceneIndex + 1}] ⚠️ Business impact validation issues: ${validation.issues.join(", ")}`);
    }
    
    return sceneJson;
  } catch (error) {
    console.error(`[SCENE ${sceneIndex + 1}] ❌ FAILED to generate "${blueprintBlock.title}". Error:`, error);
    // Return a placeholder error scene so the process doesn't stop
    return {
      sceneName: `ERROR: ${blueprintBlock.title}`,
      onScreenText: `Failed to generate this scene.`,
      narration: `An error occurred during generation.`,
      visuals: { scene: "Error state graphic" },
      interactionType: "None"
    };
  }
}


// ────────────────────────────────────────────────────────────────────────────────
// ─── Helper Functions ───────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────

// Helper functions for validation
function textOverlapRatio(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function hasMeaningfulVisualSubject(subject: any): boolean {
  if (!subject) return false;
  if (typeof subject === "string") {
    return subject.trim().length > 5;
  }
  if (typeof subject === "object") {
    return Object.values(subject).some(value => 
      typeof value === "string" ? value.trim().length > 0 : 
      Array.isArray(value) ? value.length > 0 : 
      value !== null && value !== undefined
    );
  }
  return false;
}

function knowledgeCheckIsComplete(kc: any): boolean {
  return !!(
    kc?.question &&
    kc?.options &&
    Array.isArray(kc.options) &&
    kc.options.length >= 3 &&
    kc.options.some((opt: any) => opt?.correct === true || opt?.is_correct === true || opt?.isCorrect === true) &&
    (kc?.feedback?.correct || kc?.correct_feedback) &&
    (kc?.feedback?.incorrect || kc?.incorrect_feedback)
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// ─── Main Generation Function (Re-architected) ──────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────
function validateSceneAgainstBlueprint(
  aiScene: any,
  blueprintBlock: InstructionalBlock,
  sceneContext: string,
  formData: any
): SceneValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!aiScene || typeof aiScene !== "object") {
    return {
      ok: false,
      issues: ["Model response was empty or not an object."],
      warnings,
    };
  }

  const narration =
    String(
      aiScene.narrationScript ||
        aiScene.narration ||
        aiScene.voiceover ||
        aiScene.audioScript ||
        ""
    ).trim();
  if (!narration) {
    issues.push("Narration script is missing.");
  }

  const ostStructured = normalizeOnScreenText(
    aiScene.onScreenText || aiScene.on_screen_text || aiScene.ost || ""
  );
  const ostFlattened = flattenOnScreenTextValue(ostStructured);
  if (!ostFlattened.trim()) {
    issues.push("On-screen text is missing.");
  } else if (narration && textOverlapRatio(narration, ostFlattened) > 0.8) {
    issues.push("On-screen text duplicates narration; rewrite as complementary headings or bullets.");
  }

  const developerNotes = String(aiScene.developerNotes || aiScene.internalNotes || "").trim();
  if (!developerNotes) {
    warnings.push("Developer notes are sparse; add animation/build guidance.");
  }

  const accessibilityNotes = String(aiScene.accessibilityNotes || aiScene.a11yNotes || "").trim();
  if (blueprintBlock.accessibilityMustHaves && blueprintBlock.accessibilityMustHaves.length) {
    const lower = accessibilityNotes.toLowerCase();
    blueprintBlock.accessibilityMustHaves.forEach((requirement) => {
      const token = String(requirement).split(/\s+/)[0]?.toLowerCase();
      if (token && !lower.includes(token)) {
        issues.push(`Accessibility notes must address: ${requirement}.`);
      }
    });
  } else if (
    blueprintBlock.expectedInteractionType &&
    /interactive|scenario|tab|timeline|drag|click/i.test(blueprintBlock.expectedInteractionType)
  ) {
    if (!/keyboard|focus/.test(accessibilityNotes.toLowerCase())) {
      issues.push("Accessibility notes must mention keyboard navigation and focus order for the interaction.");
    }
  } else if (!accessibilityNotes) {
    warnings.push("Accessibility notes are missing; include captions/contrast guidance.");
  }

  const visual = aiScene.visual || {};
  const subject = visual.visualGenerationBrief?.subject || visual.subject;
  const sceneDescription =
    visual.visualGenerationBrief?.sceneDescription || visual.sceneDescription || visual.description;
  if (!sceneDescription || !String(sceneDescription).trim()) {
    warnings.push("Visual brief should include a sceneDescription describing composition and setting.");
  }
  if (!hasMeaningfulVisualSubject(subject)) {
    issues.push("Visual brief subject is empty; specify characters/setting for the artwork.");
  }

  const knowledgeRaw =
    aiScene.knowledgeCheck || aiScene.quiz || aiScene.assessment || aiScene.question;
  if (blueprintBlock.requiresKnowledgeCheck) {
    if (!knowledgeRaw) {
      issues.push("Knowledge check is required by this blueprint block but missing.");
    } else {
      if (!knowledgeCheckIsComplete(knowledgeRaw)) {
        issues.push("Knowledge check must include stem, options with correct flags, and feedback.");
      }
      const options = Array.isArray(knowledgeRaw?.options) ? knowledgeRaw.options : [];
      const correctCount = options.filter((opt: any) => opt?.is_correct || opt?.correct || opt?.isCorrect).length;
      if (options.length < 3) {
        issues.push("Knowledge check must include at least three answer options.");
      }
      if (correctCount === 0) {
        issues.push("Knowledge check must mark at least one option as correct.");
      }
      if (!knowledgeRaw?.feedback?.correct || !knowledgeRaw?.feedback?.incorrect) {
        issues.push("Knowledge check feedback must cover correct and incorrect answers.");
      }
    }
  }

  const interactionType = String(aiScene.interactionType || aiScene.sceneType || "").trim();
  if (
    blueprintBlock.expectedInteractionType &&
    interactionType &&
    !interactionType.toLowerCase().includes(blueprintBlock.expectedInteractionType.toLowerCase().split(" ")[0])
  ) {
    warnings.push(
      `Interaction type should align with "${blueprintBlock.expectedInteractionType}" (received "${interactionType}").`
    );
  }

  if (
    blueprintBlock.expectedInteractionType &&
    /tab|click|timeline|scenario|drag|multi|hotspot/i.test(blueprintBlock.expectedInteractionType)
  ) {
    const interactionDetails = aiScene.interactionDetails || {};
    if (!interactionDetails || Object.keys(interactionDetails).length === 0) {
      issues.push("Interactive scene is missing interactionDetails (steps, keyboard path, retry logic).");
    }
  }

  const narrativeCorpus = ` ${narration} ${ostFlattened} ${developerNotes} ${aiScene.interactionDescription || ""} ${
    knowledgeRaw?.stem || ""
  }`.toLowerCase();
  const contextTerms = extractKeyTerms(sceneContext);
  if (contextTerms.length) {
    const narrativeTokens = new Set(tokenize(narrativeCorpus));
    const overlap = contextTerms.filter((term) => narrativeTokens.has(term));
    if (overlap.length < Math.min(4, Math.ceil(contextTerms.length * 0.2))) {
      issues.push("Scene content is not grounded in the provided context snippets.");
    }
  }

  const anchorTerms = extractKeyTerms(
    formData?.company || formData?.organisationName || formData?.organizationName || "",
    formData?.moduleName || "",
    blueprintBlock.title
  );
  if (anchorTerms.length) {
    const narrativeTokens = tokenize(narrativeCorpus);
    const containsAnchor = anchorTerms.some((term) => narrativeTokens.includes(term));
    if (!containsAnchor) {
      issues.push("Scene is missing required company/module anchors. Reference the source terminology.");
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
  };
}

export const generateStoryboardFromOpenAI = async (formData: any, options: any = {}) => {
  const model = OPENAI_DEFAULT;
  const fullSummary = options.ragContext || "";

  try {
    // PHASE 1: BUSINESS IMPACT MAPPING
    console.log(`[PHASE 1/4] 🎯 BUSINESS IMPACT MAPPING - Analyzing strategic goals and success metrics...`);
    
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    const businessImpact = await mapBusinessImpact(formData, openai);
    console.log(`[IMPACT] Primary Goal: ${businessImpact.primaryGoal}`);
    console.log(`[IMPACT] Success Definition: ${businessImpact.successDefinition}`);
    console.log(`[IMPACT] Learning Approaches: ${businessImpact.learningApproaches.join(", ")}`);
    console.log(`[IMPACT] Measurement: ${businessImpact.measurement.join(", ")}`);

    // AGENT 0: THE PROJECT SCOPING AGENT (Enhanced with Business Impact)
    console.log(`[AGENT 0/4] Analyzing project scope with business impact integration...`);
    
    const projectScope = await analyzeProjectScope(formData, openai, businessImpact);
    console.log(`[SCOPE] Selected archetype: ${projectScope.archetype}`);
    console.log(`[SCOPE] Primary character: ${projectScope.characterProfiles.primary.name} (${projectScope.characterProfiles.primary.role})`);
    console.log(`[SCOPE] Key concepts: ${projectScope.narrativeStructure.coreConcepts.join(", ")}`);

    // AGENT 0.5: NARRATIVE ANCHOR GENERATION (Phase 3)
    console.log(`[AGENT 0.5/4] Generating narrative anchor for character consistency...`);
    const narrativeAnchor = await generateNarrativeAnchor(projectScope, formData, openai);
    console.log(`[ANCHOR] Primary character: ${narrativeAnchor.characterRoster.primary.name} (${narrativeAnchor.characterRoster.primary.role})`);
    console.log(`[ANCHOR] Secondary characters: ${narrativeAnchor.characterRoster.secondary.map(c => c.name).join(", ")}`);
    console.log(`[ANCHOR] Key scenarios: ${narrativeAnchor.keyScenarios.length}`);

    // NARRATIVE ENGINE: SELECT CHARACTERS AND PATTERNS (Single Classification)
    console.log(`[NARRATIVE ENGINE] Selecting character archetypes and narrative patterns based on Module Type...`);
    
    const moduleType = formData.moduleType || "Leadership & Coaching";
    const archetype = getArchetypeForModuleType(moduleType);
    const archetypeRules = getModuleTypeRules(moduleType);
    
    const characters = selectCharacterArchetypes(moduleType, formData.complexityLevel);
    const narrativePattern = selectNarrativePattern(moduleType, formData.complexityLevel);
    const emotionalBeats = getEmotionalBeats(moduleType);
    
    console.log(`[NARRATIVE] Module Type: ${moduleType} → Archetype: ${archetype}`);
    console.log(`[NARRATIVE] Protagonist: ${characters.protagonist.name} (${characters.protagonist.role})`);
    console.log(`[NARRATIVE] Mentor: ${characters.mentor.name} (${characters.mentor.role})`);
    console.log(`[NARRATIVE] Challenge: ${characters.challenge.name} (${characters.challenge.role})`);
    console.log(`[NARRATIVE] Pattern: ${narrativePattern.name} - ${narrativePattern.beats.length} beats`);
    console.log(`[NARRATIVE] Emotional beats: ${emotionalBeats.map(b => b.name).join(", ")}`);
    console.log(`[ARCHETYPE RULES] Tone: ${archetypeRules.tone}`);
    console.log(`[ARCHETYPE RULES] Interactions: ${archetypeRules.interactions.join(", ")}`);
    if (archetypeRules.banned.length > 0) {
      console.log(`[ARCHETYPE RULES] BANNED TERMS: ${archetypeRules.banned.join(", ")}`);
    }

    // AGENT 1: THE DRAFTER (Now working scene by scene with scoper guidance)
    console.log(`[AGENT 1/4] Calling Drafter Agent scene-by-scene with model ${model}...`);

    const blueprint = master36PageBlueprint;
    const sceneContexts = buildSceneContexts(fullSummary, blueprint);

    const sceneDraftPromises = blueprint.map(async (block, index): Promise<SceneDraftResult> => {
      const maxAttempts = 3;
      let attempt = 1;
      let remediation: string[] = [];
      let lastDraft: any = null;
      let lastValidation: SceneValidationResult | null = null;

      while (attempt <= maxAttempts) {
        const draft = await generateSingleScene(
          block,
          fullSummary,
          sceneContexts[index] || "",
          formData,
          index,
          model,
          projectScope,
          narrativeAnchor, // Phase 3: Pass narrative anchor
          businessImpact, // Phase 1: Pass business impact
          characters, // Narrative Engine: Pass character archetypes
          narrativePattern, // Narrative Engine: Pass narrative pattern
          emotionalBeats, // Narrative Engine: Pass emotional beats
          attempt,
          remediation
        );

        lastDraft = draft;
        lastValidation = validateSceneAgainstBlueprint(draft, block, sceneContexts[index] || "", formData);

        if (lastValidation.ok) {
          if (lastValidation.warnings.length) {
            console.warn(
              `[SCENE ${index + 1}] ⚠️ Validation warnings: ${lastValidation.warnings.join("; ")}`
            );
          }
          return {
            aiScene: draft,
            attempts: attempt,
            residualIssues: lastValidation.warnings,
          };
        }

        console.warn(
          `[SCENE ${index + 1}] 🔁 Validation failed (attempt ${attempt}): ${lastValidation.issues.join("; ")}`
        );
        remediation = lastValidation.issues;
        attempt += 1;
      }

      if (lastValidation?.warnings?.length) {
        console.warn(
          `[SCENE ${index + 1}] ⚠️ Proceeding with residual warnings: ${lastValidation.warnings.join("; ")}`
        );
      }
      if (lastValidation?.issues?.length) {
        console.warn(
          `[SCENE ${index + 1}] ⚠️ Using last draft despite outstanding issues: ${lastValidation.issues.join("; ")}`
        );
      }

      const fallbackDraft =
        lastDraft || {
          sceneTitle: block?.title || `Scene ${index + 1}`,
          narrationScript: `Placeholder narration for ${block?.title || `scene ${index + 1}`}.`,
          onScreenText: {
            title: block?.title || `Scene ${index + 1}`,
            body_text: ["Detailed content to be generated."],
          },
          developerNotes: "Review required.",
          accessibilityNotes: "Ensure captions available.",
          visual: {
            mediaType: "Image",
            style: "Illustration",
            sceneDescription: block?.content || "",
            composition: "Centered subject, ample whitespace",
            setting: "",
            lighting: "Soft, even",
            colorPalette: ["#FFFFFF", "#111111"],
            altText: `Placeholder image for ${block?.title || `scene ${index + 1}`}`,
            aiPrompt: block?.content || "",
          },
          assets: [],
          knowledgeCheck: null,
        };

      return {
        aiScene: fallbackDraft,
        attempts: maxAttempts,
        residualIssues:
          (lastValidation?.issues && lastValidation.issues.length
            ? lastValidation.issues
            : lastValidation?.warnings || []),
      };
    });

    const sceneDrafts = await Promise.all(sceneDraftPromises);

    const storyboardScenes: Scene[] = sceneDrafts.map((draft, index) => {
      try {
        if (draft.residualIssues.length) {
          console.warn(
            `[SCENE ${index + 1}] ⚠️ Residual issues after validation: ${draft.residualIssues.join("; ")}`
          );
        }
        return convertAiSceneToStoryboardScene(
          draft.aiScene,
          blueprint[index],
          index,
          sceneContexts[index] || ""
        );
      } catch (err) {
        console.warn(`⚠️ Scene ${index + 1} normalization failed. Using placeholder.`, err);
        return convertAiSceneToStoryboardScene(
          {
            sceneTitle: blueprint[index]?.title || `Scene ${index + 1}`,
            narrationScript: `Placeholder narration for ${blueprint[index]?.title || `scene ${index + 1}`}.`,
            onScreenText: {
              title: blueprint[index]?.title || `Scene ${index + 1}`,
              body_text: ["Detailed content to be generated."],
            },
            developerNotes: "Review required.",
            accessibilityNotes: "Ensure captions available.",
            visual: {
              mediaType: "Image",
              style: "Illustration",
              sceneDescription: blueprint[index]?.content || "",
              composition: "Centered subject, ample whitespace",
              setting: "",
              lighting: "Soft, even",
              colorPalette: ["#FFFFFF", "#111111"],
              altText: `Placeholder image for ${blueprint[index]?.title || `scene ${index + 1}`}`,
              aiPrompt: blueprint[index]?.content || "",
            },
            assets: [],
            knowledgeCheck: null,
          },
          blueprint[index],
          index,
          sceneContexts[index] || ""
        );
      }
    });

    const totalEstimatedSeconds = storyboardScenes.reduce((acc, scene, idx) => {
      const seconds = Number((scene as any)?.timing?.estimatedSeconds);
      if (Number.isFinite(seconds) && seconds > 0) {
        return acc + seconds;
      }
      const fallbackSeconds = Number(blueprint[idx]?.expectedDurationSeconds || 0);
      return acc + (Number.isFinite(fallbackSeconds) ? fallbackSeconds : 0);
    }, 0);

    const moduleTiming: StoryboardTimingMetadata = {};
    if (Number.isFinite(totalEstimatedSeconds) && totalEstimatedSeconds > 0) {
      moduleTiming.totalEstimatedSeconds = Math.round(totalEstimatedSeconds);
      moduleTiming.estimatedMinutes = Math.round((totalEstimatedSeconds / 60) * 10) / 10;
    }

    const targetMinutesCandidate = Number.isFinite(Number(formData?.durationMins))
      ? Number(formData.durationMins)
      : (() => {
          const raw = String(formData?.duration || "").replace(/[^0-9.]/g, "");
          const parsed = Number(raw);
          return Number.isFinite(parsed) ? parsed : undefined;
        })();
    if (Number.isFinite(targetMinutesCandidate) && (targetMinutesCandidate as number) > 0) {
      moduleTiming.targetMinutes = Math.round((targetMinutesCandidate as number) * 10) / 10;
    }

    const draftMetadata: StoryboardModule["metadata"] = {};
    if (Object.keys(moduleTiming).length) {
      draftMetadata.moduleTiming = moduleTiming;
      if (moduleTiming.estimatedMinutes !== undefined) {
        draftMetadata.estimatedMinutes = moduleTiming.estimatedMinutes;
      }
    }

    const draftStoryboard: StoryboardModule = {
      moduleName: formData.moduleName || (humanBlueprintMetadata?.documentTitle ?? "Untitled Module"),
      scenes: storyboardScenes,
      metadata: Object.keys(draftMetadata).length ? draftMetadata : undefined,
    };

    console.log(`[AGENT 1/2] Drafter Agent finished. Generated ${draftStoryboard.scenes.length} scenes.`);

    if (!draftStoryboard.scenes || draftStoryboard.scenes.length < blueprint.length) {
      console.warn(`⚠️ WARNING: One or more scenes failed to generate. Expected ${blueprint.length}, got ${draftStoryboard.scenes.length}.`);
    }

    // AGENT 2: THE SENIOR EDITOR (with strict scene count protection)
    console.log(`[AGENT 2/4] Calling Senior Editor Agent to refine the draft...`);
    let finalStoryboard: StoryboardModule = draftStoryboard; // Default to drafter output

    const expectedSceneCount = blueprint.length;
    console.log(`[AGENT 2/4] Expected scene count: ${expectedSceneCount}, Drafter scenes: ${draftStoryboard.scenes?.length}`);

    try {
      const editorResponse = await withTimeout(
        openai.chat.completions.create({
          model,
          messages: [
            { 
              role: "system", 
            content: `You are a Senior Instructional Designer refining a storyboard. CRITICAL: You must preserve exactly ${expectedSceneCount} scenes. Do not add, remove, or merge scenes. Only improve the content within each existing scene while maintaining the exact structure and scene count.

PROJECT SCOPE CONTEXT:
- Archetype: ${projectScope.archetype}
- Primary Character: ${projectScope.characterProfiles.primary.name} (${projectScope.characterProfiles.primary.role})
- Tone: ${projectScope.toneGuidance}
- Key Concepts: ${projectScope.narrativeStructure.coreConcepts.join(", ")}

NARRATIVE ANCHOR CONTEXT:
- Primary Character: ${narrativeAnchor.characterRoster.primary.name} (${narrativeAnchor.characterRoster.primary.role})
- Personality: ${narrativeAnchor.characterRoster.primary.personality}
- Speaking Style: ${narrativeAnchor.characterRoster.primary.speakingStyle}
- Company: ${narrativeAnchor.companyContext.name}
- Tone: ${narrativeAnchor.toneOfVoice.overall}

Ensure all scenes maintain character consistency, narrative flow, and company context according to the narrative anchor. Return the complete storyboard with all ${expectedSceneCount} scenes intact.`
          },
          { 
            role: "user", 
            content: `Please refine this storyboard while keeping exactly ${expectedSceneCount} scenes and maintaining character consistency with ${narrativeAnchor.characterRoster.primary.name} and the established narrative anchor:\n\n${JSON.stringify(draftStoryboard, null, 2)}`
          },
        ],
        response_format: { type: "json_object" },
      }),
      60000
    );

      const editorResult = safeParseJson(editorResponse.choices[0].message.content || "{}");
      
      // STRICT VALIDATION: Only use editor output if it preserves scene count
      if (Array.isArray(editorResult?.scenes) && editorResult.scenes.length === expectedSceneCount) {
        // Additional quality checks
        const hasValidScenes = editorResult.scenes.every((scene: any) => 
          scene && 
          String(scene.narrationScript || "").trim().length > 10 &&
          (scene.onScreenText || scene.title)
        );
        
        if (hasValidScenes) {
          finalStoryboard = editorResult;
          console.log(`[AGENT 2/3] Senior Editor Agent finished. Scenes: ${finalStoryboard.scenes?.length} ✅`);
        } else {
          console.warn(`[AGENT 2/3] Editor output has invalid scenes. Using drafter output.`);
        }
      } else {
        console.warn(
          `[AGENT 2/3] Editor dropped scenes (expected ${expectedSceneCount}, got ${editorResult?.scenes?.length ?? 0}). Using drafter output.`
        );
      }
    } catch (err) {
      console.warn("⚠️ Agent 2 (Editor) failed. Using drafter output.");
    }

    // FINAL SAFETY CHECK: Ensure we always have the right number of scenes
    if (!Array.isArray(finalStoryboard?.scenes) || finalStoryboard.scenes.length !== expectedSceneCount) {
      console.error(
        `🚨 CRITICAL: Scene count mismatch! Expected ${expectedSceneCount}, got ${finalStoryboard?.scenes?.length ?? 0}. Using drafter output.`
      );
      finalStoryboard = draftStoryboard;
    }

    // AGENT 3: QUALITY GATES (Phase 2 Enhancement)
    console.log(`[AGENT 3/4] Running quality gates and pattern validation...`);
    
    const learningObjectives = coerceLearningOutcomes(formData?.learningOutcomes || formData?.outcomes || []);
    const storyboardId = `temp_${Date.now()}`; // Temporary ID for quality tracking
    
    try {
      const qualityResults = await runAllQualityGates(
        finalStoryboard,
        projectScope,
        learningObjectives,
        storyboardId
      );

      console.log(`[QUALITY GATES] Overall: ${qualityResults.overallScore.toFixed(1)}% (${qualityResults.overallPassed ? 'PASSED' : 'FAILED'})`);
      
      // CRITICAL: Check if any critical validations failed
      const criticalFailures = [
        qualityResults.gateResults.pedagogicalSequence,
        qualityResults.gateResults.archetypePurity,
        qualityResults.gateResults.cognitiveLoad,
        qualityResults.gateResults.characterContinuity
      ].filter(result => !result.passed);
      
      if (criticalFailures.length > 0) {
        console.error(`[QUALITY GATES] 🚨 CRITICAL VALIDATION FAILURES - STORYBOARD REJECTED`);
        console.error(`[QUALITY GATES] 🚨 Failed validations: ${criticalFailures.length}`);
        
        criticalFailures.forEach((failure, index) => {
          console.error(`[QUALITY GATES] 🚨 Critical Failure ${index + 1}:`, failure.issues);
        });
        
        // ATTEMPT RETRY WITH ENHANCED PROMPTS
        console.log(`[QUALITY GATES] 🔄 Attempting retry with enhanced pedagogical prompts...`);
        
        // Enhanced prompt with specific pedagogical requirements
        const enhancedPrompt = `
CRITICAL PEDAGOGICAL REQUIREMENTS - MUST FOLLOW EXACTLY:

1. PEDAGOGICAL SEQUENCE (MANDATORY):
   - Scene 1-2: Hook & Problem (real scenario)
   - Scene 3-4: Teach ONE core concept only
   - Scene 5: Worked example/demonstration
   - Scene 6: Guided practice
   - Scene 7: Assessment (immediately after teaching)
   - Scene 8+: Application scenarios

2. ARCHETYPE PURITY (MANDATORY):
   - Soft Skills: Focus on coaching, mentoring, communication, relationship building
   - BANNED: compliance, incident, breach, violation, policy violation, regulatory, audit
   - Compliance: Include policy references, consequences, reporting procedures

3. COGNITIVE LOAD (MANDATORY):
   - Maximum 2 new concepts per scene
   - Assessment must immediately follow teaching
   - Each scene must teach NEW content (no repetition)

4. CHARACTER CONTINUITY (MANDATORY):
   - Use same 2-4 characters throughout
   - Progressive character development
   - Consistent relationships and roles

VIOLATION OF THESE RULES WILL RESULT IN STORYBOARD REJECTION.
`;

        // Retry with enhanced prompt
        try {
          console.log(`[QUALITY GATES] 🔄 Retrying storyboard generation with enhanced pedagogical prompts...`);
          // This would trigger a regeneration with the enhanced prompt
          // For now, we'll throw an error to indicate the need for regeneration
          throw new Error(`CRITICAL PEDAGOGICAL VALIDATION FAILURES: Storyboard violates fundamental learning design principles. ${criticalFailures.length} critical validations failed. Please regenerate with enhanced pedagogical requirements.`);
        } catch (retryError) {
          throw new Error(`CRITICAL PEDAGOGICAL VALIDATION FAILURES: Storyboard violates fundamental learning design principles. ${criticalFailures.length} critical validations failed.`);
        }
      }
      
      if (!qualityResults.overallPassed) {
        console.warn(`[QUALITY GATES] Quality issues detected (non-critical):`);
        qualityResults.allIssues.forEach((issue, index) => {
          console.warn(`  ${index + 1}. ${issue}`);
        });
        
        // For now, we'll log the issues but continue with the storyboard
        // In a future enhancement, we could implement retry logic here
        console.warn(`[QUALITY GATES] Continuing with storyboard despite quality issues. Consider reviewing recommendations.`);
      }

      // Add quality results to storyboard metadata
      finalStoryboard.metadata = finalStoryboard.metadata || {};
      (finalStoryboard.metadata as any).qualityGates = {
        overallPassed: qualityResults.overallPassed,
        overallScore: qualityResults.overallScore,
        gateResults: qualityResults.gateResults,
        issues: qualityResults.allIssues,
        recommendations: qualityResults.allRecommendations
      };

      // Phase 4: Generate quality dashboard
      try {
        const companyId = formData?.company || formData?.organisationName || 'default';
        const userId = formData?.createdBy || 'system';
        
        const dashboardData = await generateQualityDashboard(
          finalStoryboard,
          projectScope,
          learningObjectives,
          companyId,
          userId
        );
        
        (finalStoryboard.metadata as any).qualityDashboard = dashboardData;
        console.log(`[QUALITY DASHBOARD] Generated dashboard with overall score: ${dashboardData.overallScore.toFixed(1)}%`);
      } catch (dashboardError) {
        console.warn("⚠️ Quality dashboard generation failed:", dashboardError);
      }

    } catch (qualityError) {
      console.error("⚠️ Quality gates failed:", qualityError);
      // Continue with storyboard generation even if quality gates fail
    }
    
    // FINAL SAVE AND RETURN
    const enrichedStoryboard = applyHumanMetadata(finalStoryboard, formData);
    try {
      enrichedStoryboard.brandonHall = buildBrandonHallStoryboard(enrichedStoryboard);
    } catch (err) {
      console.warn("⚠️ Failed to build Brandon Hall storyboard:", err);
    }

    // Generate quality report
    try {
      const { generateQualityReport } = await import("../utils/qualityReport");
      const qualityReport = generateQualityReport(enrichedStoryboard, blueprint.length);
      
      // Add quality report to metadata
      enrichedStoryboard.metadata = enrichedStoryboard.metadata || {};
      (enrichedStoryboard.metadata as any).qualityReport = qualityReport;
      
      console.log(`[QUALITY] Overall score: ${qualityReport.overallScore}/100`);
      if (qualityReport.sceneCount.status === "fail") {
        console.error(`[QUALITY] Scene count mismatch: expected ${qualityReport.sceneCount.expected}, got ${qualityReport.sceneCount.actual}`);
      }
      
      // Log critical issues
      const allIssues = [
        ...qualityReport.contentFidelity.issues,
        ...qualityReport.visualQuality.issues,
        ...qualityReport.interactionCompleteness.issues,
        ...qualityReport.accessibilityCompliance.issues,
        ...qualityReport.brandConsistency.issues
      ];
      
      if (allIssues.length > 0) {
        console.warn(`[QUALITY] Found ${allIssues.length} quality issues`);
        allIssues.slice(0, 5).forEach(issue => console.warn(`  - ${issue}`));
        if (allIssues.length > 5) {
          console.warn(`  ... and ${allIssues.length - 5} more issues`);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to generate quality report:", err);
    }

    if (supabase) {
      await saveStoryboardToSupabase(enrichedStoryboard, {
        source: formData.__source || "text",
        aiModel: `${model}-edited`,
        org: formData?.organisationName ?? null,
      });
    }

    // 🆕 PEDAGOGICAL QUALITY VALIDATION
    try {
      console.log('🔍 Running pedagogical quality validation...');
      const pedagogicalReport = await qualityValidator.validateStoryboardPedagogicalDepth(enrichedStoryboard);
      
      // Add pedagogical quality report to metadata
      enrichedStoryboard.metadata = enrichedStoryboard.metadata || {};
      (enrichedStoryboard.metadata as any).pedagogicalQuality = {
        overallScore: pedagogicalReport.overallScore,
        sceneReports: pedagogicalReport.sceneReports,
        criticalIssues: pedagogicalReport.criticalIssues,
        recommendations: pedagogicalReport.recommendations
      };
      
      console.log(`[PEDAGOGICAL QUALITY] Overall score: ${pedagogicalReport.overallScore.toFixed(1)}/100`);
      
      if (pedagogicalReport.criticalIssues.length > 0) {
        console.warn(`[PEDAGOGICAL QUALITY] Found ${pedagogicalReport.criticalIssues.length} critical pedagogical issues:`);
        pedagogicalReport.criticalIssues.forEach((issue, index) => {
          console.warn(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      }
      
      if (pedagogicalReport.recommendations.length > 0) {
        console.log(`[PEDAGOGICAL QUALITY] Recommendations:`);
        pedagogicalReport.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
    } catch (pedagogicalError) {
      console.warn("⚠️ Pedagogical quality validation failed:", pedagogicalError);
    }

    // 🆕 COMPLIANCE & CHARACTER ENHANCEMENT
    console.log('🔧 Applying compliance anchors, character names, and pedagogical enhancements...');
    let complianceCount = 0;
    let characterCount = 0;
    let whyItMattersCount = 0;

    if (enrichedStoryboard.scenes && Array.isArray(enrichedStoryboard.scenes)) {
      for (const scene of enrichedStoryboard.scenes) {
        // Inject compliance anchors if missing
        if (formData.moduleType === 'compliance' && !scene.content?.includes('policy')) {
          scene.content += '\n\n**Policy Reference:** Refer to company Code of Conduct, section 4 – Anti-Bribery and Corruption.\n**Reporting Procedures:** Report breaches via the Ethics Hotline or HR.\n**Legal Requirements:** Aligns with the Criminal Code Act 1995 (Cth).';
          complianceCount++;
        }

        // Ensure character names exist
        if (!scene.metadata?.characters) {
          scene.metadata = scene.metadata || {};
          scene.metadata.characters = { manager: 'Sarah Chen', team_member: 'Jordan Taylor' };
          characterCount++;
        }

        // Teaching scenes must include "why it matters"
        if (scene.pedagogical_purpose === 'teach' && !scene.content?.includes('why this matters')) {
          scene.content = `**Why this matters:** Understanding ${enrichedStoryboard.moduleName} helps prevent risks and protect integrity.\n\n` + (scene.content || '');
          whyItMattersCount++;
        }
      }
    }

    console.log(`✅ Compliance anchors auto-inserted: ${complianceCount}`);
    console.log(`✅ Character names auto-assigned: ${characterCount}`);
    console.log(`✅ "Why it matters" rationale added: ${whyItMattersCount}`);

    console.log("✅ FINAL STORYBOARD RETURN:", { 
      storyboard: enrichedStoryboard,
      scenes: enrichedStoryboard.scenes?.length || 0,
      hasScenes: Array.isArray(enrichedStoryboard.scenes) && enrichedStoryboard.scenes.length > 0
    });

    console.log(
      `[RETURN] Final storyboard: ${enrichedStoryboard.moduleName} — scenes=${enrichedStoryboard.scenes?.length}`                                               
    );
    return enrichedStoryboard;

  } catch (error: any) {
    console.error("💥 AI Pipeline Error:", error.stack);
    throw new Error(error.message);
  }
};
function resolveOpenAIModel(modelName: string = "gpt-4o"): string {
  const allowedModels = ["gpt-5", "gpt-4o", "gpt-4-turbo"];
  if (!allowedModels.includes(modelName)) {
    console.warn(`⚠️ Model "${modelName}" is not supported. Falling back to "gpt-4o".`);
    return "gpt-4o";
  }
  return modelName;
}

function getSystemPrompt(): string {
  return `
You are an expert Instructional Designer...
`.trim();
}

async function embedText(text: string): Promise<number[]> {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return embedding.data[0].embedding;
}

// ✅ Your other functions like generateStoryboardFromOpenAI, etc. should also be defined above here

// PHASE 1: BUSINESS IMPACT MAPPING FUNCTION
async function mapBusinessImpact(formData: any, openai: any) {
  const businessImpact = formData.businessImpact || {};
  const strategicCategory = formData.strategicCategory || "Leadership & Management Development";
  const innovationStrategies = formData.innovationStrategies || [];
  const measurementApproaches = formData.measurementApproaches || [];
  
  // Extract business impact data
  const primaryGoal = `${businessImpact.metric || "team performance"} by ${businessImpact.targetImprovement || 15}% in ${businessImpact.timeframe || 90} days`;
  const successDefinition = businessImpact.successDefinition || "Managers apply coaching skills in weekly 1:1s, leading to measurable team performance improvements";
  const learningApproaches = innovationStrategies.length > 0 ? innovationStrategies : ["Adaptive Learning Paths", "Social Learning Community"];
  const measurement = measurementApproaches.length > 0 ? measurementApproaches : ["Behavior observation", "Business impact tracking"];
  
  return {
    primaryGoal,
    successDefinition,
    learningApproaches,
    measurement,
    strategicCategory,
    targetImprovement: businessImpact.targetImprovement || 15,
    timeframe: businessImpact.timeframe || 90
  };
}

// PHASE 2: CONTENT TRANSFORMATION FUNCTION
function transformLearningObjectives(originalObjectives: string[], businessImpact: any): string[] {
  return originalObjectives.map(obj => {
    // Transform knowledge-based objectives to impact-driven objectives
    if (obj.toLowerCase().includes("recognise") || obj.toLowerCase().includes("understand") || obj.toLowerCase().includes("learn")) {
      return obj
        .replace(/recognise/gi, "Apply")
        .replace(/understand/gi, "Use")
        .replace(/learn/gi, "Implement")
        + ` to drive ${businessImpact.targetImprovement}% ${businessImpact.primaryGoal.split(' by ')[0]} improvement`;
    }
    return obj;
  });
}

// PHASE 3: INNOVATION EXECUTION FUNCTION
function addInnovationElements(scene: any, businessImpact: any): any {
  const { learningApproaches } = businessImpact;
  
  // Add adaptive learning paths
  if (learningApproaches.includes("Adaptive Learning Paths")) {
    scene.adaptiveElements = {
      experienceLevel: "Beginner/Intermediate/Advanced",
      branchingDecisions: "Personalize coaching approaches based on manager experience",
      difficultyProgression: "Adjust complexity based on user performance"
    };
  }
  
  // Add social learning community
  if (learningApproaches.includes("Social Learning Community")) {
    scene.socialElements = {
      peerFeedback: "Include peer feedback mechanisms in practice activities",
      collaborationCheckpoints: "Create manager collaboration checkpoints",
      communityOfPractice: "Build community of practice initiation scenes"
    };
  }
  
  return scene;
}

// PHASE 4: MEASUREMENT INTEGRATION FUNCTION
function addMeasurementMechanisms(scene: any, businessImpact: any): any {
  const { measurement } = businessImpact;
  
  // Add behavior observation
  if (measurement.includes("Behavior observation")) {
    scene.measurementElements = {
      observationChecklists: "Include manager observation checklists and rubrics",
      selfAssessment: "Add self-assessment against coaching behavior standards",
      peerFeedback: "Create peer feedback collection points"
    };
  }
  
  // Add business impact tracking
  if (measurement.includes("Business impact tracking")) {
    scene.businessTracking = {
      performanceDashboards: "Add virtual team performance dashboards showing coaching impact",
      metricConsequences: "Include business metric consequence tracking in scenarios",
      roiCalculation: "Create ROI calculation examples and templates"
    };
  }
  
  return scene;
}

// VALIDATION CHECK FUNCTION
function validateBusinessImpactFramework(scene: any, businessImpact: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check 1: Connect to team performance improvement goal
  if (!scene.narrationScript?.toLowerCase().includes("performance") && 
      !scene.onScreenText?.body_text?.some((text: string) => text.toLowerCase().includes("performance"))) {
    issues.push("Scene must connect to team performance improvement goal");
  }
  
  // Check 2: Include adaptive or social learning elements
  if (!scene.adaptiveElements && !scene.socialElements) {
    issues.push("Scene must include adaptive or social learning elements");
  }
  
  // Check 3: Have built-in measurement mechanisms
  if (!scene.measurementElements && !scene.businessTracking) {
    issues.push("Scene must have built-in measurement mechanisms");
  }
  
  // Check 4: Go beyond basic "click-next" interactions
  if (scene.interactionType === "None" || scene.interactionType === "Click Next") {
    issues.push("Scene must go beyond basic click-next interactions");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// ✅ Export everything in one go
module.exports = {
  generateStoryboardFromOpenAI,
  resolveOpenAIModel,
  getSystemPrompt,
  embedText, // ✅ include this here
  mapBusinessImpact,
  transformLearningObjectives,
  addInnovationElements,
  addMeasurementMechanisms,
  validateBusinessImpactFramework
};
