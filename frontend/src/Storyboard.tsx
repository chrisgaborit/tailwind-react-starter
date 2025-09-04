
import React, { useEffect, useState, useCallback } from 'react';

interface Interaction {
  id: string;
  type: string; 
  label: string;
}

interface StoryboardScene {
  id: string;
  title: string;
  narrationScript: string;
  visualDescription: string;
  onScreenText: string;
  interactions?: Interaction[];
}

interface StoryboardPlayerProps {
  storyboardId: string; 
}

const StoryboardPlayer: React.FC<StoryboardPlayerProps> = ({ storyboardId }) => {
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      const fetchedScenes: StoryboardScene[] = [ 
        { id: '1', title: 'Scene 1: Introduction', narrationScript: 'Welcome!', visualDescription: 'Visual for intro', onScreenText: 'Hello World', interactions: [{id: 'btn1', type: 'button', label: 'Next Scene'}] },
        { id: '2', title: 'Scene 2: Core Content', narrationScript: 'Learn this important information.', visualDescription: 'Visual for core content', onScreenText: 'This is important', interactions: [{id: 'btn2', type: 'button', label: 'Finish'}] },
      ];
      setScenes(fetchedScenes);
      setCurrentSceneIndex(0);
      setLoading(false);
    }, 1000);
  }, [storyboardId]);

  const handleNextScene = useCallback(() => {
    setCurrentSceneIndex((prevIndex: number) => Math.min(prevIndex + 1, scenes.length - 1));
  }, [scenes.length]);

  if (loading) {
    return <div>Loading storyboard...</div>;
  }

  if (scenes.length === 0 || !scenes[currentSceneIndex]) {
    return <div>Storyboard not found or has no scenes.</div>;
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <div>
      <h2>{currentScene.title}</h2>
      <p><strong>Narration:</strong> {currentScene.narrationScript}</p>
      <p><strong>Visuals:</strong> {currentScene.visualDescription}</p>
      <p><strong>On-Screen Text:</strong> {currentScene.onScreenText}</p>
      
      {currentScene.interactions && currentScene.interactions.map((interaction: Interaction, idx: number) => (
        <button key={interaction.id || idx} onClick={() => console.log(`Interaction ${interaction.label} clicked`)}>
          {interaction.label}
        </button>
      ))}

      {currentSceneIndex < scenes.length - 1 && (
        <button onClick={handleNextScene}>Next Scene</button>
      )}
    </div>
  );
};

export default StoryboardPlayer;
