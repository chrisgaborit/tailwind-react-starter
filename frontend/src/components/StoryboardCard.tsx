
// --- HELPER ICONS ---
// These provide quick visual cues about the type of interactivity in a scene.


import type { StoryboardScene } from "@/types";
const InteractionIcon = () => <span title="Interactive Element">🖐️</span>;
const BranchingIcon = () => <span title="Branching Scenario">🌳</span>;
const QuizIcon = () => <span title="Knowledge Check">❓</span>;
const SimIcon = () => <span title="Simulation/Game">🎮</span>;

const getCardIcon = (scene: StoryboardScene) => {
  const interaction = (scene.interactionType || "").toLowerCase();
  if (interaction.includes('simulation') || interaction.includes('game')) return <SimIcon />;
  if (interaction.includes('branching')) return <BranchingIcon />;
  if ((scene.knowledgeCheck || (scene.knowledgeChecks && scene.knowledgeChecks[0]))?.question) return <QuizIcon />;
  if (['click', 'drag', 'hotspot'].some(term => interaction.includes(term))) return <InteractionIcon />;
  return null;
};


// --- CARD COMPONENT ---

interface StoryboardCardProps {
  scene: StoryboardScene;
  sceneIndex?: number;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ scene, sceneIndex }) => {
  const imageUrl = `https://picsum.photos/seed/${scene.id || scene.sceneNumber}/${sceneIndex}/600/400`;
  const cardIcon = getCardIcon(scene);

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full">
      <img
        src={imageUrl}
        alt={scene.visualDescription || `Visual for ${scene.sceneTitle}`}
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://picsum.photos/600/400?grayscale&blur=1'; // Fallback image
          target.alt = `Visual placeholder for ${scene.sceneTitle}`;
        }}
      />
      <div className="p-5 flex-grow flex flex-col text-sm">
        {/* --- CARD HEADER --- */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-100 bg-emerald-600">
              Scene {scene.sceneNumber}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-2">{scene.sceneTitle}</h3>
          </div>
          <div className="text-2xl">{cardIcon}</div>
        </div>

        {/* --- SCENE DETAILS --- */}
        <div className="space-y-3 text-slate-300 flex-grow">
          <p><strong>Visuals:</strong> {scene.visualDescription || 'N/A'}</p>
          <p><strong>Narration:</strong> {scene.narrationScript || 'N/A'}</p>
          <p><strong>On-Screen Text:</strong> {scene.onScreenText || 'N/A'}</p>
          <p><strong>Interaction Type:</strong> <span className="font-medium text-amber-300">{scene.interactionType || 'N/A'}</span></p>

          {/* Conditionally render knowledge check only if a question exists */}
          {(scene.knowledgeCheck || (scene.knowledgeChecks && scene.knowledgeChecks[0]))?.question && (
             <div className="p-3 bg-slate-700 rounded-md">
                <p><strong className="text-slate-200">Knowledge Check:</strong> {(scene.knowledgeCheck || (scene.knowledgeChecks && scene.knowledgeChecks[0]))?.question ?? ""}</p>
             </div>
          )}
        </div>

        {/* --- AI IMAGE PROMPT (FOOTER) --- */}
        <div className="mt-auto pt-4 border-t border-slate-700 mt-4">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300 block mb-1">AI Image Prompt:</strong>
            <code className="bg-slate-900 p-2 rounded-md text-cyan-400 text-xs block whitespace-pre-wrap break-all">
              {scene.imagePrompt || 'No prompt generated.'}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;