// frontend/src/lib/api.ts

// Base URL for the backend:
//  - In dev, leave VITE_BACKEND_URL undefined and Vite proxy will use "/api"
//  - In prod, set VITE_BACKEND_URL (e.g., "https://your-host.com/api")
const API_BASE = (import.meta.env.VITE_BACKEND_URL || "/api").replace(/\/$/, "");

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
  const sb =
    json?.data?.storyboardModule ||
    json?.storyboardModule ||
    (Array.isArray(json?.scenes) ? json : json?.data);

  if (sb?.scenes) {
    normalizeSceneImages(sb);
    if (json?.data?.storyboardModule) json.data.storyboardModule = sb;
    else if (json?.storyboardModule) json.storyboardModule = sb;
    else if (json?.data?.scenes) json.data = sb;
    else if (json?.scenes) return sb; // response is the storyboard itself
  }
  return json;
}

/* -------------------------- API calls -------------------------- */

/**
 * Generate a storyboard directly from text content.
 * Always requests image generation by setting generateImages: true.
 */
export async function generateFromText(formData: any) {
  const url = API_BASE + joinUrl("v1", "generate-from-text") + "?raw=1";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formData: {
        ...formData,
        generateImages: true, // request images
      },
    }),
  });
  const json = await parseOrThrow(res);
  return normalizeEnvelope(json);
}

/**
 * Generate a storyboard from uploaded files (PDFs, docs, etc.).
 * Always requests image generation by setting generateImages: true.
 */
export async function generateFromFiles(formData: any, files: File[]) {
  const fd = new FormData();
  fd.append(
    "formData",
    JSON.stringify({
      ...formData,
      generateImages: true, // request images
    })
  );
  for (const f of files) fd.append("files", f, f.name);

  const url = API_BASE + joinUrl("v1", "generate-from-files") + "?raw=1";
  const res = await fetch(url, { method: "POST", body: fd });
  const json = await parseOrThrow(res);
  return normalizeEnvelope(json);
}