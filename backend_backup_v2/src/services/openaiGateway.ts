// backend/src/services/openaiGateway.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEMS: Record<string, string> = {
  addie: fs.readFileSync(
    path.join(__dirname, "..", "agents_v2", "prompts", "system.addie.txt"),
    "utf8"
  ),
};

export async function openaiChat({
  systemKey,
  user,
}: {
  systemKey: keyof typeof SYSTEMS;
  user: string;
}) {
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.2,
    top_p: 0.2,
    messages: [
      { role: "system", content: SYSTEMS[systemKey] },
      { role: "user", content: user },
    ],
  });

  return res.choices[0]?.message?.content || "[]";
}
