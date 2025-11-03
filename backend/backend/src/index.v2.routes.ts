// backend/src/index.v2.routes.ts
import { Router } from "express";
import { DirectorAgent } from "./agents_v2/directorAgent";
import { generateStoryboardPDF } from "./utils/generateStoryboardPDF";
import { generateDocumentationPDF } from "./utils/generateDocumentationPDF";
import { formatProductionStoryboard } from "./services/productionStoryboardFormatter";

const router = Router();

router.post("/api/v2/storyboards", async (req, res) => {
  console.log("🧠 RAG DISABLED: Running in pure Agent mode");

  try {
    // Pure agent mode - no RAG context injection
    // DirectorAgent receives only: topic, duration, audience, sourceMaterial
    
    // Apply default Phase 2 config if not provided
    const requestBody = {
      ...req.body,
      phase2Config: {
        enabled: true,
        maxInteractions: 4, // Exactly 4 interactions per storyboard
        interactionDistribution: {
          clickToReveal: 2,      // 2 Click-to-Reveal interactions
          dragDropMatching: 1,   // 1 Drag-and-Drop Matching
          dragDropSequencing: 1  // 1 Drag-and-Drop Sequencing
        },
        ...(req.body.phase2Config || {})
      }
    };
    
    const sb = await new DirectorAgent().buildStoryboard(requestBody);
    const productionFormat = formatProductionStoryboard(sb);
    res.json({ success: true, storyboard: sb, productionFormat });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || String(e) });
  }
});

router.post("/api/v2/storyboards/export-production", async (req, res) => {
  try {
    const { storyboard } = req.body;
    if (!storyboard) {
      return res.status(400).json({ success: false, error: "Missing storyboard payload" });
    }
    const productionFormat = formatProductionStoryboard(storyboard);
    res.json({ success: true, productionFormat });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || String(e) });
  }
});

router.post("/api/storyboard/pdf", async (req, res) => {
  try {
    const { storyboard } = req.body;
    if (!storyboard || !storyboard.scenes) {
      console.error("❌ Invalid storyboard data:", storyboard);
      return res.status(400).json({ error: "Invalid storyboard data" });
    }

    console.log(`📄 Starting Puppeteer PDF generation for ${storyboard.scenes.length} scenes...`);
    const pdfBuffer = await generateStoryboardPDF(storyboard);

    if (!pdfBuffer || pdfBuffer.length < 20_000) {
      console.error(`⚠️ Suspiciously small PDF buffer (${pdfBuffer?.length || 0} bytes)`);
      return res.status(500).json({ error: "PDF generation failed (empty buffer)" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=storyboard.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200);
    res.end(pdfBuffer);
    console.log("📄 PDF streamed successfully:", pdfBuffer.length, "bytes");
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).json({ error: "Failed to stream PDF" });
  }
});

router.get("/api/documentation/pdf", async (req, res) => {
  try {
    console.log("📚 Generating Genesis App documentation PDF...");
    const pdfBuffer = await generateDocumentationPDF();

    if (!pdfBuffer || pdfBuffer.length < 10_000) {
      console.error(`⚠️ Suspiciously small documentation PDF buffer (${pdfBuffer?.length || 0} bytes)`);
      return res.status(500).json({ error: "Documentation PDF generation failed" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Genesis-App-Documentation.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200);
    res.end(pdfBuffer);
    console.log("📚 Documentation PDF streamed successfully:", pdfBuffer.length, "bytes");
  } catch (err) {
    console.error("❌ Documentation PDF generation failed:", err);
    res.status(500).json({ error: "Failed to generate documentation PDF" });
  }
});

export default router;
