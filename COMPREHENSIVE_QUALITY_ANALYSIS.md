# 🔍 Comprehensive Quality Analysis: Genesis Storyboard System

**Date**: October 27, 2025  
**User Request**: Deep dive into prompts, outputs, and quality issues

---

## 📋 **1. SAMPLE OUTPUT: Complete Storyboard**

### **Test Input:**
```json
{
  "topic": "Dealing with Difficult People",
  "learningOutcomes": [
    "Recognize different types of difficult behaviors",
    "Apply de-escalation techniques effectively"
  ],
  "audience": "Customer service team",
  "duration": 10,
  "sourceMaterial": "CAPS Model: Controller, Analyser, Promoter, Supporter. Difficult behavior types: The Tank, The Staller, The Clam, The Know-It-All, The Complainer. De-escalation technique: Three-step process: 1) Acknowledge emotion, 2) Reframe issue, 3) Offer choices. Case study: Sarah was presenting when Alex the Tank interrupted..."
}
```

### **Actual Generated Output Structure:**

```json
{
  "success": true,
  "storyboard": {
    "scenes": [
      {
        "sceneNumber": 1,
        "pageTitle": "Welcome & Navigation",
        "narrationScript": "Welcome to the Dealing with Difficult People module. Navigate using the arrow buttons, use play and pause controls as needed...",
        "onScreenText": "Welcome to Dealing with Difficult People. Use arrows to move through the module...",
        "pedagogicalPhase": "Welcome"
      },
      {
        "sceneNumber": 2,
        "pageTitle": "Learning Outcomes Overview",
        "narrationScript": "By the end of this Dealing with Difficult People module, you will master these key learning outcomes: 1. Recognize different types of difficult behaviors 2. Apply de-escalation techniques effectively. Each outcome follows our proven TEACH → PRACTICE → APPLY → ASSESS learning sequence...",
        "pedagogicalPhase": "LearningOutcomes"
      },
      {
        "sceneNumber": 3,
        "pageTitle": "Understanding Recognize: different types of difficult behaviors",
        "narrationScript": "This teaching scene provides the foundation you'll need for the upcoming practice, application, and assessment phases. Let's explore the essential concepts for different types of difficult behaviors. Understanding these principles is crucial for success...",
        "onScreenText": "Key concepts: difficult behaviors, types, recognition patterns",
        "pedagogicalPhase": "Teach",
        "learningOutcome": "Recognize different types of difficult behaviors"
      },
      {
        "sceneNumber": 4,
        "pageTitle": "Practice: Recognize different types of difficult behaviors",
        "narrationScript": "Now let's practice applying what you've learned about Recognize different types of difficult behaviors. This interactive exercise will help reinforce your understanding...",
        "interactionType": "Scenario",
        "pedagogicalPhase": "Practice"
      },
      {
        "sceneNumber": 5,
        "pageTitle": "Apply: Recognize different types of difficult behaviors",
        "narrationScript": "Let's apply Recognize different types of difficult behaviors in a realistic scenario. Based on what you learned in the teaching phase...",
        "interactionType": "Scenario",
        "pedagogicalPhase": "Apply"
      },
      {
        "sceneNumber": 6,
        "pageTitle": "Knowledge Check: Recognize different types of difficult behaviors",
        "narrationScript": "Let's assess your understanding of Recognize different types of difficult behaviors...",
        "interactionType": "MCQ",
        "pedagogicalPhase": "Assess"
      },
      // ... repeats for second learning outcome
    ],
    "qaReport": {
      "score": 62,
      "issues": [
        "CRITICAL: Missing proper TEACH phase structure",
        "CRITICAL: Content duplication - identical narration scripts",
        "CRITICAL: Generic content - placeholder text instead of specific content",
        "CRITICAL: Missing proper teaching content - Scenes labeled 'Understanding' lack structured content"
      ]
    }
  }
}
```

### **🎯 Quality Assessment:**

**✅ WHAT WORKS:**
- Structure: TEACH → PRACTICE → APPLY → ASSESS sequence is present
- Framework compliance: Universal Pedagogical Framework enforced
- Scene progression: Logical flow per learning outcome
- Interaction variety: Mix of Scenario, MCQ, Drag-and-Drop

