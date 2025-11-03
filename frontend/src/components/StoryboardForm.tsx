// @ts-nocheck
import React from "react";
import {
  COMPLEXITY_LEVEL_OPTIONS,
  MODULE_TYPES,
  TONES,
  SUPPORTED_LANGUAGES,
  DURATION_HINT,
} from "@/constants";
import {
  StoryboardFormData,
} from "@/types";

// Define missing types and enums locally to avoid import issues
type LearningMode = "storytelling" | "branching" | "procedural" | "scenario-led" | "demo-practice";
type InstructionalPurpose = "teach" | "demonstrate" | "practice" | "assess";

// Create enum-like objects for Object.values() usage
const LearningMode = {
  STORYTELLING: "storytelling",
  BRANCHING: "branching", 
  PROCEDURAL: "procedural",
  SCENARIO_LED: "scenario-led",
  DEMO_PRACTICE: "demo-practice"
} as const;

const InstructionalPurpose = {
  TEACH: "teach",
  DEMONSTRATE: "demonstrate",
  PRACTICE: "practice", 
  ASSESS: "assess"
} as const;
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormTextArea from "./FormTextArea";
import FormMultiSelect from "./FormMultiSelect";
import BusinessImpactForm from "./BusinessImpactForm";

// Extend locally so we can add aiModel and durationMins without touching global types
type StoryboardFormDataWithAI = StoryboardFormData & {
  aiModel?: string;        // "gpt-4o" | "gpt-4o" | "gpt-4-turbo"
  durationMins?: number;   // preferred numeric duration (backend clamps again)
  idMethod?: string;       // instructional design method
  strictMode?: boolean;    // 🆕 Enable strict source-only generation with gap analysis
  branding?: {
    fonts?: string;
    colours?: string;
    logos?: string[];      // filenames only (company images)
    styleNotes?: string;
  };
};

interface StoryboardFormProps {
  formData: StoryboardFormDataWithAI;
  onFormChange: (
    fieldName: keyof StoryboardFormDataWithAI,
    value: string | number | string[] | any
  ) => void;
  disabled: boolean;

  // Training files
  files: File[];
  onFileChange: (files: FileList | null) => void;
  onFileRemove: (fileName: string) => void;

  // Company images (brand logos etc.)
  imageFiles?: File[];
  onImageChange?: (files: FileList | null) => void;
  onImageRemove?: (fileName: string) => void;
}

const AI_MODEL_OPTIONS = ["gpt-4o", "gpt-4-turbo", "gpt-4"];

const ID_METHOD_OPTIONS = [
  "ADDIE (Analyze–Design–Develop–Implement–Evaluate)",
  "SAM (Successive Approximation Model)",
  "Merrill's First Principles",
  "Gagné's Nine Events",
  "Backward Design",
  "Bloom-aligned Planning",
];

// NEW STRATEGIC CATEGORIES
const STRATEGIC_CATEGORIES = [
  "Compliance & Risk Management",
  "Leadership & Management Development", 
  "Sales & Customer Excellence",
  "Technical & Systems Mastery",
  "Onboarding & Culture Integration",
  "Professional Skills Development",
  "Health, Safety & Wellbeing",
  "Diversity, Equity & Inclusion",
  "Innovation & Future Readiness",
  "Product & Service Excellence",
  "Custom Strategic Initiative"
];

// NEW INNOVATION STRATEGIES
const INNOVATION_STRATEGIES = [
  "AI-Powered Simulation",
  "Branching Scenarios with Consequences",
  "Real-Work Application",
  "Social Learning Community",
  "VR/AR Immersive Experience",
  "Microlearning Performance Support",
  "Adaptive Learning Paths",
  "Gamified Progression",
  "Peer-to-Peer Coaching"
];

// NEW MEASUREMENT APPROACHES
const MEASUREMENT_APPROACHES = [
  "Level 1: Satisfaction surveys",
  "Level 2: Knowledge assessment",
  "Level 3: Behavior observation",
  "Level 4: Business impact tracking",
  "Level 5: ROI calculation"
];

