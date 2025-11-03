# 📖 Sample Storyboard Output: "Dealing with Difficult People"

**Generated**: October 27, 2025  
**Quality Score**: 62/100  
**Duration**: 10 minutes  
**Scenes**: 13

---

## 🎬 **COMPLETE STORYBOARD (First 6 Scenes)**

### **Scene 1: Welcome & Navigation**
```json
{
  "sceneNumber": 1,
  "pageTitle": "Welcome & Navigation",
  "pageType": "Informative",
  "narrationScript": "Welcome to the Dealing with Difficult People module. Navigate using the arrow buttons, use play and pause controls as needed, and revisit sections any time. Please have headphones ready for the audio content. Audience focus: Customer service team.",
  "onScreenText": "Welcome to Dealing with Difficult People. Use arrows to move through the module, play/pause to control audio, and replay sections as needed. Headphones recommended for audio.",
  "visual": {
    "aiPrompt": "Professional welcome screen for Dealing with Difficult People eLearning with navigation controls and headphone icon",
    "altText": "Welcome screen showing Dealing with Difficult People title with navigation instructions",
    "aspectRatio": "16:9"
  },
  "interactionType": "None",
  "timing": { "estimatedSeconds": 45 },
  "pedagogicalPhase": "Welcome"
}
```

**🔍 ISSUE**: Generic welcome, no emotional hook, no story setup

---

### **Scene 2: Learning Outcomes Overview**
```json
{
  "sceneNumber": 2,
  "pageTitle": "Learning Outcomes Overview",
  "pageType": "Informative",
  "narrationScript": "By the end of this Dealing with Difficult People module, you will master these key learning outcomes: 1. Recognize different types of difficult behaviors 2. Apply de-escalation techniques effectively. Each outcome follows our proven TEACH → PRACTICE → APPLY → ASSESS learning sequence to ensure deep understanding and practical application.",
  "onScreenText": "Learning Outcomes: 1. Recognize different types of difficult behaviors | 2. Apply de-escalation techniques effectively",
  "visual": {
    "aiPrompt": "Professional learning outcomes display for Dealing with Difficult People, showing numbered objectives with clear progression indicators",
    "altText": "Learning outcomes for Dealing with Difficult People with progression indicators"
  },
  "interactionType": "None",
  "timing": { "estimatedSeconds": 60 },
  "pedagogicalPhase": "LearningOutcomes"
}
```

**🔍 ISSUE**: Dry bullet points, no transformation vision

---

### **Scene 3: Understanding Recognize (TEACH)**
```json
{
  "sceneNumber": 3,
  "pageTitle": "Understanding Recognize: different types of difficult behaviors",
  "pageType": "Teaching",
  "narrationScript": "This teaching scene provides the foundation you'll need for the upcoming practice, application, and assessment phases. Let's explore the essential concepts for different types of difficult behaviors. Understanding these principles is crucial for success in customer service interactions. We'll examine key patterns that help identify challenging behaviors early, which allows for more effective responses and better outcomes for both you and your customers.",
  "onScreenText": "Key concepts: difficult behaviors, types, recognition patterns. Understanding these principles is crucial for success.",
  "visual": {
    "aiPrompt": "Professional teaching scene showing key concepts about difficult behaviors with visual aids and clear structure",
    "altText": "Teaching content about difficult behavior types"
  },
  "interactionType": "None",
  "timing": { "estimatedSeconds": 120 },
  "pedagogicalPhase": "Teach",
  "learningOutcome": "Recognize different types of difficult behaviors"
}
```

**🔍 ISSUE**: 
- ❌ Mentions "essential concepts" but doesn't state them (CAPS Model missing!)
- ❌ Generic "difficult behaviors" instead of specific types (Tank, Staller, Clam)
- ❌ No character or story (Sarah/Alex not mentioned)
- ❌ No extracted content used

---

