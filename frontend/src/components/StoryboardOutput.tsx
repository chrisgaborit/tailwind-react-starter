import React from 'react';
import type { StoryboardScene } from '../types/storyboardTypes';
import StoryboardCard from './StoryboardCard';

interface Props {
  storyboard: StoryboardScene[];
}

const StoryboardOutput: React.FC<Props> = ({ storyboard }) => {
  if (!storyboard || storyboard.length === 0) {
    return <p className="text-gray-600">No storyboard generated yet.</p>;
  }

  return (
    <div className="grid gap-6 mt-8">
      {storyboard.map((scene) => (
        <StoryboardCard key={scene.sceneNumber} scene={scene} />
      ))}
    </div>
  );
};

export default StoryboardOutput;
