# ✅ Max Interactions Feature: Limit Click-to-Reveal to 2-3 per Storyboard

## What Was Built

Added a **`maxInteractions`** configuration to limit the number of Click-to-Reveal interactions generated per storyboard.

**Before:**
- System generated 6 interactions out of 7 scenes (86% interaction rate!)
- Too many interactions = cognitive overload

**After:**
- System intelligently selects **top 2-3 most important** interactions
- Based on pedagogical priority and confidence scores

---

## How It Works

### 1. Smart Selection Algorithm

The system:
1. ✅ Generates interaction prescriptions for ALL scenes (as before)
2. ✅ **Scores each interaction** based on:
   - **Priority**: `critical` (100) → `high` (75) → `medium` (50) → `low` (25)
   - **Confidence**: AI's confidence score (0-100)
   - **Combined score**: Average of priority + confidence
3. ✅ **Selects top N** highest-scoring interactions
4. ✅ Removes prescriptions from lower-scoring scenes

**Result:** Only the most pedagogically valuable interactions are included!

---

## Files Modified

### 1. `/backend/src/agents_v2/types.ts`

Added `maxInteractions` to `Phase2Config`:

```typescript
export interface Phase2Config {
  enabled: boolean;
  maxInteractions?: number; // ← NEW: Limit total interactions (e.g., 2-3)
  densityProfile?: DensityProfile;
  maxCognitiveLoad?: number;
  allowHighIntensity?: boolean;
  customRules?: PedagogicalRule[];
}
```

---

### 2. `/backend/src/agents_v2/interactivityOrchestrator.ts`

#### Added Logic to Limit Interactions

```typescript
// Step 4: Apply maxInteractions limit if specified
const maxInteractions = request.phase2Config?.maxInteractions;
if (maxInteractions && maxInteractions > 0) {
  const limitedDecisions = this.limitToTopInteractions(decisions, maxInteractions);
  console.log(`   🎯 Applied maxInteractions limit: ${old} → ${new}`);
  return limitedDecisions;
}
```

#### Added Selection Method

```typescript
private limitToTopInteractions(
  decisions: InteractionDecision[],
  maxInteractions: number
): InteractionDecision[] {
  // Score each interaction
  const scored = withPrescriptions.map(item => {
    const priorityScore = prescription.priority === 'critical' ? 100 
                        : prescription.priority === 'high' ? 75 
                        : prescription.priority === 'medium' ? 50 
                        : 25;
    const confidenceScore = item.decision.confidence;
    const totalScore = (priorityScore + confidenceScore) / 2;
    return { ...item, score: totalScore };
  });
  
  // Sort by score and take top N
  const topInteractions = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxInteractions);
  
  // Return decisions with only top interactions
  return result;
}
```

---

### 3. `/backend/src/index.v2.routes.ts`

Set **default to 3 interactions** per storyboard:

```typescript
const requestBody = {
  ...req.body,
  phase2Config: {
    enabled: true,
    maxInteractions: 3, // ← Default to 2-3 interactions
    ...(req.body.phase2Config || {})
  }
};
```

---

## What You'll See in Logs

**Before (6 interactions):**
```
🧠 PHASE 6: INTERACTION INTELLIGENCE (Phase 2)
   ✅ Interaction decisions made: 6
   🎨 Generating Click-to-Reveal for scene 2
   🎨 Generating Click-to-Reveal for scene 3
   🎨 Generating Click-to-Reveal for scene 4
   🎨 Generating Click-to-Reveal for scene 5
   🎨 Generating Click-to-Reveal for scene 6
   🎨 Generating Click-to-Reveal for scene 7
```

**After (3 interactions):**
```
🧠 PHASE 6: INTERACTION INTELLIGENCE (Phase 2)
   ✅ Interaction decisions made: 6
   🎯 Applied maxInteractions limit: 6 → 3
   🎨 Generating Click-to-Reveal for scene 2
   🎨 Generating Click-to-Reveal for scene 4
   🎨 Generating Click-to-Reveal for scene 7
```

**Only the top 3 most important interactions are generated!**

---

## How to Change the Limit

### Option 1: Change Default (Backend)

Edit `/backend/src/index.v2.routes.ts`:

```typescript
phase2Config: {
  enabled: true,
  maxInteractions: 2, // ← Change to 2 for fewer interactions
  ...(req.body.phase2Config || {})
}
```

### Option 2: Pass from Frontend (Future)

In frontend, when calling the API:

```typescript
const response = await axios.post('/api/v2/storyboards', {
  topic: "Dealing with Difficult People",
  duration: 10,
  sourceMaterial: "...",
  phase2Config: {
    maxInteractions: 2 // ← User-configurable
  }
});
```

---

## Testing

**Restart your backend:**
```bash
# In terminal where backend is running:
Ctrl+C

# Restart:
npm run dev
```

**Generate a new storyboard** - you should see:

```
🎯 Applied maxInteractions limit: 6 → 3
✅ Interactions added: 3
```

**Verify in the storyboard JSON:**
- Only 3 scenes should have `interactionDetails.clickToRevealContent`
- Other scenes will be informative (no interaction)

---

## Benefits

✅ **Cognitive Load**: Prevents overwhelming learners with too many interactions
✅ **Quality over Quantity**: Only the most pedagogically important interactions are included
✅ **Faster Generation**: Fewer OpenAI API calls = faster storyboard creation
✅ **Configurable**: Easy to adjust from 1-5 interactions per storyboard
✅ **Smart Selection**: AI naturally chooses high-priority teaching scenes

---

## Summary

You now have **precise control** over interaction density:
- **Default**: 3 Click-to-Reveal interactions per storyboard
- **Smart**: System picks the most pedagogically valuable scenes
- **Flexible**: Easy to change to 2, 4, or any number

**Status:** ✅ READY TO TEST

Restart backend and generate a new storyboard to see it in action!




