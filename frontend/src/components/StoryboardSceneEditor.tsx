// frontend/src/components/StoryboardSceneEditor.tsx
import React from "react";
import type {
  StoryboardScene,
  OverlayElement,
  InteractionDetails,
  KnowledgeCheck,
} from "@/types/storyboardTypes";

type Props = {
  scene: StoryboardScene;
  onChange: (updated: StoryboardScene) => void;
};

function update<T extends object>(obj: T, path: string[], value: any): T {
  if (path.length === 0) return obj;
  const [k, ...rest] = path;
  return {
    ...(obj as any),
    [k]: rest.length ? update((obj as any)[k] ?? {}, rest, value) : value,
  } as T;
}

const TextInput: React.FC<{
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}> = ({ label, value, onChange, placeholder, textarea }) => (
  <label className="block">
    <div className="text-xs font-semibold text-slate-600">{label}</div>
    {textarea ? (
      <textarea
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-200 p-2 text-sm"
        rows={4}
      />
    ) : (
      <input
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-slate-200 p-2 text-sm"
      />
    )}
  </label>
);

const NumberInput: React.FC<{
  label: string;
  value?: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <div className="text-xs font-semibold text-slate-600">{label}</div>
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-1 w-full rounded border border-slate-200 p-2 text-sm"
    />
  </label>
);

const OverlayEditor: React.FC<{
  elements: OverlayElement[];
  onChange: (els: OverlayElement[]) => void;
}> = ({ elements, onChange }) => {
  const setAt = (i: number, patch: Partial<OverlayElement>) => {
    const copy = [...elements];
    copy[i] = { ...copy[i], ...patch };
    onChange(copy);
  };
  const add = () => onChange([...(elements || []), { elementType: "TitleText", content: "" } as OverlayElement]);
  const remove = (i: number) => onChange(elements.filter((_, idx) => idx !== i));

  return (
    <div className="rounded border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        <span>Overlay Elements</span>
        <button className="rounded bg-emerald-600 px-2 py-1 text-[11px] text-white" onClick={add}>
          + Add
        </button>
      </div>
      <div className="divide-y divide-slate-200">
        {(elements || []).map((el, i) => (
          <div key={`el-${i}`} className="grid gap-3 p-3 md:grid-cols-4">
            <label className="block text-xs">
              <div className="font-semibold text-slate-600">Type</div>
              <select
                className="mt-1 w-full rounded border border-slate-200 p-2 text-sm"
                value={el.elementType}
                onChange={(e) => setAt(i, { elementType: e.target.value })}
              >
                {[
                  "Background",
                  "TitleText",
                  "BodyText",
                  "Logo",
                  "Button",
                  "DynamicText",
                  "VectorIcon",
                  "TwoColumnLayout",
                  "HotspotCanvas",
                  "Media",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="Content / Label"
              value={el.content}
              onChange={(v) => setAt(i, { content: v })}
              placeholder="e.g., 'Pronunciation Guide' or semantic label"
            />

            <TextInput
              label="Placement"
              value={el.placement}
              onChange={(v) => setAt(i, { placement: v })}
              placeholder="e.g., Adjacent to pronunciation text"
            />

            <TextInput
              label="AI Directive"
              value={el.aiGenerationDirective}
              onChange={(v) => setAt(i, { aiGenerationDirective: v })}
              placeholder="[AI Generate: Vector icon …]"
            />

            <div className="md:col-span-4 grid gap-3 md:grid-cols-4">
              <TextInput
                label="Style.fontFamily"
                value={el.style?.fontFamily}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), fontFamily: v } })}
              />
              <TextInput
                label="Style.fontWeight"
                value={el.style?.fontWeight as string}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), fontWeight: v } })}
              />
              <TextInput
                label="Style.fontSize"
                value={el.style?.fontSize}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), fontSize: v } })}
              />
              <TextInput
                label="Style.color"
                value={el.style?.color}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), color: v } })}
              />
              <TextInput
                label="Style.alignment"
                value={el.style?.alignment as string}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), alignment: v } })}
              />
              <TextInput
                label="Style.position"
                value={el.style?.position}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), position: v } })}
              />
              <TextInput
                label="Style.padding"
                value={el.style?.padding}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), padding: v } })}
              />
              <TextInput
                label="Style.border"
                value={el.style?.border}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), border: v } })}
              />
              <TextInput
                label="Style.animation"
                value={el.style?.animation}
                onChange={(v) => setAt(i, { style: { ...(el.style || {}), animation: v } })}
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          </div>
        ))}
        {(!elements || elements.length === 0) && (
          <div className="p-3 text-sm text-slate-500">No overlay elements yet.</div>
        )}
      </div>
    </div>
  );
};

