// html2pdf.js-based export of the on-screen storyboard
import html2pdf from "html2pdf.js";

export type PdfOptions = {
  filename?: string;
  margin?: number; // mm
  pagebreak?: { mode?: string[]; avoid?: string[] };
};

export async function exportStoryboardToPdf(rootEl: HTMLElement, opts: PdfOptions = {}) {
  const filename = opts.filename || "storyboard_export.pdf";

  const options: any = {
    margin: opts.margin ?? 10,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: [".pdf-avoid-break", ...(opts.pagebreak?.avoid || [])],
    },
  };

  // Run export
  await (html2pdf() as any).set(options).from(rootEl).save();
}