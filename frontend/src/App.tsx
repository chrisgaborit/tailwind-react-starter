import { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [formData, setFormData] = useState({
    moduleName: '',
    language: 'English',
    moduleType: '',
    complexityLevel: '',
    audience: '',
    tone: '',
    organisation: '',
    duration: '',
    brand: '',
    outcomes: '',
    content: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('[SUBMITTING]', formData);
      // Call your backend endpoint here
    } catch (err) {
      alert('Something went wrong. Check console.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          AI eLearning Storyboard Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fields */}
          {[
            { label: 'Module Name / Title', name: 'moduleName', required: true },
            { label: 'Target Audience', name: 'audience', required: true },
            { label: 'Organisation / Client Name', name: 'organisation' },
            { label: 'Duration Target', name: 'duration', placeholder: 'e.g. 10–15 minutes or approx 15 screens' },
            { label: 'Brand Guidelines (Fonts, Colors, Logo URL etc)', name: 'brand' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block font-semibold">{field.label}</label>
              <input
                name={field.name}
                type="text"
                required={field.required}
                placeholder={field.placeholder || ''}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          ))}

          {/* Dropdowns */}
          {[
            {
              label: 'Output Language',
              name: 'language',
              options: ['English', 'Spanish', 'French', 'Chinese (Simplified)', 'Hindi', 'Arabic', 'German', 'Japanese', 'Indonesian'],
            },
            {
              label: 'Module Type',
              name: 'moduleType',
              options: ['Compliance', 'Onboarding', 'Product Training', 'Systems or Technical Training', 'Soft Skills or Behavioural', 'Leadership'],
            },
            {
              label: 'Module Complexity Level',
              name: 'complexityLevel',
              options: [
                'Level 1 – Foundational knowledge, simple interactions',
                'Level 2 – Application & scenarios, tabs/drag & drop',
                'Level 3 – Strategic skills, simulations & branching',
                'Level 4 – Immersive, real-time systems & adaptive learning',
              ],
            },
            {
              label: 'Desired Tone',
              name: 'tone',
              options: [
                'Formal',
                'Friendly',
                'Inspiring',
                'Conversational',
                'Confident & Persuasive',
                'Direct & Instructional',
                'Reflective & Story-Driven',
                'Empowering & Strategic',
              ],
            },
          ].map(({ label, name, options }) => (
            <div key={name}>
              <label className="block font-semibold">{label}</label>
              <select
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Text Areas */}
          {[
            { label: 'Learning Outcomes', name: 'outcomes', required: true },
            { label: 'Main Content for Storyboard', name: 'content', required: true },
          ].map((field) => (
            <div key={field.name}>
              <label className="block font-semibold">{field.label}</label>
              <textarea
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                required={field.required}
                rows={4}
                className="w-full border p-2 rounded"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
          >
            Generate Storyboard
          </button>
        </form>
      </div>
    </div>
  );
}