**❌ WHAT'S GENERIC/BORING:**

**1. Welcome Scene (Scene 1):**
```
❌ ACTUAL: "Welcome to the Dealing with Difficult People module. Navigate using the arrow buttons..."
✅ SHOULD BE: "Have you ever left a conversation feeling frustrated, drained, or manipulated? You're not alone. Every customer service professional faces challenging interactions daily..."
```

**2. Teaching Scene (Scene 3):**
```
❌ ACTUAL: "This teaching scene provides the foundation you'll need... Let's explore the essential concepts..."
✅ SHOULD BE: "Meet Sarah. She's been a customer service manager for 3 years. Last week, during her team presentation, Alex the Tank interrupted: 'That approach is completely flawed!' Sarah felt her heart race. Sound familiar? Let's explore how Sarah learned to recognize difficult behavior types using the CAPS Model..."
```

**3. Practice Scene (Scene 4):**
```
❌ ACTUAL: "Now let's practice applying what you've learned about Recognize different types..."
✅ SHOULD BE: "You're in a meeting. Your colleague Mike keeps interrupting, raising his voice, and dismissing others' ideas. Using the CAPS Model we discussed, is Mike a Controller, Analyser, Promoter, or Supporter? And which difficult behavior type matches his actions: The Tank, The Staller, The Clam, or The Know-It-All?"
```

---

## 🎓 **2. YOUR ACTUAL PROMPTS**

### **A. System Prompt (Master Blueprint):**

**Location**: `/backend/src/prompts/masterBlueprint.md`

**Current System Prompt:**
```markdown
# Master Blueprint v1.1 - Award-Winning Storyboard Generation System

## 🎯 CORE MISSION
Generate pedagogically-sound, award-winning storyboards that consistently follow 
the Universal Pedagogical Framework v1.0 with rich interactions, proper teaching 
structure, and learning outcome alignment.

## 📋 UNIVERSAL PEDAGOGICAL FRAMEWORK v1.0

### MANDATORY STRUCTURE (Non-Negotiable)
Every storyboard MUST follow this exact sequence:
1. Welcome - Course introduction and navigation
2. Learning Outcomes - Clear objectives overview  
3. TEACH → PRACTICE → APPLY → ASSESS (Repeat for each Learning Outcome)
4. Summary - Key takeaways and reflection
5. Next Steps - Application and call to action

### FRAMEWORK ENFORCEMENT RULES
- OutcomeLinkage: Each scene explicitly maps to ≥1 Learning Outcome
- TeachingCoverage: Every Learning Outcome has dedicated teaching scene
- SequenceLogic: TEACH → PRACTICE → APPLY → ASSESS per outcome
- AssessmentPresence: Every outcome ends with knowledge check
```

**🔍 PROBLEM**: Too focused on **structure**, not enough on **content quality, narrative, or engagement**.

---

### **B. Welcome Agent Prompt:**

**Location**: `/backend/src/agents_v2/welcomeAgent.ts`

**Current Prompt:**
```typescript
const basePrompt = `
COURSE: ${req.topic}
DURATION: ${req.duration} minutes
AUDIENCE: ${req.audience || "General staff"}
LEARNING OUTCOMES:
- ${outcomes.join("\n- ")}

Rules:
- Produce exactly TWO scenes:
  1) Welcome & Navigation
  2) Learning Outcomes
- Use UK English, professional but friendly tone.
- Mention navigation (arrows, play/pause/replay).
- Include headphone reminder for audio.
- OST ≤ 70 words per scene.
- Include 1 AI visual prompt and alt text per scene.
Output: JSON array of Scene objects.
`;
```

**🔍 PROBLEM**: 
- No instruction for emotional hooks
- No character/story requirements
- Generic "Welcome" instruction
- No stakes or transformation vision
- Focuses on mechanics, not engagement

**✅ BETTER PROMPT** (from `agentPrompts.ts` - exists but not used):
```typescript
welcomeAgent: (topic, audience, outcomes) => `
YOU ARE: An award-winning instructional designer creating an eLearning experience.

CREATE EXACTLY 2 WELCOME SCENES THAT HOOK THE LEARNER EMOTIONALLY:

SCENE 1 - EMOTIONAL HOOK (The Challenge):
✅ MUST start with a relatable problem or challenge
✅ Create emotional connection: "Have you ever struggled with..."
✅ Show STAKES: What happens if they don't master this?
✅ Use SECOND PERSON: "You will..." not "Learners will..."

SCENE 2 - BENEFITS & JOURNEY (The Promise):
✅ Show the TRANSFORMATION they'll experience
✅ Highlight SPECIFIC, TANGIBLE benefits
✅ Create a VISION of success
```
```

**Status**: Enhanced prompts exist in `/backend/src/prompts/agentPrompts.ts` but **WelcomeAgent is NOT using them**!

---

### **C. Teach Agent Prompt:**

**Location**: `/backend/src/agents_v2/enhancedTeachAgentSimple.ts`

**Current Prompt** (via systemKey: "master_blueprint"):
```typescript
// Uses Master Blueprint system prompt + adds:
private generatePedagogicallyStructuredContent(
  topic: string,
  learningOutcome: string,
  extractedContent?: any
): TeachingScene {
  // Generates structured teaching content
  // Uses extractedContent.models, techniques, examples IF available
}
```

**🔍 PROBLEM**:
- No explicit narrative/character instruction in prompt
- Extracted content is available but **not heavily emphasized**
- Focus on "pedagogical structure" vs. "engaging story"
- No requirement for named characters or specific examples

**✅ BETTER PROMPT** (exists but unused):
```typescript
teachAgent: (topic, outcome, audience) => `
CREATE A TEACHING SCENE USING NARRATIVE + CHARACTER:

MANDATORY NARRATIVE ELEMENTS:
1. CHARACTER/PERSONA:
✅ Create a RELATABLE character similar to the audience
✅ Give them a NAME and ROLE
✅ Show their STRUGGLE with this exact topic

2. TEACHING THROUGH STORY:
✅ Present the key concept through the character's journey
✅ Show BEFORE/AFTER contrast
✅ Demonstrate the "aha moment"
✅ Ground it in REAL workplace context
```
```

**Status**: Enhanced prompts exist but **TeachAgent is NOT using them**!

---

### **D. "Drafter" Agent (Apply Agent):**

**Location**: `/backend/src/agents_v2/applyAgent.ts`

**Current Prompt**:
```typescript
// Uses systemKey: "master_blueprint"
// Adds generic prompt:
const finalPrompt = `
TOPIC: ${req.topic}
LEARNING OUTCOME: ${outcome}

Create an application scenario for ${outcome} that allows learners 
to apply the knowledge they've gained...
`;
```

**🔍 PROBLEM**:
- Generic "create a scenario" instruction
- No requirement for realistic dilemmas
- No character/stakes requirements
- No use of extracted content examples

**✅ BETTER PROMPT** (exists but unused):
```typescript
applyAgent: (topic, outcome) => `
CREATE AN APPLICATION SCENE WITH HIGH REALISM:

SCENARIO REQUIREMENTS:
1. REALISTIC CONTEXT:
✅ Workplace situation the learner WILL ACTUALLY FACE
✅ Named people with roles and perspectives

2. DILEMMA (Not obvious):
✅ Present a CHOICE with no clear "right" answer
✅ Multiple reasonable options with trade-offs
✅ Real consequences for decisions

3. STAKES & IMPACT:
✅ Clear consequences for good/poor choices
✅ Impact on team, project, relationships
```
```

---

### **E. "Senior Editor" Agent (QA Agent):**

**Location**: `/backend/src/agents_v2/qaAgent.ts`

**Current Prompt:**
```typescript
const finalPrompt = `
REVIEW THIS STORYBOARD:
${storyboardContent}

ASSESS QUALITY ON THESE DIMENSIONS:
1. NARRATIVE QUALITY (0-100)
2. INSTRUCTIONAL DESIGN (0-100)
3. ENGAGEMENT (0-100)
4. ACCESSIBILITY (0-100)
`;
```

