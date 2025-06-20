import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://genesis-backend-357662238084.australia-southeast1.run.app/api/v1/generate-storyboard';

interface Scene {
  sceneNumber: string;
  title?: string;
  objectivesCovered?: string;
  visual?: string;
  narration?: string;
  onScreenText?: string;
  userInstructions?: string;
  interactions?: string;
  accessibilityNotes?: string;
  interaction?: string;
  knowledgeCheck?: string | { question: string };
}

export default function App() {
  const [formData, setFormData] = useState({
    moduleName: '',
    outputLanguage: 'English',
    moduleType: '',
    complexityLevel: '',
    targetAudience: '',
    tone: '',
    organisationName: '',
    duration: '',
    brandGuidelines: '',
    learningOutcomes: '',
    content: '',
  });

  const [scenes, setScenes] = useState<Scene[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setScenes(null);

    try {
      const response = await axios.post(API_URL, formData);
      console.log('✅ Storyboard generated:', response.data);
      setScenes(response.data);
    } catch (err) {
      console.error('❌ Error generating storyboard:', err);
      setError('Something went wrong while generating the storyboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brandDark text-white p-6 font-body">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-heading text-brilliantBlue mb-6 text-center">
          AI eLearning Storyboard Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input name="moduleName" placeholder="Module Name / Title" value={formData.moduleName} onChange={handleChange} required />
          <input name="targetAudience" placeholder="Target Audience" value={formData.targetAudience} onChange={handleChange} required />
          <input name="organisationName" placeholder="Organisation / Client Name" value={formData.organisationName} onChange={handleChange} />
          <input name="duration" placeholder="e.g., 10–15 minutes or approx 15 screens" value={formData.duration} onChange={handleChange} />
          <input name="brandGuidelines" placeholder="Fonts, Colours, Logo URL etc" value={formData.brandGuidelines} onChange={handleChange} />

          <select name="outputLanguage" value={formData.outputLanguage} onChange={handleChange}>
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>Chinese (Simplified)</option>
            <option>Hindi</option>
            <option>Arabic</option>
            <option>German</option>
            <option>Japanese</option>
            <option>Indonesian</option>
          </select>

          <select name="moduleType" value={formData.moduleType} onChange={handleChange} required>
            <option value="">Select module type...</option>
            <option>Compliance</option>
            <option>Onboarding</option>
            <option>Product Training</option>
            <option>Systems or Technical Training</option>
            <option>Soft Skills or Behavioural</option>
            <option>Leadership</option>
          </select>

          <select name="complexityLevel" value={formData.complexityLevel} onChange={handleChange} required>
            <option value="">Select complexity level...</option>
            <option>Level 1</option>
            <option>Level 2</option>
            <option>Level 3</option>
            <option>Level 4</option>
          </select>

          <select name="tone" value={formData.tone} onChange={handleChange} required>
            <option value="">Select tone...</option>
            <option>Formal</option>
            <option>Friendly</option>
            <option>Inspiring</option>
            <option>Conversational</option>
            <option>Confident & Persuasive</option>
            <option>Direct & Instructional</option>
            <option>Reflective & Story-Driven</option>
            <option>Empowering & Strategic</option>
          </select>

          <textarea name="learningOutcomes" placeholder="Learning Outcomes" value={formData.learningOutcomes} onChange={handleChange} required />
          <textarea name="content" placeholder="Main Content for Storyboard" value={formData.content} onChange={handleChange} required />

          <button
            type="submit"
            className="bg-brilliantBlue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Storyboard'}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {scenes && (
          <div className="mt-10">
            <h2 className="text-2xl font-heading text-brilliantBlue mb-4">Storyboard Output</h2>
            {scenes.map((scene, index) => (
              <div key={index} className="border border-brandGray rounded-lg p-4 mb-4 bg-gray-700">
                <h3 className="text-xl font-heading text-white mb-2">
                  Scene {scene.sceneNumber}: {scene.title || 'Untitled'}
                </h3>
                {scene.objectivesCovered && <p><strong>Objectives Covered:</strong> {scene.objectivesCovered}</p>}
                {scene.visual && <p><strong>Visual:</strong> {scene.visual}</p>}
                {scene.narration && <p><strong>Narration:</strong> {scene.narration}</p>}
                {scene.onScreenText && <p><strong>On-Screen Text:</strong> {scene.onScreenText}</p>}
                {scene.userInstructions && <p><strong>User Instructions:</strong> {scene.userInstructions}</p>}
                {scene.interactions && <p><strong>Interactions:</strong> {scene.interactions}</p>}
                {scene.accessibilityNotes && <p><strong>Accessibility Notes:</strong> {scene.accessibilityNotes}</p>}
                {scene.interaction && <p><strong>Interaction:</strong> {scene.interaction}</p>}
                {scene.knowledgeCheck && (
                  <p>
                    <strong>Knowledge Check:</strong>{' '}
                    {typeof scene.knowledgeCheck === 'string'
                      ? scene.knowledgeCheck
                      : scene.knowledgeCheck?.question}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
