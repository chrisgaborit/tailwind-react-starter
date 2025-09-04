import type { StoryboardFormData } from "@/types";

// frontend/src/components/AdvancedLayoutSection.tsx

interface Props {
  formData: StoryboardFormData;
  onFormChange: (field: keyof StoryboardFormData, value: string) => void;
  disabled: boolean;
}

export const AdvancedLayoutSection: React.FC<Props> = ({ formData, onFormChange, disabled }) => {
  return (
    <section aria-labelledby="advanced-layout-title" className="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 id="advanced-layout-title" className="text-xl font-semibold text-sky-300 mb-6 border-b border-slate-700 pb-3">
        5. Advanced Layout Preferences
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="screenType" className="block text-sm font-medium text-slate-300 mb-1">Screen Type</label>
          <select
            id="screenType"
            value={formData.screenType || ''}
            onChange={(e) => onFormChange('screenType', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-700 bg-slate-900 text-slate-200 rounded-md px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="Scenario">Scenario</option>
            <option value="Drag-and-Drop">Drag-and-Drop</option>
            <option value="Click-and-Reveal">Click-and-Reveal</option>
          </select>
        </div>

        <div>
          <label htmlFor="interactionStyle" className="block text-sm font-medium text-slate-300 mb-1">Preferred Interaction Style</label>
          <select
            id="interactionStyle"
            value={formData.interactionStyle || ''}
            onChange={(e) => onFormChange('interactionStyle', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-700 bg-slate-900 text-slate-200 rounded-md px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="Click-to-Reveal">Click-to-Reveal</option>
            <option value="Multiple Choice">Multiple Choice</option>
            <option value="Matching">Matching</option>
            <option value="Image Hotspot">Image Hotspot</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="instructionalPurpose" className="block text-sm font-medium text-slate-300 mb-1">
          Specific Instructional Purpose (Optional)
        </label>
        <input
          type="text"
          id="instructionalPurpose"
          value={formData.instructionalPurpose || ''}
          onChange={(e) => onFormChange('instructionalPurpose', e.target.value)}
          disabled={disabled}
          className="w-full border border-slate-700 bg-slate-900 text-slate-200 rounded-md px-3 py-2"
          placeholder="e.g., Reinforce ethical decision making through branching scenarios."
        />
      </div>
    </section>
  );
};
