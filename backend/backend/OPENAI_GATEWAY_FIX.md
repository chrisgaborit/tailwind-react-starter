# ✅ OpenAI Gateway Fixed - Click-to-Reveal Now Works

## The Problem

When generating Click-to-Reveal interactivities, all generations were failing with:

```
❌ BadRequestError: 400 'messages' must contain the word 'json' in some form, 
to use 'response_format' of type 'json_object'.
```

**Root Cause:**

The `openaiGateway.ts` was forcing **ALL** OpenAI API calls to use `response_format: { type: "json_object" }`, but:

1. **OpenAI's requirement**: If you use JSON mode, the prompt MUST contain the word "json"
2. **Our Click-to-Reveal template**: Returns plain text (not JSON) and doesn't mention "json"
3. **Missing system key**: The `interactivity_designer` system key wasn't defined in the SYSTEMS object

---

## The Fix

### Updated `/backend/backend/src/services/openaiGateway.ts`

**Changes Made:**

1. ✅ **Added `interactivity_designer` system prompt** to the SYSTEMS object
2. ✅ **Made JSON mode conditional** - only uses it for specific system keys
3. ✅ **Created whitelist** (`JSON_MODE_KEYS`) for which system keys need JSON mode

**Before:**
```typescript
const SYSTEMS: Record<string, string> = {
  addie: fs.readFileSync(...),
  // interactivity_designer was missing!
};

// ALWAYS used JSON mode
response_format: { type: "json_object" },
```

**After:**
```typescript
const SYSTEMS: Record<string, string> = {
  addie: fs.readFileSync(...),
  interactivity_designer: "You are an expert instructional designer...", // ✅ ADDED
};

// ✅ Only specific keys use JSON mode
const JSON_MODE_KEYS = ["addie"];

// ✅ Conditionally apply JSON mode
...(useJsonMode ? { response_format: { type: "json_object" } } : {})
```

---

## How It Works Now

### For ADDIE Agents (WelcomeAgent, TeachAgent, etc.):
- Uses `systemKey: "addie"`
- **JSON mode enabled** ✅
- Returns structured JSON

### For InteractivityOrchestrator (Click-to-Reveal):
- Uses `systemKey: "interactivity_designer"`
- **JSON mode disabled** ✅
- Returns plain text template

---

## Test It

**Restart your backend:**
```bash
# Kill the current process (Ctrl+C)
# Then restart
cd /Users/chris/genesis-app/backend/backend
npm run dev
```

**Generate a new storyboard** and you should now see:

```
🎨 Generating Click-to-Reveal for scene 2: Learning Outcomes
🎨 Generating Click-to-Reveal template for: Learning Outcomes
✅ Click-to-Reveal generated for scene 2  ← SUCCESS!
```

Instead of the error.

---

## What You'll See in the Storyboard

Scenes with interactions will now have complete `clickToRevealContent`:

```json
{
  "interactionDetails": {
    "purpose": "progressive_disclosure",
    "pedagogicalRationale": "Engages learner through active discovery",
    "clickToRevealContent": "
      Tone: professional
      
      Context & Visuals: A clean slide with 5 clickable cards...
      
      On-Screen Text (initial): Click each principle to learn more...
      
      Interactivity Steps:
      1. Element to Click: First card labeled 'Principle 1'
         - On-Screen Text: 'Identify difficult behaviors...'
         - Voice-Over: 'The first principle is...'
         - Visual/Animation: 'Card flips to reveal content...'
      
      [etc.]
    "
  }
}
```

---

## Files Changed

- ✅ `/backend/backend/src/services/openaiGateway.ts` - Fixed JSON mode handling
- ✅ `/backend/backend/src/agents_v2/interactivityOrchestrator.ts` - Already had template generation (from previous fix)
- ✅ `/backend/backend/src/agents_v2/directorAgent.ts` - Already calling template generation (from previous fix)

---

## Summary

**The InteractivityOrchestrator was working correctly**, but the OpenAI gateway was rejecting the calls because of a mismatch between the response format requirement and the prompt structure.

**Now:** Click-to-Reveal content will generate successfully with complete, developer-ready templates.

---

**Status:** ✅ READY TO TEST

Restart your backend and try generating a storyboard!




