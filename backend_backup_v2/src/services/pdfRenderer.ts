import type { PDFOptions } from "puppeteer";
const puppeteer = require("puppeteer");

/**
 * Convert an HTML string into a print-ready PDF buffer.
 *
 * Defaults:
 *  - A4 format
 *  - Print backgrounds
 *  - Sensible margins
 *  - Print CSS media emulation
 *
 * Safe for local dev and Cloud Run (no-sandbox flags included).
 */
export async function htmlToPdfBuffer(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true, // boolean works across Puppeteer versions
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=medium",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    const pdfArray = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "18mm", left: "12mm" },
      ...options,
    });

    return Buffer.from(pdfArray);
  } finally {
    await browser.close();
  }
}
