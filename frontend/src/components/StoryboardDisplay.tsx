// @ts-nocheck
import React, { Fragment, useMemo, useRef, useEffect } from "react";
import type { StoryboardModule } from "@/types";

type Props = { storyboardModule: StoryboardModule | any };

const FORCE_PAGE_BREAK_BETWEEN_SCENES = true;

/* ------------------------------- UI atoms ------------------------------- */

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-700 px-2.5 py-1 text-xs text-slate-200">
    {children}
  </span>
);

const KeyRow = ({ label, value }: { label: string; value?: any }) => {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && !value.length) ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value || {}).length === 0);
  if (isEmpty) return null;

  const render = (val: any) => {
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      return <span>{String(val)}</span>;
    }
    if (Array.isArray(val)) {
      const simple = val.every((v) => ["string", "number", "boolean"].includes(typeof v));
      return simple ? (
        <span className="whitespace-pre-wrap break-words">{val.join(", ")}</span>
      ) : (
        <pre className="whitespace-pre-wrap break-words text-slate-200/90">{JSON.stringify(val, null, 2)}</pre>
      );
    }
    return <pre className="whitespace-pre-wrap break-words text-slate-200/90">{JSON.stringify(val, null, 2)}</pre>;
  };

  return (
    <div className="grid grid-cols-12 gap-3 text-sm">
      <div className="col-span-4 md:col-span-3 text-slate-400">{label}</div>
      <div className="col-span-8 md:col-span-9 whitespace-pre-wrap text-slate-100">{render(value)}</div>
    </div>
  );
};

const Card = ({ title, children, className = "" }: any) => (
  <div className={`pdf-avoid-break rounded-xl border border-slate-700 bg-slate-800 shadow-xl ${className}`}>
    {title ? (
      <div className="px-5 py-3 border-b border-slate-700">
        <h3 className="text-base font-semibold text-sky-300">{title}</h3>
      </div>
    ) : null}
    <div className="p-5">{children}</div>
  </div>
);

/* ----------------------------- Scene section ---------------------------- */