const StoryboardForm: React.FC<StoryboardFormProps> = ({
  formData,
  onFormChange,
  disabled,
  files = [],
  onFileChange,
  onFileRemove,
  imageFiles = [],
  onImageChange = () => undefined,
  onImageRemove = () => undefined,
}) => {
  const learningModes = Object.values(LearningMode);
  const instructionalPurposes = Object.values(InstructionalPurpose);

  // Duration handler: allow clearing, accept any starting digit, clamp 1–90
  const handleDurationMinsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "") {
      onFormChange("durationMins", undefined); // allow empty box while typing
      return;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      // ignore invalid characters (keeps current display)
      return;
    }
    const clamped = Math.max(1, Math.min(90, Math.round(n)));
    onFormChange("durationMins", clamped);
  };

  // Strategic validation helper
  const isStrategicFoundationComplete = () => {
    return !!(
      formData.businessImpact?.metric &&
      formData.businessImpact?.targetImprovement &&
      formData.businessImpact?.successDefinition &&
      formData.innovationStrategies?.length > 0 &&
      formData.measurementApproaches?.length > 0
    );
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="
        space-y-10
        text-lg lg:text-xl
      "
    >
      {/* SECTION 1: Module Definition */}
      <section
        aria-labelledby="module-definition-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="module-definition-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          1. Module Definition
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          <div className="md:col-span-2">
            <FormInput
              label="Module Name"
              name="moduleName"
              value={formData.moduleName}
              onChange={onFormChange}
              placeholder="e.g., Influencing Others"
              disabled={disabled}
              required
            />
          </div>

          <FormSelect
            label="Module Type"
            name="moduleType"
            value={formData.moduleType}
            onChange={onFormChange}
            options={MODULE_TYPES}
            disabled={disabled}
            required
          />


          <FormSelect
            label="Complexity Level"
            name="complexityLevel"
            value={formData.complexityLevel}
            onChange={onFormChange}
            options={COMPLEXITY_LEVEL_OPTIONS}
            disabled={disabled}
            required
          />

          <FormSelect
            label="Tone of Voice"
            name="tone"
            value={formData.tone}
            onChange={onFormChange}
            options={TONES}
            disabled={disabled}
            required
          />

          <FormSelect
            label="Output Language"
            name="outputLanguage"
            value={formData.outputLanguage}
            onChange={onFormChange}
            options={SUPPORTED_LANGUAGES}
            disabled={disabled}
            required
          />

          {/* Duration (minutes) */}
          <div>
            <label
              htmlFor="durationMins"
              className="block text-slate-100 font-semibold mb-2"
            >
              Duration (minutes)
            </label>

            <input
              id="durationMins"
              name="durationMins"
              type="number"
              min={1}
              max={90}
              step={1}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g., 20"
              value={
                typeof formData.durationMins === "number" &&
                !isNaN(formData.durationMins)
                  ? formData.durationMins
                  : ""
              }
              onChange={handleDurationMinsChange}
              className="
                block w-full rounded-2xl
                border border-slate-600 bg-slate-700/80
                px-5 py-4
                text-slate-100
                shadow-sm
                focus:border-sky-400 focus:ring-2 focus:ring-sky-400
              "
              aria-describedby="durationMins-hint"
              disabled={disabled}
            />

            <p
              id="durationMins-hint"
              className="mt-2 text-slate-300/80 text-base"
            >
              {DURATION_HINT || "Enter total seat time. Allowed range: 1–90 minutes."}
            </p>
          </div>

          <FormSelect
            label="AI Model"
            name="aiModel"
            value={formData.aiModel || "gpt-4o"}
            onChange={onFormChange}
            options={AI_MODEL_OPTIONS}
            disabled={disabled}
          />
        </div>

        {/* 🆕 Strict Mode Toggle */}
        <div className="md:col-span-2 mt-6">
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="strictMode"
                name="strictMode"
                checked={formData.strictMode || false}
                onChange={(e) => onFormChange("strictMode", e.target.checked)}
                className="mt-1 h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-yellow-500 rounded"
                disabled={disabled}
              />
              <div className="flex-1">
                <label htmlFor="strictMode" className="text-yellow-200 font-medium">
                  🚩 Enable Strict Source-Only Generation
                </label>
                <p className="text-yellow-100/80 text-sm mt-1">
                  <strong>What this does:</strong> Uses ONLY your source material, never invents content. 
                  Identifies gaps and flags them for your review instead of filling them with AI-generated content.
                  <br />
                  <strong>When to use:</strong> When you want 100% source fidelity and transparency about content completeness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Business Impact & Strategy */}
      <section
        aria-labelledby="business-impact-strategy-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="business-impact-strategy-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          2. Business Impact & Strategy
        </h2>
        <p className="text-slate-300/90 mb-8">
          Define the business impact and learning approach for this training initiative.
        </p>
        
        {!isStrategicFoundationComplete() && (
          <div className="mb-6 p-4 bg-amber-900/30 border border-amber-600 rounded-2xl">
            <p className="text-amber-200 text-sm">
              <span className="font-semibold">⚠️ Business Impact & Strategy Required:</span> Please complete all strategic fields before proceeding to storyboard generation.
            </p>
          </div>
        )}
        
        {isStrategicFoundationComplete() && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-2xl">
            <p className="text-green-200 text-sm">
              <span className="font-semibold">✅ Business Impact & Strategy Complete:</span> Ready to proceed with storyboard generation.
            </p>
          </div>
        )}
        
        <div className="space-y-8">

          {/* Business Impact */}
          <div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">
              Business Impact <span className="text-red-400">*</span>
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              What specific business value will this training deliver?
            </p>
            <BusinessImpactForm
              value={formData.businessImpact || {
                metric: "Productivity",
                targetImprovement: 15,
                timeframe: 90,
                successDefinition: ""
              }}
              onChange={onFormChange}
              disabled={disabled}
              strategicCategory={formData.strategicCategory}
            />
          </div>

          {/* Learning Approach */}
          <div>
            <FormMultiSelect
              label="Learning Approach * (Choose 2-3)"
              name="innovationStrategies"
              value={formData.innovationStrategies || []}
              onChange={onFormChange}
              options={INNOVATION_STRATEGIES}
              disabled={disabled}
              required
            />
            <p className="text-slate-400 text-sm mt-2">
              Select methods that go beyond standard eLearning
            </p>
          </div>

          {/* How We'll Measure Success */}
          <div>
            <FormMultiSelect
              label="How We'll Measure Success * (Choose all that apply)"
              name="measurementApproaches"
              value={formData.measurementApproaches || []}
              onChange={onFormChange}
              options={MEASUREMENT_APPROACHES}
              disabled={disabled}
              required
            />
            <p className="text-slate-400 text-sm mt-2">
              Choose how you'll prove this training delivered results
            </p>
          </div>
        </div>
      </section>


      {/* SECTION 3: Audience & Branding */}
      <section
        aria-labelledby="audience-branding-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="audience-branding-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          3. Audience & Branding
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormInput
            label="Organisation Name"
            name="organisationName"
            value={formData.organisationName}
            onChange={onFormChange}
            placeholder="e.g., Learno Inc."
            disabled={disabled}
          />
          <FormInput
            label="Target Audience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={onFormChange}
            placeholder="e.g., New managers and team leaders"
            disabled={disabled}
          />
          <FormInput
            label="Brand Colours"
            name="colours"
            value={formData.colours}
            onChange={onFormChange}
            placeholder="e.g., #0057FF, #28D7FF, #0A0A0A"
            disabled={disabled}
          />
          <FormInput
            label="Brand Fonts"
            name="fonts"
            value={formData.fonts}
            onChange={onFormChange}
            placeholder="e.g., Lato, Open Sans"
            disabled={disabled}
          />
        </div>
        <div className="mt-8">
          <FormTextArea
            label="Brand Style Notes (used in Dev Notes)"
            name="brandGuidelines"
            value={formData.brandGuidelines}
            onChange={onFormChange}
            placeholder="Visual style, iconography, motion rules, use of logo, etc."
            rows={4}
            disabled={disabled}
          />
        </div>
        
        {/* Text-only images toggle */}
        <div className="mt-5 flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800/40 p-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-sky-500 cursor-pointer"
            checked={formData?.options?.skipAIImages ?? false}
            onChange={(e) =>
              onFormChange('options', { ...(formData.options ?? {}), skipAIImages: e.target.checked })
            }
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Skip AI images (text-only visuals)</span>
            <span className="text-xs text-slate-400">
              Tick this box if you don't want AI-generated images in your storyboard — only image prompts/descriptions will appear.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Core Content */}
      <section
        aria-labelledby="content-objectives-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="content-objectives-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          4. Core Content
        </h2>
        <div className="space-y-8">
          <FormTextArea
            label="Learning Outcomes"
            name="learningOutcomes"
            value={formData.learningOutcomes}
            onChange={onFormChange}
            placeholder="List the key skills or knowledge the learner will gain."
            rows={5}
            disabled={disabled}
          />
          <FormTextArea
            label="Main Content / Key Information (or upload files below)"
            name="content"
            value={formData.content}
            onChange={onFormChange}
            placeholder="Paste raw content here, or upload source documents."
            rows={12}
            disabled={disabled}
          />
        </div>
      </section>

      {/* SECTION 5: Uploads: Training Files + Company Images */}
      <section
        aria-labelledby="file-upload-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2 id="file-upload-title" className="text-2xl md:text-3xl font-bold text-sky-300 mb-6">
          5. Uploads: Training Files + Company Images
        </h2>
        <p className="text-slate-300/90 mb-8">
          Upload source PDFs and optional company images like logos or brand photography.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Training Files */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-3">Training Files (PDF)</h3>
            <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-slate-600 px-8 py-10 bg-slate-900/30">
              <div className="text-center">
                <div className="mt-2 flex leading-6 text-slate-200">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-xl bg-slate-700 px-5 py-3 font-semibold text-sky-300 hover:bg-slate-600"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={(e) => onFileChange(e.target.files)}
                      accept=".pdf"
                      disabled={disabled}
                    />
                  </label>
                  <span className="pl-2 text-slate-400">or drag and drop</span>
                </div>
                <p className="text-base leading-5 text-slate-400 mt-2">PDFs up to 50MB each</p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-slate-300 font-medium">Selected files:</h4>
                <ul className="mt-3 divide-y divide-slate-700 border-t border-slate-700">
                  {files.map((file) => (
                    <li key={file.name} className="flex items-center justify-between py-3">
                      <span className="text-slate-100 truncate pr-4">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => onFileRemove(file.name)}
                        className="rounded-xl border border-slate-600 bg-slate-700/70 px-4 py-2 hover:bg-slate-700 disabled:opacity-50"
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Company Images (PNG/JPG/SVG) */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-3">Company Images (Optional)</h3>
            <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-slate-600 px-8 py-10 bg-slate-900/30">
              <div className="text-center">
                <div className="mt-2 flex leading-6 text-slate-200">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer rounded-xl bg-slate-700 px-5 py-3 font-semibold text-sky-300 hover:bg-slate-600"
                  >
                    <span>Upload images</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={(e) => onImageChange(e.target.files)}
                      accept="image/*,.svg"
                      disabled={disabled}
                    />
                  </label>
                  <span className="pl-2 text-slate-400">or drag and drop</span>
                </div>
                <p className="text-base leading-5 text-slate-400 mt-2">Up to 15MB each</p>
              </div>
            </div>
            {imageFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-slate-300 font-medium">Selected images:</h4>
                <ul className="mt-3 divide-y divide-slate-700 border-t border-slate-700">
                  {imageFiles.map((file) => (
                    <li key={file.name} className="flex items-center justify-between py-3">
                      <span className="text-slate-100 truncate pr-4">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => onImageRemove(file.name)}
                        className="rounded-xl border border-slate-600 bg-slate-700/70 px-4 py-2 hover:bg-slate-700 disabled:opacity-50"
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

    </form>
  );
};

export default StoryboardForm;