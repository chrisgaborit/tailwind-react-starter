// src/lib/api.ts
const API_BASE = import.meta.env.VITE_BACKEND_URL;

/* -------------------------- helpers -------------------------- */

function normalizeSceneImages(sb: any) {
  if (!sb || !Array.isArray(sb.scenes)) return sb;
  sb.scenes = sb.scenes.map((s: any, i: number) => ({
    sceneNumber: s?.sceneNumber ?? i + 1,
    ...s,
    // Ensure flat mirrors exist for UI (cards/grid) and PDF builder
    imageUrl: s?.imageUrl || s?.visual?.generatedImageUrl || null,
    imageParams: s?.imageParams || s?.visual?.imageParams || null,
  }));
  return sb;
}

function normalizeEnvelope(json: any) {
  if (!json) return json;
  // Common shapes we return from the backend:
  // { success, data: { storyboardModule } }
  // { storyboardModule }
  // (fallback) { data } that IS the storyboard
  const sb =
    json?.data?.storyboardModule ||
    json?.storyboardModule ||
    (Array.isArray(json?.scenes) ? json : json?.data);

  if (sb?.scenes) {
    normalizeSceneImages(sb);
    if (json?.data?.storyboardModule) json.data.storyboardModule = sb;
    else if (json?.storyboardModule) json.storyboardModule = sb;
    else if (json?.data?.scenes) json.data = sb;
    else if (json?.scenes) return sb; // rare case: response is the storyboard itself
  }
  return json;
}

/* -------------------------- API calls -------------------------- */

/**
 * Generate a storyboard directly from text content.
 * Always requests image generation by setting generateImages: true.
 */
export async function generateFromText(formData: any) {
  const res = await fetch(`${API_BASE}/api/v1/generate-from-text?raw=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formData: {
        ...formData,
        generateImages: true, // request images
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || "No body"}`);

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 400)}`);
  }

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
    }),
  );
  for (const f of files) fd.append("files", f, f.name);

  const res = await fetch(`${API_BASE}/api/v1/generate-from-files?raw=1`, {
    method: "POST",
    body: fd,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || "No body"}`);

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 400)}`);
  }

  return normalizeEnvelope(json);
}