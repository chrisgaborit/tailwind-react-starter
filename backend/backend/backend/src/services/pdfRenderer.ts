import puppeteer, { type PDFOptions } from "puppeteer";

/**
 * Convert an HTML string into a print‑ready PDF buffer.
 * Defaults:
 *  - A4
 *  - print background graphics
 *  - sensible margins
 *  - print CSS emulation
 *
 * Works on Cloud Run / Docker thanks to no‑sandbox flags.
 */
export async function htmlToPdfBuffer(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true, // boolean works with current Puppeteer types
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

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "18mm", left: "12mm" },
      ...options,
    });

    return pdf as Buffer;
  } finally {
    await browser.close();
  }
}
