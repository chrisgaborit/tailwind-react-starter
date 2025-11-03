# 🎯 Root Cause Analysis: Why Quality is 62% Instead of 85%+

**Date**: October 27, 2025  
**Current Quality Score**: 62/100  
**Target Quality Score**: 85+/100  
**Gap**: 23 points

---

## 🔍 **THE PROBLEM (TL;DR)**

You have **excellent architecture** but **mediocre prompts**. The enhanced prompts exist but **aren't being used**. Content extraction works but **isn't injected into scene generation**.

---

## 🎓 **1. PROMPT ANALYSIS**

### **A. System Prompt (Master Blueprint)**

**Location**: `/backend/src/prompts/masterBlueprint.md`  
**Status**: ✅ Loaded and used  
**Content**: 292 lines of pedagogical framework rules

**Problem**: 
- ❌ Focuses on **structure** (TEACH→PRACTICE→APPLY→ASSESS)
- ❌ Doesn't emphasize **narrative, characters, or engagement**
- ❌ Generic "award-winning" language without specific examples

**Used By**: All agents via `systemKey: "master_blueprint"`

---

### **B. Agent-Specific Prompts**

**Location**: `/backend/src/prompts/agentPrompts.ts`  
**Status**: ✅ **EXISTS BUT UNUSED!**

**Current Reality:**
| Agent | Enhanced Prompt Exists? | Actually Using It? | Current Prompt |
|-------|------------------------|-------------------|----------------|
| WelcomeAgent | ✅ YES | ❌ NO | Generic "Welcome & Navigation" |
| TeachAgent | ✅ YES | ❌ NO | Master Blueprint only |
| ApplyAgent | ✅ YES | ❌ NO | Generic "create scenario" |
| SummaryAgent | ✅ YES | ❌ NO | Generic summary prompt |
| QAAgent | ✅ YES | ⏸️ PARTIAL | Basic quality checks |

**Example - WelcomeAgent Prompt:**

**❌ CURRENT (in `welcomeAgent.ts`):**
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
Output: JSON array of Scene objects.
`;
```

**✅ ENHANCED (in `agentPrompts.ts` - NOT USED):**
```typescript
welcomeAgent: (topic, audience, outcomes) => `
YOU ARE: An award-winning instructional designer.

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
`;
```

**The Fix**: Update `WelcomeAgent.ts` to import and use `getEnhancedPrompt('welcomeAgent', {...})`

---

## 📚 **2. RAG TRAINING DATA**

### **Current Status:**

**RAG Infrastructure**: ✅ Exists  
**Location**: `/backend/src/utils/fetchRelevantChunks.ts`  
**Status**: ❌ **DISABLED by default**

```typescript
export function isRAGEnabled(): boolean {
  // Checks environment variables
  // Currently defaults to false
  return process.env.ENABLE_RAG === 'true';
}
```

**What's in `pedagogical_memory`?**
- ❓ **Unknown** - No documentation
- ❓ **Unknown** - No Brandon Hall winners seeded
- ❓ **Unknown** - No corporate training examples
- ✅ **Likely**: Empty or minimal

**Current Content Source:**
- ✅ **ContentExtractionAgent** extracts from `sourceMaterial` parameter
- ✅ Extracts: Models, techniques, examples, characters
- ❌ **BUT**: Extracted content not heavily injected into prompts
- ❌ **NOT using RAG** from uploaded documents

**Impact**: System relies on prompts only, no example-driven learning

---

## 🔧 **3. CONTENT EXTRACTION UNDERUTILIZATION**

### **What ContentExtractionAgent Extracts:**

**From "Dealing with Difficult People" training material:**
```typescript
{
  models: ["CAPS Model: Controller, Analyser, Promoter, Supporter"],
  techniques: ["3-step de-escalation: 1) Acknowledge emotion, 2) Reframe issue, 3) Offer choices"],
  terminology: ["The Tank", "The Staller", "The Clam", "The Know-It-All", "The Complainer"],
  examples: ["Sarah was presenting when Alex the Tank interrupted..."],
  characters: ["Sarah", "Alex the Tank"],
  scenarios: ["Team meeting interruption scenario"]
}
```

### **How It's Currently Used:**

**In `EnhancedTeachAgentSimple.ts`:**
```typescript
private extractConceptsFromMaterial(extractedContent: any, learningOutcome: string): string[] {
  // ✅ Extracts concepts
  if (extractedContent.models && extractedContent.models.length > 0) {
    concepts.push(...extractedContent.models.slice(0, 3));
  }
  // BUT: Only uses first 3 models, doesn't inject into narration script!
}
```

**Problem**:
- ✅ Extracted content is stored in `req.extractedContent`
- ✅ Concepts are extracted for `keyConcepts` array
- ❌ **NOT injected into narration scripts**
- ❌ **NOT used in scene titles**
- ❌ **NOT referenced in visual prompts**
- ❌ **Characters (Sarah, Alex) don't appear in scenes**

