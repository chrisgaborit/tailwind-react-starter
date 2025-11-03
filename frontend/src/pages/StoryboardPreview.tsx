import React from 'react';
import LevelBadge from '@/components/LevelBadge';
import { detectLevel } from '@/utils/detectLevel';
import type { StoryboardModule } from '@/types';

interface StoryboardPreviewProps {
  storyboardModule: StoryboardModule;
}

const StoryboardPreview: React.FC<StoryboardPreviewProps> = ({ storyboardModule }) => {
  const { level, metrics, reasons } = detectLevel(storyboardModule);

  return (
    <header className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-xl font-semibold">{storyboardModule.moduleName}</h1>
        <p className="text-sm text-slate-500">
          {metrics.sceneCount} scenes
        </p>
      </div>

      <LevelBadge
        level={level}
        tooltip={`Scenes: ${metrics.sceneCount}\n${reasons.join(' ')}`}
      />
    </header>
  );
};

export default StoryboardPreview;