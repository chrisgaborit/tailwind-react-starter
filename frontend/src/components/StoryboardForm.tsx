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
  LearningMode,
  InstructionalPurpose,
} from "@/types";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormTextArea from "./FormTextArea";

// Extend locally so we can add aiModel and durationMins without touching global types
type StoryboardFormDataWithAI = StoryboardFormData & {
  aiModel?: string;        // "gpt-5" | "gpt-4o" | "gpt-4-turbo"
  durationMins?: number;   // preferred numeric duration (backend clamps again)
  idMethod?: string;       // instructional design method
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

const AI_MODEL_OPTIONS = ["gpt-5", "gpt-4o", "gpt-4-turbo"];

const ID_METHOD_OPTIONS = [
  "ADDIE (Analyze–Design–Develop–Implement–Evaluate)",
  "SAM (Successive Approximation Model)",
  "Merrill’s First Principles",
  "Gagné’s Nine Events",
  "Backward Design",
  "Bloom-aligned Planning",
];

const StoryboardForm: React.FC<StoryboardFormProps> = ({
  formData,
  onFormChange,
  disabled,
  files,
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
      </section>

      {/* SECTION 2: Learning Design */}
      <section
        aria-labelledby="learning-design-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="learning-design-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          2. Learning Design
        </h2>
        <p className="text-slate-300/90 mb-6">
          Use the{" "}
          <span className="text-sky-300 font-semibold">
            Preferred Instructional Design Methodology
          </span>{" "}
          to guide overall structure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          <FormSelect
            label="Instructional Design Process"
            name="idMethod"
            value={formData.idMethod || "ADDIE (Analyze–Design–Develop–Implement–Evaluate)"}
            onChange={onFormChange}
            options={ID_METHOD_OPTIONS}
            disabled={disabled}
          />
          <FormSelect
            label="Primary Learning Mode (optional)"
            name="primaryLearningMode"
            value={(formData as any).primaryLearningMode}
            onChange={onFormChange}
            options={learningModes}
            disabled={disabled}
          />
          <FormSelect
            label="Instructional Purpose"
            name="instructionalPurpose"
            value={formData.instructionalPurpose}
            onChange={onFormChange}
            options={instructionalPurposes}
            disabled={disabled}
          />
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

      {/* SECTION 6: Instructional Methodology (Advanced) */}
      <section
        aria-labelledby="instructional-methodology-title"
        className="p-8 lg:p-10 bg-slate-800/60 rounded-3xl shadow-2xl border border-slate-700"
      >
        <h2
          id="instructional-methodology-title"
          className="text-2xl md:text-3xl font-bold text-sky-300 mb-8 border-b border-slate-700 pb-4"
        >
          6. Instructional Methodology (Advanced)
        </h2>

        <FormSelect
          label="Primary Learning Goal (Select one)"
          name="primaryLearningGoal"
          value={(formData as any).primaryLearningGoal || ""}
          onChange={onFormChange}
          options={[
            "Compliance (formal tone, rules)",
            "Knowledge Transfer (clear, structured)",
            "Skills Practice (hands-on, applied)",
            "Attitude/Soft Skills (empathy, resilience)",
          ]}
          disabled={disabled}
        />

        <div className="mt-8">
          <label className="block font-semibold text-slate-100 mb-3">
            Secondary Teaching Techniques (Select all that apply)
          </label>
          <div className="space-y-3">
            {[
              { value: "explainer", label: "Explainer (use diagrams & metaphors)" },
              { value: "scenario", label: "Scenario-Based (use branching choices)" },
              { value: "softskills", label: "Soft Skills (focus on empathy)" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  id={opt.value}
                  name="secondaryTechniques"
                  value={opt.value}
                  checked={((formData as any).secondaryTechniques || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = (formData as any).secondaryTechniques || [];
                    if (e.target.checked) {
                      onFormChange("secondaryTechniques", [...current, opt.value]);
                    } else {
                      onFormChange(
                        "secondaryTechniques",
                        current.filter((v: string) => v !== opt.value)
                      );
                    }
                  }}
                  disabled={disabled}
                  className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-sky-400 focus:ring-sky-400"
                />
                <label htmlFor={opt.value} className="ml-3 text-slate-200">
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <FormSelect
            label="Interaction Frequency (Optional)"
            name="interactionFrequency"
            value={(formData as any).interactionFrequency || ""}
            onChange={onFormChange}
            options={["Let AI Decide (Recommended)", "Low", "Medium", "High"]}
            disabled={disabled}
          />
        </div>

        <div className="mt-8">
          <FormTextArea
            label="Specific Creative Instructions (Optional)"
            name="creativeInstructions"
            value={(formData as any).creativeInstructions}
            onChange={onFormChange}
            placeholder="e.g., 'For the section on data privacy, please ensure you use a branching scenario.'"
            rows={4}
            disabled={disabled}
          />
        </div>
      </section>
    </form>
  );
};

export default StoryboardForm;