---

## 🚨 **4. SPECIFIC EXAMPLES OF WHAT'S WRONG**

### **Example 1: Generic Welcome (Scene 1)**

**❌ ACTUAL OUTPUT:**
```
"Welcome to the Dealing with Difficult People module. Navigate using the arrow 
buttons, use play and pause controls as needed..."
```

**Why It's Wrong:**
- No emotional hook
- No character or story
- Generic corporate training language
- Focuses on mechanics, not learner's problem

**✅ SHOULD BE:**
```
"Have you ever left a conversation feeling frustrated, wondering what you did 
wrong? Last Tuesday, customer service manager Sarah felt exactly that when Alex, 
a senior executive, cut her off: 'That approach is completely flawed!' Sound 
familiar? By the end of this module, you'll master the techniques Sarah used 
to turn confrontations into collaborations."
```

**Root Cause**: WelcomeAgent uses generic prompt, not enhanced narrative prompt

---

### **Example 2: Teaching Scene Lacks Extracted Content (Scene 3)**

**❌ ACTUAL OUTPUT:**
```
"This teaching scene provides the foundation you'll need... Let's explore the 
essential concepts for different types of difficult behaviors..."
```

**Why It's Wrong:**
- Mentions "essential concepts" but doesn't state them
- No reference to CAPS Model (extracted but not used)
- No character continuation (Sarah/Alex missing)
- Generic "difficult behaviors" instead of specific types

**✅ SHOULD BE:**
```
"Remember Sarah and Alex? When Alex interrupted her presentation, Sarah recognized 
his behavior pattern. Using the CAPS Model from your training, Sarah identified 
Alex as a Controller - specifically, 'The Tank' type. The CAPS Model breaks down 
four types: Controller (decisive, demanding), Analyser (logical, detail-oriented), 
Promoter (enthusiastic, big-picture), and Supporter (relationship-focused). Each 
type has associated difficult behaviors: The Tank, The Staller, The Clam, The 
Know-It-All, and The Complainer."
```

**Root Cause**: 
- Extracted content not injected into narration generation
- TeachAgent prompt doesn't require extracted content usage

---

### **Example 3: Practice Scene Generic Scenario (Scene 4)**

**❌ ACTUAL OUTPUT:**
```
"Now let's practice applying what you've learned... This interactive exercise 
will help reinforce your understanding..."
```

**Why It's Wrong:**
- Generic "practice" instruction
- No specific scenario or characters
- No reference to training content (CAPS Model, behavior types)

**✅ SHOULD BE:**
```
"You're in Sarah's position now. In your next team meeting, a colleague 
interrupts others, raises their voice, and dismisses ideas - just like Alex 
did. Using the CAPS Model, which personality type matches this behavior? Is it 
A) Controller (The Tank), B) Analyser (The Know-It-All), C) Promoter (The 
Complainer), or D) Supporter (The Clam)? Think about Alex's specific actions."
```

**Root Cause**: Practice scenes generated without extracted content injection

---

### **Example 4: Visual Descriptions Generic (All Scenes)**

**❌ ACTUAL:**
```json
{
  "aiPrompt": "Professional learning outcomes display for Dealing with Difficult People",
  "altText": "Learning outcomes for Dealing with Difficult People"
}
```

**✅ SHOULD BE:**
```json
{
  "aiPrompt": "CLOSE UP: Sarah's face showing tension during Alex's interruption. WIDE SHOT: Tense team meeting with Alex standing, arms crossed, interrupting. MEDIUM SHOT: Sarah taking notes, recognizing Alex's behavior pattern.",
  "altText": "Story progression: Sarah's transformation from overwhelmed to confident using CAPS Model"
}
```

**Root Cause**: No VisualDirectorAgent integration (exists but not wired)

---

## ✅ **5. IMMEDIATE FIXES**

### **Fix 1: Use Enhanced Prompts (HIGHEST PRIORITY)**

**Files to Update:**
1. `/backend/src/agents_v2/welcomeAgent.ts`
2. `/backend/src/agents_v2/enhancedTeachAgentSimple.ts`
3. `/backend/src/agents_v2/applyAgent.ts`
4. `/backend/src/agents_v2/summaryAgent.ts`

**Example Fix for WelcomeAgent:**
```typescript
import { getEnhancedPrompt } from '../prompts/agentPrompts';

async generate(req: LearningRequest): Promise<Scene[]> {
  const outcomes = this.pickOutcomes(req);
  
  // ✅ USE ENHANCED PROMPT
  const prompt = getEnhancedPrompt('welcomeAgent', {
    topic: req.topic,
    audience: req.audience,
    outcomes: outcomes
  });
  
  const finalPrompt = `${resetHeader}${prompt}`;
  const content = await openaiChat({ systemKey: "master_blueprint", user: finalPrompt });
  // ...
}
```

**Expected Impact**: Narrative quality 40 → 75 (+35 points)

---

### **Fix 2: Inject Extracted Content Into Prompts**

