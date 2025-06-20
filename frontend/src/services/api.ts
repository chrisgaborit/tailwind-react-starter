import axios from 'axios';
import type { StoryboardFormData, StoryboardScene } from '@/types/storyboardTypes';

const API_URL = 'https://genesis-backend-357662238084.australia-southeast1.run.app';

export const generateStoryboard = async (
  formData: StoryboardFormData
): Promise<StoryboardScene[]> => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/generate-storyboard`, formData);

    // Adjust this if your backend returns { storyboard: [...] } instead of just [...]
    return response.data.storyboard || response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.message || 'Something went wrong');
  }
};
