import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- Mapping rules to turn free text -> controlled labels
const MAP = {
  // Interaction → Activation
  interactionToActivation: {
    "Drag and Drop": "Cognitive Activation",
    "DragAndDrop": "Cognitive Activation",
    "MCQ": "Assessment & Mastery Activation",
    "Multiple Choice": "Assessment & Mastery Activation",
    "Clickable Hotspots": "Micro-engagement Activation",
    "Hotspots": "Micro-engagement Activation",
    "Scenario": "Experiential Activation",
    "Branching": "Experiential Activation",
    "Role Play": "Experiential Activation",
    "Try It": "Behavioural Activation",
    "Software Sim": "Behavioural Activation"
  },
  // Normalise interaction names
  normInteraction: {
    "drag and drop": "DragAndDrop",
    "drag-and-drop": "DragAndDrop",
    "drag & drop": "DragAndDrop",
    "mcq": "MCQ",
    "multiple choice": "MCQ",
    "clickable hotspots": "ClickableHotspots",
    "hotspots": "ClickableHotspots",
    "scenario": "Scenario",
    "branching": "Scenario",
    "role play": "RolePlay",
    "try it": "TryIt",
    "software sim": "SoftwareSimulation"
  }
};

// Heuristics for quality score
function scoreQuality(scene, evt) {
  let s = 0;
  if (scene?.accessibilityNotes) s += 2;
  if (scene?.xapiEvents?.length) s += 2;
  if (scene?.interaction || scene?.interactionType) s += 2;
  if (scene?.timing?.estimatedSecs) s += 1;
  if (scene?.developerNotes) s += 2;
  if (evt?.interactive || evt?.developerNotes) s += 1;
  return s;
}

function normaliseInteraction(raw) {
  if (!raw) return null;
  const k = String(raw).toLowerCase().trim();
  return MAP.normInteraction[k] ?? raw;
}

function inferActivation(interaction) {
  return MAP.interactionToActivation[interaction] ?? "Knowledge Activation";
}

function collectAccessibility(scene) {
  const qc = scene?.quickChecks || {};
  const list = [];
  if (qc.captionsOn) list.push("CaptionsOn");
  if (qc.keyboardPath) list.push("KeyboardPath");
  if (qc.focusOrder)  list.push("FocusOrder");
  return list;
}

async function embed(text) {
  const e = await openai.embeddings.create({
    model: process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
    input: text
  });
  return e.data[0].embedding;
}

function buildText(scene, evt) {
  const bits = [
    scene?.pageTitle,
    scene?.screenLayout,
    scene?.narrationScript,
    scene?.onScreenText,
    scene?.developerNotes,
    scene?.interactionDescription,
    scene?.aiDirective,
    evt?.audio?.script,
    evt?.narrationScript,
    evt?.onScreenText,
    evt?.developerNotes
  ].filter(Boolean);
  return bits.join("\n\n");
}

function buildLabels(scene, evt) {
  const interactionRaw =
    evt?.interactive?.type || evt?.interactionType || scene?.interactionType || scene?.interaction?.type;
  const interaction = normaliseInteraction(interactionRaw);
  const activationCategory = inferActivation(interaction);

  const visual = scene?.visual || {};
  const palette = scene?.palette || (scene?.colourPalette ? [scene?.colourPalette] : []);

  // pick a rough “assessment” type if present
  const assessmentType =
    interaction === "MCQ" ? (scene?.decisionLogic ? "Summative" : "Formative") : undefined;

  return {
    activationCategory,
    interactionType: interaction || "Informative",
    assessmentType,
    knowledgeCheckType: interaction === "MCQ" ? "MCQ" : undefined,
    mediaStyle: [visual?.style, visual?.mediaType].filter(Boolean).join(" / ") || undefined,
    animationStyle: visual?.composition || scene?.animationStyle || undefined,
    colourPalette: palette,
    brandIntegration: scene?.brandIntegration || undefined,
    accessibility: collectAccessibility(scene),
    xapiVerbs: Array.isArray(scene?.xapiEvents) ? scene.xapiEvents.map(x => x?.verb).filter(Boolean) : []
  };
}

function buildBlueprint(scene, evt, labels) {
  // Only create a canonical blueprint for interactive scenes
  const it = labels.interactionType;
  const isInteractive = it && it !== "Informative";
  if (!isInteractive) return null;

  const retry = scene?.interaction?.retry || "Allow 1 retry; then reveal answers.";
  const completion = scene?.interaction?.completion || "All items completed / correct.";
  const xapi = (labels.xapiVerbs?.length ? labels.xapiVerbs : ["interacted"]).join(", ");

  return {
    pedagogicalIntent: scene?.aiDirective || `Deliver a ${it} consistent with ${labels.activationCategory}.`,
    userGoal: evt?.onScreenText || "Follow on-screen instructions and complete the task.",
    behaviour: {
      mechanics: scene?.interactionDescription || "Standard interaction behaviour per type.",
      retryLogic: retry,
      completionRule: completion,
      randomisation: /random/i.test(scene?.developerNotes || "") ? "Randomise order" : undefined
    },
    copy: {
      instructions: evt?.onScreenText || "Complete the interaction as instructed.",
      successFeedback: "Well done.",
      errorFeedback: "Please review and try again."
    },
    developerNotes: [
      "Ensure keyboard path and visible focus outlines.",
      `xAPI verbs: ${xapi}.`
    ],
    assets: {
      visualStyle: [labels.mediaStyle, labels.animationStyle].filter(Boolean).join(" • ") || undefined,
      artboards: []
    },
    timing: scene?.timing || undefined
  };
}

async function run() {
  console.log("🔎 Scanning storyboards…");
  const { data, error } = await supabase
    .from("rag_storyboards")
    .select("id, content")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;

  let upserts = 0;

  for (const row of data) {
    const sb = row.content;
    const scenes = Array.isArray(sb?.scenes) ? sb.scenes : [];
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const events = Array.isArray(s?.events) && s.events.length ? s.events : [ { } ];
      for (let j = 0; j < events.length; j++) {
        const e = events[j];
        const text = buildText(s, e);
        if (!text.trim()) continue;

        const labels = buildLabels(s, e);
        const blueprint = buildBlueprint(s, e, labels);
        const quality_score = scoreQuality(s, e);
        const vec = await embed(text.slice(0, 8000));

        const { error: upErr } = await supabase
          .from("rag_storyboard_chunks")
          .upsert({
            storyboard_id: row.id,
            scene_index: i,
            event_index: j,
            text,
            labels,
            blueprint,
            quality_score,
            embedding: vec
          }, { onConflict: "storyboard_id,scene_index,event_index" });

        if (upErr) {
          console.error("Upsert failed", upErr);
        } else {
          upserts++;
        }
      }
    }
  }

  console.log(`✅ Chunking + tagging complete. Upserted ${upserts} rows into rag_storyboard_chunks.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});