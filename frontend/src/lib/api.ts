// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export async function generateFromText(formData: any) {
  const res = await fetch(`${API_BASE}/api/v1/generate-from-text?raw=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formData }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || "No body"}`);
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text.slice(0,400)}`); }
}

export async function generateFromFiles(formData: any, files: File[]) {
  const fd = new FormData();
  fd.append("formData", JSON.stringify(formData));
  for (const f of files) fd.append("files", f, f.name);
  const res = await fetch(`${API_BASE}/api/v1/generate-from-files?raw=1`, { method: "POST", body: fd });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || "No body"}`);
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text.slice(0,400)}`); }
}
