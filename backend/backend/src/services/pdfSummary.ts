// backend/src/services/pdfSummary.ts
import { IDMethod } from "../types/storyboardTypes";

export function summariseFramework(storyboard: any) {
  const method: IDMethod = storyboard?.idMethod || "ADDIE";
  const scenes = storyboard?.scenes || [];
  const bucket: Record<string, number> = {};
  for (const s of scenes) {
    let key = "Unspecified";
    if (method === "ADDIE") key = s?.instructionalTag?.addie?.phase || key;
    if (method === "SAM") key = s?.instructionalTag?.sam?.phase || key;
    if (method === "MERRILL") key = s?.instructionalTag?.merrill?.phase || key;
    if (method === "GAGNE") key = s?.instructionalTag?.gagne?.event || key;
    if (method === "BACKWARD") key = s?.instructionalTag?.backward?.stage || key;
    if (method === "BLOOM") key = s?.instructionalTag?.bloom?.level || key;
    bucket[key] = (bucket[key] || 0) + 1;
  }
  return { method, coverage: bucket, totalScenes: scenes.length };
}