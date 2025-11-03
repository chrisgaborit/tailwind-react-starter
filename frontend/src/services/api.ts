// frontend/src/services/api.ts
const API_BASE = import.meta.env.VITE_BACKEND_URL || "/api";

async function handleResponse(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || "No body"}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchStoryboard(id: string) {
  const res = await fetch(`${API_BASE}/storyboard/${id}`);
  return handleResponse(res);
}

export async function saveStoryboard(storyboard: any) {
  const res = await fetch(`${API_BASE}/storyboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(storyboard),
  });
  return handleResponse(res);
}

export async function listStoryboards() {
  const res = await fetch(`${API_BASE}/storyboards`);
  return handleResponse(res);
}