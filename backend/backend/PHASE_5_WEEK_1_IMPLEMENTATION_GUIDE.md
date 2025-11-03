# Phase 5 Week 1 - Implementation Guide

## ✅ **TASK 1: Update All Agents with safeJSONParse()**

### **Status:** 
- ✅ welcomeAgent.ts - **COMPLETE**
- ⚠️ Remaining 7 files need updates

### **Files to Update:**

Apply these changes to each file:

#### **1. Add Import Statement**
Add to top of file with other imports:
```typescript
import { safeJSONParse } from "../utils/safeJSONParse";
```

#### **2. Replace All JSON.parse() Calls**
Find and replace pattern:
```typescript
// OLD:
const parsed = JSON.parse(content);
const data = JSON.parse(response);
JSON.parse(aiResponse)

// NEW:
const parsed = safeJSONParse(content);
const data = safeJSONParse(response);
safeJSONParse(aiResponse)
```

### **Affected Files:**
1. ✅ `/backend/src/agents_v2/welcomeAgent.ts` - DONE
2. ⚠️ `/backend/src/agents_v2/teachAgent.ts` - ~2 instances
3. ⚠️ `/backend/src/agents_v2/applyAgent.ts` - ~1 instance
4. ⚠️ `/backend/src/agents_v2/summaryAgent.ts` - ~1 instance
5. ⚠️ `/backend/src/agents_v2/qaAgent.ts` - ~1 instance
6. ⚠️ `/backend/src/agents_v2/outcomeAnalysisAgent.ts` - ~1 instance
7. ⚠️ `/backend/src/agents_v2/directorAgent.ts` - ~1 instance
8. ⚠️ `/backend/src/agents_v2/enhancedTeachAgent.ts` - ~1 instance
9. ⚠️ `/backend/src/agents_v2/interactivityOrchestrator.ts` - ~1 instance

### **Find/Replace Commands:**
```bash
# Run from backend/backend directory
cd /Users/chris/genesis-app/backend/backend

# Find all JSON.parse usages
grep -rn "JSON\.parse" src/agents_v2/

# For each file, add import and replace JSON.parse with safeJSONParse
```

---

## ✅ **TASK 2: Create Missing Interaction Builders**

### **Directory Structure:**
```
/backend/src/agents/builders/
├── TimelineSequencing.ts
├── ProceduralDemo.ts
├── BranchingScenario.ts  
├── ConversationSimulator.ts
├── CaseStudyAnalysis.ts
└── DecisionTree.ts
```

### **Builder Template:**

Each builder follows this pattern:

```typescript
// backend/src/agents/builders/[BuilderName].ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * [BuilderName] Builder
 * [Description of interaction type]
 */
export class [BuilderName]Builder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "[interaction_type]",
      title: `[Title]: ${scene.pageTitle}`,
      interactionSteps: [
        "[Step 1]",
        "[Step 2]",
        "[Step 3]"
      ],
      feedbackRules: {
        correct: "[Positive feedback]",
        incorrect: "[Corrective feedback]",
        neutral: "[Neutral feedback]"
      },
      accessibilityNotes: "[Keyboard navigation instructions]",
      imagePrompt: `[Visual description for ${scene.pageTitle}]`,
      templateData: {
        // Type-specific data
      }
    };
  }
}
```

### **Specific Implementations:**

#### **1. TimelineSequencing.ts**
```typescript
export class TimelineSequencingBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const steps = this.extractSteps(scene.onScreenText || scene.learningOutcome);
    
    return {
      type: "timeline_sequencing",
      title: `Sequence: ${scene.pageTitle}`,
      interactionSteps: [
        "Drag the steps into the correct order",
        "Review the sequence carefully",
        "Submit to check your answer"
      ],
      feedbackRules: {
        correct: "Excellent! You've sequenced the steps correctly.",
        incorrect: "Not quite. Review the logical order and try again."
      },
      accessibilityNotes: "Use Tab to navigate steps. Space to select. Arrow keys to reorder. Enter to submit.",
      imagePrompt: `Timeline interface showing sequential steps for ${scene.pageTitle}`,
      templateData: {
        steps: steps.map((step, index) => ({
          id: `step-${index + 1}`,
          order: index + 1,
          label: step,
          description: `Step ${index + 1} in the process`
        })),
        requireCorrectOrder: true,
        showHints: true
      }
    };
  }
  
  private extractSteps(text: string): string[] {
    // Extract numbered steps or create default steps
    const matches = text.match(/\d+[.)]\s*([^\n]+)/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/^\d+[.)]\s*/, '').trim());
    }
    return [
      "Identify the situation",
      "Analyze the options",
      "Make a decision",
      "Implement and reflect"
    ];
  }
}
```

#### **2. ProceduralDemo.ts**
```typescript
export class ProceduralDemoBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "procedural_demo",
      title: `Learn: ${scene.pageTitle}`,
      interactionSteps: [
        "Watch the step-by-step demonstration",
        "Practice each step yourself",
        "Complete the guided practice"
      ],
      feedbackRules: {
        correct: "Great work! You've mastered this procedure.",
        neutral: "Follow along with the demonstration."
      },
      accessibilityNotes: "Use Tab to navigate steps. Enter to advance. Space to pause/play.",
      imagePrompt: `Step-by-step demonstration interface for ${scene.pageTitle}`,
      templateData: {
        steps: this.generateDemoSteps(scene),
        interactive: true,
        allowPractice: true,
        showTips: true
      }
    };
  }
  
  private generateDemoSteps(scene: Scene) {
    return [
      { step: 1, title: "Setup", description: "Prepare the necessary materials", visual: "Setup illustration" },
      { step: 2, title: "Execute", description: "Follow the procedure", visual: "Action illustration" },
      { step: 3, title: "Verify", description: "Check the results", visual: "Verification illustration" }
    ];
  }
}
```

#### **3. BranchingScenario.ts**
```typescript
export class BranchingScenarioBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "branching_scenario",
      title: `Scenario: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the scenario carefully",
        "Consider each choice and its consequences",
        "Make your decision",
        "See the outcome and get coaching feedback"
      ],
      feedbackRules: {
        correct: "Excellent decision! This approach leads to positive outcomes.",
        incorrect: "This choice has challenges. Review the feedback.",
        neutral: "Each path has trade-offs. Consider the context."
      },
      accessibilityNotes: "Use Tab to navigate choices. Enter to select your decision.",
      imagePrompt: `Branching scenario interface for ${scene.pageTitle} with decision tree`,
      templateData: {
        scenario: this.generateScenario(scene),
        branches: this.generateBranches(),
        allowReset: true,
        trackChoices: true
      }
    };
  }
  
  private generateScenario(scene: Scene) {
    return {
      context: `A situation related to ${scene.learningOutcome || scene.pageTitle}`,
      challenge: "You must make a decision that will impact the outcome",
      stakes: "Your choice will affect team dynamics and project success"
    };
  }
  
  private generateBranches() {
    return [
      {
        id: "branch-1",
        choice: "Take immediate action",
        outcome: "Quick resolution but potential oversight",
        consequence: "The situation is resolved quickly, but you may have missed important context.",
        coaching: "Quick action can be effective, but ensure you have all the information first."
      },
      {
        id: "branch-2",
        choice: "Consult with the team",
        outcome: "Collaborative solution with buy-in",
        consequence: "The team feels valued and you gain multiple perspectives.",
        coaching: "Collaboration leads to stronger solutions and team engagement."
      },
      {
        id: "branch-3",
        choice: "Gather more information",
        outcome: "Well-informed decision but delayed",
        consequence: "You have comprehensive information, but the delay creates some urgency.",
        coaching: "Balance thoroughness with timeliness in decision-making."
      }
    ];
  }
}
```

#### **4-6. Quick Templates**

**ConversationSimulator.ts:**
```typescript
export class ConversationSimulatorBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "conversation_simulator",
      title: `Practice: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the conversation context",
        "Select your response from options",
        "See how the other person reacts",
        "Continue the conversation"
      ],
      templateData: {
        conversationFlow: [],
        personas: [],
        responseOptions: []
      }
    };
  }
}
```

