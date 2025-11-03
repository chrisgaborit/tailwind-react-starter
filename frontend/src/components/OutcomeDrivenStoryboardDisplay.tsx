/**
 * Outcome-Driven Storyboard Display Component
 * 
 * Enhanced storyboard viewer with Learn-See-Do-Apply framework features:
 * - Alignment Map section showing LO coverage across phases
 * - Phase badges on scene cards
 * - Business Impact and Learning Outcomes display
 * - Framework compliance indicators
 */

import React, { Fragment, useMemo, useRef, useEffect, useState } from "react";
import type { StoryboardModule, LearningOutcome, AlignmentLink, PedagogicalPhaseType } from "@/types";

type Props = { 
  storyboardModule: StoryboardModule | any;
  showAlignmentMap?: boolean;
};

const FORCE_PAGE_BREAK_BETWEEN_SCENES = true;

/* ------------------------------- UI atoms ------------------------------- */

const Pill = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "phase" | "outcome" }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  
  const variantClasses = {
    default: "border border-slate-600 bg-slate-700 text-slate-200",
    phase: "border border-blue-500 bg-blue-600 text-white",
    outcome: "border border-green-500 bg-green-600 text-white"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const PhaseBadge = ({ phase }: { phase: PedagogicalPhaseType }) => {
  const phaseColors = {
    LEARN: "bg-blue-100 text-blue-800 border-blue-200",
    SEE: "bg-green-100 text-green-800 border-green-200", 
    DO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPLY: "bg-purple-100 text-purple-800 border-purple-200"
  };

  const phaseLabels = {
    LEARN: "LEARN",
    SEE: "SEE", 
    DO: "DO",
    APPLY: "APPLY"
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${phaseColors[phase]}`}>
      {phaseLabels[phase]}
    </span>
  );
};

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

/* ----------------------------- Alignment Map Component ---------------------------- */

const AlignmentMapSection = ({ 
  learningOutcomes, 
  alignmentMap, 
  scenes 
}: { 
  learningOutcomes?: LearningOutcome[]; 
  alignmentMap?: AlignmentLink[]; 
  scenes: any[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!learningOutcomes || learningOutcomes.length === 0) {
    return null;
  }

    const phases: PedagogicalPhaseType[] = ['LEARN', 'SEE', 'DO', 'APPLY'];
  
  // Create coverage matrix
  const coverageMatrix = learningOutcomes.map(outcome => {
    const phaseCoverage = phases.map(phase => {
      const hasCoverage = alignmentMap?.some(link => 
        link.outcomeId === outcome.id && link.phase === phase
      ) || scenes.some(scene => 
        scene.phase === phase && scene.learningOutcomeRefs?.includes(outcome.id)
      );
      
      return { phase, covered: hasCoverage };
    });
    
    return { outcome, phaseCoverage };
  });

  const totalCoverage = coverageMatrix.reduce((acc, row) => {
    return acc + row.phaseCoverage.filter(p => p.covered).length;
  }, 0);
  
  const maxCoverage = learningOutcomes.length * phases.length;
  const coveragePercentage = Math.round((totalCoverage / maxCoverage) * 100);

  return (
    <Card title="Learning Outcomes Alignment Map" className="mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Coverage: {totalCoverage}/{maxCoverage} ({coveragePercentage}%)
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            {isExpanded ? 'Collapse' : 'Expand'} Details
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* Coverage Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 text-slate-300">Learning Outcome</th>
                    {phases.map(phase => (
                      <th key={phase} className="text-center py-2 text-slate-300">
                        <PhaseBadge phase={phase} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coverageMatrix.map((row, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="py-2 text-slate-200">
                        <div className="font-medium">{row.outcome.verb.toUpperCase()}</div>
                        <div className="text-xs text-slate-400">{row.outcome.text}</div>
                      </td>
                      {row.phaseCoverage.map(({ phase, covered }) => (
                        <td key={phase} className="text-center py-2">
                          {covered ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-red-400">✗</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Alignment Links */}
            {alignmentMap && alignmentMap.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Alignment Details</h4>
                <div className="space-y-2">
                  {alignmentMap.map((link, index) => {
                    const outcome = learningOutcomes.find(lo => lo.id === link.outcomeId);
                    const scene = scenes.find(s => s.scene_id === link.sceneId);
                    return (
                      <div key={index} className="text-xs bg-slate-700 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <PhaseBadge phase={link.phase} />
                          <span className="text-slate-300">
                            {outcome?.verb.toUpperCase()}: {outcome?.text}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-200">
                            Scene {scene?.sceneNumber}: {scene?.pageTitle}
                          </span>
                        </div>
                        {link.evidence && (
                          <div className="text-slate-400 mt-1">{link.evidence}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

/* ----------------------------- Business Impact Section ---------------------------- */

const BusinessImpactSection = ({ storyboardModule }: { storyboardModule: StoryboardModule | any }) => {
  const businessImpact = storyboardModule.project_metadata?.businessImpact || 
                        storyboardModule.metadata?.businessImpact?.successDefinition;

  if (!businessImpact) {
    return null;
  }

  return (
    <Card title="Business Impact" className="mb-6">
      <div className="text-slate-200">{businessImpact}</div>
    </Card>
  );
};

/* ----------------------------- Learning Outcomes Section ---------------------------- */

const LearningOutcomesSection = ({ learningOutcomes }: { learningOutcomes?: LearningOutcome[] }) => {
  if (!learningOutcomes || learningOutcomes.length === 0) {
    return null;
  }

  return (
    <Card title="Learning Outcomes" className="mb-6">
      <div className="space-y-3">
        {learningOutcomes.map((outcome, index) => (
          <div key={outcome.id || index} className="flex items-start gap-3">
            <Pill variant="outcome">{outcome.verb.toUpperCase()}</Pill>
            <div className="text-slate-200">
              {outcome.text}
              {outcome.context && (
                <div className="text-sm text-slate-400 mt-1">Context: {outcome.context}</div>
              )}
              {outcome.measure && (
                <div className="text-sm text-slate-400 mt-1">Measure: {outcome.measure}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ----------------------------- Enhanced Scene Card ---------------------------- */

const EnhancedSceneCard = ({ scene, index }: any) => {
  // Normalize a few fields across legacy/new shapes
  const pageTitle = scene.pageTitle || scene.title || `Scene ${scene.sceneNumber ?? index + 1}`;
  const screenLayoutLabel =
    typeof scene.screenLayout === "string"
      ? scene.screenLayout
      : scene?.screenLayout?.description || "Standard slide layout";

  const pills = useMemo(() => {
    const p: React.ReactNode[] = [];
    
    // Add phase badge if available
    if (scene.phase && ['LEARN', 'SEE', 'DO', 'APPLY'].includes(scene.phase)) {
      p.push(<PhaseBadge key="phase" phase={scene.phase} />);
    }
    
    // Add learning outcome references
    if (scene.learningOutcomeRefs && scene.learningOutcomeRefs.length > 0) {
      p.push(<Pill key="outcomes" variant="outcome">{scene.learningOutcomeRefs.length} LO{scene.learningOutcomeRefs.length > 1 ? 's' : ''}</Pill>);
    }
    
    // Add other existing pills
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
    undefined;

  return (
    <Card title={`Scene ${scene.sceneNumber ?? index + 1}: ${pageTitle}`} className="mb-6">
      <div className="space-y-4">
        {/* Pills */}
        <div className="flex flex-wrap gap-2">{pills}</div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <KeyRow label="On-Screen Text" value={ost} />
            <KeyRow label="Voiceover" value={vo} />
            {estimatedS && <KeyRow label="Duration" value={`${estimatedS}s`} />}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <KeyRow label="Screen Layout" value={screenLayoutLabel} />
            <KeyRow label="Interaction Type" value={scene.interactionType} />
            <KeyRow label="Interaction Description" value={scene.interactionDescription} />
          </div>
        </div>

        {/* Visual Generation Brief */}
        {Object.keys(vgb).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Visual Generation Brief</h4>
            <div className="bg-slate-700 p-3 rounded text-sm">
              <KeyRow label="Scene Description" value={vgb.sceneDescription} />
              <KeyRow label="Style" value={vgb.style} />
              <KeyRow label="Composition" value={vgb.composition} />
              <KeyRow label="Lighting" value={vgb.lighting} />
              <KeyRow label="Mood" value={vgb.mood} />
              <KeyRow label="Color Palette" value={vgb.colorPalette} />
            </div>
          </div>
        )}

        {/* Image Preview */}
        {img && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Visual Preview</h4>
            <img src={img} alt={vgb.sceneDescription || pageTitle} className="w-full max-w-md rounded border border-slate-600" />
          </div>
        )}

        {/* Developer Notes */}
        <KeyRow label="Developer Notes" value={scene.developerNotes} />
        <KeyRow label="Accessibility Notes" value={scene.accessibilityNotes} />
      </div>
    </Card>
  );
};

/* ----------------------------- Main Component ---------------------------- */

const OutcomeDrivenStoryboardDisplay: React.FC<Props> = ({ storyboardModule, showAlignmentMap = true }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  // Attach an id for html2pdf selection
  useEffect(() => {
    if (rootRef.current) rootRef.current.id = "storyboard-root";
  }, []);

  const scenes: any[] = Array.isArray(storyboardModule?.scenes) ? storyboardModule.scenes : [];
  const learningOutcomes = storyboardModule?.learningOutcomes;
  const alignmentMap = storyboardModule?.alignmentMap;
  const projectMetadata = storyboardModule?.project_metadata;

  return (
    <div ref={rootRef} className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">{storyboardModule?.moduleName || "Storyboard"}</h1>
        {projectMetadata?.category && (
          <div className="text-slate-400">Category: {projectMetadata.category}</div>
        )}
      </div>

      {/* Business Impact */}
      <BusinessImpactSection storyboardModule={storyboardModule} />

      {/* Learning Outcomes */}
      <LearningOutcomesSection learningOutcomes={learningOutcomes} />

      {/* Alignment Map */}
      {showAlignmentMap && (
        <AlignmentMapSection 
          learningOutcomes={learningOutcomes}
          alignmentMap={alignmentMap}
          scenes={scenes}
        />
      )}

      {/* Scenes */}
      {scenes.map((scene: any, i: number) => (
        <Fragment key={scene.screenId || scene.sceneNumber || i}>
          <EnhancedSceneCard scene={scene} index={i} />
          {FORCE_PAGE_BREAK_BETWEEN_SCENES && i < scenes.length - 1 ? <div className="pdf-pagebreak" /> : null}
        </Fragment>
      ))}
    </div>
  );
};

export default OutcomeDrivenStoryboardDisplay;

