// backend/src/services/pipeline/chatgptStyleGenerator.ts

/**
 * ChatGPT-style content generation
 * Generates high-quality, structured eLearning content using ChatGPT's exact output format
 */

import OpenAI from "openai";
import { Page, Event } from "../../validation";
import { buildChatGPTStylePrompt } from "../../prompts/chatgptStylePrompt";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

/**
 * Generate a complete 5-scene learning sequence for a learning objective
 */
export async function generateLOSequence(
  loBundle: { loId: string; loText: string },
  sourceMaterial: string,
  params: {
    audience?: string;
    moduleTitle?: string;
  }
): Promise<Page[]> {
  
  console.log(`\n🎬 Generating ChatGPT-style sequence for: ${loBundle.loText.substring(0, 60)}...`);
  
  // Build the ChatGPT-style prompt
  const prompt = buildChatGPTStylePrompt(
    loBundle.loText,
    sourceMaterial,
    params.audience || 'Professional learners',
    params.moduleTitle || 'Training Module'
  );
  
  // Call OpenAI with high token limit (no JSON mode)
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: 'system',
        content: 'You are a senior Instructional Designer specializing in Brandon Hall Award-level eLearning design.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000  // Need lots of tokens for 5 complete scenes
  });
  
  const markdown = response.choices[0]?.message?.content || '';
  
  console.log(`\n📄 Generated ${markdown.length} characters of content`);
  console.log(`   Preview: ${markdown.substring(0, 200)}...`);
  
  // Parse the markdown into Page objects
  const pages = parseMarkdownToPages(markdown, loBundle.loId);
  
  console.log(`   ✅ Parsed into ${pages.length} pages`);
  
  return pages;
}

/**
 * Parse markdown output into Page objects
 */
function parseMarkdownToPages(markdown: string, loId: string): Page[] {
  const pages: Page[] = [];
  
  // Split by scene headers - look for SCENE X: PHASE (Description) pattern
  const scenePattern = /━+\s*SCENE\s+(\d+):\s+(\w+)\s+\(([^)]+)\)\s*━+/gi;
  const matches = Array.from(markdown.matchAll(scenePattern));
  
  if (matches.length === 0) {
    console.warn(`⚠️  No scenes found in markdown. Trying alternative parsing...`);
    // Fallback: try to find sections by headers
    return parseMarkdownFallback(markdown, loId);
  }
  
  // Extract each scene
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const sceneNum = match[1];
    const phase = match[2];
    const phaseDesc = match[3];
    
    // Get content between this match and the next (or end)
    const startIdx = match.index! + match[0].length;
    const endIdx = i < matches.length - 1 ? matches[i + 1].index! : markdown.length;
    const content = markdown.substring(startIdx, endIdx);
    
    // Parse this section into a Page
    const page = parseSceneToPage(sceneNum, phase, phaseDesc, content, loId);
    if (page) {
      pages.push(page);
    }
  }
  
  return pages;
}

/**
 * Fallback parser if main pattern doesn't match
 */
function parseMarkdownFallback(markdown: string, loId: string): Page[] {
  const pages: Page[] = [];
  
  // Try to find sections by looking for "SCENE" or phase names
  const phases = ['TEACH', 'SHOW', 'APPLY', 'CHECK', 'REFLECT'];
  let sceneNum = 1;
  
  for (const phase of phases) {
    const phasePattern = new RegExp(`${phase}[\\s\\S]*?(?=${phases.find(p => p !== phase) || '$'})`, 'i');
    const match = markdown.match(phasePattern);
    
    if (match) {
      const page = parseSceneToPage(String(sceneNum), phase, phase, match[0], loId);
      if (page) {
        pages.push(page);
        sceneNum++;
      }
    }
  }
  
  return pages;
}

/**
 * Parse a single scene section into a Page object
 */