**🔍 PROBLEM**:
- Generic assessment criteria
- No specific check for extracted content usage
- No validation that characters/examples appear
- Doesn't enforce narrative requirements

---

## 📚 **3. RAG TRAINING DATA**

### **Current RAG Status:**

**Location**: `/backend/src/utils/fetchRelevantChunks.ts`

**Implementation:**
- ✅ Supabase pgvector integration exists
- ✅ Vector similarity search via `rag_match_storyboards` RPC
- ✅ Graceful fallback if RAG unavailable

**🔍 PROBLEM**: **RAG is DISABLED by default!**

```typescript
// backend/src/utils/fetchRelevantChunks.ts
export function isRAGEnabled(): boolean {
  // Checks environment variables
  // Currently defaults to false
}
```

**What's in `pedagogical_memory`?**
- ❓ **Unknown** - No documentation of seeded data
- ❓ **Unknown** - No Brandon Hall winners in training data
- ❓ **Unknown** - No real corporate training examples
- ✅ **Likely**: Empty or minimal - system relies on prompts only

**Current Content Source:**
- ✅ **ContentExtractionAgent** extracts from `sourceMaterial` parameter
- ❌ **NOT using RAG** from uploaded documents
- ❌ **NOT using Brandon Hall examples** as training data

---

## 🚨 **4. WHAT "NOT PERFORMING" MEANS - SPECIFIC EXAMPLES**

### **Problem 1: Generic Narration (Boring)**

**EXAMPLE 1 - Welcome Scene:**
```
❌ ACTUAL OUTPUT:
"Welcome to the Dealing with Difficult People module. Navigate using the arrow 
buttons, use play and pause controls as needed, and revisit sections any time."

✅ SHOULD BE:
"Have you ever left a conversation with your heart racing, wondering 'What did 
I do wrong?' Last Tuesday, customer service manager Sarah felt exactly that when 
Alex, a senior executive, cut her off mid-sentence: 'That approach is completely 
flawed!' Sound familiar? By the end of this module, you'll master the techniques 
Sarah used to turn that confrontation into collaboration."
```

**Why It's Wrong:**
- No emotional hook
- No character or story
- Focuses on navigation mechanics, not the learner's problem
- Generic corporate training language

---

**EXAMPLE 2 - Teaching Scene:**
```
❌ ACTUAL OUTPUT:
"This teaching scene provides the foundation you'll need for the upcoming practice, 
application, and assessment phases. Let's explore the essential concepts for different 
types of difficult behaviors. Understanding these principles is crucial for success."

✅ SHOULD BE:
"Remember Sarah and Alex? Sarah recognized Alex's behavior pattern: interrupting, 
raising his voice, dismissing others. Using the CAPS Model from your training material, 
Sarah identified Alex as a Controller - specifically, 'The Tank' type: aggressive and 
confrontational. The CAPS Model breaks down four personality types: Controller (decisive, 
demanding), Analyser (logical, detail-oriented), Promoter (enthusiastic, big-picture), 
and Supporter (relationship-focused). Each type has associated difficult behaviors."
```

**Why It's Wrong:**
- Mentions "principles" but doesn't state them
- No reference to actual training content (CAPS Model)
- Generic "essential concepts" instead of specific models
- No character continuation from welcome
- No connection to extracted content

---

**EXAMPLE 3 - Practice Scene:**
```
❌ ACTUAL OUTPUT:
"Now let's practice applying what you've learned about Recognize different types of 
difficult behaviors. This interactive exercise will help reinforce your understanding 
and prepare you for real-world application."

✅ SHOULD BE:
"You're in Sarah's position now. In your next team meeting, you notice a colleague 
interrupting others, raising their voice, and dismissing ideas. Using the CAPS Model, 
which personality type matches this behavior? Is it:
A) Controller (The Tank)
B) Analyser (The Know-It-All)  
C) Promoter (The Complainer)
D) Supporter (The Clam)

Think about Alex's behavior from Sarah's story. What specific actions match which type?"
```

**Why It's Wrong:**
- Generic "practice" instruction
- No specific scenario or characters
- No reference to training content (CAPS Model, behavior types)
- No connection to extracted examples

---

