// backend/src/agents/VisualDirectorAgent.ts

/**
 * Visual Director Agent
 * 
 * Replaces generic "clean corporate" visuals with CINEMATIC DIRECTIONS.
 * Creates shot compositions that advance story and emotional engagement.
 * 
 * Thinks like a film director, not a stock photo searcher.
 */

import { Character } from './CharacterGenerationAgent';

export type SceneType = 'hook' | 'character_intro' | 'conflict' | 'teaching' | 'breakthrough' | 'climax' | 'resolution' | 'action';
export type Emotion = 'tension' | 'frustration' | 'confusion' | 'aha_moment' | 'confidence' | 'determination' | 'relief' | 'triumph';
export type ShotType = 'close_up' | 'medium_shot' | 'wide_shot' | 'over_shoulder' | 'two_shot' | 'reaction_shot';

export interface CinematicDirection {
  shot: ShotType;
  subject: string;
  action: string;
  emotion: Emotion;
  lighting: string;
  composition: string;
  fullDirection: string;
}

export class VisualDirectorAgent {
  
  /**
   * Generate cinematic visual direction for scene
   */
  generateSceneDirection(
    sceneType: SceneType,
    characters: { protagonist?: Character; difficult?: Character; supporting?: Character },
    emotion: Emotion,
    context?: string
  ): CinematicDirection {
    
    console.log(`🎬 VisualDirector: Creating direction for ${sceneType} scene`);
    console.log(`   🎭 Emotion: ${emotion}`);

    const protagonist = characters.protagonist?.name || 'the protagonist';
    const difficult = characters.difficult?.name || 'a colleague';
    const supporting = characters.supporting?.name || 'a mentor';

    const directions: Record<SceneType, CinematicDirection> = {
      
      hook: {
        shot: 'close_up',
        subject: protagonist,
        action: 'looking troubled, slight furrow in brow',
        emotion,
        lighting: 'Dramatic side lighting with shadows',
        composition: 'Rule of thirds, negative space on left suggesting isolation',
        fullDirection: `CLOSE UP: ${protagonist}'s face showing ${emotion}. Slight furrow in brow, jaw tight. Dramatic side lighting creates shadows, emphasizing inner conflict. Background slightly blurred (shallow depth of field) to focus on emotional intensity. Negative space on left side suggests isolation and challenge ahead. Professional workplace setting visible but defocused.`
      },

      character_intro: {
        shot: 'medium_shot',
        subject: protagonist,
        action: 'standing in workplace, authentic body language',
        emotion: 'determination',
        lighting: 'Natural office lighting, warm tones',
        composition: 'Centered, grounded posture, making eye contact',
        fullDirection: `MEDIUM SHOT: ${protagonist} at their desk in realistic office setting. Natural, authentic body language - not posed. Making eye contact with camera/audience, creating connection. Warm office lighting (not harsh fluorescent). Personal items visible (photo, coffee mug, notebook) to humanize. Real workspace clutter, not sterile. Expression shows ${emotion} and readiness to learn.`
      },

      conflict: {
        shot: 'two_shot',
        subject: `${protagonist} and ${difficult}`,
        action: 'tense conversation, defensive body language',
        emotion: 'tension',
        lighting: 'Neutral lighting, slight coolness',
        composition: 'Characters facing each other, negative space between them',
        fullDirection: `TWO SHOT: ${protagonist} facing ${difficult} across a desk or meeting space. Body language shows tension - ${protagonist} leaning back slightly (defensive), ${difficult} leaning forward (aggressive). Arms crossed or hands on hips. Significant negative space between characters emphasizes conflict. Neutral to slightly cool lighting reinforces uncomfortable atmosphere. Background shows realistic office with other people visible but blurred, suggesting public nature of conflict.`
      },

      teaching: {
        shot: 'medium_shot',
        subject: `${protagonist} with ${supporting}`,
        action: 'engaged conversation, learning body language',
        emotion: 'aha_moment',
        lighting: 'Warm, inviting lighting',
        composition: 'Characters slightly angled toward each other, collaborative',
        fullDirection: `MEDIUM SHOT: ${protagonist} with ${supporting} in collaborative discussion. Both leaning slightly forward, engaged. ${protagonist} shows "aha moment" - eyes widening, slight smile of recognition. ${supporting} has warm, encouraging expression. Warm lighting creates inviting atmosphere. Whiteboard or notes visible in background with key framework sketched. Hands in animated gesture suggesting active exchange of ideas.`
      },

      breakthrough: {
        shot: 'close_up',
        subject: protagonist,
        action: 'moment of realization, facial transformation',
        emotion: 'aha_moment',
        lighting: 'Bright, warm lighting from above (metaphorical enlightenment)',
        composition: 'Direct eye contact, slight upward angle (empowering)',
        fullDirection: `CLOSE UP: ${protagonist}'s face during moment of breakthrough. Eyes light up with recognition, subtle smile forming. Facial muscles relax from earlier tension. Warm lighting from slightly above creates almost metaphorical "light bulb" moment. Shot from slightly below eye level (empowering angle). Background soft-focused. Expression transitions from confusion to clarity, captured mid-realization.`
      },

      climax: {
        shot: 'medium_shot',
        subject: protagonist,
        action: 'applying new skills under pressure',
        emotion: 'confidence',
        lighting: 'Dynamic lighting with slight drama',
        composition: 'Confident stance, direct engagement',
        fullDirection: `MEDIUM SHOT: ${protagonist} in high-stakes situation applying learned skills. Confident body language - shoulders back, grounded stance, direct eye contact. Handling difficult interaction with ${difficult} visible in background or partial frame. Dynamic lighting with slight contrast showing significance of moment. ${protagonist}'s expression shows concentration and confidence. Environment suggests real workplace pressure - others watching, time constraint visible (clock or calendar).`
      },

      resolution: {
        shot: 'wide_shot',
        subject: `${protagonist} with team`,
        action: 'successful outcome, collaborative atmosphere',
        emotion: 'relief',
        lighting: 'Bright, uplifting natural light',
        composition: 'Balanced composition with multiple people',
        fullDirection: `WIDE SHOT: ${protagonist} with team in positive interaction. Open body language all around - smiles, relaxed postures. Collaborative atmosphere evident. Bright natural lighting (window visible) creates uplifting mood. ${difficult} now engaged positively, showing transformation. Others visible showing approval or support. Workspace shows productivity - whiteboards with solutions, collaborative tools in use. Wide framing shows full context of success.`
      },

      action: {
        shot: 'medium_shot',
        subject: protagonist,
        action: 'determined, ready to act',
        emotion: 'determination',
        lighting: 'Forward-facing lighting, energizing',
        composition: 'Facing forward, action-oriented posture',
        fullDirection: `MEDIUM SHOT: ${protagonist} with determined expression, ready to apply learning. Leaning slightly forward (action-oriented). Looking toward the future (frame right). Bright, energizing forward lighting. May be walking or in motion to suggest momentum. Workplace visible but transitioning (suggests moving from learning to application). Expression combines confidence with purposeful determination. Perhaps holding notebook or phone with action plan visible.`
      }
    };

    const direction = directions[sceneType] || this.getDefaultDirection(protagonist, emotion);
    
    console.log(`   🎬 Shot Type: ${direction.shot}`);
    console.log(`   🎭 Key Emotion: ${direction.emotion}`);
    console.log(`   📝 Direction: ${direction.fullDirection.substring(0, 80)}...`);

    return direction;
  }

