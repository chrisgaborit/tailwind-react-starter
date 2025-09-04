// frontend/src/components/StoryboardDisplayV2.tsx
import React, { useMemo, useState, useEffect } from "react";
import type { StoryboardModule, StoryboardScene, OverlayElement } from "@/types";
import QualityPanel from "./QualityPanel";

// ---- Helpers -------------------------------------------------
const pad2 = (n: number) => String(n).padStart(2, "0");
const wc = (s?: string) => (s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0);
const textOrDash = (s?: string) => (s && String(s).trim().length ? s : "—");

function evaluate(m: StoryboardModule) {
  // lightweight mirror of backend scoring (avoids waiting for server)
  let issues: any[] = [];
  (m.scenes || []).forEach((s, i) => {
    const count = wc(s.onScreenText);
    if (count > 70) issues.push({ sceneIndex: i, kind: "ost-limit", message: `On-screen text is ${count} words (limit 70).`, severity: "warn" });
    const hasVGB = !!s.visual?.visualGenerationBrief?.sceneDescription;
    if (!hasVGB) issues.push({ sceneIndex: i, kind: "visual-brief-missing", message: "Visual generation brief is missing key fields.", severity: "warn" });
    const hasElems = typeof s.screenLayout === "object" && Array.isArray((s.screenLayout as any).elements);
    if (!hasElems) issues.push({ sceneIndex: i, kind: "layout-not-componentised", message: "Screen layout is not componentised.", severity: "info" });
    const hasAudioDir = !!s.audio?.aiGenerationDirective || !!s.audio?.voiceParameters?.persona;
    if (!hasAudioDir) issues.push({ sceneIndex: i, kind: "audio-directive-missing", message: "Audio directive/persona missing.", severity: "info" });
    if (s.interactionType !== "None" && !s.interactionDetails) {
      issues.push({ sceneIndex: i, kind: "interaction-details-missing", message: "Interactive scene without detailed interaction logic.", severity: "warn" });
    }
  });
  let score = 100 - issues.reduce((acc, it) => acc + (it.severity === "error" ? 10 : it.severity === "warn" ? 5 : 2), 0);
  if (score < 0) score = 0;
  return { score, issues };
}

// ---- Component -------------------------------------------------
type Props = {
  storyboard: StoryboardModule;
};