const DecisionLogicEditor: React.FC<{
  details: InteractionDetails;
  onChange: (d: InteractionDetails) => void;
}> = ({ details, onChange }) => {
  const rules = details.aiDecisionLogic || [];
  const setRule = (i: number, patch: any) => {
    const copy = [...rules];
    copy[i] = { ...copy[i], ...patch };
    onChange({ ...details, aiDecisionLogic: copy });
  };
  const add = () =>
    onChange({
      ...details,
      aiDecisionLogic: [
        ...(rules || []),
        { choice: "A", feedback: { text: "" }, xapi: { verb: "responded", object: "" } },
      ],
    });
  const remove = (i: number) =>
    onChange({ ...details, aiDecisionLogic: rules.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        <span>Decision Logic</span>
        <button className="rounded bg-emerald-600 px-2 py-1 text-[11px] text-white" onClick={add}>
          + Add rule
        </button>
      </div>
      <div className="divide-y divide-slate-200">
        {(rules || []).map((r, i) => (
          <div key={`rule-${i}`} className="grid gap-3 p-3 md:grid-cols-4">
            <TextInput label="Choice" value={r.choice} onChange={(v) => setRule(i, { choice: v })} />
            <TextInput
              label="Feedback Text"
              value={r.feedback?.text}
              onChange={(v) => setRule(i, { feedback: { ...(r.feedback || {}), text: v } })}
            />
            <TextInput
              label="Feedback Tone"
              value={r.feedback?.tone}
              onChange={(v) => setRule(i, { feedback: { ...(r.feedback || {}), tone: v } })}
            />
            <TextInput
              label="Visual Cue"
              value={r.feedback?.visualCue}
              onChange={(v) => setRule(i, { feedback: { ...(r.feedback || {}), visualCue: v } })}
            />
            <TextInput
              label="xAPI Verb"
              value={r.xapi?.verb}
              onChange={(v) => setRule(i, { xapi: { ...(r.xapi || {}), verb: v } })}
            />
            <TextInput
              label="xAPI Object"
              value={r.xapi?.object}
              onChange={(v) => setRule(i, { xapi: { ...(r.xapi || {}), object: v } })}
            />
            <TextInput
              label="xAPI Result (JSON)"
              value={r.xapi?.result ? JSON.stringify(r.xapi.result) : ""}
              onChange={(v) => {
                try {
                  const parsed = v ? JSON.parse(v) : undefined;
                  setRule(i, { xapi: { ...(r.xapi || {}), result: parsed } });
                } catch {
                  setRule(i, { xapi: { ...(r.xapi || {}), result: v } });
                }
              }}
            />
            <TextInput
              label="Navigate To"
              value={r.navigateTo}
              onChange={(v) => setRule(i, { navigateTo: v })}
            />
            <div className="md:col-span-4 flex justify-end">
              <button className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          </div>
        ))}
        {(!rules || rules.length === 0) && <div className="p-3 text-sm text-slate-500">No rules.</div>}
      </div>
    </div>
  );
};

const KnowledgeCheckEditor: React.FC<{
  kc: KnowledgeCheck | undefined;
  onChange: (k?: KnowledgeCheck) => void;
}> = ({ kc, onChange }) => {
  const set = (patch: Partial<KnowledgeCheck>) => onChange({ ...(kc || {}), ...patch });
  return (
    <div className="rounded border border-slate-200">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        Knowledge Check (optional)
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-2">
        <TextInput label="Stem / Question" value={kc?.stem || kc?.question} onChange={(v) => set({ stem: v })} />
        <TextInput
          label="Answer (comma‑separated)"
          value={Array.isArray(kc?.answer) ? kc?.answer?.join(", ") : (kc?.answer as any)}
          onChange={(v) => set({ answer: v.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
        <TextInput
          label="Options (JSON array of { text, correct, feedback })"
          value={kc?.options ? JSON.stringify(kc.options) : ""}
          onChange={(v) => {
            try {
              const parsed = v ? JSON.parse(v) : undefined;
              set({ options: parsed });
            } catch {
              // ignore
            }
          }}
        />
      </div>
    </div>
  );
};

const StoryboardSceneEditor: React.FC<Props> = ({ scene, onChange }) => {
  const set = (path: string, value: any) => onChange(update(scene, path.split("."), value));
  const layout = typeof scene.screenLayout === "string" ? { description: scene.screenLayout, elements: [] } : (scene.screenLayout as any);
  const overlayElements = (layout?.elements || []) as OverlayElement[];

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <TextInput label="Page Title" value={scene.pageTitle} onChange={(v) => set("pageTitle", v)} />
        <TextInput
          label="Interaction Type"
          value={scene.interactionType}
          onChange={(v) => set("interactionType", v)}
          placeholder="None | MCQ | Scenario | Drag & Drop | Clickable Hotspots …"
        />
        <NumberInput
          label="Timing (seconds)"
          value={scene.timing?.estimatedSeconds}
          onChange={(v) => set("timing", { ...(scene.timing || {}), estimatedSeconds: v })}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TextInput
          label="On‑Screen Text (≤ 70 words)"
          value={scene.onScreenText}
          onChange={(v) => set("onScreenText", v)}
          textarea
        />
        <TextInput
          label="Developer Notes"
          value={scene.developerNotes}
          onChange={(v) => set("developerNotes", v)}
          textarea
        />
      </div>

      {/* Audio */}
      <div className="rounded border border-slate-200">
        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Audio</div>
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <TextInput
            label="Script"
            value={scene.audio?.script}
            onChange={(v) => {
              set("audio", { ...(scene.audio || {}), script: v });
              set("narrationScript", v);
            }}
            textarea
          />
          <div className="grid gap-3">
            <TextInput
              label="Persona"
              value={scene.audio?.voiceParameters?.persona}
              onChange={(v) =>
                set("audio", {
                  ...(scene.audio || {}),
                  voiceParameters: { ...(scene.audio?.voiceParameters || {}), persona: v },
                })
              }
            />
            <TextInput
              label="Pace"
              value={scene.audio?.voiceParameters?.pace}
              onChange={(v) =>
                set("audio", {
                  ...(scene.audio || {}),
                  voiceParameters: { ...(scene.audio?.voiceParameters || {}), pace: v },
                })
              }
            />
            <TextInput
              label="Tone"
              value={scene.audio?.voiceParameters?.tone}
              onChange={(v) =>
                set("audio", {
                  ...(scene.audio || {}),
                  voiceParameters: { ...(scene.audio?.voiceParameters || {}), tone: v },
                })
              }
            />
            <TextInput
              label="Emphasis"
              value={scene.audio?.voiceParameters?.emphasis}
              onChange={(v) =>
                set("audio", {
                  ...(scene.audio || {}),
                  voiceParameters: { ...(scene.audio?.voiceParameters || {}), emphasis: v },
                })
              }
            />
            <TextInput
              label="Background Music"
              value={scene.audio?.backgroundMusic}
              onChange={(v) => set("audio", { ...(scene.audio || {}), backgroundMusic: v })}
            />
            <TextInput
              label="AI Directive"
              value={scene.audio?.aiGenerationDirective}
              onChange={(v) => set("audio", { ...(scene.audio || {}), aiGenerationDirective: v })}
              placeholder='[AI Generate: VO at 150 WPM, female, warm …]'
            />
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className="rounded border border-slate-200">
        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Visual</div>
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <TextInput label="Media Type" value={scene.visual?.mediaType} onChange={(v) => set("visual", { ...(scene.visual || {}), mediaType: v })} />
          <TextInput label="Style" value={scene.visual?.style} onChange={(v) => set("visual", { ...(scene.visual || {}), style: v })} />
          <TextInput
            label="Aspect Ratio"
            value={scene.visual?.aspectRatio}
            onChange={(v) => set("visual", { ...(scene.visual || {}), aspectRatio: v })}
          />
          <TextInput
            label="Alt Text (≤125 chars)"
            value={scene.visual?.altText}
            onChange={(v) => set("visual", { ...(scene.visual || {}), altText: v })}
          />
          <TextInput
            label="AI Prompt (legacy)"
            value={scene.visual?.aiPrompt}
            onChange={(v) => set("visual", { ...(scene.visual || {}), aiPrompt: v })}
          />
        </div>

        <div className="border-t border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Visual Generation Brief</div>
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <TextInput
            label="Scene Description"
            value={scene.visual?.visualGenerationBrief?.sceneDescription}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), sceneDescription: v },
              })
            }
            textarea
          />
          <TextInput
            label="Brief: Style"
            value={scene.visual?.visualGenerationBrief?.style}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), style: v },
              })
            }
          />
          <TextInput
            label="Brief: Subject (JSON)"
            value={
              scene.visual?.visualGenerationBrief?.subject
                ? JSON.stringify(scene.visual.visualGenerationBrief.subject)
                : ""
            }
            onChange={(v) => {
              try {
                const parsed = v ? JSON.parse(v) : undefined;
                set("visual", {
                  ...(scene.visual || {}),
                  visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), subject: parsed },
                });
              } catch {
                // ignore
              }
            }}
          />
          <TextInput
            label="Brief: Setting"
            value={scene.visual?.visualGenerationBrief?.setting}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), setting: v },
              })
            }
          />
          <TextInput
            label="Brief: Composition"
            value={scene.visual?.visualGenerationBrief?.composition}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), composition: v },
              })
            }
          />
          <TextInput
            label="Brief: Lighting"
            value={scene.visual?.visualGenerationBrief?.lighting}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), lighting: v },
              })
            }
          />
          <TextInput
            label="Brief: Colour Palette (comma HEX)"
            value={(scene.visual?.visualGenerationBrief?.colorPalette || []).join(", ")}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: {
                  ...(scene.visual?.visualGenerationBrief || {}),
                  colorPalette: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          <TextInput
            label="Brief: Mood"
            value={scene.visual?.visualGenerationBrief?.mood}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), mood: v },
              })
            }
          />
          <TextInput
            label="Brief: Brand Integration"
            value={scene.visual?.visualGenerationBrief?.brandIntegration}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), brandIntegration: v },
              })
            }
          />
          <TextInput
            label="Brief: Negative Space"
            value={scene.visual?.visualGenerationBrief?.negativeSpace}
            onChange={(v) =>
              set("visual", {
                ...(scene.visual || {}),
                visualGenerationBrief: { ...(scene.visual?.visualGenerationBrief || {}), negativeSpace: v },
              })
            }
          />
        </div>

        <div className="border-t border-slate-200 p-3">
          <OverlayEditor
            elements={overlayElements}
            onChange={(els) =>
              set("screenLayout", { description: layout?.description || "Layout", elements: els })
            }
          />
        </div>
      </div>

      {/* Interaction */}
      <div className="rounded border border-slate-200">
        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
          Interaction Details
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <TextInput
            label="Interaction Description (legacy)"
            value={scene.interactionDescription}
            onChange={(v) => set("interactionDescription", v)}
          />
          <TextInput
            label="AI Directive"
            value={scene.interactionDetails?.aiGenerationDirective}
            onChange={(v) =>
              set("interactionDetails", { ...(scene.interactionDetails || { interactionType: scene.interactionType }), aiGenerationDirective: v })
            }
            placeholder='[AI Generate: MCQ with option‑level feedback …]'
          />
          <TextInput
            label="Retry Logic"
            value={scene.interactionDetails?.retryLogic}
            onChange={(v) =>
              set("interactionDetails", { ...(scene.interactionDetails || { interactionType: scene.interactionType }), retryLogic: v })
            }
          />
          <TextInput
            label="Completion Rule"
            value={scene.interactionDetails?.completionRule}
            onChange={(v) =>
              set("interactionDetails", { ...(scene.interactionDetails || { interactionType: scene.interactionType }), completionRule: v })
            }
          />
        </div>
        <div className="border-t border-slate-200 p-3">
          <DecisionLogicEditor
            details={scene.interactionDetails || { interactionType: scene.interactionType }}
            onChange={(d) => set("interactionDetails", { ...(scene.interactionDetails || {}), ...d })}
          />
        </div>
      </div>

      {/* Knowledge Check (optional) */}
      <KnowledgeCheckEditor
        kc={scene.knowledgeCheck}
        onChange={(k) => set("knowledgeCheck", k)}
      />

      {/* Accessibility */}
      <div className="rounded border border-slate-200">
        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
          Accessibility
        </div>
        <div className="p-3">
          <TextInput
            label="Notes"
            value={scene.accessibilityNotes}
            onChange={(v) => set("accessibilityNotes", v)}
            textarea
          />
        </div>
      </div>
    </section>
  );
};

export default StoryboardSceneEditor;