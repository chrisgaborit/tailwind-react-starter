// frontend/src/lib/api.ts

// Base URL for the backend Agents v2 service
const BASE_URL = (import.meta.env.VITE_BACKEND_BASE || "http://localhost:8080").replace(/\/$/, "");
// Use Brandon Hall pipeline endpoint for new architecture
const STORYBOARD_ENDPOINT = `${BASE_URL}/api/generate`;
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
  // { success, storyboard } (Brandon Hall format with pages[])
  // { success, storyboard: { pages: [...] } } (Brandon Hall format)
  const sb =
    json?.data?.storyboardModule ||
    json?.storyboardModule ||
    json?.storyboard ||
    (Array.isArray(json?.scenes) ? json : json?.data);

  // Handle Brandon Hall format (pages[]) - convert to scenes[] for compatibility
  if (sb?.pages && Array.isArray(sb.pages) && sb.pages.length > 0) {
    console.log("🔄 Converting Brandon Hall pages[] to scenes[] for frontend compatibility");
    
    // Convert pages to scenes format
    const scenes = sb.pages.map((page: any) => {
      // Combine all event OST fields into one
      const ostTexts = page.events
        ?.map((event: any) => event.ost)
        .filter((text: string) => text && text.trim().length > 0) || [];

      // Combine all event audio fields into one
      const audioTexts = page.events
        ?.map((event: any) => event.audio)
        .filter((text: string) => text && text.trim().length > 0) || [];

      return {
        sceneNumber: page.pageNumber || 'p00',
        title: page.title || 'Untitled Scene',
        pageTitle: page.title || 'Untitled Scene',
        pageType: page.pageType || 'Text + Image',
        
        // CRITICAL: These are the fields the frontend expects
        onScreenText: ostTexts.length > 0 ? ostTexts.join('\n\n') : 'Content not available',
        voiceoverScript: audioTexts.length > 0 ? audioTexts.join(' ') : 'Content not available',
        
        // Additional metadata
        estimatedDuration: page.estimatedDurationSec || 60,
        timing: {
          estimatedSeconds: page.estimatedDurationSec || 60,
        },
        learningObjectiveIds: page.learningObjectiveIds || [],
        
        // Include events for detailed view
        events: page.events || [],
        
        // Developer notes
        developerNotes: page.events
          ?.map((event: any) => event.devNotes)
          .filter((text: string) => text && text.trim().length > 0)
          .join('\n') || '',
        
        // Accessibility
        accessibility: page.accessibility || {
          altText: [],
          keyboardNav: 'Standard navigation',
          contrastNotes: 'Standard contrast',
          screenReader: 'Standard screen reader support'
        }
      };
    });

    // Add scenes to storyboard object
    sb.scenes = scenes;
    console.log(`✅ Converted ${scenes.length} pages to ${scenes.length} scenes`);
    if (scenes.length > 0) {
      console.log(`   Scene 1 OST: ${scenes[0].onScreenText?.substring(0, 50)}...`);
      console.log(`   Scene 1 VO: ${scenes[0].voiceoverScript?.substring(0, 50)}...`);
    }
  }

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

  // Map learning outcomes to simple strings (not objects)
  const learningOutcomesArray = mapLearningOutcomes(
    formData.learningOutcomes || formData.learningObjectives
  );
  const learningOutcomes = learningOutcomesArray.map(lo => lo.text);

  const payload = {
    topic: formData.moduleName || formData.topic,
    duration,
    audience: formData.targetAudience || formData.audience || "General staff",
    learningOutcomes: learningOutcomes, // Send as array of strings
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

  // Map learning outcomes to simple strings (not objects)
  const learningOutcomesArray = mapLearningOutcomes(
    formData.learningOutcomes || formData.learningObjectives
  );
  const learningOutcomes = learningOutcomesArray.map(lo => lo.text);

  const payload = {
    topic: formData.moduleName || formData.topic,
    duration,
    audience: formData.targetAudience || formData.audience || "General staff",
    learningOutcomes: learningOutcomes, // Send as array of strings
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
