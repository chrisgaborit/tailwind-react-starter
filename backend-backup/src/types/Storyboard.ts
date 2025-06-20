export interface StoryboardScene {
    sceneNumber: number;
    sceneTitle: string;
    visualDescription: string;
    voiceOver: string;
    onScreenText: string;
    interaction: string | null;
    knowledgeCheck?: {
      question: string;
      options: string[];
      answer: string;
    } | null;
  }

  