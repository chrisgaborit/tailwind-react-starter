// File: backend/src/utils/summarizer.ts

import OpenAI from "openai";

/**
 * Summarizes a large block of text if it exceeds a certain length.
 * @param text The full text content.
 * @param openaiClient The OpenAI client instance.
 * @returns A summarized version of the text, or the original text if it's short enough.
 */
export async function summarizeContentIfNeeded(text: string, openaiClient: OpenAI): Promise<string> {
  const SUMMARY_THRESHOLD = 15000; // Summarize if content is over ~15k chars (~4000 words)
  const SUMMARY_MODEL = "gpt-4o"; // Use a fast and capable model for summarizing

  if (text.length < SUMMARY_THRESHOLD) {
    console.log("[SUMMARIZER] Content is short enough, skipping summarization.");
    return text;
  }

  console.log(`[SUMMARIZER] Content is long (${text.length} chars). Calling Summarizer Agent...`);

  try {
    const response = await openaiClient.chat.completions.create({
      model: SUMMARY_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert instructional design assistant. Your task is to read the following raw document text and create a concise, structured summary. Focus on extracting the key learning objectives, main topics, core concepts, and any specific examples or case studies. The summary should be well-organized and capture the essence of the material for a storyboard writer.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
    });

    const summary = response.choices[0].message.content;
    console.log(`[SUMMARIZER] Summarization complete. New length: ${summary?.length || 0} chars.`);
    return summary || text; // Fallback to original text if summary fails
  } catch (error) {
    console.error("[SUMMARIZER] Error during summarization:", error);
    return text; // Fallback to original text on error
  }
}
