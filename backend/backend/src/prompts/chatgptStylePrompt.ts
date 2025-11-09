// backend/src/prompts/chatgptStylePrompt.ts

/**
 * ChatGPT-style prompt template for generating high-quality, structured eLearning content
 * This replicates ChatGPT's exact output format for instructional design
 */

export function buildChatGPTStylePrompt(
  learningObjective: string,
  sourceMaterial: string,
  audience: string,
  moduleTitle: string
): string {
  
  const sourceExcerpt = sourceMaterial.substring(0, 5000);
  
  return `You are a senior Instructional Designer creating a Brandon Hall Award-level eLearning module.

=== ASSIGNMENT ===
Create a COMPLETE 5-scene learning sequence for this learning objective.

Learning Objective: "${learningObjective}"
Module: ${moduleTitle}
Audience: ${audience}

=== SOURCE TRAINING MATERIAL ===
${sourceExcerpt}

Extract specific concepts, frameworks, examples, and real workplace scenarios from this material.

=== REQUIRED OUTPUT FORMAT ===

You MUST create EXACTLY 5 scenes following this structure:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 1: TEACH (Knowledge Delivery)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Page Title: [Engaging 5-8 word title]

On-Screen Text (75-100 words):
[Write clear, concise on-screen text that introduces the core concept. Use 2-3 short paragraphs or bullet points. Make it scannable.]

Voice-Over Script (180-220 words):
[Write a conversational narrative that:
- Opens with a relatable workplace scenario
- Explains WHY this concept matters
- Introduces a framework or model
- Uses a recurring character (e.g., "Meet Sarah, a team leader who...")
- Ends with a bridge to the next section]

Visual AI Prompt:
[Detailed visual description: setting, characters, mood, composition, specific elements to show]

Alt Text:
[Accessible description of the visual]

Developer Notes:
[Animation timing, fade-ins, emphasis points]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 2: SHOW (Demonstration)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interactivity Type: Click-to-Reveal

Instruction: Click each element to explore how it works in practice.

[Create a table with 4-5 interactive reveals]

Trigger | Reveal Text (40-60 words) | Voice-Over (30-50 words)
--------|---------------------------|-------------------------
[Label 1] | [Explanation + specific example from source material] | [Conversational elaboration]
[Label 2] | [Explanation + specific example] | [Conversational elaboration]
[Label 3] | [Explanation + specific example] | [Conversational elaboration]
[Label 4] | [Explanation + specific example] | [Conversational elaboration]

Visuals:
[Describe the icon/visual for each trigger, arranged in a specific layout]

Developer Notes:
Sequential reveal, fade-in animation, keyboard accessible via Tab + Enter.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 3: APPLY (Guided Practice)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interactivity Type: Drag-and-Drop Matching

Instruction: Match each [item] to its [category].

[Create a matching table with 5-6 items and 3-4 categories]

Draggable Item | Correct Drop Zone
---------------|------------------
"[Specific example from source]" | [Category name]
"[Specific example from source]" | [Category name]
"[Specific example from source]" | [Category name]
"[Specific example from source]" | [Category name]
"[Specific example from source]" | [Category name]

Feedback:
- Correct: "[Specific, encouraging feedback explaining why this match is correct]"
- Incorrect: "[Gentle redirect with hint: 'Think about...']"

Developer Notes:
Immediate color feedback on drop; all items draggable with Tab + Enter + arrow keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 4: CHECK (Knowledge Confirmation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mini-Quiz (2-3 Questions):

Question 1: [Scenario-based question, 20-30 words]
A. [Plausible distractor]
B. [Correct answer] ✓
C. [Plausible distractor]
D. [Plausible distractor]

Feedback (Correct): "[Specific reinforcement, 15-25 words]"
Feedback (Incorrect): "[Gentle correction with learning point, 15-25 words]"

Question 2: [Application question, 20-30 words]
A. [Plausible distractor]
B. [Plausible distractor]
C. [Correct answer] ✓
D. [Plausible distractor]

Feedback (Correct): "[Specific reinforcement, 15-25 words]"
Feedback (Incorrect): "[Gentle correction with learning point, 15-25 words]"

Developer Notes:
Radio buttons, submit button, immediate feedback with explanation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 5: REFLECT (Personal Application + Bridge)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On-Screen Prompt (60-80 words):
Think of [relevant personal experience].
[2-3 reflective questions that encourage them to connect the learning to their work]

Transition Statement (Bridge):
You've now learned [key takeaway from this LO].
Next, you'll discover [preview of next topic] and learn how to [specific skill/application].

Developer Notes:
- Calm background (soft gradient or abstract pattern)
- "Next" button pulses gently after 8 seconds
- Voice-over restates bridge for reinforcement
- Screen fades seamlessly into next section

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== CRITICAL QUALITY REQUIREMENTS ===

1. **Use Source Material**: Every example, scenario, and concept MUST come from the training material provided above. Do NOT invent generic content.

2. **Narrative Continuity**: Use ONE recurring character or scenario throughout all 5 scenes. Reference them by name in TEACH, continue their story in SHOW, use them in APPLY examples.

3. **Specific, Not Generic**: 
   ❌ BAD: "Communication is important"
   ✅ GOOD: "When Sarah's team member said 'I'm fine' but avoided eye contact, she recognized the disconnect between words and body language"

4. **Word Counts Matter**:
   - TEACH On-Screen: 75-100 words
   - TEACH Voice-Over: 180-220 words
   - SHOW Reveals: 40-60 words each
   - APPLY Feedback: 15-25 words
   - CHECK Feedback: 15-25 words

5. **Conversational Tone**: Write like you're speaking to a colleague, not reading from a textbook. Use "you," contractions, and natural phrasing.

6. **Bridge Statements**: Every scene should flow naturally to the next. End each with a teaser or transition.

=== OUTPUT FORMAT ===

Provide your response in clean, readable markdown following the exact structure above.

DO NOT use JSON.
DO NOT use placeholders like "..." or "[content here]"
DO NOT skip any sections.

Write the complete 5-scene sequence now.`;

}



