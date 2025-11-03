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
  const MAX_CONTENT_LENGTH = 50000; // Hard limit to prevent context window issues

  // If content is extremely large, truncate first
  if (text.length > MAX_CONTENT_LENGTH) {
    console.log(`[SUMMARIZER] Content is extremely large (${text.length} chars). Truncating first to ${MAX_CONTENT_LENGTH} chars.`);
    text = truncateContent(text, MAX_CONTENT_LENGTH);
  }

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
    
    // If summary is still too long, truncate it
    if (summary && summary.length > SUMMARY_THRESHOLD) {
      console.log(`[SUMMARIZER] Summary is still long (${summary.length} chars). Truncating.`);
      return truncateContent(summary, SUMMARY_THRESHOLD);
    }
    
    return summary || text; // Fallback to original text if summary fails
  } catch (error) {
    console.error("[SUMMARIZER] Error during summarization:", error);
    // If summarization fails, truncate the original content as a fallback
    return truncateContent(text, SUMMARY_THRESHOLD);
  }
}

/**
 * Truncates content to a maximum character limit if summarization is not available
 * @param text The text content to truncate
 * @param maxLength Maximum character length (default: 12000)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateContent(text: string, maxLength: number = 12000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  console.log(`[TRUNCATOR] Content truncated from ${text.length} to ${maxLength} chars.`);
  
  // Try to truncate at a sentence boundary
  const truncated = text.slice(0, maxLength);
  const lastSentenceEnd = truncated.lastIndexOf('.');
  
  if (lastSentenceEnd > maxLength * 0.8) { // If we can find a sentence end in the last 20%
    return truncated.slice(0, lastSentenceEnd + 1) + '\n\n[Content truncated due to length]';
  }
  
  return truncated + '\n\n[Content truncated due to length]';
}
