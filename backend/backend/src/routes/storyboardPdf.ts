// backend/src/routes/storyboardPdf.ts
import express from "express";
import puppeteer from "puppeteer";

const router = express.Router();

/**
 * GET /api/storyboard/pdf?id=<storyboardId>
 * Renders the SAME React page the user sees (e.g. /storyboard/print?id=...)
 */
router.get("/pdf", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing storyboard id");

  const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
  const url = `${baseUrl}/storyboard/print?id=${encodeURIComponent(String(id))}&pdf=1`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--font-render-hinting=medium"],
    });
    const page = await browser.newPage();

    // Make sure print CSS is applied, but the UI is otherwise identical
    await page.emulateMediaType("print");

    // Load and wait for network + fonts/images
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    await page.evaluate(async () => {
      // Wait for fonts (critical for identical look)
      // @ts-ignore
      await (document as any).fonts?.ready;
      // Ensure lazy images are loaded
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img => img.decode?.().catch(() => null)));
    });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // trust @page size from CSS
      displayHeaderFooter: false,
      timeout: 120000,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="storyboard-${id}.pdf"`);
    res.send(pdf);
  } catch (e: any) {
    console.error("PDF render error:", e);
    res.status(500).send("Failed to render PDF");
  } finally {
    await browser?.close();
  }
});

export default router;