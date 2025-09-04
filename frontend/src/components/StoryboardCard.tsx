import React from "react";

type AnyScene = {
  id?: string | number;
  sceneNumber?: number;
  sceneTitle?: string;
  visualDescription?: string;
  narrationScript?: string;
  onScreenText?: string;
  interactionType?: string;
  knowledgeCheck?: { question?: string } | null;
  knowledgeChecks?: Array<{ question?: string }>;
  imagePrompt?: string;

  // fields coming back from backend after image gen
  imageUrl?: string | null;
  imageParams?: {
    prompt?: string;
    model?: string;
    style?: string;
    size?: string;
    seed?: number;
    version?: number;
    generatedAt?: string;
    enhancements?: string[];
  } | null;

  // sometimes nested under visual
  visual?: {
    generatedImageUrl?: string | null;
    imageParams?: AnyScene["imageParams"];
  } | null;
};

// --- HELPER ICONS ---
const InteractionIcon = () => <span title="Interactive Element">🖐️</span>;
const BranchingIcon = () => <span title="Branching Scenario">🌳</span>;
const QuizIcon = () => <span title="Knowledge Check">❓</span>;
const SimIcon = () => <span title="Simulation/Game">🎮</span>;

const getCardIcon = (scene: AnyScene) => {
  const interaction = (scene.interactionType || "").toLowerCase();
  if (interaction.includes("simulation") || interaction.includes("game")) return <SimIcon />;
  if (interaction.includes("branching")) return <BranchingIcon />;
  if ((scene.knowledgeCheck || (scene.knowledgeChecks && scene.knowledgeChecks[0]))?.question)
    return <QuizIcon />;
  if (["click", "drag", "hotspot"].some((term) => interaction.includes(term))) return <InteractionIcon />;
  return null;
};

interface StoryboardCardProps {
  scene: AnyScene;
  sceneIndex?: number;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ scene, sceneIndex = 0 }) => {
  // Prefer generated image (flat) then visual.generatedImageUrl, else placeholder
  const preferredUrl =
    (scene.imageUrl && scene.imageUrl.trim()) ||
    (scene.visual?.generatedImageUrl && scene.visual.generatedImageUrl.trim()) ||
    "";

  const fallbackUrl = `https://picsum.photos/seed/${scene.id || scene.sceneNumber || sceneIndex}/${600}/${400}`;
  const imageUrl = preferredUrl || fallbackUrl;

  const recipe = scene.imageParams || scene.visual?.imageParams || null;
  const cardIcon = getCardIcon(scene);

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full">
      <img
        src={imageUrl}
        alt={
          scene.visualDescription ||
          `Visual for ${scene.sceneTitle || `Scene ${scene.sceneNumber}`}`
        }
        className="w-full h-48 object-cover"
        crossOrigin="anonymous"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://picsum.photos/600/400?grayscale&blur=1";
          target.alt = `Visual placeholder for ${
            scene.sceneTitle || `Scene ${scene.sceneNumber}`
          }`;
        }}
      />

      <div className="p-5 flex-grow flex flex-col text-sm">
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-100 bg-emerald-600">
              Scene {scene.sceneNumber ?? sceneIndex + 1}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-2">
              {scene.sceneTitle || `Scene ${scene.sceneNumber ?? sceneIndex + 1}`}
            </h3>
          </div>
          <div className="text-2xl">{cardIcon}</div>
        </div>

        {/* --- DETAILS --- */}
        <div className="space-y-3 text-slate-300 flex-grow">
          <p>
            <strong>Visuals:</strong> {scene.visualDescription || "N/A"}
          </p>
          <p>
            <strong>Narration:</strong> {scene.narrationScript || "N/A"}
          </p>
          <p>
            <strong>On-Screen Text:</strong> {scene.onScreenText || "N/A"}
          </p>
          <p>
            <strong>Interaction Type:</strong>{" "}
            <span className="font-medium text-amber-300">
              {scene.interactionType || "N/A"}
            </span>
          </p>

          {(scene.knowledgeCheck ||
            (scene.knowledgeChecks && scene.knowledgeChecks[0]))?.question && (
            <div className="p-3 bg-slate-700 rounded-md">
              <p>
                <strong className="text-slate-200">Knowledge Check:</strong>{" "}
                {(
                  scene.knowledgeCheck ||
                  (scene.knowledgeChecks && scene.knowledgeChecks[0])
                )?.question ?? ""}
              </p>
            </div>
          )}
        </div>

        {/* --- IMAGE RECIPE / PROMPT --- */}
        <div className="mt-auto pt-4 border-t border-slate-700">
          {/* Always show the original prompt if present */}
          <div className="mb-2">
            <strong className="text-slate-300 block mb-1">AI Image Prompt:</strong>
            <code className="bg-slate-900 p-2 rounded-md text-cyan-400 text-xs block whitespace-pre-wrap break-all">
              {scene.imagePrompt || recipe?.prompt || "No prompt generated."}
            </code>
          </div>

          {/* Show recipe meta if available */}
          {recipe && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
              <div>
                <strong>Model:</strong> {recipe.model || "imagen-3.0"}
              </div>
              {recipe.style && (
                <div>
                  <strong>Style:</strong> {recipe.style}
                </div>
              )}
              {recipe.size && (
                <div>
                  <strong>Size:</strong> {recipe.size}
                </div>
              )}
              {typeof recipe.seed === "number" && (
                <div>
                  <strong>Seed:</strong> {recipe.seed}
                </div>
              )}
              {recipe.version && (
                <div>
                  <strong>Version:</strong> {recipe.version}
                </div>
              )}
              {recipe.generatedAt && (
                <div className="col-span-2">
                  <strong>Generated:</strong>{" "}
                  {new Date(recipe.generatedAt).toLocaleString()}
                </div>
              )}
              {recipe.enhancements && recipe.enhancements.length > 0 && (
                <div className="col-span-2">
                  <strong>Enhancements:</strong>{" "}
                  {recipe.enhancements.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;