import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

/**
 * Generate PDF that matches the exact StoryboardDisplay component styling
 */
export async function generateStoryboardPDF(storyboard: any) {
  console.log("=== DATA RECEIVED BY PDF GENERATOR ===");
  console.log(`Scenes: ${storyboard?.scenes?.length || 0}`);
  
  // ✅ VISUAL CHECK: Verify structured Click-to-Reveal data
  const clickToRevealScenes = (storyboard?.scenes || []).filter((s: any) => 
    s.interactionDetails?.type === "Click-to-Reveal"
  );
  
  if (clickToRevealScenes.length > 0) {
    console.log("✅ Render check:");
    console.log(`   - Found ${clickToRevealScenes.length} Click-to-Reveal interaction(s)`);
    
    const panelCounts = clickToRevealScenes.map((s: any) => {
      const count = s.interactionDetails?.reveals?.length || 0;
      return `${count} panels (${s.pageTitle})`;
    });
    
    console.log(`   - Panel counts: ${panelCounts.join(", ")}`);
    
    // Warning if any undefined
    const undefinedCount = clickToRevealScenes.filter((s: any) => 
      !s.interactionDetails?.reveals || s.interactionDetails.reveals.length === 0
    ).length;
    
    if (undefinedCount > 0) {
      console.warn(`   ⚠️  Warning: ${undefinedCount} scene(s) missing structured reveals array!`);
      console.warn(`   ⚠️  The orchestrator may not be populating properly.`);
    }
  } else {
    console.log("   ℹ️  No Click-to-Reveal interactions found in storyboard");
  }

  // Generate HTML that matches StoryboardDisplay.tsx exactly
  const html = generateStoryboardHTML(storyboard);
  
  // Write to temp file for Puppeteer to load
  const tempFile = path.join(__dirname, "../../temp-storyboard.html");
  fs.writeFileSync(tempFile, html);
  
  console.log("🖨️ Generating PDF from styled HTML template");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Load the temp file
  await page.goto(`file://${tempFile}`, { waitUntil: "networkidle0" });

  // Wait for content to render
  await page.waitForSelector(".scene-card", { timeout: 10000 });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Render PDF with wider format for 2-column layout
  const pdfBuffer = Buffer.from(await page.pdf({
    format: "A3", // Wider format to accommodate 2-column layout
    landscape: true, // Landscape for better 2-column display
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  }));

  await browser.close();

  // Clean up temp file
  fs.unlinkSync(tempFile);

  console.log("✅ PDF generated successfully — size:", pdfBuffer.length, "bytes");

  // Debug copy
  fs.writeFileSync("debug-storyboard.pdf", pdfBuffer);

  return pdfBuffer;
}

/**
 * Helper to render a KeyRow (label: value)
 */
function renderKeyRow(label: string, value: any): string {
  if (value === undefined || value === null || value === "" || 
      (Array.isArray(value) && !value.length) ||
      (typeof value === "object" && !Array.isArray(value) && Object.keys(value || {}).length === 0)) {
    return '';
  }

  let renderedValue = '';
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    renderedValue = escapeHtml(String(value));
  } else if (Array.isArray(value)) {
    const simple = value.every((v) => ["string", "number", "boolean"].includes(typeof v));
    renderedValue = simple 
      ? escapeHtml(value.join(", "))
      : `<pre class="whitespace-pre-wrap break-words text-slate-200/90">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  } else {
    renderedValue = `<pre class="whitespace-pre-wrap break-words text-slate-200/90">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  }

  return `
    <div class="grid grid-cols-12 gap-3 text-sm">
      <div class="col-span-4 md:col-span-3 text-slate-400">${escapeHtml(label)}</div>
      <div class="col-span-8 md:col-span-9 whitespace-pre-wrap text-slate-100">${renderedValue}</div>
    </div>
  `;
}

/**
 * Generate HTML that exactly matches StoryboardDisplay.tsx styling
 */