const StoryboardDisplayV2: React.FC<Props> = ({ storyboard }) => {
  const { score, issues } = useMemo(() => evaluate(storyboard), [storyboard]);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [assetStatus, setAssetStatus] = useState<any | null>(null);

  // Asset generation
  const enqueueAssets = async () => {
    const res = await fetch("/api/assets/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboard }),
    });
    const json = await res.json();
    setModuleId(json.moduleId);
    setAssetStatus(json.snapshot);
  };

  useEffect(() => {
    if (!moduleId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/assets/status/${moduleId}`);
      const json = await res.json();
      setAssetStatus(json);
    }, 3000);
    return () => clearInterval(iv);
  }, [moduleId]);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{storyboard.moduleName || "Storyboard"}</h2>
          <p className="text-sm text-slate-500">Brandon Hall enriched preview</p>
        </div>
        <button
          onClick={enqueueAssets}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700"
        >
          Generate Assets
        </button>
      </header>

      <QualityPanel score={score} issues={issues} />

      {assetStatus && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 font-semibold text-slate-800">Asset Queue</div>
          <div className="text-sm text-slate-600">
            queued: {assetStatus?.totals?.queued} • running: {assetStatus?.totals?.running} • done: {assetStatus?.totals?.done} • error: {assetStatus?.totals?.error}
          </div>
        </div>
      )}

      {(storyboard.scenes || []).map((scene, i) => (
        <SceneCard key={scene.screenId || i} scene={scene} index={i} total={storyboard.scenes.length} />
      ))}
    </section>
  );
};

const SceneCard: React.FC<{ scene: StoryboardScene; index: number; total: number }> = ({ scene, index, total }) => {
  const pageNo = `p${pad2(index + 1)}`;
  const ostWords = wc(scene.onScreenText);

  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-2 rounded-t-lg border-b border-slate-200 bg-slate-50 [grid-template-columns:1fr_auto_auto]">
        <div className="p-3 text-sm">
          <div className="font-semibold text-slate-700">Page Title</div>
          <div className="text-slate-900">{scene.pageTitle}</div>
        </div>
        <div className="p-3 text-sm">
          <div className="font-semibold text-slate-700">Type</div>
          <div className="text-slate-900">{scene.interactionType !== "None" ? "Interactive" : "Informative"}</div>
        </div>
        <div className="p-3 text-sm">
          <div className="font-semibold text-slate-700">Number</div>
          <div className="text-slate-900">{pageNo}</div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <VisualBriefBlock scene={scene} />
        <AudioBlock scene={scene} />
      </div>

      <LayoutElements scene={scene} />

      <InteractionBlock scene={scene} />

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-600">
        <span>OST words: {ostWords}{ostWords > 70 ? " (limit 70 exceeded)" : ""}</span>
        <span>
          Page {index + 1} of {total}
        </span>
      </div>
    </article>
  );
};

const VisualBriefBlock: React.FC<{ scene: StoryboardScene }> = ({ scene }) => {
  const v = scene.visual;
  const b = v.visualGenerationBrief || ({} as any);
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="mb-2 font-semibold text-slate-800">Visual Brief</div>
      <div className="text-sm text-slate-700 space-y-1">
        <div><strong>Media:</strong> {v.mediaType} • <strong>Style:</strong> {v.style} • <strong>Aspect:</strong> {v.aspectRatio}</div>
        <div><strong>Scene:</strong> {textOrDash(b.sceneDescription)}</div>
        <div><strong>Subject:</strong> {b.subject ? JSON.stringify(b.subject) : "—"}</div>
        <div><strong>Setting:</strong> {textOrDash(b.setting)}</div>
        <div><strong>Composition:</strong> {textOrDash(b.composition)}</div>
        <div><strong>Lighting:</strong> {textOrDash(b.lighting)}</div>
        <div><strong>Palette:</strong> {Array.isArray(b.colorPalette) && b.colorPalette.length ? b.colorPalette.join(", ") : "—"}</div>
        <div><strong>Mood:</strong> {textOrDash(b.mood)}</div>
        <div><strong>Brand:</strong> {textOrDash(b.brandIntegration)}</div>
        <div><strong>Negative Space:</strong> {textOrDash(b.negativeSpace)}</div>
        <div><strong>Alt text:</strong> {textOrDash(v.altText)}</div>
      </div>
      {(scene as any).generatedImageUrl && (
        <div className="mt-3 overflow-hidden rounded border">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={(scene as any).generatedImageUrl} className="block w-full" />
        </div>
      )}
    </div>
  );
};

const AudioBlock: React.FC<{ scene: StoryboardScene }> = ({ scene }) => {
  const a = scene.audio;
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="mb-2 font-semibold text-slate-800">Audio</div>
      <div className="mb-1 text-xs text-slate-500">Persona: {a.voiceParameters?.persona} • Pace: {a.voiceParameters?.pace} • Tone: {a.voiceParameters?.tone}</div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[12px] leading-5 text-slate-800">{a.script}</pre>
      {a.aiGenerationDirective && (
        <div className="mt-2 rounded border border-indigo-200 bg-indigo-50 p-2 text-xs text-indigo-800">
          <strong>AI Directive:</strong> {a.aiGenerationDirective}
        </div>
      )}
      {(a as any).fileUrl && (
        <audio className="mt-2 w-full" controls src={(a as any).fileUrl} />
      )}
    </div>
  );
};

const LayoutElements: React.FC<{ scene: StoryboardScene }> = ({ scene }) => {
  const layout = scene.screenLayout;
  const elements: OverlayElement[] =
    typeof layout === "object" && Array.isArray((layout as any).elements) ? (layout as any).elements : [];

  return (
    <div className="px-4">
      <div className="mb-2 font-semibold text-slate-800">Overlay Elements</div>
      {elements.length === 0 ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">—</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {elements.map((el, i) => (
            <div key={i} className="rounded border border-slate-200 bg-white p-3">
              <div className="text-sm"><strong>Type:</strong> {el.elementType}</div>
              {el.content && <div className="text-sm"><strong>Content:</strong> {el.content}</div>}
              {el.placement && <div className="text-sm"><strong>Placement:</strong> {el.placement}</div>}
              {el.style && (
                <div className="mt-1 text-xs text-slate-600">
                  <strong>Style</strong>: {Object.entries(el.style).map(([k, v]) => `${k}=${v}`).join("; ")}
                </div>
              )}
              {el.aiGenerationDirective && (
                <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                  <strong>AI Directive:</strong> {el.aiGenerationDirective}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InteractionBlock: React.FC<{ scene: StoryboardScene }> = ({ scene }) => {
  const id = scene.interactionDetails;
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-1 font-semibold text-slate-800">Interaction</div>
        <div className="text-sm text-slate-700">
          <strong>Type:</strong> {scene.interactionType}
          {scene.interactionDescription ? <> — <span>{scene.interactionDescription}</span></> : null}
        </div>
        {id?.aiActions && id.aiActions.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-600">AI Actions</div>
            <ul className="ml-4 list-disc text-sm">
              {id.aiActions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        {id?.aiGenerationDirective && (
          <div className="mt-2 rounded border border-indigo-200 bg-indigo-50 p-2 text-xs text-indigo-800">
            <strong>AI Directive:</strong> {id.aiGenerationDirective}
          </div>
        )}
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="mb-1 font-semibold text-slate-800">Decision Logic & xAPI</div>
        {id?.aiDecisionLogic && id.aiDecisionLogic.length > 0 ? (
          <ul className="ml-4 list-disc text-sm">
            {id.aiDecisionLogic.map((rule, i) => (
              <li key={i}>
                <strong>Choice {rule.choice}</strong>
                {rule.feedback?.text && <> — <em>{rule.feedback.text}</em></>}
                {rule.navigateTo && <> → <span className="text-slate-600">Navigate: {rule.navigateTo}</span></>}
                {rule.xapi && (
                  <div className="text-xs text-slate-600">xAPI: {rule.xapi.verb} {rule.xapi.object} {rule.xapi.result ? JSON.stringify(rule.xapi.result) : ""}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-600">—</div>
        )}

        {id?.xapiEvents && id.xapiEvents.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold text-slate-600">Additional xAPI</div>
            <ul className="ml-4 list-disc text-sm">
              {id.xapiEvents.map((e, i) => (
                <li key={i}>{e.verb} {e.object} {e.result ? JSON.stringify(e.result) : ""}</li>
              ))}
            </ul>
          </div>
        )}

        {(id?.retryLogic || id?.completionRule) && (
          <div className="mt-2 text-xs text-slate-600">
            {id.retryLogic && <div><strong>Retry:</strong> {id.retryLogic}</div>}
            {id.completionRule && <div><strong>Completion:</strong> {id.completionRule}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardDisplayV2;