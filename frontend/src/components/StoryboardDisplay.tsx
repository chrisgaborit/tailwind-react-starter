// @ts-nocheck
import React, { Fragment, useMemo, useRef, useEffect } from "react";
import type { StoryboardModule } from "@/types";

type Props = { 
  storyboardModule: StoryboardModule | any;
  metadata?: {
    qualityScore?: number;
    grade?: string;
    framework?: string;
    agentsUsed?: string[];
    sceneCount?: number;
    estimatedDuration?: string;
    dimensionScores?: {
      loAlignment?: number;
      pedagogicalStructure?: number;
      frameworkIntegration?: number;
      interactivityQuality?: number;
      productionReadiness?: number;
    };
    validationIssues?: number;
    validationStrengths?: number;
  };
};

const FORCE_PAGE_BREAK_BETWEEN_SCENES = true;

/* ------------------------------- UI atoms ------------------------------- */

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-xs md:text-sm font-medium text-slate-200 ${className}`}
  >
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
  <div
    className={`pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-sky-500/70 hover:shadow-sky-600/20 ${className}`}
  >
    {title ? (
      <div className="px-6 py-4 border-b border-slate-700/60">
        <h3 className="text-lg font-semibold text-sky-300 md:text-xl">{title}</h3>
      </div>
    ) : null}
    <div className="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">{children}</div>
  </div>
);

/* ----------------------------- Brandon Hall Page Card ---------------------------- */

const BrandonHallPageCard = ({ page, index }: any) => {
  const pills = useMemo(() => {
    const p: React.ReactNode[] = [];
    if (page.pageType) p.push(<Pill key="type">{page.pageType}</Pill>);
    if (page.pageNumber) p.push(<Pill key="page">{page.pageNumber}</Pill>);
    if (page.estimatedDurationSec) p.push(<Pill key="duration">{page.estimatedDurationSec}s</Pill>);
    return p;
  }, [page]);

  // Combine all event OST into one field
  const onScreenText = page.events
    ?.map((e: any) => e.ost)
    .filter(Boolean)
    .join('\n\n') || '—';

  // Combine all event audio into one field
  const voiceoverScript = page.events
    ?.map((e: any) => e.audio)
    .filter(Boolean)
    .join(' ') || '—';

  return (
    <div className="scene-card pdf-avoid-break animate-fade-in rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl overflow-hidden" data-testid="page">
      {/* Title row */}
      <div className="px-6 py-4 border-b border-slate-700/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl md:text-2xl font-semibold text-sky-300">
            {page.pageNumber || `p${String(index + 1).padStart(2, "0")}`}. {page.title || `Page ${index + 1}`}
          </h3>
          <div className="flex flex-wrap gap-2">{pills}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6 md:space-y-8">
          <Card title="On-Screen Text (OST)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {onScreenText}
            </div>
          </Card>

          <Card title="Voiceover Script (VO)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {voiceoverScript}
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 md:space-y-8">
          <Card title="Page Details">
            <div className="grid grid-cols-1 gap-2">
              <KeyRow label="Page Type" value={page.pageType} />
              <KeyRow label="Estimated Duration" value={page.estimatedDurationSec ? `${page.estimatedDurationSec}s` : undefined} />
              <KeyRow label="Learning Objectives" value={Array.isArray(page.learningObjectiveIds) ? page.learningObjectiveIds.join(", ") : undefined} />
            </div>
          </Card>

          <Card title="Accessibility">
            <div className="grid grid-cols-1 gap-2">
              <KeyRow label="Alt Text" value={Array.isArray(page.accessibility?.altText) ? page.accessibility.altText.join(", ") : undefined} />
              <KeyRow label="Keyboard Navigation" value={page.accessibility?.keyboardNav} />
              <KeyRow label="Contrast Notes" value={page.accessibility?.contrastNotes} />
              <KeyRow label="Screen Reader" value={page.accessibility?.screenReader} />
            </div>
          </Card>

          {page.events && page.events.length > 0 && (
            <Card title={`Events (${page.events.length})`}>
              <div className="space-y-4">
                {page.events.map((event: any, eventIdx: number) => (
                  <div key={eventIdx} className="border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sky-300 font-semibold">Event {event.number || `${index + 1}.${eventIdx + 1}`}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 text-sm font-medium">Audio:</span>
                        <p className="text-slate-100 text-sm mt-1 whitespace-pre-wrap">{event.audio || "—"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm font-medium">On-Screen Text:</span>
                        <p className="text-slate-100 text-sm mt-1 whitespace-pre-wrap">{event.ost || "—"}</p>
                      </div>
                      {event.devNotes && (
                        <div>
                          <span className="text-slate-400 text-sm font-medium">Dev Notes:</span>
                          <p className="text-slate-100 text-sm mt-1 whitespace-pre-wrap">{event.devNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- Scene section ---------------------------- */

const SceneCard = ({ scene, index }: any) => {
  // Check if this is a gap flag scene
  const isGapFlag = scene.metadata?.is_gap_flag;
  const isGapSummary = scene.metadata?.is_gap_summary;
  
  // Normalize a few fields across legacy/new shapes
  const pageTitle = scene.pageTitle || scene.title || `Scene ${scene.sceneNumber ?? index + 1}`;
  const screenLayoutLabel =
    typeof scene.screenLayout === "string"
      ? scene.screenLayout
      : scene?.screenLayout?.description || "Standard slide layout";

  const pills = useMemo(() => {
    const p: React.ReactNode[] = [];
    
    // Add gap-specific pills
    if (isGapFlag) {
      p.push(<Pill key="gap-flag" className="bg-red-900 border-red-600 text-red-200">🚩 GAP FLAG</Pill>);
      p.push(<Pill key="gap-severity" className="bg-orange-900 border-orange-600 text-orange-200">
        {scene.metadata?.severity?.toUpperCase() || 'UNKNOWN'}
      </Pill>);
    }
    if (isGapSummary) {
      p.push(<Pill key="gap-summary" className="bg-blue-900 border-blue-600 text-blue-200">📋 GAP SUMMARY</Pill>);
    }
    
    // Regular pills
    if (scene.pageType) p.push(<Pill key="type">{scene.pageType}</Pill>);
    if (scene.visual?.aspectRatio || scene.aspectRatio)
      p.push(<Pill key="ar">Aspect: {scene.visual?.aspectRatio || scene.aspectRatio}</Pill>);
    if (screenLayoutLabel) p.push(<Pill key="layout">Layout: {screenLayoutLabel}</Pill>);
    if (scene.interactionType) p.push(<Pill key="ix">Interaction: {scene.interactionType}</Pill>);
    return p;
  }, [scene, screenLayoutLabel, isGapFlag, isGapSummary]);

  const vgb = scene?.visual?.visualGenerationBrief || {};
  const overlay = Array.isArray(scene?.visual?.overlayElements) ? scene.visual.overlayElements : [];
  const xapi =
    (Array.isArray(scene?.interactionDetails?.xapiEvents) && scene.interactionDetails.xapiEvents) ||
    (Array.isArray(scene?.xapiEvents) && scene.xapiEvents) ||
    undefined;

  const ost = scene.onScreenText || scene?.textOnScreen?.onScreenTextContent || "—";
  // Check all possible VO field names in order of preference
  const vo = (scene as any)?.voiceoverScript || scene.narration || scene?.audio?.script || scene.narrationScript || (scene as any)?.voiceover || (scene as any)?.VO || "—";

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

  // Special rendering for gap flags
  if (isGapFlag) {
    return (
      <div className="pdf-avoid-break animate-fade-in rounded-2xl border-2 border-red-500 bg-red-900/20 shadow-xl overflow-hidden">
        {/* Title row */}
        <div className="px-6 py-4 border-b border-red-500/50 bg-red-900/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl md:text-2xl font-semibold text-red-300">
              🚩 {scene.sceneNumber ?? index + 1}. {pageTitle}
            </h3>
            <div className="flex flex-wrap gap-2">{pills}</div>
          </div>
        </div>

        {/* Gap Flag Content */}
        <div className="p-6">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <h4 className="text-red-200 font-semibold mb-3">Content Gap Identified</h4>
            <div className="space-y-3 text-red-100">
              <div>
                <span className="font-medium">Missing Element:</span> {scene.metadata?.gap_type || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Severity:</span> {scene.metadata?.severity?.toUpperCase() || 'UNKNOWN'}
              </div>
              <div>
                <span className="font-medium">Description:</span> {scene.metadata?.gap_description || 'No description available'}
              </div>
              <div>
                <span className="font-medium">Recommendation:</span> {scene.metadata?.gap_recommendation || 'No recommendation available'}
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-800/30 border border-red-600/50 rounded text-red-100 text-sm">
              <strong>Impact:</strong> This storyboard uses only available source material. Consider adding {scene.metadata?.gap_type} content for a more complete learning experience.
            </div>
          </div>
          
          {/* Show the narration script if it contains gap details */}
          {scene.narrationScript && (
            <div className="mt-4">
              <h5 className="text-red-200 font-medium mb-2">Gap Details:</h5>
              <div className="prose prose-invert max-w-none text-red-100 whitespace-pre-wrap text-sm">
                {scene.narrationScript}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Special rendering for gap summary
  if (isGapSummary) {
    return (
      <div className="pdf-avoid-break animate-fade-in rounded-2xl border-2 border-blue-500 bg-blue-900/20 shadow-xl overflow-hidden">
        {/* Title row */}
        <div className="px-6 py-4 border-b border-blue-500/50 bg-blue-900/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl md:text-2xl font-semibold text-blue-300">
              📋 {scene.sceneNumber ?? index + 1}. {pageTitle}
            </h3>
            <div className="flex flex-wrap gap-2">{pills}</div>
          </div>
        </div>

        {/* Gap Summary Content */}
        <div className="p-6">
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <h4 className="text-blue-200 font-semibold mb-3">Source Material Analysis Summary</h4>
            <div className="space-y-3 text-blue-100">
              <div>
                <span className="font-medium">Overall Adequacy Score:</span> {scene.metadata?.adequacy_score || 'Unknown'}/100
              </div>
              <div>
                <span className="font-medium">Total Gaps Found:</span> {scene.metadata?.total_gaps || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Can Generate Storyboard:</span> {scene.metadata?.can_generate_storyboard ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-800/30 border border-blue-600/50 rounded text-blue-100 text-sm">
              <strong>Generation Approach:</strong> This storyboard was created using ONLY the source material provided, with no invented content. Gap flags indicate where additional content could enhance the learning experience.
            </div>
          </div>
          
          {/* Show the narration script if it contains summary details */}
          {scene.narrationScript && (
            <div className="mt-4">
              <h5 className="text-blue-200 font-medium mb-2">Detailed Analysis:</h5>
              <div className="prose prose-invert max-w-none text-blue-100 whitespace-pre-wrap text-sm">
                {scene.narrationScript}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular scene rendering
  return (
    <div className="scene-card pdf-avoid-break animate-fade-in rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl overflow-hidden" data-testid="scene">
      {/* Title row */}
      <div className="px-6 py-4 border-b border-slate-700/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl md:text-2xl font-semibold text-sky-300">
            {scene.sceneNumber ?? index + 1}. {pageTitle}
          </h3>
          <div className="flex flex-wrap gap-2">{pills}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6 md:space-y-8">
          <Card title="On-Screen Text (OST)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {ost}
            </div>
          </Card>

          <Card title="Voiceover Script (VO)">
            <div className="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {vo}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
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
              
              {/* NEW: Structured Click-to-Reveal Display */}
              {scene?.interactionDetails?.type === "Click-to-Reveal" && scene?.interactionDetails?.reveals && (
                <div className="mt-4 p-4 bg-sky-900/20 rounded-lg border border-sky-500/30">
                  <h4 className="text-sky-300 font-semibold mb-3 text-base">🎯 Click-to-Reveal Interaction</h4>
                  
                  <div className="space-y-3 mb-4">
                    <KeyRow label="Tone" value={scene.interactionDetails.tone} />
                    <KeyRow label="Instruction" value={scene.interactionDetails.instruction} />
                    <KeyRow label="Context & Visuals" value={scene.interactionDetails.contextVisuals} />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sky-300 font-semibold mb-3 text-sm">
                      Reveal Panels ({scene.interactionDetails.reveals.length}):
                    </p>
                    <div className="space-y-3">
                      {scene.interactionDetails.reveals.map((reveal: any, index: number) => (
                        <div key={index} className="ml-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <p className="text-amber-400 font-semibold mb-2 text-sm">
                            Panel {index + 1}: {reveal.label || 'Untitled'}
                          </p>
                          {reveal.text && (
                            <div className="mb-2">
                              <span className="text-sky-300 font-medium text-xs">Text: </span>
                              <span className="text-slate-200 text-sm">{reveal.text}</span>
                            </div>
                          )}
                          {reveal.voiceOver && (
                            <div className="mb-2">
                              <span className="text-sky-300 font-medium text-xs">Voice-Over: </span>
                              <span className="text-slate-200 text-sm">{reveal.voiceOver}</span>
                            </div>
                          )}
                          {reveal.animation && (
                            <div>
                              <span className="text-sky-300 font-medium text-xs">Animation: </span>
                              <span className="text-slate-200 text-sm">{reveal.animation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {scene.interactionDetails.developerNotes && (
                    <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                      <p className="text-amber-300 font-semibold mb-1 text-xs">Developer Notes:</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{scene.interactionDetails.developerNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Drag-and-Drop Matching Display */}
              {scene?.interactionDetails?.type === "DragAndDrop-Matching" && scene?.interactionDetails?.items && scene?.interactionDetails?.targets && (
                <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-300 font-semibold mb-3 text-base">🎯 Drag-and-Drop Matching Interaction</h4>
                  
                  <div className="space-y-3 mb-4">
                    <KeyRow label="Tone" value={scene.interactionDetails.tone} />
                    <KeyRow label="Instruction" value={scene.interactionDetails.instruction} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Items to Drag */}
                    <div>
                      <p className="text-purple-300 font-semibold mb-2 text-sm">
                        Items to Drag ({scene.interactionDetails.items.length}):
                      </p>
                      <div className="space-y-2">
                        {scene.interactionDetails.items.map((item: any, index: number) => (
                          <div key={index} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <p className="text-slate-200 text-sm">{item.label}</p>
                            <p className="text-slate-400 text-xs mt-1">→ {scene.interactionDetails.targets.find((t: any) => t.id === item.correctTarget)?.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Target Categories */}
                    <div>
                      <p className="text-purple-300 font-semibold mb-2 text-sm">
                        Target Categories ({scene.interactionDetails.targets.length}):
                      </p>
                      <div className="space-y-2">
                        {scene.interactionDetails.targets.map((target: any, index: number) => (
                          <div key={index} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <p className="text-slate-200 text-sm">{target.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="mt-4">
                    <p className="text-purple-300 font-semibold mb-2 text-sm">Feedback Messages:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                        <p className="text-green-300 font-medium text-xs mb-1">Correct:</p>
                        <p className="text-slate-200 text-sm">{scene.interactionDetails.feedback?.correct}</p>
                      </div>
                      <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                        <p className="text-red-300 font-medium text-xs mb-1">Incorrect:</p>
                        <p className="text-slate-200 text-sm">{scene.interactionDetails.feedback?.incorrect}</p>
                      </div>
                    </div>
                  </div>
                  
                  {scene.interactionDetails.developerNotes && (
                    <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                      <p className="text-amber-300 font-semibold mb-1 text-xs">Developer Notes:</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{scene.interactionDetails.developerNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Drag-and-Drop Sequencing Display */}
              {scene?.interactionDetails?.type === "DragAndDrop-Sequencing" && scene?.interactionDetails?.items && (
                <div className="mt-4 p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                  <h4 className="text-emerald-300 font-semibold mb-3 text-base">🎯 Drag-and-Drop Sequencing Interaction</h4>
                  
                  <div className="space-y-3 mb-4">
                    <KeyRow label="Tone" value={scene.interactionDetails.tone} />
                    <KeyRow label="Instruction" value={scene.interactionDetails.instruction} />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-emerald-300 font-semibold mb-3 text-sm">
                      Steps to Sequence ({scene.interactionDetails.items.length}):
                    </p>
                    <div className="space-y-2">
                      {scene.interactionDetails.items
                        .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
                        .map((item: any, index: number) => (
                        <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                              <span className="text-emerald-300 font-bold text-sm">{item.correctOrder}</span>
                            </div>
                            <div className="flex-grow">
                              <p className="text-slate-200 text-sm">{item.label}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="mt-4">
                    <p className="text-emerald-300 font-semibold mb-2 text-sm">Feedback Messages:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                        <p className="text-green-300 font-medium text-xs mb-1">Correct:</p>
                        <p className="text-slate-200 text-sm">{scene.interactionDetails.feedback?.correct}</p>
                      </div>
                      <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                        <p className="text-red-300 font-medium text-xs mb-1">Incorrect:</p>
                        <p className="text-slate-200 text-sm">{scene.interactionDetails.feedback?.incorrect}</p>
                      </div>
                    </div>
                  </div>
                  
                  {scene.interactionDetails.developerNotes && (
                    <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                      <p className="text-amber-300 font-semibold mb-1 text-xs">Developer Notes:</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{scene.interactionDetails.developerNotes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Legacy markdown format warning */}
              {scene?.interactionDetails?.clickToRevealContent && (
                <div className="mt-4 p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                  <p className="text-orange-300 font-semibold mb-2 text-sm">⚠️ Legacy Format Detected</p>
                  <p className="text-orange-200 text-xs mb-2">
                    This interaction uses the old markdown string format. It should be upgraded to the structured format.
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-orange-300 hover:text-orange-200">
                      View Raw Content
                    </summary>
                    <pre className="mt-2 text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto p-2 bg-slate-900/50 rounded">
                      {scene.interactionDetails.clickToRevealContent}
                    </pre>
                  </details>
                </div>
              )}
              
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
        <div className="space-y-6 md:space-y-8">
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
                    className="rounded-xl border border-slate-600/70 max-h-64 object-cover w-full bg-slate-900/60"
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
            <div className="text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {scene.developerNotes || scene.devNotes || "—"}
            </div>
          </Card>

          <Card title="Accessibility Notes">
            <div className="text-slate-100 whitespace-pre-wrap text-base md:text-lg">
              {scene.accessibilityNotes || scene.a11y || "—"}
            </div>
          </Card>

          <Card title="Timing">
            <div className="text-slate-100 text-base md:text-lg">
              Estimated: {typeof estimatedS === "number" ? `${estimatedS}s` : "—"}
            </div>
          </Card>
        </div>

        {/* Footer helper */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-slate-700/70 p-4 text-sm md:text-base text-slate-300">
            <span className="font-medium text-slate-200">End-of-Page Instruction: </span>
            {scene.endInstruction || "Select Next to continue."}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Module-level header -------------------------- */

/* --------------------------- Quality Metrics Panel -------------------------- */

const QualityMetricsPanel = ({ metadata }: { metadata: Props["metadata"] }) => {
  if (!metadata) return null;

  const qualityScore = metadata.qualityScore ?? 0;
  const grade = metadata.grade || "N/A";
  const framework = metadata.framework || "None";
  const agentsUsed = metadata.agentsUsed || [];
  const dimensionScores = metadata.dimensionScores || {};
  
  // Color coding for quality score
  const getQualityColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
    if (score >= 70) return "bg-amber-500/20 border-amber-500/50 text-amber-300";
    return "bg-red-500/20 border-red-500/50 text-red-300";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return "✅";
    if (score >= 70) return "⚠️";
    return "❌";
  };

  return (
    <Card title="Quality Metrics" className="pdf-avoid-break">
      {/* Quality Score Badge */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${getQualityColor(qualityScore)}`}>
          <span className="text-2xl font-bold">{qualityScore}%</span>
          <div className="flex flex-col">
            <span className="text-xs font-medium opacity-80">Quality Score</span>
            <span className="text-sm font-semibold">Grade: {grade}</span>
          </div>
          {qualityScore < 85 && (
            <div className="ml-auto text-xs bg-red-500/30 px-2 py-1 rounded border border-red-500/50">
              Below Threshold
            </div>
          )}
        </div>
      </div>

      {/* Warning if quality < 85% */}
      {qualityScore < 85 && (
        <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xl">⚠️</span>
            <div>
              <p className="text-amber-300 font-semibold mb-1">Quality below threshold</p>
              <p className="text-amber-200 text-sm">
                Review flagged issues before production. Quality score must be ≥85% for production readiness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Framework Integration */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <span className="font-semibold text-slate-200">Framework Integration</span>
        </div>
        {framework !== "None" ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <span>✅</span>
            <span>{framework} Integrated</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <span>❌</span>
            <span>No framework detected</span>
          </div>
        )}
      </div>

      {/* Agent Orchestration Status */}
      {agentsUsed.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-slate-200">Agent Orchestration</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {agentsUsed.map((agent, index) => (
              <React.Fragment key={agent}>
                <span className="px-2 py-1 bg-sky-900/30 border border-sky-500/30 rounded text-sky-300">
                  {agent}
                </span>
                {index < agentsUsed.length - 1 && (
                  <span className="text-slate-500">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Scores */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <span className="font-semibold text-slate-200">Dimension Scores</span>
        </div>
        <div className="space-y-2">
          {dimensionScores.loAlignment !== undefined && (
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <span className="text-slate-300">LO Alignment</span>
              <span className={`font-semibold ${getScoreColor(dimensionScores.loAlignment)}`}>
                {getScoreIcon(dimensionScores.loAlignment)} {dimensionScores.loAlignment}%
              </span>
            </div>
          )}
          {dimensionScores.pedagogicalStructure !== undefined && (
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <span className="text-slate-300">Pedagogical Structure</span>
              <span className={`font-semibold ${getScoreColor(dimensionScores.pedagogicalStructure)}`}>
                {getScoreIcon(dimensionScores.pedagogicalStructure)} {dimensionScores.pedagogicalStructure}%
              </span>
            </div>
          )}
          {dimensionScores.frameworkIntegration !== undefined && (
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <span className="text-slate-300">Framework Integration</span>
              <span className={`font-semibold ${getScoreColor(dimensionScores.frameworkIntegration)}`}>
                {getScoreIcon(dimensionScores.frameworkIntegration)} {dimensionScores.frameworkIntegration}%
              </span>
            </div>
          )}
          {dimensionScores.interactivityQuality !== undefined && (
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <span className="text-slate-300">Interactivity Quality</span>
              <span className={`font-semibold ${getScoreColor(dimensionScores.interactivityQuality)}`}>
                {getScoreIcon(dimensionScores.interactivityQuality)} {dimensionScores.interactivityQuality}%
              </span>
            </div>
          )}
          {dimensionScores.productionReadiness !== undefined && (
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <span className="text-slate-300">Production Readiness</span>
              <span className={`font-semibold ${getScoreColor(dimensionScores.productionReadiness)}`}>
                {getScoreIcon(dimensionScores.productionReadiness)} {dimensionScores.productionReadiness}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scene Count and Structure Validation */}
      {(metadata.sceneCount !== undefined || metadata.estimatedDuration) && (
        <div className="pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {metadata.sceneCount !== undefined && (
              <div>
                <span className="text-slate-400">Scene Count:</span>
                <span className="ml-2 text-slate-200 font-semibold">{metadata.sceneCount}</span>
              </div>
            )}
            {metadata.estimatedDuration && (
              <div>
                <span className="text-slate-400">Duration:</span>
                <span className="ml-2 text-slate-200 font-semibold">{metadata.estimatedDuration}</span>
              </div>
            )}
          </div>
          {metadata.validationIssues !== undefined && metadata.validationStrengths !== undefined && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Issues:</span>
                <span className="ml-2 text-red-300 font-semibold">{metadata.validationIssues}</span>
              </div>
              <div>
                <span className="text-slate-400">Strengths:</span>
                <span className="ml-2 text-emerald-300 font-semibold">{metadata.validationStrengths}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const StoryboardHeader = ({ storyboardModule, metadata }: { storyboardModule: any; metadata?: Props["metadata"] }) => {
  const isBrandonHall = Array.isArray(storyboardModule?.pages) && storyboardModule.pages.length > 0;
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

  // Handle Brandon Hall TOC format
  const toc: any[] = isBrandonHall && Array.isArray(storyboardModule?.toc)
    ? storyboardModule.toc
    : Array.isArray(storyboardModule?.tableOfContents)
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

  const moduleTitle = isBrandonHall
    ? (storyboardModule.moduleTitle || "Untitled Module")
    : (storyboardModule.moduleName || "Untitled Module");

  return (
    <div className="pdf-avoid-break rounded-2xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-sky-300">
          {moduleTitle}
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

        {/* Pronunciation Guide section removed per user request */}

        {/* TOC section removed per user request */}

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

        {/* Quality Metrics Panel */}
        {metadata && <QualityMetricsPanel metadata={metadata} />}
      </div>
    </div>
  );
};

/* --------------------------- Main wrapper/view --------------------------- */

const StoryboardDisplay: React.FC<Props> = ({ storyboardModule, metadata }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  // Attach an id for html2pdf selection
  useEffect(() => {
    if (rootRef.current) rootRef.current.id = "storyboard-root";
  }, []);

  // Handle Brandon Hall format (pages[]) or legacy format (scenes[])
  const isBrandonHall = Array.isArray(storyboardModule?.pages) && storyboardModule.pages.length > 0;
  const scenes: any[] = isBrandonHall 
    ? (storyboardModule.pages || [])
    : (Array.isArray(storyboardModule?.scenes) ? storyboardModule.scenes : []);

  return (
    <div ref={rootRef} className="space-y-8 md:space-y-12">
      {/* Header */}
      <StoryboardHeader storyboardModule={storyboardModule} metadata={metadata} />

      {/* Pages (Brandon Hall) or Scenes (Legacy) */}
      {isBrandonHall ? (
        // Brandon Hall format: render pages with events
        storyboardModule.pages.map((page: any, i: number) => (
          <Fragment key={page.pageNumber || i}>
            <BrandonHallPageCard page={page} index={i} />
            {FORCE_PAGE_BREAK_BETWEEN_SCENES && i < storyboardModule.pages.length - 1 ? <div className="pdf-pagebreak" /> : null}
          </Fragment>
        ))
      ) : (
        // Legacy format: render scenes
        scenes.map((scene: any, i: number) => (
          <Fragment key={scene.screenId || scene.sceneNumber || i}>
            <SceneCard scene={scene} index={i} />
            {FORCE_PAGE_BREAK_BETWEEN_SCENES && i < scenes.length - 1 ? <div className="pdf-pagebreak" /> : null}
          </Fragment>
        ))
      )}

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
