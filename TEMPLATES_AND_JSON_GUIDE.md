# 📋 Genesis AI Storyboard App - Templates & JSON Guide

## 🎯 Overview

This guide provides all the JSON templates and structures you need to work with the Genesis AI Storyboard App.

---

## 📁 Available Template Files

### 1. **STORYBOARD_REQUEST_TEMPLATE.json**
   - How to send a request to generate a storyboard
   - All available parameters and options
   - Example requests for different scenarios

### 2. **STORYBOARD_TEMPLATE.json**
   - Complete example of a generated storyboard
   - Shows all scene types and structures
   - Includes interaction examples
   - Full metadata and QA report structure

### 3. **INTERACTION_TYPES_CATALOG.json**
   - All 13 available interaction types
   - Bloom's taxonomy mapping
   - Cognitive load information
   - Priority rankings

---

## 🚀 Quick Start

### Generate a Storyboard

```bash
curl -X POST http://localhost:8080/api/v2/storyboards \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Effective Communication",
    "learningOutcomes": ["Practice active listening"],
    "audience": "Team Leaders",
    "duration": 15
  }'
```

### Minimal Request

```json
{
  "topic": "Your Topic Here",
  "learningOutcomes": ["Learning outcome 1"],
  "audience": "Target audience",
  "duration": 15
}
```

### Full Request with Options

```json
{
  "topic": "Managing Difficult Conversations",
  "learningOutcomes": [
    "Identify triggers and emotional responses",
    "Apply de-escalation techniques",
    "Create personal action plan"
  ],
  "audience": "Mid-level managers",
  "duration": 15,
  "moduleLevel": 3,
  "moduleType": "application",
  "sourceMaterial": "Optional: paste training content here"
}
```

---

## 📊 Storyboard Structure

### Scene Types

1. **Welcome Scene** - Introduction and navigation
2. **Learning Outcomes** - Objectives overview
3. **Teaching Scenes** - Content instruction (TEACH phase)
4. **Practice Scenes** - Guided practice (PRACTICE phase)
5. **Application Scenes** - Real-world scenarios (APPLY phase)
6. **Assessment Scenes** - Knowledge checks (ASSESS phase)
7. **Summary Scene** - Key takeaways
8. **Next Steps Scene** - Action planning

### Required Scene Fields

```json
{
  "sceneNumber": 1,
  "pageTitle": "Scene Title",
  "pageType": "Informative | Interactive",
  "narrationScript": "Voiceover text (150-200 words)",
  "onScreenText": "Brief on-screen text (30-50 words)",
  "visual": {
    "aiPrompt": "Detailed visual description for AI image generation",
    "altText": "Accessibility description",
    "aspectRatio": "16:9"
  },
  "interactionType": "None | DragDrop | Scenario | MCQ",
  "timing": {
    "estimatedSeconds": 90
  }
}
```

---

## 🎮 Interaction Types (13 Total)

### High Priority (Narrative-First)
1. **Branching Scenario** - Real-world decision-making
2. **Conversation Simulator** - Practice dialogue
3. **Reflection Journal** - Personal application
4. **Video Analysis** - Analyze video content
5. **Case Study Analysis** - Real-world cases

### Medium Priority (Applied)
6. **Procedural Demo** - Step-by-step process
7. **Hotspot Exploration** - Interactive diagrams
8. **Decision Tree** - Guided decision paths
9. **Timeline Sequencing** - Order events/steps

### Low Priority (Academic)
10. **Multi-Select Quiz** - Multiple correct answers
11. **Single-Select Quiz** - One correct answer
12. **Drag and Drop** - Match or sequence
13. **Click to Reveal** - Progressive disclosure

---

## 🎓 Pedagogical Framework

### TEACH → PRACTICE → APPLY → ASSESS

Every learning outcome follows this sequence:

1. **TEACH** - Direct instruction with examples
2. **PRACTICE** - Guided exercises with support
3. **APPLY** - Real-world scenario application
4. **ASSESS** - Knowledge check and validation

---

## 💡 Module Levels

| Level | Name | Description | Interaction Density |
|-------|------|-------------|-------------------|
| 1 | Passive | Minimal interaction, info-heavy | 1 per 3 scenes |
| 2 | Limited | Some basic interactions | 1 per 2 scenes |
| 3 | Moderate | Balanced interactions | 1 per scene |
| 4 | Immersive | Rich, complex interactions | Multiple per scene |

---

## 🧠 Bloom's Taxonomy Mapping

| Level | Interaction Types |
|-------|------------------|
| Remember | Click-to-Reveal, Single-Select Quiz |
| Understand | Drag-and-Drop, Multi-Select Quiz, Procedural Demo |
| Apply | Scenario, Timeline Sequencing, Decision Tree |
| Analyze | Case Study, Reflection, Video Analysis |
| Evaluate | Scenario, Reflection, Case Study |
| Create | Reflection Journal, Scenario |

---

## 📈 Quality Metrics

### QA Scoring (0-100)

- **85-100**: Excellent - Ready for production
- **70-84**: Good - Minor improvements needed
- **60-69**: Fair - Moderate revisions required
- **0-59**: Poor - Major redesign needed

### What Gets Checked

1. **Outcome Linkage** - Every scene maps to a learning outcome
2. **Framework Compliance** - TEACH→PRACTICE→APPLY→ASSESS followed
3. **Interactivity Balance** - Proper density and distribution
4. **Content Quality** - No duplication, clear structure
5. **Pedagogical Rationale** - Teaching decisions justified

---

## 🔧 Advanced Features

### Domain-Specific Boosting

The system automatically prioritizes interactions based on content domain:

- **Emotional/Leadership** → Conversation, Reflection, Scenarios
- **Compliance/Safety** → Branching Scenarios, Decision Trees
- **Procedural/Technical** → Procedural Demo, Simulations
- **Product Knowledge** → Hotspot Exploration, Video Analysis

### Narrative Penalties

Academic interactions (quizzes, drag-drop) receive lower priority in narrative-heavy modules to favor storytelling approaches.

---

## 📝 Example Workflows

### 1. Generate Simple 5-Minute Module

```json
{
  "topic": "Email Etiquette Basics",
  "learningOutcomes": ["Write professional emails"],
  "audience": "New employees",
  "duration": 5
}
```

### 2. Generate Complex 30-Minute Module

```json
{
  "topic": "Strategic Leadership",
  "learningOutcomes": [
    "Analyze organizational dynamics",
    "Evaluate leadership frameworks",
    "Create strategic vision"
  ],
  "audience": "Senior Executives",
  "duration": 30,
  "moduleLevel": 4
}
```

### 3. Generate with Source Material

```json
{
  "topic": "Product Training",
  "learningOutcomes": ["Demonstrate product features"],
  "audience": "Sales team",
  "duration": 20,
  "sourceMaterial": "Paste entire training manual here..."
}
```

---

## 🎨 Current AI Engine

**OpenAI ChatGPT** is now configured as the AI engine:
- Model: `gpt-4o-mini`
- Base URL: `https://api.openai.com/v1`
- API Key: Configured in `.env`

---

## 📚 Additional Resources

- **Master Blueprint**: `/backend/src/prompts/masterBlueprint.md`
- **Type Definitions**: `/backend/src/types/storyboardTypes.ts`
- **Interaction Builders**: `/backend/src/agents/builders/`
- **Agent Prompts**: `/backend/src/prompts/agentPrompts.ts`

---

## 🆘 Troubleshooting

### Storyboard Generation Fails
- Check backend logs for errors
- Verify OpenAI API key is valid
- Ensure learning outcomes are well-formed
- Try reducing duration for complex topics

### Low QA Scores
- Make learning outcomes more specific
- Use Bloom's taxonomy verbs
- Ensure topic matches audience level
- Add more detailed source material

### Missing Interactions
- Increase `moduleLevel` (3 or 4)
- Check that learning outcomes support interactivity
- Verify interaction builders are working

---

## 📞 Support

For issues or questions:
1. Check logs at `/backend/backend/` terminal
2. Review `COMPREHENSIVE_TEST_REPORT.md`
3. Verify both services running:
   - Backend: http://localhost:8080/health
   - Frontend: http://localhost:5173

---

**Last Updated**: DeepSeek integration complete ✅  
**Version**: Phase 6 - Architecture Overhaul

