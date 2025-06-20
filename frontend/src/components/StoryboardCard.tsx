import React from 'react';
import type { StoryboardScene } from '../types/storyboardTypes';

interface Props {
  scene: StoryboardScene;
}

const StoryboardCard: React.FC<Props> = ({ scene }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-2">🎬 {scene.sceneTitle}</h2>

      <div className="mb-2">
        <strong>Narration:</strong>
        <p className="text-gray-700">{scene.narrationScript}</p>
      </div>

      <div className="mb-2">
        <strong>Visuals:</strong>
        <p className="text-gray-700">{scene.visualDescription}</p>
      </div>

      {scene.knowledgeCheck && (
        <div className="mb-2">
          <strong>Knowledge Check:</strong>
          <p className="text-blue-700">{typeof scene.knowledgeCheck === 'string' ? scene.knowledgeCheck : JSON.stringify(scene.knowledgeCheck)}</p>
        </div>
      )}

      <div>
        <strong>Interactivity:</strong>
        <p className="text-green-700">{scene.interactivityType}</p>
      </div>
    </div>
  );
};

export default StoryboardCard;