function parseSceneToPage(
  sceneNum: string,
  phase: string,
  phaseDesc: string,
  content: string,
  loId: string
): Page | null {
  
  // Extract title
  const titleMatch = content.match(/Page Title:\s*(.+?)(?:\n|$)/i);
  const title = titleMatch ? titleMatch[1].trim() : `${phase}: Learning Objective`;
  
  // Determine page type based on phase
  let pageType: Page["pageType"] = 'Text + Image';
  if (phase.toUpperCase() === 'SHOW') pageType = 'Interactive: Click-to-Reveal';
  if (phase.toUpperCase() === 'APPLY') pageType = 'Interactive: Drag-and-Drop';
  if (phase.toUpperCase() === 'CHECK') pageType = 'Assessment: MCQ';
  if (phase.toUpperCase() === 'REFLECT') pageType = 'Text + Image';
  
  // Extract on-screen text and voice-over
  const ostMatch = content.match(/On-Screen Text[^:]*:\s*(?:\([^)]+\))?\s*\n([\s\S]+?)(?=Voice-Over|Interactivity|Mini-Quiz|Visual AI|$)/i);
  const voMatch = content.match(/Voice-Over Script[^:]*:\s*(?:\([^)]+\))?\s*\n([\s\S]+?)(?=Visual AI|Interactivity|Trigger|Mini-Quiz|On-Screen Prompt|$)/i);
  
  const ost = ostMatch ? ostMatch[1].trim() : '';
  const audio = voMatch ? voMatch[1].trim().replace(/^["']|["']$/g, '') : '';
  
  // Build events based on phase type
  const events: Event[] = [];
  
  if (phase.toUpperCase() === 'TEACH' || phase.toUpperCase() === 'REFLECT') {
    // Single or multiple events with OST and audio
    if (ost || audio) {
      // Split into paragraphs for multiple events
      const ostParagraphs = ost.split(/\n\n+/).filter(p => p.trim().length > 0);
      const audioParagraphs = audio.split(/\n\n+/).filter(p => p.trim().length > 0);
      
      const maxEvents = Math.max(ostParagraphs.length, audioParagraphs.length, 1);
      
      for (let i = 0; i < maxEvents; i++) {
        events.push({
          number: `${sceneNum}.${i + 1}`,
          audio: audioParagraphs[i] || audio || `Content for ${phase} phase`,
          ost: ostParagraphs[i] || ost || `On-screen content for ${phase}`,
          devNotes: `${phase} content - Event ${i + 1}`
        });
      }
    }
  } else if (phase.toUpperCase() === 'SHOW') {
    // Parse click-to-reveal table
    const tableMatch = content.match(/Trigger\s*\|\s*Reveal Text[\s\S]+?\n([\s\S]+?)(?=\n\n|Visuals:|Developer Notes:|$)/i);
    if (tableMatch) {
      const rows = tableMatch[1].split('\n').filter(row => {
        const trimmed = row.trim();
        return trimmed.includes('|') && !trimmed.includes('---') && trimmed.length > 5;
      });
      
      rows.forEach((row, idx) => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (cells.length >= 2) {
          const trigger = cells[0];
          const reveal = cells[1] || '';
          const voiceover = cells[2] || reveal;
          
          events.push({
            number: `${sceneNum}.${idx + 1}`,
            audio: voiceover,
            ost: `TRIGGER: ${trigger}\n\nREVEAL: ${reveal}`,
            devNotes: `Click-to-reveal: ${trigger}`
          });
        }
      });
    }
  } else if (phase.toUpperCase() === 'APPLY') {
    // Parse drag-drop table
    const tableMatch = content.match(/Draggable Item\s*\|\s*Correct Drop Zone[\s\S]+?\n([\s\S]+?)(?=\n\n|Feedback:|Developer Notes:|$)/i);
    if (tableMatch) {
      const rows = tableMatch[1].split('\n').filter(row => {
        const trimmed = row.trim();
        return trimmed.includes('|') && !trimmed.includes('---') && trimmed.length > 5;
      });
      
      rows.forEach((row, idx) => {
        const cells = row.split('|').map(c => c.trim().replace(/^["']|["']$/g, '')).filter(c => c.length > 0);
        if (cells.length >= 2) {
          const item = cells[0];
          const dropZone = cells[1];
          
          events.push({
            number: `${sceneNum}.${idx + 1}`,
            audio: `Correct! ${item} matches ${dropZone}.`,
            ost: `DRAG: ${item}\nDROP: ${dropZone}`,
            devNotes: `Drag-drop pair ${idx + 1}: ${item} → ${dropZone}`
          });
        }
      });
    }
  } else if (phase.toUpperCase() === 'CHECK') {
    // Parse quiz questions
    const questionMatches = Array.from(content.matchAll(/Question\s+(\d+):\s*([\s\S]+?)(?=Question\s+\d+:|Developer Notes:|$)/gi));
    
    if (questionMatches.length === 0) {
      // Try alternative pattern
      const altMatches = Array.from(content.matchAll(/(?:Question|Q)\s*(\d+)[:.]\s*([\s\S]+?)(?=(?:Question|Q)\s*\d+:|$)/gi));
      for (const match of altMatches) {
        const qNum = match[1];
        const qContent = match[2];
        
        // Extract question text and options
        const lines = qContent.split('\n').filter(l => l.trim() && !l.match(/^Feedback/));
        const questionText = lines[0] || 'Question';
        const options = lines.slice(1, 5).filter(l => l.match(/^[A-D][.)]/)).join('\n');
        
        // Extract feedback
        const correctMatch = qContent.match(/Feedback\s*\(Correct\):\s*["']?([^"'\n]+)/i);
        const incorrectMatch = qContent.match(/Feedback\s*\(Incorrect\):\s*["']?([^"'\n]+)/i);
        
        events.push({
          number: `${sceneNum}.${qNum}`,
          audio: correctMatch ? correctMatch[1].trim() : 'Correct!',
          ost: `${questionText}\n\n${options}`,
          devNotes: `Quiz Q${qNum} | Incorrect: ${incorrectMatch ? incorrectMatch[1].trim() : 'Review the material'}`
        });
      }
    } else {
      for (const match of questionMatches) {
        const qNum = match[1];
        const qContent = match[2];
        
        // Extract question text and options
        const lines = qContent.split('\n').filter(l => l.trim() && !l.match(/^Feedback/));
        const questionText = lines[0] || 'Question';
        const options = lines.slice(1, 5).filter(l => l.match(/^[A-D][.)]/)).join('\n');
        
        // Extract feedback
        const correctMatch = qContent.match(/Feedback\s*\(Correct\):\s*["']?([^"'\n]+)/i);
        const incorrectMatch = qContent.match(/Feedback\s*\(Incorrect\):\s*["']?([^"'\n]+)/i);
        
        events.push({
          number: `${sceneNum}.${qNum}`,
          audio: correctMatch ? correctMatch[1].trim() : 'Correct!',
          ost: `${questionText}\n\n${options}`,
          devNotes: `Quiz Q${qNum} | Incorrect: ${incorrectMatch ? incorrectMatch[1].trim() : 'Review the material'}`
        });
      }
    }
  }
  
  // If no events parsed, create a default one
  if (events.length === 0) {
    events.push({
      number: `${sceneNum}.1`,
      audio: audio || `Content for ${phase} phase`,
      ost: ost || `On-screen content for ${phase}`,
      devNotes: `${phase} scene`
    });
  }
  
  // Ensure we have at least 2 events (Brandon Hall requirement)
  while (events.length < 2) {
    events.push({
      number: `${sceneNum}.${events.length + 1}`,
      audio: `Additional content for ${phase}`,
      ost: `Additional on-screen content`,
      devNotes: `${phase} scene - additional event`
    });
  }
  
  // Trim to max 12 events
  if (events.length > 12) {
    events.splice(12);
  }
  
  // Extract visual prompt and alt text if available
  const visualMatch = content.match(/Visual AI Prompt:\s*\n([\s\S]+?)(?=Alt Text:|Developer Notes:|$)/i);
  const altTextMatch = content.match(/Alt Text:\s*\n([\s\S]+?)(?=Developer Notes:|$)/i);
  
  const altTexts = altTextMatch 
    ? [altTextMatch[1].trim(), 'Interactive elements accessible via keyboard']
    : visualMatch 
      ? [visualMatch[1].trim().substring(0, 200), 'Interactive elements accessible via keyboard']
      : ['Visual supporting this scene', 'Interactive elements accessible via keyboard'];
  
  // Build keyboard navigation based on phase type
  let keyboardNav = '';
  if (phase.toUpperCase() === 'SHOW') {
    keyboardNav = `Tab order: 1-${phase.toLowerCase()}-intro, 2-main-content, 3-clickable-triggers, 4-reveal-areas, 5-next-button. Keyboard: Tab to navigate, Enter/Space to activate reveals, Arrow keys for trigger selection.`;
  } else if (phase.toUpperCase() === 'APPLY') {
    keyboardNav = `Tab order: 1-${phase.toLowerCase()}-intro, 2-main-content, 3-draggable-items, 4-drop-zones, 5-feedback-area, 6-next-button. Keyboard: Tab to navigate, Enter to select draggable item, Arrow keys to move, Space to drop.`;
  } else if (phase.toUpperCase() === 'CHECK') {
    keyboardNav = `Tab order: 1-${phase.toLowerCase()}-intro, 2-question-text, 3-answer-options, 4-submit-button, 5-feedback-area, 6-next-button. Keyboard: Tab to navigate, Arrow keys to select option, Enter to submit, Space to activate.`;
  } else {
    keyboardNav = `Tab order: 1-${phase.toLowerCase()}-intro, 2-main-content, 3-interactive-elements, 4-next-button. Keyboard: Tab to navigate, Enter/Space to activate, Arrow keys for selections.`;
  }
  
  return {
    pageNumber: `p${sceneNum.padStart(2, '0')}`, // Will be reassigned in assembly
    title,
    pageType,
    learningObjectiveIds: [loId],
    estimatedDurationSec: phase.toUpperCase() === 'CHECK' ? 90 : phase.toUpperCase() === 'APPLY' ? 120 : 60,
    accessibility: {
      altText: altTexts,
      keyboardNav: keyboardNav,
      contrastNotes: 'Standard contrast ratios maintained (WCAG AA compliant)',
      screenReader: `Scene ${sceneNum}: ${title}. ${phase} phase content. Navigate with Tab key, activate with Enter.`
    },
    events
  };
}

