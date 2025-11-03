// frontend/src/lib/api.ts

// Base URL for the backend Agents v2 service
const BASE_URL = (import.meta.env.VITE_BACKEND_BASE || "http://localhost:8080").replace(/\/$/, "");
const STORYBOARD_ENDPOINT = `${BASE_URL}/api/v2/storyboards`;
const STORYBOARD_PDF_ENDPOINT = `${BASE_URL}/api/storyboard/pdf`;

/* -------------------------- tiny helpers -------------------------- */

// Safe URL joiner (avoids double slashes)
function joinUrl(...parts: Array<string | undefined>): string {
  const cleaned = parts
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/+|\/+$/g, ""));
  return cleaned.length ? `/${cleaned.join("/")}` : "/";
}

async function parseOrThrow(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || "No body"}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 400)}`);
  }
}

if (typeof window !== "undefined") {
  console.log(`🔗 Client BACKEND_BASE = ${BASE_URL}`);
}

function normalizeSceneImages(sb: any) {
  if (!sb || !Array.isArray(sb.scenes)) return sb;
  sb.scenes = sb.scenes.map((s: any, i: number) => ({
    sceneNumber: s?.sceneNumber ?? i + 1,
    ...s,
    // Ensure flat mirrors for UI cards/grid & PDF
    imageUrl: s?.imageUrl || s?.visual?.generatedImageUrl || null,
    imageParams: s?.imageParams || s?.visual?.imageParams || null,
  }));
  return sb;
}

function normalizeEnvelope(json: any) {
  if (!json) return json;

  // Accept several backend envelopes:
  // { success, data: { storyboardModule } }
  // { storyboardModule }
  // { data } where data itself is the storyboard
  // { success, storyboard }
  const sb =
    json?.data?.storyboardModule ||
    json?.storyboardModule ||
    json?.storyboard ||
    (Array.isArray(json?.scenes) ? json : json?.data);

  if (sb?.scenes) {
    normalizeSceneImages(sb);
    if (json?.data?.storyboardModule) json.data.storyboardModule = sb;
    else if (json?.storyboardModule) json.storyboardModule = sb;
    else if (json?.storyboard) json.storyboard = sb;
    else if (json?.data?.scenes) json.data = sb;
    else if (json?.scenes) return sb; // response is the storyboard itself
  }
  return json;
}

function mapLearningOutcomes(raw: any): Array<{ text: string }> {
  if (!raw) return [];
  const values: string[] = Array.isArray(raw)
    ? raw
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item.text === "string") return item.text.trim();
          return "";
        })
        .filter(Boolean)
    : String(raw)
        .split(/\r?\n|[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  return values.map((text) => ({ text }));
}

/* -------------------------- API calls -------------------------- */

/**
 * Generate a storyboard directly from text content.
 * Always requests image generation by setting generateImages: true.
 */
export async function generateFromText(formData: any) {
  const rawDuration =
    formData.durationMins ??
    formData.duration ??
    20;
  const parsedDuration =
    typeof rawDuration === "string"
      ? parseInt(rawDuration, 10)
      : Number(rawDuration);
  const duration =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : 20;

  const payload = {
    topic: formData.moduleName || formData.topic,
    duration,
    audience: formData.targetAudience || formData.audience || "General staff",
    learningOutcomes: mapLearningOutcomes(
      formData.learningOutcomes || formData.learningObjectives
    ),
    sourceMaterial: formData.sourceMaterial || formData.content || "",
  };

  console.log("Posting to:", STORYBOARD_ENDPOINT, payload);

  const res = await fetch(STORYBOARD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await parseOrThrow(res);
  return normalizeEnvelope(json);
}

/**
 * Generate a storyboard from uploaded files (PDFs, docs, etc.).
 * Always requests image generation by setting generateImages: true.
 */
export async function generateFromFiles(formData: any) {
  const rawDuration =
    formData.durationMins ??
    formData.duration ??
    20;
  const parsedDuration =
    typeof rawDuration === "string"
      ? parseInt(rawDuration, 10)
      : Number(rawDuration);
  const duration =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : 20;

  const payload = {
    topic: formData.moduleName || formData.topic,
    duration,
    audience: formData.targetAudience || formData.audience || "General staff",
    learningOutcomes: mapLearningOutcomes(
      formData.learningOutcomes || formData.learningObjectives
    ),
    sourceMaterial: formData.sourceMaterial || formData.content || "",
  };

  console.log("Posting to:", STORYBOARD_ENDPOINT, payload);

  const response = await fetch(STORYBOARD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseOrThrow(response);
  return normalizeEnvelope(json);
}

/**
 * Download a PDF by sending the current storyboard JSON to the backend.
 */
export async function downloadStoryboardPdf(storyboard: any) {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE}/api/storyboard/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyboard }),
  });

  if (!response.ok) throw new Error("Failed to generate PDF");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storyboard.pdf";
  a.click();
  window.URL.revokeObjectURL(url);
}
