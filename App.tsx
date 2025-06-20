import { useState } from 'react';
import axios from 'axios';

function App() {
  const [moduleName, setModuleName] = useState('');
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('English');
  const [level, setLevel] = useState('Level 1');
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setScenes([]);

    try {
      const res = await axios.post('https://genesis-backend-357662238084.australia-southeast1.run.app/api/v1/generate-storyboard', {
        moduleName,
        moduleType: 'Product Training',
        moduleLevel: level,
        tone,
        organisationName: 'Demo Org',
        audience: 'Sales Team',
        learningOutcomes: 'By the end of this module, learners will be able to explain the benefits of the product, match features to customer needs, and handle objections effectively.',
        mainContent: 'Welcome to Product Mastery. We’ll cover key selling points, objection handling, and customer engagement strategies.',
        durationMinutes: 15,
        language,
        brandGuidelines: 'Use Learno brand guidelines: Outfit font for headings, Inter for body, Primary #0387E6, Accent #E63946.'
      });

      setScenes(res.data.storyboard);
    } catch (error) {
      console.error('Frontend error submitting form:', error);
      alert('There was an error. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 font-sans max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">AI eLearning Storyboard Generator</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block font-semibold">Module Name</label>
          <input
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option>Professional</option>
            <option>Friendly</option>
            <option>Inspirational</option>
            <option>Confident & Persuasive</option>
            <option>Reflective & Story-Driven</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Chinese (Simplified)</option>
            <option>Arabic</option>
            <option>Hindi</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option>Level 1 – Foundational knowledge. Simple instruction and MCQs.</option>
            <option>Level 2 – Application and scenarios. Interactive & guided exploration.</option>
            <option>Level 3 – Strategic thinking. Simulations & branching scenarios.</option>
            <option>Level 4 – Immersive simulations. High realism, gamification, deep reflection.</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Generating…' : 'Generate Storyboard'}
        </button>
      </form>

      {scenes.length > 0 && (
        <div className="space-y-6">
          {scenes.map((scene: any, index: number) => (
            <div key={index} className="border rounded p-4 shadow">
              <h2 className="font-bold text-xl mb-2">{scene.sceneTitle}</h2>
              <p><strong>Visual:</strong> {scene.visualDescription}</p>
              <p><strong>Narration:</strong> {scene.narrationScript}</p>
              <p><strong>On-Screen Text:</strong> {scene.onScreenText}</p>
              {scene.interaction && <p><strong>Interaction:</strong> {scene.interaction}</p>}
              {scene.knowledgeCheck && (
                <div>
                  <p><strong>Knowledge Check:</strong></p>
                  <pre>{JSON.stringify(scene.knowledgeCheck, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
