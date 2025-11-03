// backend/src/services/openaiGateway.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

// Load Master Blueprint v1.1
const MASTER_BLUEPRINT = fs.readFileSync(
  path.join(__dirname, "..", "prompts", "masterBlueprint.md"),
  "utf8"
);

const SYSTEMS: Record<string, string> = {
  addie: fs.readFileSync(
    path.join(__dirname, "..", "agents_v2", "prompts", "system.addie.txt"),
    "utf8"
  ),
  interactivity_designer: "You are an expert instructional designer specializing in creating engaging, pedagogically-sound e-learning interactivities.",
  interactivity_designer_json: "You are an expert instructional designer specializing in creating structured, developer-ready interactivity specifications. You always output valid JSON with no markdown formatting or explanations.",
  // Master Blueprint system for storyboard generation
  master_blueprint: MASTER_BLUEPRINT,
};

// System keys that should return JSON
const JSON_MODE_KEYS = ["addie", "interactivity_designer_json"];

export async function openaiChat({
  systemKey,
  user,
}: {
  systemKey: keyof typeof SYSTEMS;
  user: string;
}) {
  // Only use JSON mode for specific system keys
  const useJsonMode = JSON_MODE_KEYS.includes(systemKey);
  
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
    temperature: 0.2,
    top_p: 0.2,
    messages: [
      { role: "system", content: SYSTEMS[systemKey] },
      { role: "user", content: user },
    ],
  });

  return res.choices[0]?.message?.content || "[]";
}