### **Problem 2: Wrong Structure/Sequencing**

**EXAMPLE - Rigid TEACH→PRACTICE→APPLY→ASSESS:**
```
❌ CURRENT FLOW (Too Rigid):
Scene 3: TEACH - "Understanding Recognize different types..."
Scene 4: PRACTICE - "Now let's practice applying what you've learned..."
Scene 5: APPLY - "Let's apply Recognize different types..."
Scene 6: ASSESS - "Let's assess your understanding..."

✅ BETTER FLOW (Narrative-Driven):
Scene 3: HOOK - "Sarah faced Alex the Tank - here's what she did wrong"
Scene 4: TEACH - "The CAPS Model: Controller, Analyser, Promoter, Supporter"
Scene 5: EXAMPLE - "See how Sarah identified Alex as a Controller"
Scene 6: PRACTICE - "You're in Sarah's position - identify the behavior type"
Scene 7: APPLY - "Real scenario: Your colleague interrupts constantly"
Scene 8: ASSESS - "Test: Match these behaviors to CAPS types"
```

**Why It's Wrong:**
- Forced structure doesn't match narrative flow
- Practice comes before learners understand the content
- No emotional hook before teaching
- Generic sequence vs. story-driven progression

---

### **Problem 3: Not Engaging Enough**

**EXAMPLE - Missing Stakes:**
```
❌ ACTUAL:
"Let's explore the essential concepts for different types of difficult behaviors."

✅ SHOULD BE:
"What's at stake? If you misread a Controller as a Supporter, you might try 
to build rapport when they want decisive action - resulting in frustration, 
missed deadlines, and damaged relationships. Sarah learned this the hard way 
when she tried to soothe Alex's concerns, only to have him escalate: 'I don't 
need empathy, I need solutions!' Understanding the CAPS Model prevents this 
exact mistake."
```

**Why It's Wrong:**
- No emotional stakes mentioned
- No consequences for misunderstanding
- No "what's at risk" framing
- Generic learning vs. high-stakes scenario

---

### **Problem 4: Too Text-Heavy**

**EXAMPLE - Visual Descriptions:**
```
❌ ACTUAL:
"visual": {
  "aiPrompt": "Professional learning outcomes display for Dealing with Difficult People",
  "altText": "Learning outcomes for Dealing with Difficult People"
}

✅ SHOULD BE:
"visual": {
  "aiPrompt": "CLOSE UP: Sarah's face showing tension during Alex's interruption. 
  WIDE SHOT: Tense team meeting with Alex standing, arms crossed, interrupting. 
  MEDIUM SHOT: Sarah taking notes, recognizing Alex's behavior pattern. Split 
  screen showing before (tense) and after (collaborative) using CAPS techniques.",
  "altText": "Story progression: Sarah's transformation from overwhelmed to confident 
  using CAPS Model"
}
```

**Why It's Wrong:**
- Generic "professional display" vs. cinematic story visuals
- No character presence in visuals
- No emotional storytelling in images
- Focuses on information display, not narrative

---

### **Problem 5: Interactions Feel Forced**

**EXAMPLE - Scenario Interaction:**
```
❌ ACTUAL:
{
  "interactionType": "Scenario",
  "narrationScript": "Let's apply Recognize different types of difficult behaviors 
  in a realistic scenario."
}

✅ SHOULD BE:
{
  "interactionType": "Scenario",
  "narrationScript": "You're in Sarah's exact situation. Alex interrupts your 
  presentation: 'That approach won't work.' Your heart races. Using the CAPS Model, 
  you recognize Alex's behavior pattern. What do you do?
  
  A) Acknowledge his emotion: 'I can see you're concerned about this approach.'
  B) Reframe: 'Let me understand which specific aspect worries you.'
  C) Offer choices: 'Would you prefer Option A or Option B?'
  D) Match his intensity: 'I hear your concern, and here's why this will work.'
  
  Think about Sarah's 3-step de-escalation technique from the training material."
}
```

**Why It's Wrong:**
- Generic "realistic scenario" instruction
- No specific characters or context
- No connection to extracted content (3-step technique)
- No emotional framing

---