  /**
   * Get default direction for unknown scene types
   */
  private getDefaultDirection(protagonist: string, emotion: Emotion): CinematicDirection {
    return {
      shot: 'medium_shot',
      subject: protagonist,
      action: 'engaged in realistic workplace activity',
      emotion,
      lighting: 'Natural office lighting',
      composition: 'Rule of thirds, authentic setting',
      fullDirection: `MEDIUM SHOT: ${protagonist} in authentic workplace setting showing ${emotion}. Natural office lighting, realistic environment. Rule of thirds composition. Authentic, not posed.`
    };
  }

  /**
   * Generate visual for interaction scene
   */
  generateInteractionVisual(
    interactionType: string,
    characters: { protagonist?: Character },
    context: string
  ): string {
    const protagonist = characters.protagonist?.name || 'the learner';

    const interactionVisuals: Record<string, string> = {
      'branching_scenario': `MEDIUM SHOT: ${protagonist} at decision point, multiple paths visible. Split-screen or decision tree visual in background. Thoughtful expression, weighing options. Professional setting with real workplace elements.`,
      
      'conversation_simulator': `TWO SHOT: ${protagonist} in conversation practice. Speech bubbles or dialogue options visible. Realistic workplace meeting room. Both characters visible, showing interaction dynamics. Natural lighting, authentic expressions.`,
      
      'procedural_demo': `WIDE SHOT: ${protagonist} following step-by-step demonstration. Numbered steps visible in environment or overlay. Hands-on activity in progress. Professional setting with tools/materials visible. Clear view of process.`,
      
      'timeline_sequencing': `MEDIUM SHOT: ${protagonist} arranging sequence. Timeline or flowchart visual prominent. Thoughtful concentration. Workspace showing organizational tools. Clean but realistic environment.`,
      
      'decision_tree': `${protagonist} following decision flowchart. Tree structure visible in environment. Multiple paths shown with clear decision nodes. Professional analytical setting.`,
      
      'case_study_analysis': `${protagonist} reviewing case documents. Real materials visible - reports, data, notes. Analytical expression. Realistic office with reference materials.`,
      
      'reflection_journal': `CLOSE UP: ${protagonist} in reflective moment. Thoughtful expression, perhaps writing or pausing. Soft lighting. Private workspace. Introspective mood.`
    };

    const visual = interactionVisuals[interactionType] || 
      `${protagonist} engaged in ${interactionType} interaction. Realistic workplace setting. Authentic, focused expression.`;

    console.log(`   🎬 Interaction Visual: ${visual.substring(0, 60)}...`);

    return visual;
  }

  /**
   * Get emotion for scene type
   */
  getEmotionForSceneType(sceneType: SceneType): Emotion {
    const emotionMap: Record<SceneType, Emotion> = {
      'hook': 'tension',
      'character_intro': 'determination',
      'conflict': 'frustration',
      'teaching': 'aha_moment',
      'breakthrough': 'aha_moment',
      'climax': 'confidence',
      'resolution': 'relief',
      'action': 'determination'
    };

    return emotionMap[sceneType] || 'confidence';
  }
}

export default VisualDirectorAgent;