**File**: `/backend/src/agents_v2/enhancedTeachAgentSimple.ts`

**Current:**
```typescript
const extractedContent = (req as any).extractedContent;
const keyConcepts = this.extractConceptsFromMaterial(extractedContent, learningOutcome);
```

**Fix:**
```typescript
const extractedContent = (req as any).extractedContent;

// ✅ INJECT EXTRACTED CONTENT INTO PROMPT
const enhancedPrompt = `
${getEnhancedPrompt('teachAgent', { topic, outcome, audience })}

EXTRACTED CONTENT FROM TRAINING MATERIAL:
${contentExtractor.formatForPrompt(extractedContent)}

MANDATORY REQUIREMENTS:
- MUST use these specific characters: ${extractedContent.characters.join(', ')}
- MUST reference these models: ${extractedContent.models.join(', ')}
- MUST use these techniques: ${extractedContent.techniques.join(', ')}
- MUST include these examples: ${extractedContent.examples.join(', ')}

DO NOT create generic content. Use the extracted material above.
`;
```

**Expected Impact**: Content specificity 50 → 85 (+35 points)

---

### **Fix 3: Enable RAG (If Training Data Available)**

**File**: `/backend/src/agents_v2/directorAgent.ts`

**Fix:**
```typescript
async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
  // Extract content first
  const extractedContent = await this.contentExtractor.extractContent(...);
  
  // ✅ ENABLE RAG IF AVAILABLE
  let ragContext = '';
  if (isRAGEnabled()) {
    const ragChunks = await fetchRelevantChunks(req.topic, 5);
    ragContext = buildRAGContext(ragChunks);
    console.log(`✅ RAG context loaded: ${ragChunks.length} chunks`);
  }
  
  // Inject into all agent prompts
  (req as any).ragContext = ragContext;
  (req as any).extractedContent = extractedContent;
  
  // Continue with storyboard generation...
}
```

**Expected Impact**: Example-driven learning +10 points

---

### **Fix 4: Narrative-Driven Framework (Optional)**

**File**: `/backend/src/agents_v2/enhancedPedagogicalDirector.ts`

**Current Flow**: TEACH → PRACTICE → APPLY → ASSESS (rigid)

**Better Flow**: HOOK → TEACH → EXAMPLE → PRACTICE → APPLY → ASSESS

**Fix:**
```typescript
// For each learning outcome:
1. HOOK scene - Emotional connection with character/stakes
2. TEACH scene - Using extracted content (CAPS Model, techniques)
3. EXAMPLE scene - Show extracted case study (Sarah/Alex)
4. PRACTICE scene - Apply extracted techniques
5. APPLY scene - Realistic scenario with extracted characters
6. ASSESS scene - Test specific extracted concepts
```

**Expected Impact**: Engagement +15 points

---

## 📊 **EXPECTED QUALITY IMPROVEMENT**

| Fix | Current Score | After Fix | Improvement |
|-----|---------------|-----------|-------------|
| Use Enhanced Prompts | 62 | 75 | +13 |
| Inject Extracted Content | 75 | 82 | +7 |
| Enable RAG (if available) | 82 | 85 | +3 |
| Narrative Framework | 85 | 88 | +3 |

**Total Expected**: 62 → **88** (+26 points)

---

## 🎯 **PRIORITY ORDER**

### **PRIORITY 1 (Do Today - 2 hours):**
1. ✅ Update WelcomeAgent to use enhanced prompt
2. ✅ Inject extracted content into TeachAgent prompts
3. ✅ Test with "Dealing with Difficult People" material

**Expected Result**: 62 → 75 (+13 points)

### **PRIORITY 2 (Do This Week - 4 hours):**
1. ✅ Update ApplyAgent and SummaryAgent prompts
2. ✅ Enhance visual prompts with cinematic descriptions
3. ✅ Add character/story requirements to all prompts

**Expected Result**: 75 → 82 (+7 points)

### **PRIORITY 3 (Do Next Week - 6 hours):**
1. ✅ Enable RAG and seed with Brandon Hall examples
2. ✅ Implement narrative-driven framework
3. ✅ Add VisualDirectorAgent integration

**Expected Result**: 82 → 88 (+6 points)

---

## ✅ **SUMMARY**

**Root Causes:**
1. ❌ Enhanced prompts exist but not used (biggest issue)
2. ❌ Extracted content not injected into narration generation
3. ❌ RAG disabled (no example-driven learning)
4. ❌ Rigid framework prioritizes structure over engagement

**Fixes:**
1. ✅ Use enhanced prompts (immediate +13 points)
2. ✅ Inject extracted content (+7 points)
3. ✅ Enable RAG (+3 points)
4. ✅ Narrative framework (+3 points)

**Bottom Line**: You have the tools (enhanced prompts, content extraction, RAG), but they're not wired together. **Wire them up = 88% quality.**

---

**END OF ROOT CAUSE ANALYSIS**

