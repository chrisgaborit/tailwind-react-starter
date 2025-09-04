// @ts-nocheck
import React from "react";
import {
  ModuleLevel,
  ModuleType,
  Tone,
  SupportedLanguage,
  type StoryboardFormData,
} from "@/types";

import TextInputArea from "./TextInputArea";
import { DURATION_HINT, LEVEL_DESCRIPTIONS } from "../constants";

interface StoryboardFormProps {
  formData: StoryboardFormData;
  onFormChange: (fieldName: keyof StoryboardFormData, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`mb-6 ${className || ""}`}>{children}</div>;

const Label: React.FC<{
  htmlFor: string;
  text: string;
  required?: boolean;
  subtext?: string;
}> = ({ htmlFor, text, required, subtext }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-sky-300 mb-1"
  >
    {text} {required && <span className="text-red-400">*</span>}
    {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
  </label>
);

const StoryboardRequestForm: React.FC<StoryboardFormProps> = ({
  formData,
  onFormChange,
  onSubmit,
  isLoading,
  disabled,
}) => {
  const handleTextishChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onFormChange(e.target.name as keyof StoryboardFormData, e.target.value);
  };

  // Allow free typing in Duration; convert to number when possible; permit clearing
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "") {
      onFormChange("moduleDuration", "");
      return;
    }
    const n = Number(v);
    onFormChange("moduleDuration", Number.isFinite(n) ? n : "");
  };

  return (
    <div className="w-full max-w-3xl p-6 sm:p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
        Create Your eLearning Storyboard
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-8"
      >
        {/* ===================== Module Definition ===================== */}
        <section aria-labelledby="module-definition-title" className="p-0">
          <h2
            id="module-definition-title"
            className="text-xl font-semibold text-sky-300 mb-6 border-b border-slate-700 pb-3"
          >
            Define Your eLearning Module
          </h2>

          <FormRow>
            <Label htmlFor="moduleName" text="Module Name / Title" required />
            <input
              type="text"
              id="moduleName"
              name="moduleName"
              value={formData.moduleName || ""}
              onChange={handleTextishChange}
              disabled={disabled || isLoading}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            />
          </FormRow>

          <FormRow>
            <Label htmlFor="language" text="Output Language" required />
            <select
              id="language"
              name="language"
              value={formData.language || ""}
              onChange={handleTextishChange}
              disabled={disabled || isLoading}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            >
              <option value="" disabled>
                Select output language...
              </option>
              {(Object.values(SupportedLanguage) as string[]).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </FormRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormRow>
              <Label htmlFor="moduleType" text="Module Type" required />
              <select
                id="moduleType"
                name="moduleType"
                value={formData.moduleType || ""}
                onChange={handleTextishChange}
                disabled={disabled || isLoading}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              >
                <option value="" disabled>
                  Select module type...
                </option>
                {(Object.values(ModuleType) as string[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow>
              <Label
                htmlFor="moduleLevel"
                text="Module Complexity Level"
                required
              />
              <select
                id="moduleLevel"
                name="moduleLevel"
                value={formData.moduleLevel || ""}
                onChange={handleTextishChange}
                disabled={disabled || isLoading}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              >
                <option value="" disabled>
                  Select complexity level...
                </option>
                {Object.entries(ModuleLevel).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value} —{" "}
                    {LEVEL_DESCRIPTIONS[
                      value as keyof typeof LEVEL_DESCRIPTIONS
                    ]}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormRow>
              <Label htmlFor="audience" text="Target Audience" required />
              <input
                type="text"
                id="audience"
                name="audience"
                value={formData.audience || ""}
                onChange={handleTextishChange}
                placeholder="e.g., New hires, Sales team, All staff"
                disabled={disabled || isLoading}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="tone" text="Desired Tone" required />
              <select
                id="tone"
                name="tone"
                value={formData.tone || ""}
                onChange={handleTextishChange}
                disabled={disabled || isLoading}
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              >
                <option value="" disabled>
                  Select tone...
                </option>
                {(Object.values(Tone) as string[]).map((toneItem) => (
                  <option key={toneItem} value={toneItem}>
                    {toneItem}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>
        </section>

        {/* ===================== Organisation & Branding ===================== */}
        <section aria-labelledby="organisation-details-title" className="p-0">
          <h2
            id="organisation-details-title"
            className="text-xl font-semibold text-sky-300 mb-6 border-b border-slate-700 pb-3"
          >
            Organisation & Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormRow>
              <Label
                htmlFor="organisationName"
                text="Organisation / Client Name"
              />
              <input
                type="text"
                id="organisationName"
                name="organisationName"
                value={formData.organisationName || ""}
                onChange={handleTextishChange}
                disabled={disabled || isLoading}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </FormRow>

            <FormRow>
              <Label
                htmlFor="moduleDuration"
                text="Duration Target"
                subtext={DURATION_HINT}
              />
              <input
                id="moduleDuration"
                name="moduleDuration"
                type="number"
                min={1}
                max={90}
                step={1}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g., 20"
                value={
                  formData.moduleDuration === "" ||
                  typeof formData.moduleDuration === "undefined"
                    ? ""
                    : formData.moduleDuration
                }
                onChange={handleDurationChange}
                disabled={disabled || isLoading}
                className="block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100 shadow-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
            </FormRow>
          </div>

          <FormRow>
            <Label
              htmlFor="orgBranding"
              text="Brand Guidelines (Fonts, Colours, Logo URL, etc.)"
            />
            <TextInputArea
              id="orgBranding"
              name="orgBranding"
              value={formData.orgBranding || ""}
              onChange={(e: any) => onFormChange("orgBranding", e.target.value)}
              placeholder="e.g., Fonts: Inter, Open Sans. Colours: #003366 (Primary), #FF9900 (Accent). Logo: https://…"
              disabled={disabled || isLoading}
              rows={3}
            />
          </FormRow>
        </section>

        {/* ===================== Learning Content ===================== */}
        <section aria-labelledby="content-input-title" className="p-0">
          <h2
            id="content-input-title"
            className="text-xl font-semibold text-sky-300 mb-4 border-b border-slate-700 pb-3"
          >
            Learning Content
          </h2>

          <FormRow>
            <Label htmlFor="learningOutcomes" text="Learning Outcomes" required />
            <TextInputArea
              id="learningOutcomes"
              name="learningOutcomes"
              value={formData.learningOutcomes || ""}
              onChange={(e: any) =>
                onFormChange("learningOutcomes", e.target.value)
              }
              placeholder="List the key learning objectives. e.g., By the end of this module, learners will be able to: 1) … 2) … 3) …"
              disabled={disabled || isLoading}
              rows={5}
              required
            />
          </FormRow>

          <FormRow>
            <Label htmlFor="mainContent" text="Main Content for Storyboard" required />
            <p className="text-sm text-slate-400 mb-2">
              Paste the core text from your presentation, document, or notes.
              The more detailed your content, the better the storyboard.
            </p>
            <TextInputArea
              id="mainContent"
              name="mainContent"
              value={formData.mainContent || ""}
              onChange={(e: any) => onFormChange("mainContent", e.target.value)}
              placeholder="Example: Welcome to Advanced Sales Techniques. Today we'll cover consultative selling, handling objections, and closing strategies..."
              disabled={disabled || isLoading}
              rows={15}
              required
            />
          </FormRow>
        </section>

        {/* ===================== Submit ===================== */}
        <div className="pt-6 text-center">
          <button
            type="submit"
            disabled={disabled || isLoading}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white font-semibold py-3 px-12 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Storyboard"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryboardRequestForm;