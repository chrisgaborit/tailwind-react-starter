// src/lib/pdf.ts
// AFTER
const API_BASE = import.meta.env.VITE_BACKEND_URL;

/**
 * Download a PDF version of the storyboard by posting the
 * entire in-memory object (with scenes + imageUrl fields)
 * to the backend PDF builder.
 */
export async function downloadStoryboardPdf(storyboard: any) {
  const res = await fetch(`${API_BASE}/api/storyboard/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(storyboard), // send the full object including imageUrl
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PDF export failed: ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storyboard_${(storyboard.moduleName || "export")
    .replace(/\W+/g, "_")
    .toLowerCase()}_exact.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}