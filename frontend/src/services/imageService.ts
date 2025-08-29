import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured on the server.');
  }

  try {
    console.log(`🎨 Sending prompt to DALL-E: "${prompt}"`);
    const response = await openai.images.generate({
      model: "dall-e-3", // Powerful and follows instructions well
      prompt: prompt,
      n: 1,
      size: "1024x1024", // Standard size, can also be "1792x1024" or "1024x1792"
      quality: "standard", // "hd" is higher quality but more expensive
    });

    const imageUrl = response?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed, no URL returned from API.');
    }
    console.log(`🖼️ Image URL received: ${imageUrl}`);
    return imageUrl;

  } catch (error) {
    console.error("❌ Error generating image with DALL-E:", error);
    throw new Error("Failed to generate image from the AI service.");
  }
}