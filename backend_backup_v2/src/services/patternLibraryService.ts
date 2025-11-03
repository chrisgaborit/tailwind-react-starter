// Pattern Library Service
// Manages reusable learning patterns and scene structures

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface LearningPattern {
  id: string;
  pattern_type: 'dilemma' | 'click_to_reveal' | 'tabbed_explainer' | 'timeline' | 'assessment' | 'menu';
  pattern_name: string;
  description: string;
  structure: any;
  examples: any[];
  archetype_tags: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  interaction_density: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface PatternUsage {
  id: string;
  pattern_id: string;
  storyboard_id: string;
  scene_index: number;
  success_rating?: number;
  feedback?: string;
  used_at: string;
}

export interface QualityMetric {
  id: string;
  storyboard_id: string;
  metric_type: 'lo_coverage' | 'interactivity_density' | 'character_consistency' | 'narrative_flow';
  metric_value: number;
  target_value: number;
  passed: boolean;
  details: any;
  checked_at: string;
}

/**
 * Get patterns suitable for a specific archetype and complexity
 */
export async function getPatternsForArchetype(
  archetype: string,
  complexity: string = 'intermediate',
  patternType?: string
): Promise<LearningPattern[]> {
  try {
    let query = supabase
      .from('learning_patterns')
      .select('*')
      .contains('archetype_tags', [archetype])
      .eq('complexity_level', complexity);

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Pattern library service error:', error);
    return [];
  }
}

/**
 * Get patterns for hybrid archetypes (e.g., compliance+scenario)
 */
export async function getPatternsForHybridArchetype(
  primaryArchetype: string,
  secondaryArchetype: string,
  complexity: string = 'intermediate'
): Promise<LearningPattern[]> {
  try {
    const { data, error } = await supabase
      .from('learning_patterns')
      .select('*')
      .or(`archetype_tags.cs.{${primaryArchetype},${secondaryArchetype}}`)
      .eq('complexity_level', complexity)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hybrid patterns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Hybrid pattern service error:', error);
    return [];
  }
}

/**
 * Get a specific pattern by ID
 */
export async function getPatternById(patternId: string): Promise<LearningPattern | null> {
  try {
    const { data, error } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (error) {
      console.error('Error fetching pattern by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Pattern by ID service error:', error);
    return null;
  }
}

/**
 * Record pattern usage for analytics and improvement
 */
export async function recordPatternUsage(
  patternId: string,
  storyboardId: string,
  sceneIndex: number,
  successRating?: number,
  feedback?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pattern_usage')
      .insert({
        pattern_id: patternId,
        storyboard_id: storyboardId,
        scene_index: sceneIndex,
        success_rating: successRating,
        feedback: feedback
      });

    if (error) {
      console.error('Error recording pattern usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Pattern usage recording error:', error);
    return false;
  }
}

/**
 * Record quality metrics for a storyboard
 */
export async function recordQualityMetric(
  storyboardId: string,
  metricType: string,
  metricValue: number,
  targetValue: number,
  passed: boolean,
  details: any = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quality_metrics')
      .insert({
        storyboard_id: storyboardId,
        metric_type: metricType,
        metric_value: metricValue,
        target_value: targetValue,
        passed: passed,
        details: details
      });

    if (error) {
      console.error('Error recording quality metric:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Quality metric recording error:', error);
    return false;
  }
}

/**
 * Get quality metrics for a storyboard
 */
export async function getQualityMetrics(storyboardId: string): Promise<QualityMetric[]> {
  try {
    const { data, error } = await supabase
      .from('quality_metrics')
      .select('*')
      .eq('storyboard_id', storyboardId)
      .order('checked_at', { ascending: false });

    if (error) {
      console.error('Error fetching quality metrics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Quality metrics service error:', error);
    return [];
  }
}

/**
 * Generate a scene using a specific pattern
 */
export function generateSceneFromPattern(
  pattern: LearningPattern,
  context: any,
  characters: any,
  companyName: string
): any {
  const structure = pattern.structure;
  
  switch (pattern.pattern_type) {
    case 'dilemma':
      return generateDilemmaScene(structure, context, characters, companyName);
    case 'click_to_reveal':
      return generateClickToRevealScene(structure, context, characters, companyName);
    case 'tabbed_explainer':
      return generateTabbedExplainerScene(structure, context, characters, companyName);
    case 'assessment':
      return generateAssessmentScene(structure, context, characters, companyName);
    case 'timeline':
      return generateTimelineScene(structure, context, characters, companyName);
    case 'menu':
      return generateMenuScene(structure, context, characters, companyName);
    default:
      return generateGenericScene(structure, context, characters, companyName);
  }
}

// Pattern-specific generators
function generateDilemmaScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: `Dilemma: ${structure.setup}`,
    screenLayout: "Interactive scenario with character decision points",
    narrationScript: `${characters.primary.name} faces a challenging situation at ${companyName}. ${structure.conflict}`,
    onScreenText: {
      title: structure.setup,
      body_text: [structure.conflict],
      bullet_points: structure.choices,
      continue_prompt: "What should the character do? Select your choice."
    },
    knowledgeCheck: {
      type: "Scenario",
      stem: structure.conflict,
      instruction: "Choose the best response to this workplace dilemma.",
      options: structure.choices.map((choice: string, index: number) => ({
        text: choice,
        is_correct: index === 0, // First choice is typically correct
        feedback: `This choice ${index === 0 ? 'demonstrates proper policy adherence' : 'may lead to compliance issues'}.`
      })),
      feedback: {
        correct: structure.learning_point,
        incorrect: "Consider the company's policies and ethical guidelines.",
        try_again: "Think about the long-term consequences of each choice."
      }
    }
  };
}

function generateClickToRevealScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: structure.title,
    screenLayout: "Interactive click-to-reveal interface",
    narrationScript: `Let's explore ${structure.title} at ${companyName}. Click on each section to learn more.`,
    onScreenText: {
      title: structure.title,
      body_text: ["Click on each section below to reveal detailed information:"],
      bullet_points: structure.sections.map((section: any) => `${section.header}: Click to reveal`),
      continue_prompt: "Click each section to learn more, then continue."
    },
    developerNotes: `Implement click-to-reveal interaction for ${structure.sections.length} sections. Each section should expand to show: ${structure.sections.map((s: any) => s.content).join(', ')}.`
  };
}

function generateTabbedExplainerScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: `Understanding ${structure.tabs[0]?.label || 'Key Concepts'}`,
    screenLayout: "Tabbed interface with organized information",
    narrationScript: `Let's break down this topic into organized sections. Use the tabs to explore different aspects.`,
    onScreenText: {
      title: "Explore the different aspects below:",
      body_text: structure.tabs.map((tab: any) => `${tab.label}: ${tab.content}`),
      bullet_points: [],
      continue_prompt: "Review all tabs, then continue."
    },
    developerNotes: `Create tabbed interface with ${structure.tabs.length} tabs. Each tab should contain: ${structure.tabs.map((t: any) => `${t.label} - ${t.content}`).join(', ')}.`
  };
}

function generateAssessmentScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: "Knowledge Check",
    screenLayout: "Assessment interface with multiple choice options",
    narrationScript: `Now let's test your understanding with a scenario from ${companyName}.`,
    onScreenText: {
      title: "Assessment",
      body_text: [structure.stem],
      bullet_points: [],
      continue_prompt: "Select your answer, then submit."
    },
    knowledgeCheck: {
      type: "MCQ",
      stem: structure.stem,
      instruction: structure.question,
      options: structure.options,
      feedback: structure.rationale
    }
  };
}

function generateTimelineScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: structure.title,
    screenLayout: "Interactive timeline with clickable events",
    narrationScript: `Let's explore the historical context and key developments.`,
    onScreenText: {
      title: structure.title,
      body_text: structure.events.map((event: any) => `${event.date}: ${event.title}`),
      bullet_points: [],
      continue_prompt: "Click on events to learn more, then continue."
    },
    developerNotes: `Create interactive timeline with ${structure.events.length} events. Each event should be clickable to reveal: ${structure.events.map((e: any) => e.description).join(', ')}.`
  };
}

function generateMenuScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: structure.title,
    screenLayout: "Menu interface with pathway selection",
    narrationScript: `Choose the learning path that best fits your role at ${companyName}.`,
    onScreenText: {
      title: structure.title,
      body_text: structure.paths.map((path: any) => `${path.label}: ${path.description} (${path.duration})`),
      bullet_points: [],
      continue_prompt: "Select your preferred learning path."
    },
    developerNotes: `Create menu interface with ${structure.paths.length} pathways. Each path should lead to different content based on user selection.`
  };
}

function generateGenericScene(structure: any, context: any, characters: any, companyName: string): any {
  return {
    sceneTitle: structure.title || "Learning Content",
    screenLayout: "Standard content presentation",
    narrationScript: `Let's explore this important topic for ${companyName}.`,
    onScreenText: {
      title: structure.title || "Key Information",
      body_text: [structure.description || "Important learning content"],
      bullet_points: [],
      continue_prompt: "Continue when ready."
    }
  };
}












