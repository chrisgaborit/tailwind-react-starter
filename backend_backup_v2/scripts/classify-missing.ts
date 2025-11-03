import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TOPIC_VOCAB = [
  "Induction","Onboarding","Safety","Compliance","Ethics","Privacy",
  "Cybersecurity","Leadership","Customer Service","Product Training",
  "Diversity & Inclusion","Wellbeing","Technical Training","Soft Skills"
];
const INDUSTRY_VOCAB = [
  "Oil & Gas","Financial Services","Retail","Healthcare","Government",
  "Utilities","Transport & Logistics","Education","Manufacturing","Technology",
  "Cross-Industry"
];

async function classify(text: string) {
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Classify text strictly into JSON {topic:[], industry:[]}" },
      { role: "user", content: `Text:\n${text.slice(0,2000)}\n\nTopics:${TOPIC_VOCAB.join(", ")}\nIndustries:${INDUSTRY_VOCAB.join(", ")}` }
    ],
    temperature: 0
  });
  try {
    return JSON.parse(r.choices[0].message.content ?? "{}");
  } catch { return { topic: [], industry: [] }; }
}

async function run(batch = 20) {
  const { data: rows } = await supabase
    .from("storyboards")
    .select("id, title, content")
    .or("cardinality(topic).eq.0,topic.is.null,cardinality(industry).eq.0,industry.is.null")
    .limit(batch);

  for (const row of rows ?? []) {
    const text = `${row.title}\n${JSON.stringify(row.content)}`;
    const labels = await classify(text);

    await supabase.from("storyboards").update({
      topic: labels.topic ?? [],
      industry: labels.industry ?? [],
      tags: (labels.topic ?? []).concat(labels.industry ?? [])
    }).eq("id", row.id);

    console.log("Updated:", row.id, labels);
  }
}

run();