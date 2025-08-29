// backend/src/services/imageService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const candidates = result.response.candidates || [];
    const base64Image = candidates[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Image) throw new Error('No image data returned from Gemini.');

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('❌ Image generation error:', error);
    return '';
  }
}