**CaseStudyAnalysis.ts:**
```typescript
export class CaseStudyAnalysisBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "case_study_analysis",
      title: `Analyze: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the case study",
        "Answer analysis questions",
        "Compare with expert analysis"
      ],
      templateData: {
        caseStudy: { title: "", context: "", challenge: "" },
        questions: [],
        expertAnalysis: ""
      }
    };
  }
}
```

**DecisionTree.ts:**
```typescript
export class DecisionTreeBuilder {
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    return {
      type: "decision_tree",
      title: `Decide: ${scene.pageTitle}`,
      interactionSteps: [
        "Follow the decision tree",
        "Answer each question",
        "Reach your recommendation"
      ],
      templateData: {
        rootNode: { question: "", options: [] },
        nodes: [],
        outcomes: []
      }
    };
  }
}
```

### **Update interactivityBuilders.ts Registry:**

Add to `BUILDER_REGISTRY`:
```typescript
import { TimelineSequencingBuilder } from './builders/TimelineSequencing';
import { ProceduralDemoBuilder } from './builders/ProceduralDemo';
import { BranchingScenarioBuilder } from './builders/BranchingScenario';
import { ConversationSimulatorBuilder } from './builders/ConversationSimulator';
import { CaseStudyAnalysisBuilder } from './builders/CaseStudyAnalysis';
import { DecisionTreeBuilder } from './builders/DecisionTree';

const timelineBuilder = new TimelineSequencingBuilder();
const proceduralBuilder = new ProceduralDemoBuilder();
const branchingBuilder = new BranchingScenarioBuilder();
const conversationBuilder = new ConversationSimulatorBuilder();
const caseStudyBuilder = new CaseStudyAnalysisBuilder();
const decisionTreeBuilder = new DecisionTreeBuilder();

const BUILDER_REGISTRY: Record<string, BuilderFunction> = {
  // ... existing builders
  'timeline_sequencing': (scene, decision) => timelineBuilder.build(scene, decision),
  'procedural_demo': (scene, decision) => proceduralBuilder.build(scene, decision),
  'branching_scenario': (scene, decision) => branchingBuilder.build(scene, decision),
  'conversation_simulator': (scene, decision) => conversationBuilder.build(scene, decision),
  'case_study_analysis': (scene, decision) => caseStudyBuilder.build(scene, decision),
  'decision_tree': (scene, decision) => decisionTreeBuilder.build(scene, decision),
};
```

---

## ✅ **TASK 3: Enhanced Prompt Templates**

### **Create New File:** `/backend/src/prompts/agentPrompts.ts`

```typescript
// backend/src/prompts/agentPrompts.ts

/**
 * Enhanced Agent Prompts - Phase 5
 * 
 * These prompts enforce:
 * - Narrative structure
 * - Emotional hooks
 * - Character/context
 * - Plain JSON only (NO markdown)
 * - Brandon Hall award-level quality
 */