### **Scene 4: Practice Recognize (PRACTICE)**
```json
{
  "sceneNumber": 4,
  "pageTitle": "Practice: Recognize different types of difficult behaviors",
  "pageType": "Interactive",
  "narrationScript": "Now let's practice applying what you've learned about Recognize different types of difficult behaviors. This interactive exercise will help reinforce your understanding and prepare you for real-world application. Follow the instructions carefully and use the knowledge from the previous teaching scene.",
  "onScreenText": "Practice Exercise: Apply your knowledge of Recognize different types of difficult behaviors through interactive activities.",
  "visual": {
    "aiPrompt": "Interactive practice environment for Recognize different types of difficult behaviors, showing engaging learning activities and clear instructions with reference to teaching content",
    "altText": "Interactive practice exercise for Recognize different types of difficult behaviors"
  },
  "interactionType": "Scenario",
  "interactionDetails": {
    "type": "scenario_simulation",
    "templateData": {
      "scenario": "You're in a team meeting when a colleague interrupts your presentation. They raise their voice and dismiss your ideas. How do you respond?",
      "choices": [
        "Acknowledge their concern and ask for specific feedback",
        "Match their intensity and defend your approach",
        "Ignore the interruption and continue",
        "Defer to their expertise and apologize"
      ],
      "feedback": {
        "correct": "Good choice. Acknowledging concerns while seeking specifics helps de-escalate.",
        "incorrect": "Consider how different responses impact the situation."
      }
    }
  },
  "timing": { "estimatedSeconds": 120 },
  "pedagogicalPhase": "Practice",
  "learningOutcome": "Recognize different types of difficult behaviors"
}
```

**🔍 ISSUE**:
- ❌ Generic scenario without specific behavior types (no mention of Tank, Controller, etc.)
- ❌ No reference to CAPS Model or extracted training content
- ❌ Generic feedback doesn't teach specific concepts

---

### **Scene 5: Apply Recognize (APPLY)**
```json
{
  "sceneNumber": 5,
  "pageTitle": "Apply: Recognize different types of difficult behaviors",
  "pageType": "Interactive",
  "narrationScript": "Let's apply Recognize different types of difficult behaviors in a realistic scenario. Based on what you learned in the teaching phase and practiced in the interactive exercise, make decisions and see how your choices impact the outcome.",
  "onScreenText": "Real-world Application: Use your knowledge of Recognize different types of difficult behaviors to navigate this scenario.",
  "visual": {
    "aiPrompt": "Realistic workplace scenario for Recognize different types of difficult behaviors, showing decision points and potential outcomes based on teaching principles",
    "altText": "Real-world application scenario for Recognize different types of difficult behaviors"
  },
  "interactionType": "Scenario",
  "timing": { "estimatedSeconds": 150 },
  "pedagogicalPhase": "Apply",
  "learningOutcome": "Recognize different types of difficult behaviors"
}
```

**🔍 ISSUE**:
- ❌ Generic "realistic scenario" instruction without specific details
- ❌ No named characters (Sarah, Alex missing)
- ❌ No specific behavior types or CAPS Model application

---

### **Scene 6: Knowledge Check Recognize (ASSESS)**
```json
{
  "sceneNumber": 6,
  "pageTitle": "Knowledge Check: Recognize different types of difficult behaviors",
  "pageType": "Interactive",
  "narrationScript": "Let's assess your understanding of Recognize different types of difficult behaviors. This knowledge check will help verify that you've mastered the key concepts from the teaching phase and can apply them effectively.",
  "onScreenText": "Knowledge Check: Test your understanding of Recognize different types of difficult behaviors concepts.",
  "visual": {
    "aiPrompt": "Assessment interface for Recognize different types of difficult behaviors, showing quiz elements and progress indicators with references to teaching content",
    "altText": "Knowledge assessment for Recognize different types of difficult behaviors"
  },
  "interactionType": "MCQ",
  "interactionDetails": {
    "type": "multi_select_quiz",
    "templateData": {
      "question": "Which behaviors indicate a difficult interaction?",
      "options": [
        "Interrupting and raising voice",
        "Active listening and asking questions",
        "Dismissing others' ideas",
        "Collaborative problem-solving"
      ],
      "correctAnswers": [0, 2],
      "feedback": {
        "correct": "Correct. Interrupting and dismissing are signs of difficult behavior.",
        "incorrect": "Review the teaching content about difficult behavior patterns."
      }
    }
  },
  "timing": { "estimatedSeconds": 90 },
  "pedagogicalPhase": "Assess",
  "learningOutcome": "Recognize different types of difficult behaviors"
}
```

**🔍 ISSUE**:
- ❌ Generic quiz question doesn't test specific concepts (CAPS Model, behavior types)
- ❌ No reference to training material content
- ❌ Feedback is generic, doesn't reinforce specific learning

---

## 🎯 **WHAT'S MISSING FROM EXTRACTED CONTENT**

