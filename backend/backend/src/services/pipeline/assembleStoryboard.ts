// backend/src/services/pipeline/assembleStoryboard.ts

/**
 * Pipeline Stage 5: Assemble Storyboard
 * 
 * Build TOC, renumber pages to p01..pNN, ensure event numbering continuity,
 * generate assets list, compute estimatedDurationSec roll-ups, return final Storyboard JSON.
 */

import { Storyboard, Page } from "../../validation";

export interface AssembleInput {
  moduleTitle: string;
  pages: Page[];
}

/**
 * Assemble final storyboard with proper numbering and TOC
 */
export function assembleStoryboard(input: AssembleInput): Storyboard {
  const { moduleTitle, pages } = input;

  console.log(`📦 Assembling storyboard: ${moduleTitle} (${pages.length} pages)...`);

  // Renumber pages to p01..pNN
  const renumberedPages = pages.map((page, idx) => {
    // Fix empty voiceovers: copy from narration if available
    const pageAny = page as any;
    const hasEmptyVoiceover = page.events.every((e) => !e.audio || e.audio.trim().length === 0);
    
    let fixedEvents = page.events.map((event, eventIdx) => {
      const pageNum = idx + 1;
      // Extract event number from original (e.g., "1.1" -> "1")
      const eventNum = parseInt(event.number.split(".")[1] || String(eventIdx + 1));
      
      // Fix empty audio: try to get from narration or devNotes
      let audio = event.audio;
      if (!audio || audio.trim().length === 0) {
        audio = (event as any).narration || (event as any).narrationScript || event.devNotes || "Audio script required";
        console.warn(`⚠️  Page ${page.pageNumber} event ${event.number} had empty audio, using fallback`);
      }
      
      return {
        ...event,
        number: `${pageNum}.${eventNum}`,
        audio,
      };
    });
    
    return {
      ...page,
      pageNumber: `p${String(idx + 1).padStart(2, "0")}`,
      events: fixedEvents,
    };
  });

  // Build TOC
  const toc = renumberedPages.map((page) => ({
    pageNumber: page.pageNumber,
    title: page.title,
  }));

  // Extract assets from pages
  const images: string[] = [];
  const icons: string[] = [];

  renumberedPages.forEach((page) => {
    // Extract image descriptions from altText
    page.accessibility.altText.forEach((alt) => {
      if (alt && !images.includes(alt)) {
        images.push(alt);
      }
    });

    // Extract icons from devNotes (if any)
    const iconMatches = page.events
      .flatMap((e) => e.devNotes.match(/icon:([^\s,]+)/gi) || [])
      .map((match) => match.replace(/icon:/i, "").trim());
    
    iconMatches.forEach((icon) => {
      if (icon && !icons.includes(icon)) {
        icons.push(icon);
      }
    });
  });

  // Compute total duration
  const totalDuration = renumberedPages.reduce(
    (sum, page) => sum + page.estimatedDurationSec,
    0
  );

  console.log(`✅ Storyboard assembled:`);
  console.log(`   📄 Pages: ${renumberedPages.length}`);
  console.log(`   📑 TOC entries: ${toc.length}`);
  console.log(`   🖼️  Images: ${images.length}`);
  console.log(`   🎨 Icons: ${icons.length}`);
  console.log(`   ⏱️  Total duration: ${totalDuration} seconds (${Math.round(totalDuration / 60)} minutes)`);

  return {
    moduleTitle,
    toc,
    pages: renumberedPages,
    assets: {
      images,
      icons,
    },
  };
}