export const ENHANCED_PROMPTS = {
  
  welcomeAgent: (topic: string, audience: string, outcomes: string[]) => `
You are an award-winning instructional designer creating an eLearning experience.

TOPIC: ${topic}
AUDIENCE: ${audience}
LEARNING OUTCOMES:
${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}

CREATE EXACTLY 2 WELCOME SCENES:

SCENE 1 - EMOTIONAL HOOK:
- Start with a relatable problem or challenge the audience faces
- Create emotional connection ("Have you ever struggled with...")
- Show what's at stake if they don't master this
- NO generic "Welcome to this module" openings
- Use second person ("You will...")

SCENE 2 - BENEFITS & JOURNEY:
- Show the transformation they'll experience
- Highlight specific, tangible benefits
- Create curiosity about what's ahead
- Navigation instructions (arrows, play/pause, headphones)
- Keep on-screen text ≤ 70 words

STRICT OUTPUT RULES:
❌ DO NOT wrap output in markdown code blocks
❌ DO NOT use \`\`\`json formatting
✅ Return ONLY valid JSON
✅ Use UK English spelling
✅ Professional but warm tone

JSON STRUCTURE:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "[Emotional hook title]",
      "on_screen_text": "[Hook text]",
      "narration_script": "[Engaging narration 150-200 words]",
      "visual_ai_prompt": "[Specific visual description]",
      "alt_text": "[Accessibility description]"
    },
    {
      "scene_number": 2,
      "title": "[Benefits title]",
      "on_screen_text": "[Benefits text ≤70 words]",
      "narration_script": "[Engaging narration 150-200 words]",
      "visual_ai_prompt": "[Specific visual description]",
      "alt_text": "[Accessibility description]"
    }
  ]
}
`.trim(),

  teachAgent: (topic: string, outcome: string, audience: string) => `
You are a master educator creating story-based learning content.

TOPIC: ${topic}
LEARNING OUTCOME: ${outcome}
AUDIENCE: ${audience}

CREATE A TEACHING SCENE USING NARRATIVE STRUCTURE:

MANDATORY ELEMENTS:
1. CHARACTER/PERSONA:
   - Create a relatable character facing this challenge
   - Make them similar to the audience
   - Show their initial struggle

2. TEACHING PRINCIPLE:
   - Present the key concept or technique clearly
   - Use the character's journey to illustrate it
   - Show before/after contrast

3. REALISTIC EXAMPLE:
   - Ground it in real workplace context
   - Show practical application
   - Demonstrate immediate benefit

4. EMOTIONAL RESONANCE:
   - Connect to audience's daily challenges
   - Show "aha moment" for character
   - Build confidence for learner

STRICT OUTPUT RULES:
❌ NO markdown code blocks
❌ NO \`\`\`json formatting
❌ NO generic lectures or bullet points
✅ Return ONLY valid JSON
✅ Story-first approach
✅ 150-200 word narration

JSON STRUCTURE:
{
  "scene_number": 1,
  "title": "[Engaging title with character or scenario]",
  "on_screen_text": "[Key points 40-60 words]",
  "narration_script": "[Story-based teaching 150-200 words]",
  "visual_ai_prompt": "[Specific visual showing character/scenario]",
  "alt_text": "[Accessibility description]",
  "character": {
    "name": "[Name]",
    "role": "[Role]",
    "challenge": "[What they struggle with]"
  }
}
`.trim(),

  applyAgent: (topic: string, outcome: string) => `
You are creating a realistic scenario for skill application.

TOPIC: ${topic}
LEARNING OUTCOME: ${outcome}

CREATE AN APPLICATION SCENE:

SCENARIO REQUIREMENTS:
1. REALISTIC CONTEXT:
   - Workplace situation the learner will actually face
   - Specific details that make it believable
   - Clear challenge that requires the learned skill

2. DECISION POINT:
   - Present a dilemma or choice
   - Multiple reasonable options
   - No single "obviously correct" answer

3. STAKES:
   - Show what happens with good/poor choices
   - Real consequences (not just "try again")
   - Connect to real outcomes

4. COACHING:
   - Guide thinking without giving away answers
   - Provide criteria for good decisions
   - Build confidence in application

STRICT OUTPUT RULES:
❌ NO markdown formatting
❌ NO code blocks
✅ Return ONLY valid JSON
✅ Realistic scenario
✅ 150-200 word narration

JSON STRUCTURE:
{
  "scene_number": 1,
  "title": "[Scenario title]",
  "on_screen_text": "[Scenario context 40-60 words]",
  "narration_script": "[Detailed scenario 150-200 words]",
  "visual_ai_prompt": "[Realistic workplace visual]",
  "alt_text": "[Accessibility description]",
  "scenario": {
    "context": "[Situation]",
    "challenge": "[Dilemma]",
    "stakes": "[Why it matters]"
  }
}
`.trim(),

  summaryAgent: (topic: string, outcomes: string[]) => `
You are creating a powerful summary that reinforces learning and inspires action.

TOPIC: ${topic}
LEARNING OUTCOMES COVERED:
${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}

CREATE 2 SUMMARY SCENES:

SCENE 1 - TRANSFORMATION REVIEW:
- Show the journey from start to mastery
- Highlight key "aha moments"
- Connect learning to real application
- Celebrate progress

SCENE 2 - CALL TO ACTION:
- Specific next steps for application
- Challenge to use skills immediately
- Resources or support available
- Inspirational closing

STRICT OUTPUT RULES:
❌ NO markdown code blocks
❌ NO bullet-point lists only
✅ Return ONLY valid JSON
✅ Inspirational tone
✅ Action-oriented

JSON STRUCTURE:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "[Transformation title]",
      "on_screen_text": "[Key takeaways 40-60 words]",
      "narration_script": "[Celebration of learning 150-200 words]",
      "visual_ai_prompt": "[Journey/success visual]",
      "alt_text": "[Accessibility description]"
    },
    {
      "scene_number": 2,
      "title": "[Action title]",
      "on_screen_text": "[Next steps 40-60 words]",
      "narration_script": "[Call to action 150-200 words]",
      "visual_ai_prompt": "[Forward-looking visual]",
      "alt_text": "[Accessibility description]"
    }
  ]
}
`.trim()

};

