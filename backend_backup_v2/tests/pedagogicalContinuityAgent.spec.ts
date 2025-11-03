/**
 * Unit tests for Pedagogical Continuity Agent
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PedagogicalContinuityAgent } from '../src/agents/pedagogicalContinuityAgent';
import type { 
  StoryboardModule, 
  StoryboardScene, 
  PedagogicalBlueprint,
  ContinuityReport 
} from '../../packages/shared/src/types';

describe('PedagogicalContinuityAgent', () => {
  let agent: PedagogicalContinuityAgent;
  let mockStoryboard: StoryboardModule;
  let mockBlueprint: PedagogicalBlueprint;

  beforeEach(() => {
    agent = new PedagogicalContinuityAgent();
    
    // Mock pedagogical blueprint
    mockBlueprint = {
      id: 'test-blueprint-1',
      learning_objectives: [
        { id: 'lo-1', description: 'Understand communication principles' },
        { id: 'lo-2', description: 'Apply active listening skills' }
      ],
      segments: [],
      total_duration: 30,
      pedagogical_strategy: 'scaffolded-progressive',
      strategy: 'scaffolded-progressive',
      learningObjectiveFlow: [],
      repetitionGuards: [],
      clientTerminology: {}
    };

    // Mock storyboard with scenes
    mockStoryboard = {
      id: 'test-storyboard-1',
      title: 'Test Module',
      scenes: [],
      metadata: {}
    };
  });

  describe('validate', () => {
    it('should detect example without preceding teach', async () => {
      // Arrange: Create scenes with example before teaching
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Introduction',
          pedagogical_purpose: 'example',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Here is an example of communication' },
          narrationScript: 'Here is an example of communication',
          onScreenText: 'Example scene without teaching'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Teaching',
          pedagogical_purpose: 'teach',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Let me teach you about communication' },
          narrationScript: 'Let me teach you about communication',
          onScreenText: 'Teaching scene'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].type).toBe('pedagogical-sequence');
      expect(report.issues[0].description).toContain('example without preceding teaching');
      expect(report.issues[0].severity).toBe('high');
      expect(report.requiresRegeneration).toBe(true);
    });

    it('should detect 3 consecutive scenarios', async () => {
      // Arrange: Create 3 consecutive scenario scenes
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Scenario 1',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'First scenario' },
          narrationScript: 'First scenario',
          onScreenText: 'Scenario 1 content'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Scenario 2',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Second scenario' },
          narrationScript: 'Second scenario',
          onScreenText: 'Scenario 2 content'
        } as StoryboardScene,
        {
          sceneNumber: 3,
          pageTitle: 'Scenario 3',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Third scenario' },
          narrationScript: 'Third scenario',
          onScreenText: 'Scenario 3 content'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].type).toBe('repetition');
      expect(report.issues[0].description).toContain('consecutive scenario scenes');
      expect(report.issues[0].severity).toBe('medium');
      expect(report.issues[0].scenes).toEqual([1, 2, 3]);
    });

    it('should detect character repetition', async () => {
      // Arrange: Create scenes with repeated character "Alex"
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Scene 1',
          pedagogical_purpose: 'teach',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Alex explains the concept' },
          narrationScript: 'Alex explains the concept',
          onScreenText: 'Alex teaches about communication'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Scene 2',
          pedagogical_purpose: 'example',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Alex demonstrates the skill' },
          narrationScript: 'Alex demonstrates the skill',
          onScreenText: 'Alex shows an example'
        } as StoryboardScene,
        {
          sceneNumber: 3,
          pageTitle: 'Scene 3',
          pedagogical_purpose: 'practice',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Alex guides the practice' },
          narrationScript: 'Alex guides the practice',
          onScreenText: 'Alex helps with practice'
        } as StoryboardScene,
        {
          sceneNumber: 4,
          pageTitle: 'Scene 4',
          pedagogical_purpose: 'assessment',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Alex evaluates the assessment' },
          narrationScript: 'Alex evaluates the assessment',
          onScreenText: 'Alex reviews the assessment'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].type).toBe('character-repetition');
      expect(report.issues[0].description).toContain('appears in 4 scenes');
      expect(report.issues[0].severity).toBe('medium');
    });

    it('should detect no teaching in first 3 scenes', async () => {
      // Arrange: Create scenes without teaching in first 3
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Introduction',
          pedagogical_purpose: 'example',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Introduction' },
          narrationScript: 'Introduction',
          onScreenText: 'Welcome'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Overview',
          pedagogical_purpose: 'example',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Overview' },
          narrationScript: 'Overview',
          onScreenText: 'Overview content'
        } as StoryboardScene,
        {
          sceneNumber: 3,
          pageTitle: 'Scenario',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Scenario' },
          narrationScript: 'Scenario',
          onScreenText: 'Scenario content'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].type).toBe('pedagogical-sequence');
      expect(report.issues[0].description).toContain('No teaching content found in the first 3 scenes');
      expect(report.issues[0].severity).toBe('high');
    });

    it('should pass validation for well-structured storyboard', async () => {
      // Arrange: Create properly structured scenes
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Teaching',
          pedagogical_purpose: 'teach',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Teaching content' },
          narrationScript: 'Teaching content',
          onScreenText: 'Learn about communication'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Example',
          pedagogical_purpose: 'example',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Example with Alex' },
          narrationScript: 'Example with Alex',
          onScreenText: 'Alex demonstrates communication'
        } as StoryboardScene,
        {
          sceneNumber: 3,
          pageTitle: 'Practice',
          pedagogical_purpose: 'practice',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Practice with Jordan' },
          narrationScript: 'Practice with Jordan',
          onScreenText: 'Jordan practices communication'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.issues).toHaveLength(0);
      expect(report.requiresRegeneration).toBe(false);
      expect(report.overallScore).toBe(100);
      expect(report.summary).toContain('Excellent continuity');
    });

    it('should calculate overall score correctly', async () => {
      // Arrange: Create scenes with multiple issues
      const scenes: StoryboardScene[] = [
        {
          sceneNumber: 1,
          pageTitle: 'Example',
          pedagogical_purpose: 'example', // Issue: example without teaching
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Example' },
          narrationScript: 'Example',
          onScreenText: 'Example content'
        } as StoryboardScene,
        {
          sceneNumber: 2,
          pageTitle: 'Scenario 1',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Scenario 1' },
          narrationScript: 'Scenario 1',
          onScreenText: 'Scenario 1 content'
        } as StoryboardScene,
        {
          sceneNumber: 3,
          pageTitle: 'Scenario 2',
          pedagogical_purpose: 'scenario',
          screenLayout: { type: 'full', elements: [] },
          audio: { script: 'Scenario 2' },
          narrationScript: 'Scenario 2',
          onScreenText: 'Scenario 2 content'
        } as StoryboardScene
      ];
      mockStoryboard.scenes = scenes;

      // Act
      const report: ContinuityReport = await agent.validate(mockStoryboard, mockBlueprint);

      // Assert
      expect(report.overallScore).toBeLessThan(100);
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.summary).toContain('Continuity score');
    });
  });

  describe('proposeRepairs', () => {
    it('should return repair recommendations', () => {
      // Arrange
      const report: ContinuityReport = {
        issues: [
          {
            type: 'pedagogical-sequence',
            description: 'Example without teaching',
            severity: 'high',
            scenes: [1],
            recommendation: 'Add teaching content before example'
          }
        ],
        requiresRegeneration: true,
        overallScore: 70,
        summary: 'Issues found'
      };

      // Act
      const repairs = agent.proposeRepairs(report);

      // Assert
      expect(repairs).toHaveLength(2); // 1 issue + 1 critical regeneration notice
      expect(repairs[0]).toContain('CRITICAL');
      expect(repairs[0]).toContain('Regeneration required');
      expect(repairs[1]).toContain('HIGH');
      expect(repairs[1]).toContain('Add teaching content before example');
    });
  });
});
