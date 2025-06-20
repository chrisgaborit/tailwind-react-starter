import { useState, useRef } from 'react';
import { generateStoryboard } from '@/services/api';
import { StoryboardFormData, StoryboardScene } from '@/types/StoryboardTypes';
import html2pdf from 'html2pdf.js';

const defaultFormData: StoryboardFormData = {
  moduleName: '',
  moduleType: '',
  organisationName: '',
  outputLanguage: 'English',
  brandGuidelines: '',
  logoUrl: '',
  colours: '',
  fonts: '',
  learningOutcomes: '',
  targetAudience: '',
  knowledgeCheck: '',
  complexityLevel: '',
  duration: '',
  tone: '',
  moduleComplexity: '',
};

const StoryboardForm = () => {
  const [formData, setFormData] = useState<StoryboardFormData>(defaultFormData);
  const [storyboard, setStoryboard] = useState<StoryboardScene[] | null>(null);
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await generateStoryboard(formData);
      setStoryboard(result);
    } catch (err) {
      alert('Failed to generate storyboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfRef.current) return;

    const opt = {
      margin: 0.5,
      filename: `storyboard_${formData.moduleName || 'output'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().from(pdfRef.current).set(opt).save();
  };

  return (
    <div className="min-h-screen bg-brandDark text-white font-body flex items-start justify-center py-12 px-6">
      <div className="w-full max-w-3xl bg-zinc-900 rounded-2xl shadow-lg p-10">
        <h1 className="text-4xl font-heading text-brilliantBlue mb-10 text-center">
          AI eLearning Storyboard Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {["moduleName", "targetAudience", "organisationName", "duration", "brandGuidelines"].map((field, idx) => (
            <input
              key={field}
              name={field}
              placeholder={
                field === "moduleName" ? "Module Name / Title" :
                field === "targetAudience" ? "Target Audience" :
                field === "organisationName" ? "Organisation / Client Name" :
                field === "duration" ? "Duration Target (e.g. 10–15 minutes)" :
                "Brand Guidelines (Fonts, Colors, Logo URL etc)"
              }
              value={(formData as any)[field]}
              onChange={handleChange}
              required={field === "moduleName" || field === "organisationName"}
              className="h-14 w-full rounded-md px-4 bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brilliantBlue"
            />
          ))}

          <select
            name="outputLanguage"
            value={formData.outputLanguage}
            onChange={handleChange}
            className="h-14 w-full rounded-md px-4 bg-zinc-800 border border-zinc-700 text-white"
          >
            {["English", "Spanish", "French", "Chinese"].map((lang) => (
              <option key={lang}>{lang}</option>
            ))}
          </select>

          {["moduleType", "complexityLevel", "tone"].map((name) => (
            <select
              key={name}
              name={name}
              value={(formData as any)[name]}
              onChange={handleChange}
              className="h-14 w-full rounded-md px-4 bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="">Select {name}...</option>
              {(name === "moduleType"
                ? ["Onboarding", "Compliance", "Product Training", "Soft Skills", "Leadership"]
                : name === "complexityLevel"
                ? ["Level 1", "Level 2", "Level 3"]
                : ["Professional", "Conversational", "Inspiring", "Fun"]).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ))}

          {["learningOutcomes", "knowledgeCheck"].map((area) => (
            <textarea
              key={area}
              name={area}
              placeholder={
                area === "learningOutcomes"
                  ? "Learning Outcomes"
                  : "Main Content for Storyboard"
              }
              value={(formData as any)[area]}
              onChange={handleChange}
              className="w-full min-h-[100px] rounded-md px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400"
            />
          ))}

          <button
            type="submit"
            className="w-full h-14 bg-brilliantBlue text-white font-semibold rounded-md hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Storyboard'}
          </button>
        </form>

        {storyboard && (
          <div className="mt-12">
            <button
              onClick={handleDownloadPDF}
              className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📥 Download PDF
            </button>

            <div ref={pdfRef} className="space-y-6">
              <h2 className="text-2xl font-heading text-brilliantBlue mb-4">🎬 Generated Storyboard</h2>
              {storyboard.map((scene) => (
                <div key={scene.sceneNumber} className="bg-brandField p-4 rounded border border-brandGray">
                  <h3 className="font-bold text-lg mb-2">Scene {scene.sceneNumber}: {scene.title}</h3>
                  <p><strong>Script:</strong> {scene.script}</p>
                  <p><strong>Visuals:</strong> {scene.visuals}</p>
                  <p><strong>Voiceover:</strong> {scene.voiceover}</p>
                  {scene.knowledgeCheck && (
                    <div className="mt-2">
                      <strong>Knowledge Check:</strong>
                      <pre className="bg-gray-800 text-white p-2 rounded text-sm">{JSON.stringify(scene.knowledgeCheck, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryboardForm;
