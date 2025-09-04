// frontend/src/services/api.ts
import axios from 'axios';
import type { StoryboardFormData, StoryboardScene } from '@/types/storyboardTypes';

// Tip: switch to import.meta.env.VITE_API_URL for prod if you like
// AFTER
const API_URL = import.meta.env.VITE_BACKEND_URL; // This will be "/api" in development // ✅ Local backend URL

// Extend locally to allow aiModel without touching global types
type StoryboardFormDataWithAI = StoryboardFormData & {
  aiModel?: string; // "gpt-4-turbo" | "gpt-5" | "gpt-4o"
};

export const generateStoryboard = async (
  formData: StoryboardFormDataWithAI
): Promise<StoryboardScene[]> => {
  try {
    const response = await axios.post(
  `${API_-URL}/v1/generate-storyboard`,
      {
        ...formData,
        aiModel: formData.aiModel || 'gpt-4-turbo', // ✅ default if none selected
      }
    );

    // Backend might return { storyboard: [...] } or just [...]
    return response.data.storyboard || response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(
      error.response?.data?.message || 'Something went wrong generating the storyboard'
    );
  }
};
