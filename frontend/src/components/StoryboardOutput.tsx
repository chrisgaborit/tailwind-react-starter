
import React from 'react';
import type { StoryboardScene } from "@/types";
import StoryboardCard from './StoryboardCard'; 

interface Props {
  storyboard: StoryboardScene[] | null;
}

const StoryboardOutput: React.FC<Props> = ({ storyboard }) => {
  if (!storyboard || storyboard.length === 0) {
    return <p className="text-gray-600 py-4 text-center">No storyboard generated yet, or the storyboard is empty.</p>;
  }

  return (
    <div className="grid gap-6 mt-8">
      {storyboard.map((scene: StoryboardScene, index: number) => (
        <StoryboardCard key={scene.sceneNumber || ('scene-' + index)} scene={scene as unknown as StoryboardScene}  sceneIndex={index} />
      ))}
    </div>
  );
};

export default StoryboardOutput;