const SceneCard = ({ scene, index }: any) => {
  // Normalize a few fields across legacy/new shapes
  const pageTitle = scene.pageTitle || scene.title || `Scene ${scene.sceneNumber ?? index + 1}`;
  const screenLayoutLabel =
    typeof scene.screenLayout === "string"
      ? scene.screenLayout
      : scene?.screenLayout?.description || "Standard slide layout";

  const pills = useMemo(() => {
    const p: React.ReactNode[] = [];
    if (scene.pageType) p.push(<Pill key="type">{scene.pageType}</Pill>);
    if (scene.visual?.aspectRatio || scene.aspectRatio)
      p.push(<Pill key="ar">Aspect: {scene.visual?.aspectRatio || scene.aspectRatio}</Pill>);
    if (screenLayoutLabel) p.push(<Pill key="layout">Layout: {screenLayoutLabel}</Pill>);
    if (scene.interactionType) p.push(<Pill key="ix">Interaction: {scene.interactionType}</Pill>);
    return p;
  }, [scene, screenLayoutLabel]);

  const vgb = scene?.visual?.visualGenerationBrief || {};
  const overlay = Array.isArray(scene?.visual?.overlayElements) ? scene.visual.overlayElements : [];
  const xapi =
    (Array.isArray(scene?.interactionDetails?.xapiEvents) && scene.interactionDetails.xapiEvents) ||
    (Array.isArray(scene?.xapiEvents) && scene.xapiEvents) ||
    undefined;

  const ost = scene.onScreenText || scene?.textOnScreen?.onScreenTextContent || "—";
  const vo = scene?.audio?.script || scene.narrationScript || "—";

  const estimatedS =
    scene?.timing?.estimatedSecs ??
    scene?.timing?.estimatedSeconds ??
    (typeof scene?.estimatedSeconds === "number" ? scene.estimatedSeconds : undefined);

  // Image (robust) – use any of the mirrors
  const img =
    scene.generatedImageUrl ||
    scene.imageUrl ||
    scene?.visual?.generatedImageUrl ||
    scene?.visual?.previewUrl ||
    "";

  return (
    <div className="pdf-avoid-break rounded-2xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
      {/* Title row */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-sky-300">
            {scene.sceneNumber ?? index + 1}. {pageTitle}
          </h3>
          <div className="flex flex-wrap gap-2">{pills}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <Card title="On-Screen Text (OST)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap">{ost}</div>
          </Card>

          <Card title="Voiceover Script (VO)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap">{vo}</div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <KeyRow label="Persona" value={scene?.audio?.voiceParameters?.persona} />
              <KeyRow label="Pace" value={scene?.audio?.voiceParameters?.pace} />
              <KeyRow label="Tone" value={scene?.audio?.voiceParameters?.tone} />
              <KeyRow label="Emphasis" value={scene?.audio?.voiceParameters?.emphasis} />
              <KeyRow label="Gender" value={scene?.audio?.voiceParameters?.gender} />
              <KeyRow label="Background Music" value={scene?.audio?.backgroundMusic} />
            </div>
            <KeyRow label="Audio AI Directive" value={scene?.audio?.aiGenerationDirective} />
          </Card>

          <Card title="Interaction Details">
            <div className="space-y-3">
              <KeyRow label="Type" value={scene.interactionType || scene?.interactionDetails?.interactionType || "None"} />
              <KeyRow label="Description" value={scene.interactionDescription} />
              <KeyRow label="AI Actions" value={scene?.interactionDetails?.aiActions} />
              <KeyRow
                label="Decision Logic"
                value={scene?.interactionDetails?.aiDecisionLogic || scene.decisionLogic || scene?.interaction?.logic}
              />
              <KeyRow
                label="Retry Logic"
                value={scene?.interactionDetails?.retryLogic || scene?.interaction?.retry || scene?.retryLogic}
              />
              <KeyRow
                label="Completion Rule"
                value={scene?.interactionDetails?.completionRule || scene?.interaction?.completion || scene?.completionRule}
              />
              <KeyRow label="xAPI Events" value={xapi} />
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card title="AI Visual Generation Brief">
            <div className="grid grid-cols-1 gap-2">
              <KeyRow label="Scene Description" value={vgb.sceneDescription} />
              <KeyRow label="Style" value={vgb.style || scene.visual?.style} />
              <KeyRow label="Subject" value={vgb.subject || scene.visual?.subject} />
              <KeyRow label="Setting" value={vgb.setting || scene.visual?.setting} />
              <KeyRow label="Composition" value={vgb.composition || scene.visual?.composition} />
              <KeyRow label="Lighting" value={vgb.lighting || scene.visual?.lighting} />
              <KeyRow
                label="Color Palette"
                value={vgb.colorPalette || scene.visual?.colorPalette || scene.palette || scene.colourPalette}
              />
              <KeyRow label="Mood" value={vgb.mood || scene.visual?.mood || scene.mood} />
              <KeyRow label="Brand Integration" value={vgb.brandIntegration || scene.visual?.brandIntegration} />
              <KeyRow label="Negative Space" value={vgb.negativeSpace || scene.visual?.negativeSpace} />
              <KeyRow label="Alt Text" value={scene.visual?.altText} />
              <KeyRow label="Aspect Ratio" value={scene.visual?.aspectRatio || scene.aspectRatio} />
              <KeyRow label="Asset ID" value={vgb.assetId} />
              <KeyRow label="Legacy AI Prompt" value={scene.visual?.aiPrompt} />
            </div>

            {/* Inline image thumbnail + link to full-size */}
            {!!img && (
              <div className="mt-4">
                <a href={img} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={img}
                    alt={scene.visual?.altText || pageTitle}
                    className="rounded-lg border border-slate-600 max-h-64 object-contain w-full bg-slate-900"
                  />
                </a>
                <div className="mt-2 text-xs text-slate-400 break-all">
                  <span className="mr-1">Full:</span>
                  <a href={img} target="_blank" rel="noreferrer" className="underline">{img}</a>
                </div>
              </div>
            )}
          </Card>

          <Card title="Overlay Elements">
            {overlay.length ? (
              <div className="space-y-2">
                {overlay.map((el: any, i: number) => (
                  <div key={i} className="border border-slate-700 rounded-md p-3">
                    <div className="text-slate-300 text-sm mb-1">
                      #{i + 1} {el.elementType || "Element"}
                    </div>
                    <KeyRow label="Content" value={el.content} />
                    <KeyRow label="Style" value={el.style} />
                    <KeyRow label="AI Directive" value={el.aiGenerationDirective} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400">—</div>
            )}
          </Card>

          <Card title="Developer Notes">
            <div className="text-slate-100 whitespace-pre-wrap">
              {scene.developerNotes || scene.devNotes || "—"}
            </div>
          </Card>

          <Card title="Accessibility Notes">
            <div className="text-slate-100 whitespace-pre-wrap">
              {scene.accessibilityNotes ||
                scene.a11y ||
                "—"}
            </div>
          </Card>

          <Card title="Timing">
            <div className="text-slate-100">Estimated: {typeof estimatedS === "number" ? `${estimatedS}s` : "—"}</div>
          </Card>
        </div>

        {/* Footer helper */}
        <div className="xl:col-span-2">
          <div className="rounded-lg border border-slate-700 p-3 text-sm text-slate-300">
            <span className="font-medium text-slate-200">End-of-Page Instruction: </span>
            {scene.endInstruction || "Select Next to continue."}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Module-level header -------------------------- */

const StoryboardHeader = ({ storyboardModule }: { storyboardModule: any }) => {
  const moduleTiming =
    storyboardModule?.metadata?.moduleTiming || storyboardModule?.moduleTiming || undefined;

  const brand =
    storyboardModule?.metadata?.brand ||
    storyboardModule?.brand ||
    {
      colours: storyboardModule?.colours,
      fonts: storyboardModule?.fonts,
      guidelines: storyboardModule?.brandGuidelines,
    };

  const colours =
    Array.isArray(brand?.colours) ? brand.colours.join(", ") : typeof brand?.colours === "string" ? brand.colours : "";

  const toc: string[] = Array.isArray(storyboardModule?.tableOfContents)
    ? storyboardModule.tableOfContents
    : [];

  const pronGuide = Array.isArray(storyboardModule?.pronunciationGuide)
    ? storyboardModule.pronunciationGuide
    : [];

  const revHistory = Array.isArray(storyboardModule?.revisionHistory)
    ? storyboardModule.revisionHistory
    : [];

  const learningLevel =
    storyboardModule?.learningLevel || storyboardModule?.complexityLevel || undefined;

  return (
    <div className="pdf-avoid-break rounded-2xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-sky-300">
          {storyboardModule.moduleName || "Untitled Module"}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {storyboardModule.moduleType && <Pill>{storyboardModule.moduleType}</Pill>}
          {learningLevel && <Pill>Level: {learningLevel}</Pill>}
          {storyboardModule.targetAudience && <Pill>Audience: {storyboardModule.targetAudience}</Pill>}
          {storyboardModule.outputLanguage && <Pill>Lang: {storyboardModule.outputLanguage}</Pill>}
          {typeof moduleTiming?.targetMinutes === "number" && (
            <Pill>Target: {moduleTiming.targetMinutes} mins</Pill>
          )}
          {typeof moduleTiming?.totalEstimatedMinutes === "number" && (
            <Pill>Est: {moduleTiming.totalEstimatedMinutes} mins</Pill>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Module Overview">
          <div className="text-slate-100 whitespace-pre-wrap">
            {storyboardModule.moduleOverview ||
              storyboardModule.intro?.welcome ||
              "—"}
          </div>
        </Card>

        <Card title="Branding">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KeyRow label="Fonts" value={brand?.fonts || storyboardModule.fonts} />
            <KeyRow label="Colours" value={colours} />
            <KeyRow label="Guidelines" value={brand?.guidelines || storyboardModule.brandGuidelines} />
          </div>
        </Card>

        {!!pronGuide.length && (
          <Card title="Pronunciation Guide">
            <div className="space-y-2">
              {pronGuide.map((t: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-3 text-sm">
                  <div className="col-span-4 md:col-span-3 text-slate-300">{t.term}</div>
                  <div className="col-span-8 md:col-span-9 text-slate-100">
                    <span className="font-mono">{t.pronunciation}</span>
                    {t.note ? <span className="text-slate-400"> — {t.note}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!toc.length && (
          <Card title="Table of Contents">
            <ol className="list-decimal pl-5 text-slate-100 space-y-1">
              {toc.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Card>
        )}

        {moduleTiming?.perSceneSeconds && Array.isArray(moduleTiming.perSceneSeconds) && (
          <Card title="Timing (per scene)">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
              {moduleTiming.perSceneSeconds.map((sec: number, i: number) => (
                <div
                  key={i}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300"
                >
                  S{i + 1}: <span className="text-slate-100">{sec ?? "—"}s</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!!revHistory.length && (
          <Card title="Revision History">
            <div className="space-y-2">
              {revHistory.map((r: any, i: number) => (
                <div key={i} className="text-sm text-slate-100">
                  <span className="text-slate-400">{r.dateISO || r.date}:</span>{" "}
                  <span>{r.change}</span>{" "}
                  {r.author ? <span className="text-slate-400">— {r.author}</span> : null}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

/* --------------------------- Main wrapper/view --------------------------- */

const StoryboardDisplay: React.FC<Props> = ({ storyboardModule }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  // Attach an id for html2pdf selection
  useEffect(() => {
    if (rootRef.current) rootRef.current.id = "storyboard-root";
  }, []);

  const scenes: any[] = Array.isArray(storyboardModule?.scenes) ? storyboardModule.scenes : [];

  return (
    <div ref={rootRef} className="space-y-8">
      {/* Header */}
      <StoryboardHeader storyboardModule={storyboardModule} />

      {/* Scenes */}
      {scenes.map((scene: any, i: number) => (
        <Fragment key={scene.screenId || scene.sceneNumber || i}>
          <SceneCard scene={scene} index={i} />
          {FORCE_PAGE_BREAK_BETWEEN_SCENES && i < scenes.length - 1 ? <div className="pdf-pagebreak" /> : null}
        </Fragment>
      ))}

      {/* Assessment (legacy / optional) */}
      {Array.isArray(storyboardModule?.assessment?.items) && storyboardModule.assessment.items.length > 0 && (
        <div className="pdf-avoid-break rounded-2xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-sky-300">Assessment</h3>
          </div>
          <div className="p-6 space-y-4">
            {storyboardModule.assessment.items.map((q: any, i: number) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4">
                <div className="text-slate-200 font-medium mb-1">{q.type}</div>
                <div className="text-slate-100 whitespace-pre-wrap mb-2">{q.stem}</div>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <ul className="list-disc pl-5 text-slate-100 mb-2">
                    {q.options.map((o: string, oi: number) => (
                      <li key={oi}>{o}</li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-emerald-300 mb-1">Feedback (Correct)</div>
                    <div className="text-slate-100 whitespace-pre-wrap">{q.feedback?.correct || "—"}</div>
                  </div>
                  <div>
                    <div className="text-rose-300 mb-1">Feedback (Incorrect)</div>
                    <div className="text-slate-100 whitespace-pre-wrap">{q.feedback?.incorrect || "—"}</div>
                  </div>
                </div>
                {q.developerNotes && (
                  <div className="mt-2 text-xs text-slate-400 whitespace-pre-wrap">Dev Notes: {q.developerNotes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing (legacy / optional) */}
      {(storyboardModule?.closing ||
        storyboardModule?.metadata?.completionRule ||
        storyboardModule?.completionRule) && (
        <div className="pdf-avoid-break rounded-2xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-sky-300">Closing</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Summary">
              <ul className="list-disc pl-5 text-slate-100">
                {(storyboardModule?.closing?.summary || []).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card title="Completion Rule">
              <div className="text-slate-100 whitespace-pre-wrap">
                {storyboardModule?.closing?.completion ||
                  storyboardModule?.metadata?.completionRule ||
                  storyboardModule?.completionRule ||
                  "—"}
              </div>
            </Card>
            <div className="md:col-span-2">
              <Card title="Thank You">
                <div className="text-slate-100 whitespace-pre-wrap">
                  {storyboardModule?.closing?.thankYou || "—"}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardDisplay;