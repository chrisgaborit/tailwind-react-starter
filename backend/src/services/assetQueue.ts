// backend/src/services/assetQueue.ts
import path from "path";
import fs from "fs";
import crypto from "crypto";
import OpenAI from "openai";
import type { StoryboardModule, StoryboardScene, VisualSpec } from "../types";

type JobKind = "image" | "voice";
type JobStatus = "queued" | "running" | "done" | "error";

export interface AssetJob {
  id: string;
  kind: JobKind;
  moduleId: string;
  sceneIndex: number; // 0-based
  createdAt: number;
  status: JobStatus;
  error?: string;
  result?: AssetResult;
}

export interface AssetResult {
  assetId: string;
  filePath: string;
  publicUrl?: string;
  meta?: Record<string, any>;
}

export interface ModuleQueueSnapshot {
  moduleId: string;
  totals: {
    queued: number;
    running: number;
    done: number;
    error: number;
  };
  jobs: AssetJob[];
  sceneSummary: Array<{
    sceneIndex: number;
    pageTitle: string;
    image?: { assetId?: string; url?: string; status?: JobStatus };
    voice?: { assetId?: string; url?: string; status?: JobStatus };
  }>;
}

const ASSETS_DIR = process.env.ASSETS_DIR || path.join(process.cwd(), "assets");
const ASSETS_BASE_URL = process.env.ASSETS_BASE_URL || ""; // e.g., "/static/assets" behind a static handler

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(ASSETS_DIR);

function uid(prefix = "") {
  return `${prefix}${crypto.randomBytes(8).toString("hex")}`;
}

function aspectToSize(aspect: string | undefined): "1024x1024" | "1792x1024" | "1024x1792" | "1024x1280" {
  const a = String(aspect || "").toLowerCase();
  if (a.includes("16:9")) return "1792x1024";
  if (a.includes("9:16")) return "1024x1792";
  if (a.includes("4:5")) return "1024x1280";
  return "1024x1024";
}

function buildImagePrompt(v: VisualSpec, title: string): string {
  const b = v.visualGenerationBrief || ({} as any);
  const parts = [
    b.sceneDescription ? `Scene: ${b.sceneDescription}` : `Scene: Illustration supporting "${title}".`,
    b.style ? `Style: ${b.style}.` : "",
    b.subject ? `Subject: ${JSON.stringify(b.subject)}.` : "",
    b.setting ? `Setting: ${b.setting}.` : "",
    b.composition ? `Composition: ${b.composition}.` : "",
    b.lighting ? `Lighting: ${b.lighting}.` : "",
    Array.isArray(b.colorPalette) && b.colorPalette.length ? `Palette: ${b.colorPalette.join(", ")}.` : "",
    b.mood ? `Mood: ${b.mood}.` : "",
    b.brandIntegration ? `Brand integration: ${b.brandIntegration}.` : "",
    b.negativeSpace ? `Negative space: ${b.negativeSpace}.` : "",
    v.aiPrompt ? `Short brief: ${v.aiPrompt}.` : "",
    "Accessibility: ensure clear visual hierarchy and adequate contrast.",
  ]
    .filter(Boolean)
    .join(" ");

  return parts;
}

function chooseTTSVoice(persona?: string, gender?: string): string {
  const g = (gender || "").toLowerCase();
  if (g.includes("female")) return "alloy";
  if (g.includes("male")) return "verse";
  // neutral/persona based heuristic
  const p = (persona || "").toLowerCase();
  if (p.includes("warm") || p.includes("supportive")) return "alloy";
  if (p.includes("authoritative")) return "verse";
  return "alloy";
}

/** In-memory queue runner (simple, no Redis). */
class InMemoryAssetQueue {
  private jobs: AssetJob[] = [];
  private modules = new Map<string, StoryboardModule>();
  private running = false;

  enqueueModule(moduleId: string, storyboard: StoryboardModule) {
    this.modules.set(moduleId, storyboard);

    storyboard.scenes.forEach((scene, idx) => {
      // Image job if visual present and no assetId
      if (!scene.visual?.assetId) {
        this.jobs.push({
          id: uid("img_"),
          kind: "image",
          moduleId,
          sceneIndex: idx,
          createdAt: Date.now(),
          status: "queued",
        });
      }
      // Voice job if audio present and no assetId
      // (We use audio.aiGenerationDirective as optional hint; not required)
      const existingVoiceAsset = (scene as any).audio?.["assetId"];
      if (!existingVoiceAsset && scene.audio?.script) {
        this.jobs.push({
          id: uid("vo_"),
          kind: "voice",
          moduleId,
          sceneIndex: idx,
          createdAt: Date.now(),
          status: "queued",
        });
      }
    });

    this.kick();
    return this.snapshot(moduleId);
  }

  snapshot(moduleId: string): ModuleQueueSnapshot {
    const storyboard = this.modules.get(moduleId);
    const jobs = this.jobs.filter((j) => j.moduleId === moduleId);
    const totals = {
      queued: jobs.filter((j) => j.status === "queued").length,
      running: jobs.filter((j) => j.status === "running").length,
      done: jobs.filter((j) => j.status === "done").length,
      error: jobs.filter((j) => j.status === "error").length,
    };

    const sceneSummary =
      storyboard?.scenes.map((s, i) => {
        const imageJob = jobs.find((j) => j.sceneIndex === i && j.kind === "image");
        const voiceJob = jobs.find((j) => j.sceneIndex === i && j.kind === "voice");
        const imageRes = imageJob?.result;
        const voiceRes = voiceJob?.result;

        return {
          sceneIndex: i,
          pageTitle: s.pageTitle,
          image: imageJob
            ? {
              assetId: imageRes?.assetId,
              url: imageRes?.publicUrl || imageRes?.filePath,
              status: imageJob.status,
            }
            : undefined,
          voice: voiceJob
            ? {
              assetId: voiceRes?.assetId,
              url: voiceRes?.publicUrl || voiceRes?.filePath,
              status: voiceJob.status,
            }
            : undefined,
        };
      }) || [];

    return { moduleId, totals, jobs, sceneSummary };
  }

  private kick() {
    if (this.running) return;
    this.running = true;
    this.loop().finally(() => {
      this.running = false;
      // if jobs remain, schedule another pass
      if (this.jobs.some((j) => j.status === "queued")) {
        setTimeout(() => this.kick(), 100);
      }
    });
  }

  private async loop() {
    // Process a handful in parallel to keep it simple
    const parallel = Number(process.env.ASSET_QUEUE_PARALLEL || 2);
    const runners: Promise<void>[] = [];

    const queued = this.jobs.filter((j) => j.status === "queued").slice(0, parallel);
    for (const job of queued) {
      job.status = "running";
      runners.push(this.runJob(job));
    }
    await Promise.allSettled(runners);
  }

  private async runJob(job: AssetJob) {
    try {
      const storyboard = this.modules.get(job.moduleId);
      if (!storyboard) throw new Error("Unknown module");

      const scene = storyboard.scenes[job.sceneIndex];
      if (!scene) throw new Error("Unknown scene index");

      if (job.kind === "image") {
        job.result = await this.generateImage(job, scene);
        // persist on scene
        scene.visual.assetId = job.result.assetId;
        (scene as any).generatedImageUrl = job.result.publicUrl || job.result.filePath;
      } else if (job.kind === "voice") {
        job.result = await this.generateVoice(job, scene);
        // persist on scene
        (scene.audio as any).assetId = job.result.assetId;
        (scene.audio as any).fileUrl = job.result.publicUrl || job.result.filePath;
      }
      job.status = "done";
    } catch (err: any) {
      job.status = "error";
      job.error = err?.message || String(err);
    }
  }

  private async generateImage(job: AssetJob, scene: StoryboardScene): Promise<AssetResult> {
    const v = scene.visual;
    const title = scene.pageTitle || `Scene ${scene.sceneNumber}`;
    const prompt = buildImagePrompt(v, title);
    const size = aspectToSize(v.aspectRatio);

    const assetId = uid("img_");
    const outDir = path.join(ASSETS_DIR, job.moduleId);
    ensureDir(outDir);
    const filePath = path.join(outDir, `${assetId}.png`);

    // Use OpenAI Images API (gpt-image-1)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality: "high",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned");
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(filePath, buf);

    const publicUrl = ASSETS_BASE_URL ? path.join(ASSETS_BASE_URL, job.moduleId, `${assetId}.png`) : undefined;
    return { assetId, filePath, publicUrl, meta: { size, title } };
  }

  private async generateVoice(job: AssetJob, scene: StoryboardScene): Promise<AssetResult> {
    const script = scene.audio?.script || scene.narrationScript || "";
    if (!script.trim()) throw new Error("Empty audio script");

    const voice = chooseTTSVoice(scene.audio?.voiceParameters?.persona, scene.audio?.voiceParameters?.gender);
    const assetId = uid("vo_");
    const outDir = path.join(ASSETS_DIR, job.moduleId);
    ensureDir(outDir);
    const filePath = path.join(outDir, `${assetId}.mp3`);

    // OpenAI TTS (gpt-4o-mini-tts)
    const tts = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: script,
      format: "mp3",
    });

    const arrayBuffer = await tts.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const publicUrl = ASSETS_BASE_URL ? path.join(ASSETS_BASE_URL, job.moduleId, `${assetId}.mp3`) : undefined;
    return { assetId, filePath, publicUrl, meta: { voice } };
  }
}

export const assetQueue = new InMemoryAssetQueue();

/** Convenience API for routes */
export function enqueueStoryboardAssets(moduleId: string, storyboard: StoryboardModule) {
  return assetQueue.enqueueModule(moduleId, storyboard);
}
export function getModuleQueueSnapshot(moduleId: string) {
  return assetQueue.snapshot(moduleId);
}