function generateStoryboardHTML(storyboard: any): string {
  const meta = storyboard.meta || {};
  const scenes = storyboard.scenes || [];

  const scenesHTML = scenes.map((scene: any, index: number) => {
    const pageTitle = scene.pageTitle || scene.title || `Scene ${scene.sceneNumber ?? index + 1}`;
    const ost = scene.onScreenText || scene.on_screen_text || scene.ost || "";
    const vo = scene.narrationScript || scene.voiceover || scene.voiceoverScript || scene.voice_over || "";
    const screenLayout = typeof scene.screenLayout === "string" ? scene.screenLayout : scene?.screenLayout?.description || "Standard slide layout";
    
    // Visual generation brief
    const vgb = scene.visual || scene.visualGenerationBrief || {};
    
    // Interaction
    const interactionType = scene.interactionType || scene?.interactionDetails?.interactionType || "None";
    
    // Overlay elements
    const overlay = scene.overlayElements || [];
    
    // Timing
    const estimatedS = scene.estimatedDuration || scene.duration || "—";
    
    return `
    <div class="scene-card pdf-avoid-break animate-fade-in rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl overflow-hidden mb-6" data-testid="scene">
      <!-- Title row -->
      <div class="px-6 py-4 border-b border-slate-700/60">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xl md:text-2xl font-semibold text-sky-300">
            ${scene.sceneNumber ?? index + 1}. ${escapeHtml(pageTitle)}
          </h3>
          <div class="flex flex-wrap gap-2">
            ${scene.pageType ? `<span class="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-xs md:text-sm font-medium text-slate-200">${escapeHtml(scene.pageType)}</span>` : ''}
            ${scene.aspectRatio || scene.visual?.aspectRatio ? `<span class="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-xs md:text-sm font-medium text-slate-200">Aspect: ${escapeHtml(scene.aspectRatio || scene.visual?.aspectRatio)}</span>` : ''}
            <span class="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-xs md:text-sm font-medium text-slate-200">Layout: ${escapeHtml(screenLayout)}</span>
            <span class="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-xs md:text-sm font-medium text-slate-200">Interaction: ${escapeHtml(interactionType)}</span>
          </div>
        </div>
      </div>

      <!-- Body: 2-column layout -->
      <div class="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        <!-- LEFT COLUMN -->
        <div class="space-y-6 md:space-y-8">
          
          <!-- On-Screen Text (OST) -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">On-Screen Text (OST)</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
                ${escapeHtml(ost)}
              </div>
            </div>
          </div>

          <!-- Voiceover Script (VO) -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Voiceover Script (VO)</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="prose prose-invert max-w-none text-slate-100 whitespace-pre-wrap text-base md:text-lg">
                ${escapeHtml(vo)}
              </div>
              
              ${scene?.audio?.voiceParameters ? `
                <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
                  ${renderKeyRow("Persona", scene.audio.voiceParameters.persona)}
                  ${renderKeyRow("Pace", scene.audio.voiceParameters.pace)}
                  ${renderKeyRow("Tone", scene.audio.voiceParameters.tone)}
                  ${renderKeyRow("Emphasis", scene.audio.voiceParameters.emphasis)}
                  ${renderKeyRow("Gender", scene.audio.voiceParameters.gender)}
                  ${renderKeyRow("Background Music", scene.audio.backgroundMusic)}
                </div>
              ` : ''}
              
              ${renderKeyRow("Audio AI Directive", scene?.audio?.aiGenerationDirective)}
            </div>
          </div>

          <!-- Interaction Details -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Interaction Details</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="space-y-3">
                ${renderKeyRow("Type", interactionType)}
                
                  ${scene?.interactionDetails?.type === "Click-to-Reveal" && scene?.interactionDetails?.reveals ? `
                    <!-- NEW: Structured Click-to-Reveal Format -->
                    <div class="mt-4 p-4 bg-slate-900/50 rounded-lg border border-sky-500/30">
                      <h4 class="text-sky-300 font-semibold mb-3">🎯 Click-to-Reveal Interaction</h4>
                      
                      ${renderKeyRow("Tone", scene.interactionDetails.tone)}
                      ${renderKeyRow("Instruction", scene.interactionDetails.instruction)}
                      ${renderKeyRow("Context & Visuals", scene.interactionDetails.contextVisuals)}
                      
                      <div class="mt-4">
                        <p class="text-sky-300 font-semibold mb-2">Reveal Panels (${scene.interactionDetails.reveals.length}):</p>
                        ${scene.interactionDetails.reveals.map((reveal: any, index: number) => `
                          <div class="ml-4 mb-3 p-3 bg-slate-800/50 rounded border border-slate-700/50">
                            <p class="text-amber-300 font-semibold">Panel ${index + 1}: ${reveal.label || 'Untitled'}</p>
                            ${reveal.text ? `<p class="mt-2 text-slate-200"><strong class="text-sky-300">Text:</strong> ${reveal.text}</p>` : ''}
                            ${reveal.voiceOver ? `<p class="mt-2 text-slate-200"><strong class="text-sky-300">Voice-Over:</strong> ${reveal.voiceOver}</p>` : ''}
                            ${reveal.animation ? `<p class="mt-2 text-slate-200"><strong class="text-sky-300">Animation:</strong> ${reveal.animation}</p>` : ''}
                          </div>
                        `).join('')}
                      </div>
                      
                      ${scene.interactionDetails.developerNotes ? `
                        <div class="mt-3 p-3 bg-amber-900/20 rounded border border-amber-500/30">
                          <p class="text-amber-300 font-semibold">Developer Notes:</p>
                          <p class="text-slate-200 mt-1">${scene.interactionDetails.developerNotes}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                  
                  ${scene?.interactionDetails?.type === "DragAndDrop-Matching" && scene?.interactionDetails?.items && scene?.interactionDetails?.targets ? `
                    <!-- NEW: Drag-and-Drop Matching Format -->
                    <div class="mt-4 p-4 bg-slate-900/50 rounded-lg border border-purple-500/30">
                      <h4 class="text-purple-300 font-semibold mb-3">🎯 Drag-and-Drop Matching Interaction</h4>
                      
                      ${renderKeyRow("Tone", scene.interactionDetails.tone)}
                      ${renderKeyRow("Instruction", scene.interactionDetails.instruction)}
                      
                      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <!-- Items to Drag -->
                        <div>
                          <p class="text-purple-300 font-semibold mb-2">Items to Drag (${scene.interactionDetails.items.length}):</p>
                          ${scene.interactionDetails.items.map((item: any, index: number) => `
                            <div class="mb-2 p-3 bg-slate-800/50 rounded border border-slate-700/50">
                              <p class="text-slate-200 text-sm">${item.label}</p>
                              <p class="text-slate-400 text-xs mt-1">→ ${scene.interactionDetails.targets.find((t: any) => t.id === item.correctTarget)?.label}</p>
                            </div>
                          `).join('')}
                        </div>
                        
                        <!-- Target Categories -->
                        <div>
                          <p class="text-purple-300 font-semibold mb-2">Target Categories (${scene.interactionDetails.targets.length}):</p>
                          ${scene.interactionDetails.targets.map((target: any, index: number) => `
                            <div class="mb-2 p-3 bg-slate-800/50 rounded border border-slate-700/50">
                              <p class="text-slate-200 text-sm">${target.label}</p>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                      
                      <!-- Feedback -->
                      <div class="mt-4">
                        <p class="text-purple-300 font-semibold mb-2">Feedback Messages:</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div class="p-3 bg-green-900/20 rounded border border-green-500/30">
                            <p class="text-green-300 font-medium text-xs mb-1">Correct:</p>
                            <p class="text-slate-200 text-sm">${scene.interactionDetails.feedback?.correct}</p>
                          </div>
                          <div class="p-3 bg-red-900/20 rounded border border-red-500/30">
                            <p class="text-red-300 font-medium text-xs mb-1">Incorrect:</p>
                            <p class="text-slate-200 text-sm">${scene.interactionDetails.feedback?.incorrect}</p>
                          </div>
                        </div>
                      </div>
                      
                      ${scene.interactionDetails.developerNotes ? `
                        <div class="mt-3 p-3 bg-amber-900/20 rounded border border-amber-500/30">
                          <p class="text-amber-300 font-semibold">Developer Notes:</p>
                          <p class="text-slate-200 mt-1">${scene.interactionDetails.developerNotes}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                  
                  ${scene?.interactionDetails?.type === "DragAndDrop-Sequencing" && scene?.interactionDetails?.items ? `
                    <!-- NEW: Drag-and-Drop Sequencing Format -->
                    <div class="mt-4 p-4 bg-slate-900/50 rounded-lg border border-emerald-500/30">
                      <h4 class="text-emerald-300 font-semibold mb-3">🎯 Drag-and-Drop Sequencing Interaction</h4>
                      
                      ${renderKeyRow("Tone", scene.interactionDetails.tone)}
                      ${renderKeyRow("Instruction", scene.interactionDetails.instruction)}
                      
                      <div class="mt-4">
                        <p class="text-emerald-300 font-semibold mb-2">Steps to Sequence (${scene.interactionDetails.items.length}):</p>
                        ${scene.interactionDetails.items
                          .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
                          .map((item: any, index: number) => `
                          <div class="mb-3 p-4 bg-slate-800/50 rounded border border-slate-700/50">
                            <div class="flex items-center gap-3">
                              <div class="flex-shrink-0 w-8 h-8 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                                <span class="text-emerald-300 font-bold text-sm">${item.correctOrder}</span>
                              </div>
                              <div class="flex-grow">
                                <p class="text-slate-200 text-sm">${item.label}</p>
                              </div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                      
                      <!-- Feedback -->
                      <div class="mt-4">
                        <p class="text-emerald-300 font-semibold mb-2">Feedback Messages:</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div class="p-3 bg-green-900/20 rounded border border-green-500/30">
                            <p class="text-green-300 font-medium text-xs mb-1">Correct:</p>
                            <p class="text-slate-200 text-sm">${scene.interactionDetails.feedback?.correct}</p>
                          </div>
                          <div class="p-3 bg-red-900/20 rounded border border-red-500/30">
                            <p class="text-red-300 font-medium text-xs mb-1">Incorrect:</p>
                            <p class="text-slate-200 text-sm">${scene.interactionDetails.feedback?.incorrect}</p>
                          </div>
                        </div>
                      </div>
                      
                      ${scene.interactionDetails.developerNotes ? `
                        <div class="mt-3 p-3 bg-amber-900/20 rounded border border-amber-500/30">
                          <p class="text-amber-300 font-semibold">Developer Notes:</p>
                          <p class="text-slate-200 mt-1">${scene.interactionDetails.developerNotes}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                
                ${scene?.interactionDetails?.clickToRevealContent ? `
                  <!-- LEGACY: Markdown String Format (for backward compatibility) -->
                  <div class="mt-4 p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                    <p class="text-amber-300 font-semibold mb-2">⚠️ Legacy Click-to-Reveal Format (Markdown String)</p>
                    <pre class="text-sm text-slate-200 whitespace-pre-wrap">${scene.interactionDetails.clickToRevealContent}</pre>
                  </div>
                ` : ''}
                
                ${renderKeyRow("Description", scene.interactionDescription)}
                ${renderKeyRow("AI Actions", scene?.interactionDetails?.aiActions)}
                ${renderKeyRow("Decision Logic", scene?.interactionDetails?.aiDecisionLogic || scene.decisionLogic || scene?.interaction?.logic)}
                ${renderKeyRow("Retry Logic", scene?.interactionDetails?.retryLogic || scene?.interaction?.retry || scene?.retryLogic)}
                ${renderKeyRow("Completion Rule", scene?.interactionDetails?.completionRule || scene?.interaction?.completion || scene?.completionRule)}
                ${renderKeyRow("xAPI Events", scene?.xapi)}
              </div>
            </div>
          </div>
          
        </div>

        <!-- RIGHT COLUMN -->
        <div class="space-y-6 md:space-y-8">
          
          <!-- AI Visual Generation Brief -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">AI Visual Generation Brief</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="grid grid-cols-1 gap-2">
                ${renderKeyRow("Scene Description", vgb.sceneDescription || scene.visualDescription || scene.visual_ai_prompt || vgb.aiGenerationDirective)}
                ${renderKeyRow("Style", vgb.style || scene.visual?.style)}
                ${renderKeyRow("Subject", vgb.subject || scene.visual?.subject)}
                ${renderKeyRow("Setting", vgb.setting || scene.visual?.setting)}
                ${renderKeyRow("Composition", vgb.composition || scene.visual?.composition)}
                ${renderKeyRow("Lighting", vgb.lighting || scene.visual?.lighting)}
                ${renderKeyRow("Color Palette", vgb.colorPalette || scene.visual?.colorPalette || scene.palette || scene.colourPalette)}
                ${renderKeyRow("Mood", vgb.mood || scene.visual?.mood || scene.mood)}
                ${renderKeyRow("Brand Integration", vgb.brandIntegration || scene.visual?.brandIntegration)}
                ${renderKeyRow("Negative Space", vgb.negativeSpace || scene.visual?.negativeSpace)}
                ${renderKeyRow("Alt Text", scene.visual?.altText || scene.alt_text)}
                ${renderKeyRow("Aspect Ratio", scene.visual?.aspectRatio || scene.aspectRatio)}
                ${renderKeyRow("Asset ID", vgb.assetId)}
                ${renderKeyRow("Legacy AI Prompt", scene.visual?.aiPrompt || scene.legacyAiPrompt)}
              </div>
            </div>
          </div>

          <!-- Overlay Elements -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Overlay Elements</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              ${overlay.length ? `
                <div class="space-y-2">
                  ${overlay.map((el: any, i: number) => `
                    <div class="border border-slate-700 rounded-md p-3">
                      <div class="text-slate-300 text-sm mb-1">
                        #${i + 1} ${escapeHtml(el.elementType || "Element")}
                      </div>
                      ${renderKeyRow("Content", el.content)}
                      ${renderKeyRow("Style", el.style)}
                      ${renderKeyRow("AI Directive", el.aiGenerationDirective)}
                    </div>
                  `).join('')}
                </div>
              ` : '<div class="text-slate-400">—</div>'}
            </div>
          </div>

          <!-- Developer Notes -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Developer Notes</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="text-slate-100 whitespace-pre-wrap text-base md:text-lg">
                ${escapeHtml(scene.developerNotes || scene.devNotes) || '<span class="text-slate-400">—</span>'}
              </div>
            </div>
          </div>

          <!-- Accessibility Notes -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Accessibility Notes</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="text-slate-100 whitespace-pre-wrap text-base md:text-lg">
                ${escapeHtml(scene.accessibilityNotes || scene.a11y) || '<span class="text-slate-400">—</span>'}
              </div>
            </div>
          </div>

          <!-- Timing -->
          <div class="pdf-avoid-break rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl backdrop-blur-sm">
            <div class="px-6 py-4 border-b border-slate-700/60">
              <h3 class="text-lg font-semibold text-sky-300 md:text-xl">Timing</h3>
            </div>
            <div class="p-6 space-y-4 text-base leading-relaxed text-slate-100 md:text-lg">
              <div class="text-slate-100 text-base md:text-lg">
                Estimated: ${escapeHtml(String(estimatedS))}
              </div>
            </div>
          </div>
          
        </div>

        <!-- Footer: End-of-Page Instruction (full width) -->
        <div class="xl:col-span-2">
          <div class="rounded-xl border border-slate-700/70 p-4 text-sm md:text-base text-slate-300">
            <span class="font-medium text-slate-200">End-of-Page Instruction: </span>
            ${escapeHtml(scene.endInstruction || scene.endOfPageInstruction || "Select Next to continue.")}
          </div>
        </div>
        
      </div>
    </div>
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Storyboard - ${escapeHtml(meta.moduleName || meta.topic || 'eLearning Storyboard')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { margin: 10mm; }
    body {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    }
    .pdf-avoid-break {
      page-break-inside: avoid;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .prose-invert { color: #f1f5f9; }
    /* Ensure 2-column layout displays properly */
    @media print {
      .xl\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
</head>
<body class="p-4 md:p-8">
  <div class="max-w-[1800px] mx-auto">
    <!-- Header -->
    <div class="mb-8 p-6 rounded-2xl border border-slate-700/70 bg-slate-800/80 shadow-xl">
      <h1 class="text-3xl md:text-4xl font-bold text-sky-300 mb-4">
        ${escapeHtml(meta.moduleName || meta.topic || 'eLearning Storyboard')}
      </h1>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300">
        ${meta.duration ? `<div><span class="font-medium text-slate-400">Duration:</span> ${escapeHtml(meta.duration)}</div>` : ''}
        ${meta.audience ? `<div><span class="font-medium text-slate-400">Audience:</span> ${escapeHtml(meta.audience)}</div>` : ''}
        ${meta.level ? `<div><span class="font-medium text-slate-400">Level:</span> ${escapeHtml(String(meta.level))}</div>` : ''}
        <div><span class="font-medium text-slate-400">Total Scenes:</span> ${scenes.length}</div>
      </div>
    </div>

    <!-- Scenes -->
    <div class="space-y-6">
      ${scenesHTML}
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