/**
 * Get enhanced prompt for specific agent
 */
export function getEnhancedPrompt(
  agentName: 'welcomeAgent' | 'teachAgent' | 'applyAgent' | 'summaryAgent',
  params: any
): string {
  const promptGenerator = ENHANCED_PROMPTS[agentName];
  if (!promptGenerator) {
    throw new Error(`No enhanced prompt found for agent: ${agentName}`);
  }
  
  if (agentName === 'welcomeAgent') {
    return promptGenerator(params.topic, params.audience, params.outcomes);
  } else if (agentName === 'teachAgent') {
    return promptGenerator(params.topic, params.outcome, params.audience);
  } else if (agentName === 'applyAgent') {
    return promptGenerator(params.topic, params.outcome);
  } else if (agentName === 'summaryAgent') {
    return promptGenerator(params.topic, params.outcomes);
  }
  
  return '';
}
```

### **Update Agents to Use Enhanced Prompts:**

Example for `welcomeAgent.ts`:
```typescript
import { getEnhancedPrompt } from '../prompts/agentPrompts';

// In generate() method:
const enhancedPrompt = getEnhancedPrompt('welcomeAgent', {
  topic: req.topic,
  audience: req.audience || 'General staff',
  outcomes: this.pickOutcomes(req)
});

const finalPrompt = `${resetHeader}${enhancedPrompt}`;
```

---

## 📊 **IMPLEMENTATION CHECKLIST**

### **Week 1 Tasks:**
- ✅ safeJSONParse() utility created
- ✅ welcomeAgent.ts updated
- ⚠️ 7 more agents need safeJSONParse()
- ⚠️ 6 interaction builders need creation
- ⚠️ Enhanced prompts file needs creation
- ⚠️ Agents need to use enhanced prompts

### **Testing:**
```bash
# After updates, test with:
cd /Users/chris/genesis-app/backend/backend
npm test

# Or generate a storyboard and check logs for:
# ✅ No JSON.parse errors
# ✅ "safeJSONParse" in logs
# ✅ Narrative structure in scenes
# ✅ New interaction types appearing
```

---

## 🎯 **SUCCESS CRITERIA**

After Week 1 implementation:
1. ✅ Zero JSON parsing failures
2. ✅ 6 new interaction builders functional
3. ✅ Enhanced prompts generating narrative-rich content
4. ✅ All agents using safeJSONParse()
5. ✅ Storyboards show emotional hooks and character
6. ✅ No markdown-wrapped JSON in responses

---

**Phase 5 Week 1 Status**: 🔄 **IN PROGRESS**
- Foundation: ✅ Complete (safeJSONParse utility)
- Agent updates: 12.5% (1/8 agents)
- Builders: 0% (0/6 complete)
- Prompts: 0% (not started)

**Next Actions**: Complete remaining agent updates, then builders, then prompts.


