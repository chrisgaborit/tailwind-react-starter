import { StoryboardScene } from "../components/StoryboardCard";

// Make sure this points to your backend when running locally or in production
const BASE_URL = "http://localhost:3000";

export async function generateStoryboard(formData: any): Promise<StoryboardScene[]> {
  const response = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error("Failed to generate storyboard");
  }

  const data = await response.json();
  return data as StoryboardScene[];
}