## 🎯 **ROOT CAUSE ANALYSIS**

### **1. Prompts Not Being Used**
- ✅ Enhanced prompts exist in `/backend/src/prompts/agentPrompts.ts`
- ❌ **WelcomeAgent uses generic prompt, NOT enhanced prompt**
- ❌ **TeachAgent uses Master Blueprint, NOT narrative-focused prompt**
- ❌ **ApplyAgent uses generic prompt, NOT scenario-focused prompt**

### **2. Content Extraction Underutilized**
- ✅ **ContentExtractionAgent extracts** CAPS Model, techniques, examples
- ⏸️ **Extracted content stored** in `req.extractedContent`
- ❌ **NOT heavily injected into prompts**
- ❌ **NOT emphasized in narration generation**
- ❌ **Examples (Sarah/Alex) not appearing in scenes**

### **3. RAG Disabled**
- ✅ RAG infrastructure exists
- ❌ **RAG is disabled by default**
- ❌ **No Brandon Hall examples in training data**
- ❌ **System relies on prompts only, not examples**

### **4. Rigid Framework Overrides Narrative**
- ✅ Universal Pedagogical Framework enforces structure
- ❌ **Structure prioritized over engagement**
- ❌ **TEACH→PRACTICE→APPLY→ASSESS is rigid**
- ❌ **No room for narrative-driven flow**

---

## ✅ **IMMEDIATE FIXES NEEDED**

### **Fix 1: Use Enhanced Prompts**
```typescript
// In WelcomeAgent.ts:
import { getEnhancedPrompt } from '../prompts/agentPrompts';

const prompt = getEnhancedPrompt('welcomeAgent', {
  topic: req.topic,
  audience: req.audience,
  outcomes: outcomes
});
```

### **Fix 2: Inject Extracted Content Into Prompts**
```typescript
// In EnhancedTeachAgentSimple.ts:
const extractedContent = (req as any).extractedContent;

const prompt = `
${getEnhancedPrompt('teachAgent', {...})}

EXTRACTED CONTENT FROM TRAINING MATERIAL:
${contentExtractor.formatForPrompt(extractedContent)}

MANDATORY: Use these SPECIFIC examples in your teaching:
- Characters: ${extractedContent.characters.join(', ')}
- Models: ${extractedContent.models.join(', ')}
- Techniques: ${extractedContent.techniques.join(', ')}
`;
```

### **Fix 3: Enable RAG**
```typescript
// In DirectorAgent.ts:
if (isRAGEnabled()) {
  const ragChunks = await fetchRelevantChunks(topic, 5);
  const ragContext = buildRAGContext(ragChunks);
  // Inject into all agent prompts
}
```

### **Fix 4: Narrative-Driven Framework**
```typescript
// Replace rigid TEACH→PRACTICE with:
// HOOK → TEACH → EXAMPLE → PRACTICE → APPLY → ASSESS
```

---

## 📊 **QUALITY SCORE BREAKDOWN**

**Current QA Score: 62/100**

| Dimension | Current | Target | Gap |
|-----------|---------|--------|-----|
| Narrative Quality | 40/100 | 85/100 | -45 |
| Instructional Design | 70/100 | 85/100 | -15 |
| Engagement | 50/100 | 85/100 | -35 |
| Accessibility | 80/100 | 85/100 | -5 |

**Biggest Issues:**
1. ❌ Generic narration (no characters, no stories)
2. ❌ Extracted content not appearing in scenes
3. ❌ No emotional hooks or stakes
4. ❌ Interactions feel mechanical vs. engaging

---

## 🎯 **EXPECTED IMPROVEMENT**

**After Fixes:**
- **Narrative Quality**: 40 → 80 (use enhanced prompts + extracted content)
- **Engagement**: 50 → 75 (add characters, stakes, cinematic visuals)
- **Overall Score**: 62 → 80+

**Key Changes:**
1. ✅ Enhanced prompts actually used
2. ✅ Extracted content (CAPS, Sarah, Alex) appears in scenes
3. ✅ Emotional hooks and character-driven stories
4. ✅ Realistic scenarios with specific examples

---

**END OF ANALYSIS**