**Training Material Provided:**
```
CAPS Model: Controller, Analyser, Promoter, Supporter
Difficult behavior types: The Tank, The Staller, The Clam, The Know-It-All, The Complainer
3-step de-escalation: 1) Acknowledge emotion, 2) Reframe issue, 3) Offer choices
Case study: Sarah and Alex the Tank
```

**Extracted Content (from ContentExtractionAgent):**
- ✅ Models: ["CAPS Model"]
- ✅ Techniques: ["3-step de-escalation"]
- ✅ Characters: ["Sarah", "Alex the Tank"]
- ✅ Examples: ["Sarah's presentation interruption"]

**BUT: This content appears NOWHERE in the actual scenes!**

---

## ✅ **WHAT SHOULD BE (Example Fixes)**

### **Scene 1 (Fixed Welcome):**
```json
{
  "narrationScript": "Have you ever left a conversation feeling frustrated, wondering what you did wrong? Last Tuesday, customer service manager Sarah felt exactly that. During her team presentation, Alex, a senior executive, interrupted: 'That approach is completely flawed!' Sarah's heart raced. Sound familiar? In this module, you'll learn the exact techniques Sarah used to turn confrontations into collaborations - using the CAPS Model and proven de-escalation strategies."
}
```

### **Scene 3 (Fixed Teaching):**
```json
{
  "narrationScript": "Remember Sarah and Alex? When Alex interrupted her presentation, Sarah recognized his behavior pattern: interrupting, raising his voice, dismissing ideas. Using the CAPS Model from your training, Sarah identified Alex as a Controller - specifically, 'The Tank' type: aggressive and confrontational. The CAPS Model breaks down four personality types: Controller (decisive, demanding, direct), Analyser (logical, detail-oriented, methodical), Promoter (enthusiastic, big-picture thinker), and Supporter (relationship-focused, team-oriented). Each type has associated difficult behaviors: The Tank, The Staller, The Clam, The Know-It-All, and The Complainer."
}
```

### **Scene 4 (Fixed Practice):**
```json
{
  "narrationScript": "You're in Sarah's position now. In your next team meeting, a colleague interrupts others, raises their voice, and dismisses ideas - just like Alex did. Using the CAPS Model we discussed, which personality type matches this behavior? Is it A) Controller (The Tank), B) Analyser (The Know-It-All), C) Promoter (The Complainer), or D) Supporter (The Clam)? Think about Alex's specific actions: interrupting, aggressive tone, dismissing others' ideas."
}
```

---

## 📊 **QA REPORT EXCERPT**

```json
{
  "score": 62,
  "issues": [
    "CRITICAL: Universal Pedagogical Framework violation - Missing proper TEACH phase structure",
    "CRITICAL: Content duplication - Multiple scenes have identical narration scripts",
    "CRITICAL: Generic content - Teaching scenes use placeholder text instead of specific 'Dealing with Difficult People' content",
    "CRITICAL: Missing assessment alignment - No clear connection between teaching content and knowledge checks",
    "STRUCTURAL: Scene numbering consistency issues",
    "CONTENT: Missing specific training material references (CAPS Model, behavior types, case studies)"
  ],
  "recommendations": [
    "REBUILD: Replace generic teaching content with specific techniques for identifying behavioral patterns",
    "SPECIFICITY: Use extracted content (CAPS Model, Sarah/Alex case study) in scenes",
    "NARRATIVE: Add character-driven stories and emotional hooks",
    "INTERACTION REDESIGN: Align interactions with specific learning outcomes and extracted examples"
  ]
}
```

---

## 🎯 **TEACH→SHOW→APPLY→CHECK FLOW ASSESSMENT**

**Current Flow:**
1. ✅ TEACH - Scene 3 (but generic, no extracted content)
2. ✅ PRACTICE - Scene 4 (but generic scenario)
3. ✅ APPLY - Scene 5 (but generic application)
4. ✅ CHECK - Scene 6 (but doesn't test specific concepts)

**Does the Flow Work?**
- ✅ **Structure**: Yes, sequence is present
- ❌ **Quality**: No, content is too generic
- ❌ **Engagement**: No, lacks narrative and characters
- ❌ **Content Specificity**: No, extracted content not used

**Bottom Line:** The framework structure is enforced, but the content quality within that structure is poor.

---

**END OF SAMPLE OUTPUT**

