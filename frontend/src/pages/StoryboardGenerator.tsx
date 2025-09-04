// frontend/src/pages/StoryboardGenerator.tsx
import { useState } from "react";
import { generateFromText, generateFromFiles } from "@/lib/api";
import { normaliseStoryboardForUI } from "@/lib/normaliseStoryboard";
import type { StoryboardModule } from "@/types";

type Scene = {
  sceneNumber: number;
  pageTitle: string;
  onScreenText?: string;
  narrationScript?: string;
  interactionType?: string;
  developerNotes?: string;
};

export default function StoryboardGenerator() {
  const [storyboard, setStoryboard] = useState<StoryboardModule | { moduleName?: string; scenes?: Scene[] }>({});
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // however you build your formData/files today:
  const [formData] = useState<any>({
    moduleName: "",
    moduleType: "eLearning",
    complexityLevel: "Level 3",
    targetAudience: "Advisors",
    tone: "Professional",
    outputLanguage: "English (UK)",
    content: "",
  });
  const [files] = useState<any[] | undefined>(undefined);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { storyboard: rawStoryboard, meta } = files?.length
        ? await generateFromFiles(formData as any, files as any)
        : await generateFromText(formData as any);

      // ✅ Normalise the AI response so UI + PDF always get the detailed shape
      const detailed = normaliseStoryboardForUI(rawStoryboard) as StoryboardModule;

      setStoryboard(detailed);
      setMeta(meta); // modelUsed, durationMs, etc.
    } catch (e: any) {
      setError(e.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* your existing form UI goes here... */}
      <button onClick={onGenerate} disabled={loading} className="px-3 py-2 bg-black text-white rounded">
        {loading ? "Generating..." : "Generate Storyboard"}
      </button>

      {error && <div className="text-red-600">{error}</div>}

      {meta && (
        <div className="text-sm text-gray-600">
          Model: <b>{meta.modelUsed}</b> • Examples: {meta.examples} • Time: {meta.durationMs} ms
        </div>
      )}

      {Array.isArray((storyboard as any).scenes) && (storyboard as any).scenes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{(storyboard as any).moduleName}</h2>
          {(storyboard as any).scenes.map((s: Scene) => (
            <div key={s.sceneNumber} className="border rounded p-3">
              <div className="font-medium">
                Scene {s.sceneNumber}: {s.pageTitle}
              </div>
              {s.onScreenText && <div className="mt-1">OST: {s.onScreenText}</div>}
              {s.narrationScript && (
                <pre className="mt-2 text-sm whitespace-pre-wrap">{s.narrationScript}</pre>
              )}
              {s.interactionType && (
                <div className="mt-1 text-sm text-gray-700">Interaction: {s.interactionType}</div>
              )}
              {s.developerNotes && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Developer notes</summary>
                  <pre className="text-xs whitespace-pre-wrap">{s.developerNotes}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}