import { useState, useRef } from 'react';
import { generateStoryboard } from '@/services/api';
import { StoryboardFormData, StoryboardScene } from '@/types/StoryboardTypes';
import html2pdf from 'html2pdf.js';

const defaultFormData: StoryboardFormData = {
  moduleName: '',
  moduleType: 'Onboarding',
  organisationName: '',
  outputLanguage: 'English',
  brandGuidelines: '',
  logoUrl: '',
  colours: '',
  fonts: '',
  learningOutcomes: '',
  targetAudience: '',
  knowledgeCheck: '',
  complexityLevel: 'Level 1',
  duration: '10',
  tone: 'Professional',
  moduleComplexity: 'Basic',
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
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storyboard Generator</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <input name="moduleName" placeholder="Module Name" value={formData.moduleName} onChange={handleChange} className="w-full border p-2" required />
        <input name="organisationName" placeholder="Organisation" value={formData.organisationName} onChange={handleChange} className="w-full border p-2" required />
        <input name="targetAudience" placeholder="Audience" value={formData.targetAudience} onChange={handleChange} className="w-full border p-2" />
        <textarea name="learningOutcomes" placeholder="Learning Outcomes" value={formData.learningOutcomes} onChange={handleChange} className="w-full border p-2" />
        <textarea name="knowledgeCheck" placeholder="Knowledge Check (optional)" value={formData.knowledgeCheck} onChange={handleChange} className="w-full border p-2" />
        <input name="duration" type="number" placeholder="Duration (minutes)" value={formData.duration} onChange={handleChange} className="w-full border p-2" />
        <input name="logoUrl" placeholder="Logo URL (optional)" value={formData.logoUrl} onChange={handleChange} className="w-full border p-2" />
        <input name="colours" placeholder="Brand Colours (optional)" value={formData.colours} onChange={handleChange} className="w-full border p-2" />
        <input name="fonts" placeholder="Fonts (optional)" value={formData.fonts} onChange={handleChange} className="w-full border p-2" />
        <input name="brandGuidelines" placeholder="Brand Guidelines (optional)" value={formData.brandGuidelines} onChange={handleChange} className="w-full border p-2" />

        <select name="moduleType" value={formData.moduleType} onChange={handleChange} className="w-full border p-2">
          <option value="Onboarding">Onboarding</option>
          <option value="Compliance">Compliance</option>
          <option value="Product Training">Product Training</option>
          <option value="Soft Skills">Soft Skills</option>
          <option value="Leadership">Leadership</option>
        </select>

        <select name="complexityLevel" value={formData.complexityLevel} onChange={handleChange} className="w-full border p-2">
          <option value="Level 1">Level 1</option>
          <option value="Level 2">Level 2</option>
          <option value="Level 3">Level 3</option>
        </select>

        <select name="moduleComplexity" value={formData.moduleComplexity} onChange={handleChange} className="w-full border p-2">
          <option value="Basic">Basic</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <select name="tone" value={formData.tone} onChange={handleChange} className="w-full border p-2">
          <option value="Professional">Professional</option>
          <option value="Conversational">Conversational</option>
          <option value="Fun">Fun</option>
          <option value="Serious">Serious</option>
        </select>

        <select name="outputLanguage" value={formData.outputLanguage} onChange={handleChange} className="w-full border p-2">
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="Chinese">Chinese</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Storyboard'}
        </button>
      </form>

      {storyboard && (
        <div className="mt-8 space-y-4">
          <button onClick={handleDownloadPDF} className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            📥 Download PDF
          </button>

          <div ref={pdfRef}>
            <h2 className="text-2xl font-semibold mb-4">🎬 Generated Storyboard</h2>
            {storyboard.map((scene) => (
              <div key={scene.sceneNumber} className="p-4 border rounded bg-white shadow-sm mb-4">
                <h3 className="font-bold text-lg mb-1">Scene {scene.sceneNumber}: {scene.title}</h3>
                <p><strong>Script:</strong> {scene.script}</p>
                <p><strong>Visuals:</strong> {scene.visuals}</p>
                <p><strong>Voiceover:</strong> {scene.voiceover}</p>
                {scene.knowledgeCheck && (
                  <div className="mt-2">
                    <strong>Knowledge Check:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(scene.knowledgeCheck, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardForm;
